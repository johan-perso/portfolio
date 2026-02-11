const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")
const roc = require("roc-framework")

const contentDir = {
	base: path.join(__dirname, "content"),
	raw: path.join(__dirname, "content", "raw"),
	compiled: path.join(__dirname, "content", "compiled"),
	attachments: path.join(__dirname, "content", "attachments"),
}
const publicAssetsPath = "/medias/content/"

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

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

	var cacheControlHeader = server.isDev ? "no-cache" : "max-age=7200" // 7200sec = 2h

	server.on("request", (req, res) => {
		if(req.method == "GET" && req.path == "/version") return res.send(200, mainVersion, { headers: { "Content-Type": "text/plain" } })

		if(res.initialAction.type == "sendHtml") res.send(200, res.initialAction.content, { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendJs") res.send(200, res.initialAction.content, { headers: { "Content-Type": "application/javascript", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendFile") res.sendFile(200, res.initialAction.content, { headers: { "Cache-Control": [".png", ".jpg", ".svg", ".webp", ".gif", ".mp4", ".ttf", ".woff2", ".json", ".css", ".js"].includes(path.extname(req.path)) ? cacheControlHeader : "no-cache" } })
		else if(res.initialAction.type == "redirect") res.redirect(302, res.initialAction.content)
		else if(res.initialAction.type == "404") res.send404()
	})

	server.start()
}

main()