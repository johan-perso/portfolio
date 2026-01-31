var path = require("path")
var roc = require("roc-framework")

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

	// var allPromises = []

	// if(rebuildWebsite) allPromises.push(new Promise(async (resolve) => {
	// 	if(fs.existsSync(buildedSitePath)) fs.rmSync(buildedSitePath, { recursive: true })
	// 	await buildSite()
	// 	resolve()
	// }))

	console.log(`Starting the server...          (took ${(Math.round(performance.now() - perfNow) / 1000).toFixed(3)}s)`)
	startRocServer()
}

// function readFilesRecursively(dir){
// 	var files = fs.readdirSync(dir)
// 	var filesList = []

// 	files.forEach(file => {
// 		var filePath = path.join(dir, file)
// 		if(fs.statSync(filePath).isDirectory()) filesList.push(...readFilesRecursively(filePath))
// 		else filesList.push(filePath)
// 	})

// 	return filesList
// }

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