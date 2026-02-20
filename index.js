if(!process.versions.bun) console.warn("Warning: It is recommended to run this server using Bun for better library compatibility.")

const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")
const { getRelativeTime, getAbsoluteDate } = require("./utils/dateFormatter")
const getReadingTime = require("./utils/readingTime")
const roc = require("roc-framework")

const NodeCache = require("node-cache")
const caches = new NodeCache({ stdTTL: 60 * 60 * 24 }) // cache with a default of one day

const contentDir = {
	base: path.join(__dirname, "content"),
	raw: path.join(__dirname, "content", "raw"),
	compiled: path.join(__dirname, "content", "compiled"),
	attachments: path.join(__dirname, "content", "attachments"),
}
const publicAssetsPath = "/medias/content/"

const contentFiles = {
	redirections: {},
	_index: {}
}
const mainVersion = require("./package.json").version

const cachesEligibleExt = [".png", ".jpg", ".svg", ".webp", ".gif", ".mp4", ".ttf", ".woff2", ".json", ".css", ".js"]
function isEligibleForCache(filePath) {
	return cachesEligibleExt.includes(path.extname(filePath))
}

async function executeCommandInConsole(command, options = {}){
	var spawnedProcess = childProcess.exec(command)
	await new Promise((resolve, reject) => {
		spawnedProcess.stdout.on("data", data => {
			if(typeof data == "string") console.log(`> ${data.trim().split("\n").join("\n> ")}`)
			else process.stdout.write(data)
		})
		spawnedProcess.stderr.on("data", data => {
			if(typeof data == "string") console.error(`> ${data.trim().split("\n").join("\n> ")}`)
			else process.stderr.write(data)
		})
		spawnedProcess.on("close", code => {
			if(code === 0) resolve()
			else reject(new Error(`Process exited with code ${code}`))
		})
	})
	return true
}

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

	// Check for compiled content, compile it if not found
	if(!fs.existsSync(contentDir.compiled) || fs.readdirSync(contentDir.compiled).length < 1) {
		console.log("Compiled content not found. Compiling content...")
		await executeCommandInConsole(`${process.versions.bun ? "bun run" : "node"} scripts/compileContent.js`)
		await require("./scripts/getGitDetails").saveGitDetails(process.cwd(), path.join(contentDir.compiled, "git_repo_details.json"))
	}

	// Add some compiled content files to memory
	["redirections", "_index", "git_repo_details"].forEach(fileName => {
		const filePath = path.join(contentDir.compiled, `${fileName}.json`)
		if(!fs.existsSync(filePath)) throw new Error(`Required content file "${fileName}.json" not found in compiled content folder.`)
		const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"))
		if(!fileContent || typeof fileContent != "object") throw new Error(`Content file "${fileName}.json" is not valid. Found:`, fileContent)
		if(fileName == "git_repo_details") globalThis.gitRepoDetails = fileContent
		contentFiles[fileName] = fileContent
	})

	console.log(`Starting the server...          (took ${(Math.round(performance.now() - perfNow) / 1000).toFixed(3)}s)`)
	startRocServer()
}

