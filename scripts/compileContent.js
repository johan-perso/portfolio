const fs = require("fs")
const path = require("path")
const compileMarkdown = require("./compileMarkdown")

const contentDir = {
	base: path.join(__dirname, "..", "content"),
	raw: path.join(__dirname, "..", "content", "raw"),
	compiled: path.join(__dirname, "..", "content", "compiled"),
	attachments: path.join(__dirname, "..", "content", "attachments"),
}
const publicAssetsPath = "/medias/content/"

const compiledFiles = {}

function readFilesRecursively(dir){
	var files = fs.readdirSync(dir)
	var filesList = []

	files.forEach(file => {
		var filePath = path.join(dir, file)
		if(fs.statSync(filePath).isDirectory()) filesList.push(...readFilesRecursively(filePath))
		else filesList.push(filePath)
	})

	return filesList
}

async function main(){
	const rawFilesList = readFilesRecursively(contentDir.raw)
	console.log(`Found ${rawFilesList.length} raw content files. Reading content...`)

	const rawFilesContent = rawFilesList.map(file => {
		const content = fs.readFileSync(file, "utf-8")
		const ext = path.extname(file).slice(1)

		// Read frontmatter of Markdown files
		const frontMatter = {}
		if(ext == "md") {
			const match = content.match(/^---\n([\s\S]+?)\n---\n/)
			if(match){
				const unparsedFrontMatter = match[1]
				const frontMatterLines = unparsedFrontMatter.split("\n")
				frontMatterLines.forEach(line => {
					const key = line.split(":")[0].trim()
					const value = line.split(":").slice(1).join(":").trim()
					if(key && value) frontMatter[key.toLowerCase()] = value
				})
			}
		}

		return {
			filename: path.relative(contentDir.raw, file),
			ext: ext,
			type: ext == "md" && frontMatter?.["excel-pro-plugin"] == "parsed" ? "excel" : ext == "md" ? "document" : "asset",
			path: file,
			frontMatter,
			content,
		}
	})
	console.log(`Read content from ${rawFilesContent.length} raw content files:
- ${rawFilesContent.filter(f => f.type == "document").length} documents
- ${rawFilesContent.filter(f => f.type == "excel").length} excel files
- ${rawFilesContent.filter(f => f.type == "asset").length} assets\n`)

	// Compile every file according to its type and save it to the compiled directory
	await fs.promises.rm(contentDir.compiled, { recursive: true, force: true })
	await Promise.all(rawFilesContent.map(async (file, i) => {
		var originalFilenameTitle = path.basename(file.filename)
		console.log(`Compiling content... (${i + 1}/${rawFilesContent.length} - ${file.filename})`)

		var formattedFilename
		if(file.type == "document" && file.content.trim().startsWith("---")) file.filename = file?.frontMatter?.slug?.toLowerCase()?.trim() || null
		if(!formattedFilename) formattedFilename = path.basename(file.filename).toLowerCase()

		const compiledPath = path.join(contentDir.compiled, formattedFilename)
		const fileExt = path.extname(file.filename) ?? ""
		const compiledPathHtml = `${!fileExt ? compiledPath : compiledPath.slice(0, -fileExt.length)}.html`
		const compiledPathJson = `${!fileExt ? compiledPath : compiledPath.slice(0, -fileExt.length)}.json`
		await fs.promises.mkdir(path.dirname(compiledPath), { recursive: true })

		if(file.type == "document") {
			const result = await compileMarkdown.convertMarkdown(file.content, {
				filePath: file.path,
				assetsPath: contentDir.attachments,
				publicAssetsPath: publicAssetsPath,
			})
			if(fs.existsSync(compiledPathHtml)) throw new Error(`File ${compiledPathHtml} already exists. Please remove it before compiling.`)
			await fs.promises.writeFile(compiledPathHtml, result.content, "utf-8")
			compiledFiles[path.relative(contentDir.compiled, compiledPathHtml)] = {
				type: "document",
				slug: file.filename,
				title: (path.extname(originalFilenameTitle).length ? originalFilenameTitle.slice(0, -path.extname(originalFilenameTitle).length) : originalFilenameTitle).replace(", ", " : "),
				frontmatter: {
					...file.frontMatter,
				},
			}
		} else if(file.type == "excel") {
			if(fs.existsSync(compiledPathJson)) throw new Error(`File ${compiledPathJson} already exists. Please remove it before compiling.`)

			// Parse content of the file to extract the sheet block
			var sheetBlock = ""
			var parsedSheetBlock = {}
			var isReadingSheetBlock = false
			file.content.split("\n").forEach(line => {
				if(line.startsWith("```sheet")) isReadingSheetBlock = true
				else if(line.startsWith("```")) isReadingSheetBlock = false
				else if(isReadingSheetBlock) sheetBlock += `${line}\n`
			})

			try {
				parsedSheetBlock = JSON.parse(sheetBlock)
			} catch (err) {
				console.error(`Error parsing sheet block in file ${file.filename}:`, err)
				process.exit(1)
			}

			// Extract data from the first sheet (if exists)
			var firstSheetCells = Object.values(Object.values((parsedSheetBlock?.sheets || [{}]))?.[0]?.cellData)
			var headers = Object.values(firstSheetCells?.[0] ?? [{}]).map(cell => (cell?.v || "unknown").toLowerCase().trim()) || []
			var compiledData = { "keyValue": [], "list": {} }
			firstSheetCells.forEach((cell, i) => {
				var cellCols = Object.values(cell).map(c => c?.v || c?.p?.body?.dataStream || "").map(v => typeof v == "string" ? v.trim() : v)
				var cellContentCompiledKeyValue = {}
				cellCols.forEach((col, j) => {
					var header = headers[j] || `column${j + 1}`
					// Add values according to the key-value structure (using the header as key with value of this line)
					cellContentCompiledKeyValue[header] = col
					if(j == cellCols.length - 1) compiledData.keyValue.push(cellContentCompiledKeyValue)

					// Add all values of this column to the list of values for this header
					if(!compiledData.list[header]) compiledData.list[header] = []
					if(i != 0) compiledData.list[header].push(col)
				})
			})

			await fs.promises.writeFile(compiledPathJson, JSON.stringify(compiledData, null, 2), "utf-8")
			compiledFiles[path.relative(contentDir.compiled, compiledPathJson)] = { type: "excel" }
		} else {
			// Copy asset file to compiled directory (for images, PDFs, ...)
			try {
				await fs.promises.copyFile(file.path, compiledPath)
			} catch (err) {
				await fs.promises.writeFile(compiledPath, file.content, "utf-8")
			}
		}
	}))

	await fs.promises.writeFile(path.join(contentDir.compiled, "_index.json"), JSON.stringify(compiledFiles, null, 2), "utf-8")

	console.log(`Compiled content saved to ${contentDir.compiled}`)
}
main()