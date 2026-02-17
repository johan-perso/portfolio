const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")
const { getRelativeTime, getAbsoluteDate } = require("./utils/dateFormatter")
// const roc = require("roc-framework")
const roc = require("/Volumes/SSD256/MacMini/Developer/roc/index.js")

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

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

	// Check for compiled content, compile it if not found
	if(!fs.existsSync(contentDir.compiled)) {
		console.log("Compiled content not found. Compiling content...")
		var spawnedCompileProcess = childProcess.exec(`${process.versions.bun ? "bun run" : "node"} scripts/compileContent.js`)
		await new Promise((resolve, reject) => {
			spawnedCompileProcess.stdout.on("data", data => {
				if(typeof data == "string") console.log(`> ${data.trim().split("\n").join("\n> ")}`)
				else process.stdout.write(data)
			})
			spawnedCompileProcess.stderr.on("data", data => {
				if(typeof data == "string") console.error(`> ${data.trim().split("\n").join("\n> ")}`)
				else process.stderr.write(data)
			})
			spawnedCompileProcess.on("close", code => {
				if(code === 0) resolve()
				else reject(new Error(`Content compilation process exited with code ${code}`))
			})
		})
	}

	// Add some compiled content files to memory
	["redirections", "_index"].forEach(fileName => {
		const filePath = path.join(contentDir.compiled, `${fileName}.json`)
		if(!fs.existsSync(filePath)) throw new Error(`Required content file "${fileName}.json" not found in compiled content folder.`)
		const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"))
		if(!fileContent || typeof fileContent != "object") throw new Error(`Content file "${fileName}.json" is not valid. Found:`, fileContent)
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
			console.log("=".repeat(50))

			const originalBlogHtml = fs.readFileSync(path.join("public", "blog.html"), "utf-8")
			const editedBlogHtml = originalBlogHtml
				.replaceAll("%%BLOG_TITLE%%", foundBlogDocument?.title)
				.replaceAll("%%BLOG_DETAILS_READ_TIME%%", 0) // TODO
				.replaceAll("%%BLOG_DETAILS_RELEASE_DATE%%", getAbsoluteDate("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate)))
				.replaceAll("%%BLOG_DETAILS_RELEASE_RELATIVE_DATE%%", getRelativeTime("fr-FR", new Date(foundBlogDocument?.frontmatter?.post_releasedate), "ago"))

			const htmlResponse = await server.renderPage(editedBlogHtml, { route: { file: null, path: req.path } })
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