async function startRocServer(){
	var server = new roc.server({
		port: 3000, // process.env.PORT is sill prioritary
		logger: true,
		path: path.join(__dirname, "public"),

		interceptRequests: true,

		useTailwindCSS: true,
		minifyHtml: true,
		exposeComponents: false,
		serversideCodeExecution: true,
		liveReload: true // only when isDev = true
	})
	const cacheControlHeader = server.isDev ? "no-cache" : "max-age=7200" // 7200sec = 2h

	// Register routes from content files
	server.registerRoutes(contentFiles.redirections.keyValue.map(redirection => {
		return {
			method: "get",
			path: redirection.origine,
			options: {
				redirect: redirection.destination
			}
		}
	}))
	server.registerRoutes(Object.values(contentFiles._index)
		.filter(content => content.type == "document")
		.map(content => {
			return {
				method: "get",
				path: content.slug || content.url,
			}
		}))

	// Listen for incoming requests
	server.on("request", async (req, res) => {
		if(req.method == "GET" && req.simplifiedPath == "version") return res.send(200, mainVersion, { headers: { "Content-Type": "text/plain" } })
		if(req.method == "GET" && req.simplifiedPath == "blog") return res.redirect(302, "/") // hide template file

		// Serve blog documents
		const foundBlogDocument = contentFiles._index[`${req.path.startsWith("/") ? req.path.substring(1) : req.path}.html`]
		if(req.method == "GET" && foundBlogDocument) {
			console.log("=".repeat(50))
			console.log(`Got a request to ${req.path} - Serving blog document with slug: ${foundBlogDocument.slug || foundBlogDocument.url}`)
			console.log(foundBlogDocument)

			const originalBlogHtml = fs.readFileSync(path.join("public", "blog.html"), "utf-8")
			const blogContent = fs.readFileSync(path.join(contentDir.compiled, `${foundBlogDocument.slug}.html`), "utf-8")
			var readTime = caches.get(`readTime-${foundBlogDocument.slug}`)
			if(!readTime) {
				readTime = getReadingTime(blogContent).minutes
				caches.set(`readTime-${foundBlogDocument.slug}`, readTime)
				console.log(`Calculated reading time for blog "${foundBlogDocument.slug}": ${readTime} minutes (now cached)`)
			}

			const bannerPhysicalPath = foundBlogDocument?.frontmatter?.banner ? path.join(contentDir.attachments, foundBlogDocument.frontmatter.banner) : null
			var bannerWebPath
			if(foundBlogDocument?.frontmatter?.banner && !fs.existsSync(bannerPhysicalPath)) {
				console.warn(`Banner image specified in frontmatter of blog post "${foundBlogDocument.slug}" not found at path: ${bannerPhysicalPath} - The banner will not be displayed.`)
			} else if(foundBlogDocument?.frontmatter?.banner) {
				bannerWebPath = foundBlogDocument?.frontmatter?.banner ? path.join(publicAssetsPath, foundBlogDocument.frontmatter.banner).replace(/\\/g, "/") : null
			}

			const editedBlogHtml = originalBlogHtml
				.replaceAll("%%BLOG_TITLE%%", foundBlogDocument?.title)
				.replaceAll("%%BLOG_BANNER%%", `<img src="${bannerWebPath}" alt="" class="w-full h-auto rounded-lg mt-6 bentoCard smallShadow transition-shadow" />`)
				.replaceAll("%%BLOG_DETAILS_READ_TIME%%", readTime)
				.replaceAll("%%BLOG_DETAILS_RELEASE_DATE%%", getAbsoluteDate("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate)))
				.replaceAll("%%BLOG_DETAILS_RELEASE_RELATIVE_DATE%%", getRelativeTime("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate), "ago"))

				.replaceAll("%%BLOG_DETAILS_PROJECT_PERIOD%%", foundBlogDocument?.frontmatter?.post_date || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_THEME%%", foundBlogDocument?.frontmatter?.post_theme || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_AUTHOR%%", foundBlogDocument?.frontmatter?.post_author || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_COAUTHORS%%", foundBlogDocument?.frontmatter?.post_coauthors || "")

				.replaceAll("%%BLOG_DETAILS_LINK_SOURCECODE%%", foundBlogDocument?.frontmatter?.post_link_sourcecode || "")
				.replaceAll("%%BLOG_DETAILS_LINK_DEMO%%", foundBlogDocument?.frontmatter?.post_link_demo || "")
				.replaceAll("%%BLOG_DETAILS_LINK_ANDROID%%", foundBlogDocument?.frontmatter?.download_android || "")
				.replaceAll("%%BLOG_DETAILS_LINK_IOS%%", foundBlogDocument?.frontmatter?.download_ios || "")
				.replaceAll("%%BLOG_DETAILS_LINK_WINDOWS%%", foundBlogDocument?.frontmatter?.download_windows || "")
				.replaceAll("%%BLOG_DETAILS_LINK_MACOS%%", foundBlogDocument?.frontmatter?.download_macos || "")
				.replaceAll("%%BLOG_DETAILS_LINK_LINUX%%", foundBlogDocument?.frontmatter?.download_linux || "")

				.replace("%%BLOG_CONTENT%%", blogContent)

			const htmlResponse = await server.renderPage(editedBlogHtml, { route: { file: null, path: req.path } })
			console.log("=".repeat(50))
			return res.send(200, htmlResponse, { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
		}

		// Redirections from content file, should not be used but still here as a fallback
		const foundRedirection = contentFiles?.redirections?.keyValue?.find(r => r?.origine == req?.path || r?.origine == `${req?.path}/` || `/${r?.origine}` == req?.path)
		if(req.method == "GET" && foundRedirection) return res.redirect(302, foundRedirection.destination)

		// Serve attachments from content folder
		if(req.method == "GET" && req.path.startsWith(publicAssetsPath) && res.initialAction.type == "404") {
			var requestedFilePath = path.join(contentDir.attachments, req.path.substring(publicAssetsPath.length))
			if(fs.existsSync(requestedFilePath) && fs.statSync(requestedFilePath).isFile()) {
				return res.sendFile(200, requestedFilePath, { headers: { "Cache-Control": isEligibleForCache(requestedFilePath) ? cacheControlHeader : "no-cache" } })
			}
			else return res.send(404, "Not Found", { headers: { "Content-Type": "text/plain" } })
		}

		if(res.initialAction.type == "sendHtml") res.send(200, res.initialAction.content, { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendJs") res.send(200, res.initialAction.content, { headers: { "Content-Type": "application/javascript", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendFile") res.sendFile(200, res.initialAction.content, { headers: { "Cache-Control": isEligibleForCache(req.path) ? cacheControlHeader : "no-cache" } })
		else if(res.initialAction.type == "redirect") res.redirect(302, res.initialAction.content)
		else if(res.initialAction.type == "404") res.redirect(302, "/")
		else res.send(500, "Internal Server Error", { headers: { "Content-Type": "text/plain" } })
	})

	server.start()
}

main()