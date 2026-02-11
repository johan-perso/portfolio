const fs = require("fs")
const path = require("path")

// TODO: Dans le parser, on remplace « , » dans un titre d'article de blog par « : » prcq un nom de fichier peut pas l'avoir mais dcp on perd l'info de base

const contentDir = {
	base: path.join(__dirname, "..", "content"),
	raw: path.join(__dirname, "..", "content", "raw"),
	compiled: path.join(__dirname, "..", "content", "compiled"),
}

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

		const frontMatter = {}
		if(ext == "md") {
			const match = content.match(/^---\n([\s\S]+?)\n---\n/)
			if(match){
				const unparsedFrontMatter = match[1]
				const frontMatterLines = unparsedFrontMatter.split("\n")
				frontMatterLines.forEach(line => {
					const [key, value] = line.split(":").map(s => s.trim())
					if(key && value) frontMatter[key] = value
				})
			}
		}

		return {
			filename: path.relative(contentDir.raw, file),
			ext: ext,
			type: ext == "md" && frontMatter?.["excel-pro-plugin"] == "parsed" ? "excel" : ext == "md" ? "document" : "asset",
			path: file,
			content,
		}
	})
	console.log(`Read content from ${rawFilesContent.length} raw content files:
- ${rawFilesContent.filter(f => f.type == "document").length} documents
- ${rawFilesContent.filter(f => f.type == "excel").length} excel files
- ${rawFilesContent.filter(f => f.type == "asset").length} assets\n`)

	rawFilesContent.forEach((file, i) => {
		console.log(`Compiling content... (${i + 1}/${rawFilesContent.length} - ${file.filename})`)
		const formattedFilename = path.basename(file.filename).toLowerCase()
		const compiledPath = path.join(contentDir.compiled, formattedFilename)
		const compiledPathJson = `${compiledPath.slice(0, -path.extname(file.filename).length)}.json`
		fs.mkdirSync(path.dirname(compiledPath), { recursive: true })

		if(file.type == "document") {
			// Goes on every line, parse frontmatter, differents tags, and organizes it in an array with each content
			// Parsing will be similar to the one in MarkDocs, maybe the same code
		} else if(file.type == "excel") {
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
			fs.writeFileSync(compiledPathJson, JSON.stringify(compiledData, null, 2), "utf-8")
		} else {
			// Copy asset file to compiled directory (for images, PDFs, ...)
			try {
				fs.copyFileSync(file.path, compiledPath)
			} catch (err) {
				fs.writeFileSync(compiledPath, file.content, "utf-8")
			}
		}
	})
	console.log(`Compiled content saved to ${contentDir.compiled}`)
}
main()