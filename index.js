if(!process.versions.bun) console.warn("Warning: It is recommended to run this server using Bun for better library compatibility.")

const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")
const { getRelativeTime, getAbsoluteDate } = require("./utils/dateFormatter")
const getReadingTime = require("./utils/readingTime")
const roc = require("roc-framework")

const NodeCache = require("node-cache")
const caches = new NodeCache({ stdTTL: 60 * 60 * 24 * 30 }) // cache with a default of 30 days

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

function getBlogDocument(slug, frontmatter){
	if(!slug) throw new Error("Slug is required to get a blog document.")
	if(caches.has(`blogDocument-${slug}`)) {
		console.log(`Blog document "${slug}" found in cache.`)
		return caches.get(`blogDocument-${slug}`)
	}

	const originalBlogHtml = fs.readFileSync(path.join("public", "blog_post_template.html"), "utf-8")
	const blogContent = fs.readFileSync(path.join(contentDir.compiled, `${slug}.html`), "utf-8")

	var readTime = caches.get(`readTime-${slug}`)
	if(!readTime) {
		readTime = getReadingTime(blogContent).minutes
		caches.set(`readTime-${slug}`, readTime)
		console.log(`Calculated reading time for blog "${slug}": ${readTime} minutes (now cached)`)
	}

	const bannerPhysicalPath = frontmatter?.banner ? path.join(contentDir.attachments, frontmatter.banner) : null
	var bannerWebPath
	if(frontmatter?.banner && !fs.existsSync(bannerPhysicalPath)) {
		console.warn(`Banner image specified in frontmatter of blog post "${slug}" not found at path: ${bannerPhysicalPath} - The banner will not be displayed.`)
	} else if(frontmatter?.banner) {
		bannerWebPath = frontmatter?.banner ? path.join(publicAssetsPath, frontmatter.banner).replace(/\\/g, "/") : null
	}

	var toReturn = {
		originalBlogHtml,
		blogContent,
		readTime,
		bannerWebPath
	}
	caches.set(`blogDocument-${slug}`, toReturn)
	return toReturn
}

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

	// Check for compiled content, compile it if not found
	const compiledContentFolder = fs.existsSync(contentDir.compiled) ? fs.readdirSync(contentDir.compiled) : []
	if(!compiledContentFolder || compiledContentFolder.length < 1) {
		console.log("Compiled content not found. Compiling content...")
		await executeCommandInConsole(`${process.versions.bun ? "bun run" : "node"} scripts/compileContent.js`)
	}
	if(!compiledContentFolder.includes("git_repo_details.json")) await require("./scripts/getGitDetails").saveGitDetails(process.cwd(), path.join(contentDir.compiled, "git_repo_details.json"))

	// Add some compiled content files to memory
	const requiredFiles = ["redirections", "_index", "git_repo_details"]
	requiredFiles.forEach(fileName => {
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

	// Parse blog documents from content index
	const blogDocuments = Object.values(contentFiles._index).filter(content => content.type == "document").sort((a, b) => new Date(b.frontmatter?.post_releasedate || 0) - new Date(a.frontmatter?.post_releasedate || 0))
	globalThis.recentsBlogArticlesMachineCards = blogDocuments.filter(content => content?.frontmatter?.visibility != "hidden").slice(0, 5).map(content => {
		const href = content.slug || content.url || "#"
		return `<p><span class="text-stone-400">-</span> <a target="_blank" class="hover:underline decoration-blue-500" href="${href}"><span>[${(content.title || "").replace(/\[/g, "\\[").replace(/\]/g, "\\]")}]</span><span class="text-stone-400 break-all">(/${href})</span></a></p>`
	}).join("\n")
	globalThis.recentsBlogArticlesCards = blogDocuments.filter(content => content?.frontmatter?.visibility != "hidden").slice(0, 3).map(content => {
		return `<BlogPostCard
			date="${content.frontmatter?.post_releasedate || ""}"
			title="${(content.title || "").replace(/"/g, "&quot;")}"
			content="${(content.firstParagraph || "").replace(/"/g, "&quot;")}"
			href="${content.slug || content.url || "#"}"
		></BlogPostCard>`
	}).join("\n")
	globalThis.blogDocumentsCards = blogDocuments.filter(content => content?.frontmatter?.visibility != "hidden").map(content => {
		const { readTime, bannerWebPath } = getBlogDocument(content?.slug, content?.frontmatter)
		const banner = bannerWebPath ? `<img src="${bannerWebPath.replace(/"/g, "\\\"")}" alt="" class="w-full h-auto aspect-video object-cover rounded-lg mt-4 bentoCard smallShadow duration-300 transition-shadow" />` : ""
		const href = `${(content.slug ? `/${content.slug}` : undefined) || content.url || "#"}?from=/articles`

		return `<div class="bentoCard smallShadow rounded-[18px] text-primary-content font-normal text-sm w-full h-full p-5 transition-all duration-300 overflow-hidden">
			<div class="inline items-start justify-between min-w-0">
				<a href="${href}" class="hover:text-link w-fit duration-300 transition-colors font-medium text-base 2xl:text-[17px] overflow-hidden text-ellipsis line-clamp-2 text-primary-content-heavy">
					${(content.title || "").replace(/"/g, "&quot;")}
				</a>
				<p class="mt-1 2xl:mt-[3px] text-sm line-clamp-2 text-primary-content-light">Publié le ${getAbsoluteDate("fr-FR", new Date(content?.frontmatter?.post_releasedate))} • ${readTime || "0"} min de lecture</p>

				${banner ? `<a href="${href}">
					${banner}
				</a>` : `<p class="mt-3 font-normal text-primary-content-light overflow-hidden break-words text-ellipsis line-clamp-5 leading-snug">${(content.firstParagraph || "").replace(/"/g, "&quot;")}</p>`}
			</div>
		</div>`
	}).join("\n")

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
	server.registerRoutes(blogDocuments
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

			const { originalBlogHtml, blogContent, readTime, bannerWebPath } = getBlogDocument(foundBlogDocument?.slug, foundBlogDocument?.frontmatter)

			const editedBlogHtml = originalBlogHtml
				.replaceAll("%%BLOG_TITLE%%", foundBlogDocument?.title)
				.replaceAll("%%BLOG_BANNER%%", !bannerWebPath ? "" : `<img src="${bannerWebPath}" alt="" class="w-full h-auto rounded-lg mt-6 bentoCard smallShadow duration-300 transition-shadow" />`)
				.replaceAll("%%BLOG_DETAILS_READ_TIME%%", readTime)
				.replaceAll("%%BLOG_DETAILS_RELEASE_DATE%%", getAbsoluteDate("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate)))
				.replaceAll("%%BLOG_DETAILS_RELEASE_RELATIVE_DATE%%", getRelativeTime("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate), "ago"))

				.replaceAll("%%BLOG_DETAILS_PROJECT_PERIOD%%", foundBlogDocument?.frontmatter?.post_date || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_THEME%%", foundBlogDocument?.frontmatter?.post_theme || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_AUTHOR%%", foundBlogDocument?.frontmatter?.post_author || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_COAUTHORS%%", foundBlogDocument?.frontmatter?.post_coauthors || "")

				.replaceAll("%%BLOG_DETAILS_LINK_SOURCECODE%%", foundBlogDocument?.frontmatter?.link_sourcecode || "")
				.replaceAll("%%BLOG_DETAILS_LINK_DEMO%%", foundBlogDocument?.frontmatter?.link_demo || "")
				.replaceAll("%%BLOG_DETAILS_LINK_ANDROID%%", foundBlogDocument?.frontmatter?.download_android || "")
				.replaceAll("%%BLOG_DETAILS_LINK_IOS%%", foundBlogDocument?.frontmatter?.download_ios || "")
				.replaceAll("%%BLOG_DETAILS_LINK_WINDOWS%%", foundBlogDocument?.frontmatter?.download_windows || "")
				.replaceAll("%%BLOG_DETAILS_LINK_MACOS%%", foundBlogDocument?.frontmatter?.download_macos || "")
				.replaceAll("%%BLOG_DETAILS_LINK_LINUX%%", foundBlogDocument?.frontmatter?.download_linux || "")

				.replace("%%BLOG_ROBOTS_RULES%%", foundBlogDocument?.frontmatter?.visibility == "hidden" ? "noindex" : "index")
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