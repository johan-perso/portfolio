// Based on MarkDocs CLI Markdown parser
// https://github.com/johan-perso/MarkDocs/blob/main/utils/convertMd.js

const fs = require("fs")
const path = require("path")
const stripMarkdown = require("../utils/stripMarkdown")
const { svgPaths } = require("../utils/svgPaths")

const components = {
	"callout": fs.readFileSync(path.join(__dirname, "..", "public", "components", "Callout.html"), "utf-8"),
	"primarybutton": fs.readFileSync(path.join(__dirname, "..", "public", "components", "PrimaryButton.html"), "utf-8")
}

function escapeHtml(text){
	if(!text) return text
	if(typeof text != "string") return text
	text = normalizeText(text)
	return text?.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp")?.replace(/</g, "&lt;")?.replace(/>/g, "&gt;")?.replace(/"/g, "&quot;")?.replace(/'/g, "&apos;")
}

function extractLinkAndText(markdownLink) {
	if(!markdownLink) return { url: null, content: null }
	const urlSplitRegex = /\[(.*?)\]\((.*?)\)/
	const hyperlinkPropertiesMatch = markdownLink?.match(urlSplitRegex)
	var url = hyperlinkPropertiesMatch?.[2] || markdownLink?.split("(")?.[1]?.split(")")?.[0] || null
	const content = hyperlinkPropertiesMatch?.[1] || markdownLink?.split("[")?.[1]?.split("]")?.[0] || null
	return { url, content }
}

function checkForBasicMarkdownSyntax(text){ // check for bold, italic, strikethrough and underline
	return text
		.replace(/(\*\*|__)(?:(?!\1|<[^>]*>)(.|\n))*?\1/g, match => `<strong class="font-medium">${escapeHtml(match.slice(2, -2))}</strong>`) // bold
		.replace(/(\*|_)(?:(?!\1|<[^>]*>)(.|\n))*?\1/g, match => `<strong class="font-medium">${escapeHtml(match.slice(1, -1))}</strong>`) // italic text will be bold (font doesn't support italic)
		// .replace(/(\*|_)(?:(?!\1|<[^>]*>)(.|\n))*?\1/g, match => `<em class="italic">${escapeHtml(match.slice(1, -1))}</em>`) // (disabled) italic
		.replace(/~~(?:(?!~~|<[^>]*>)(.|\n))*?~~/g, match => `<del>${escapeHtml(match.slice(2, -2))}</del>`) // strikethrough
		.replace(/__(?:(?!__|<[^>]*>)(.|\n))*?__/g, match => `<u>${escapeHtml(match.slice(2, -2))}</u>`) // underline
		.replace(/`(?:(?!`|<[^>]*>)(.|\n))*?`/g, match => `<code>${escapeHtml(match.slice(1, -1))}</code>`) // inline code
}

function normalizeText(text){
	if(!text) return text
	if(typeof text != "string") return text
	text = text.replace(/\r/g, "").replace(/\t/g, "")
	text = text.replace(/\n{3,}/g, "\n\n") // replace 3 or more new lines with only 2 new lines
	text = text.replace(/ {2,}/g, " ") // replace 2 or more spaces with only 1 space
	text = text.replace(/'/g, "'") // replace special apostrophes with simple ones
	return text.normalize("NFC") // avoid issues wih some unicode characters such as emojis or weird chatgpt-ahh spaces
}

function addRefInUrl(url, ref){
	return url
	// if(!url) return url
	// const [baseUrl, hash] = url.split("#")
	// const separator = baseUrl.includes("?") ? "&" : "?"
	// return `${baseUrl}${separator}ref=${ref}${hash ? `#${hash}` : ""}`
}

function formatTableCell(cell) {
	const normalized = cell.replaceAll("<br/>", "<br>").replaceAll("<br />", "<br>")
	const parts = normalized.split("<br>").map(p => p.trim()).filter(p => p.length > 0)

	if(parts.some(p => p.startsWith("- "))) {
		const items = parts.map(p => {
			const text = p.startsWith("- ") ? p.slice(2).trim() : p
			return `<li>${checkForBasicMarkdownSyntax(escapeHtml(text))}</li>`
		}).join("")
		return `<ul class="list-disc list-inside space-y-0.5 py-0.5">${items}</ul>`
	}

	return parts.map(p => checkForBasicMarkdownSyntax(escapeHtml(p))).join("<br>")
}

var lastRandomStrings = {}
function randomString(length, ignoreDuplicateCheck = false, retryI = 0) {
	var result = ""
	var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	var charactersLength = characters.length
	for (var i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength))
	}

	if(!ignoreDuplicateCheck) { // check to avoid generating multiple times the same string in a row
		if(!lastRandomStrings[length]) lastRandomStrings[length] = []
		if(lastRandomStrings[length]?.includes(result)) {
			if(retryI > 50) throw new Error(`randomString - Too many retries to generate a unique string for ${length} characters.`)
			return randomString(length)
		}
		lastRandomStrings[length].push(result)
	}

	return result
}

async function searchReferenceFile(referenceName, searchPath){
	function getReturnValue(filePath){
		var slug = fs.readFileSync(filePath, "utf-8").split("\n").find(line => line.trim().startsWith("slug:"))?.split("slug:")[1]?.trim()
		return {
			path: filePath,
			url: `/${slug || path.parse(filePath).name}`
		}
	}

	referenceName = referenceName.toLowerCase()
	const files = fs.readdirSync(searchPath)
	for(const file of files){
		const filePath = path.join(searchPath, file)
		const lowerCaseFileName = file.toLowerCase()

		if(fs.lstatSync(filePath).isDirectory()){
			const result = await searchReferenceFile(referenceName, filePath)
			if(result) return result
		} else {
			if(lowerCaseFileName == referenceName || lowerCaseFileName == `${referenceName}.md`) return getReturnValue(filePath)
		}
	}
	return null
}

// Convert a Markdown document into an object with content formatted as HTML
/**
 * Convert a Markdown document into an object with content formatted as HTML
 * @param {String} content Markdown document content
 * @param {String} options.assetsPath Path to the folder that contains the assets attached in the Markdown document (images, videos, etc.)
 * @param {String} options.publicAssetsPath Public (on the web server) path that browsers will use to access assets (used to generate the correct src in the HTML content)
 * @param {String} options.filePath Path to the Markdown file being converted (used to resolve local references and links)
 * @param {boolean} options.renameAssets Whether to rename assets with random strings (avoid leaking information when serving them)
 * @returns {Object}
*/
module.exports.convertMarkdown = async (
	content,
	options = {
		assetsPath: null,
		filePath: null,
		renameAssets: true
	}
) => {
	const contentObject = {
		warns: [],
		images: [],
		metadata: {},
		content: ""
	}

	const lines = content.split("\n")
	let lastLineType = ""
	let lastLineWasEmpty = false

	let currentValue = ""
	let currentAction = ""
	let currentActionHistory = []

	let wentPastFirstParagraph = false
	let wentPastFirstTitle = false
	let tableIsInHeader = true

	const htmlTokens = {}
	let tokenIndex = 0

	function addHtmlToken(html){
		const token = `?!(HTMLTOKEN:N${tokenIndex.toString()})!?`
		tokenIndex++
		htmlTokens[token] = html
		return token
	}

	function currentAction_set(action){
		if(currentAction == action) return false
		currentActionHistory.push(action)
		currentAction = action
		return true
	}

	function currentAction_precedent(){
		if(!currentActionHistory.length) currentAction = ""
		else {
			currentActionHistory = currentActionHistory.slice(0, -1)
			currentAction = currentActionHistory[currentActionHistory.length - 1]
		}
		return true
	}

	// Check every line of the document for specific syntax
	for (let i = 0; i < lines.length; i++) {
		var line = lines[i]

		if(line == "----"){
			lastLineType = "separator"
			contentObject.content += "<hr>"
			lastLineWasEmpty = false
			continue
		}

		if(currentAction != "codeblock" && currentAction != "custom-component" && line.trim().startsWith("```") && !line.trim().startsWith("```component")){
			currentAction_set("codeblock")
			const language = line.trim().slice(3).trim() || ""
			contentObject.content += `<pre><code${language ? ` class="language-${escapeHtml(language.replace(/\s/g, "-"))}"` : ""}>`
			lastLineWasEmpty = false
			continue
		}
		if(currentAction == "codeblock" && line.trim().startsWith("```")){
			currentAction_precedent()
			contentObject.content += "</code></pre>\n"
			lastLineType = "codeblock"
			lastLineWasEmpty = false
			continue
		}

		if(currentAction == "codeblock"){
			contentObject.content += `${escapeHtml(line)}\n`
			lastLineType = "codeblock"
			lastLineWasEmpty = false
			continue
		}

		if(currentAction != "metadata" && line.trim() == "---" && !Object.keys(contentObject.metadata).length){
			currentAction_set("metadata")
			lastLineType = "metadata"
			continue
		}
		if(currentAction == "metadata" && line.trim() == "---"){
			currentAction_precedent()
			lastLineType = "metadata"
			continue
		}

		if(currentAction == "metadata"){
			const key = line.split(":")[0].trim()
			const value = line.split(":").slice(1).join(":").trim()
			contentObject.metadata[key.toLowerCase()] = value
			lastLineType = "metadata"
			continue
		}

		// ========= Actions that can potentially edit the content

		// images attached with the format: ![Image](/image.png)
		const imagesWithAltMatches = line.match(/!\[.*?\]\(.*?\)/g)
		if(imagesWithAltMatches?.length){
			imagesWithAltMatches.forEach(imageMatch => {
				const extract = extractLinkAndText(linkMatch.content)
				var { url, content } = extract
				if(!url || !content) return

				// Remove "|number" at the end of the URL (syntax used by Obsidian to specify image width)
				url = url?.replace(/\|(\d+)$/, "")

				const image = {
					"alt": checkForBasicMarkdownSyntax(escapeHtml(extract.content)),
					"src": extract.url
				}

				var imagePath = path.join(options.assetsPath, image.src)
				var imageContent
				try {
					imageContent = fs.readFileSync(imagePath)
					image.content = imageContent
					image.path = imagePath
					if(options.renameAssets) image.src = `${randomString(12)}${path.parse(imagePath).ext}`

					contentObject.images.push(image)
					lastLineType = "image"

					const html = image.src.endsWith(".mp4")
						? `<video class="w-full h-auto rounded-lg shadow my-5" controls src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" aria-label="${image.alt.replace(/"/g, "\\\"")}" />`
						: `<img class="w-full h-auto rounded-lg bentoCard smallShadow transition-shadow my-5" src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" alt="${image.alt.replace(/"/g, "\\\"")}" />`
					line = line.replace(
						imageMatch,
						addHtmlToken(html)
					)
				} catch (error) {
					contentObject.warns.push(`Attaching an image - Cannot read the file located at "${imagePath}".`)
				}
			})
		}

		// link attached with following format: ![[file name]]
		// Obsidian supports referencing any files (including other notes), but we will focus on images
		const imagesWithoutAltMatches = line.match(/!\[\[.*?\]\]/g)
		if(imagesWithoutAltMatches?.length){
			imagesWithoutAltMatches.forEach(match => {
				var link = match.split("[[")[1].split("]]")[0]
				link = link?.replace(/\|(\d+)$/, "") // remove "|number" at the end of the URL (syntax used by Obsidian to specify image width)

				if(!link.endsWith(".png") && !link.endsWith(".jpg") && !link.endsWith(".jpeg") && !link.endsWith(".gif") && !link.endsWith(".webp")){
					contentObject.warns.push(`Attaching an image - The extension of the file located at "${imagePath}" is not supported. Supported extensions are: .png, .jpg, .jpeg, .gif and .webp.`)
					return
				}

				var imageContent
				var imagePath = path.join(options.assetsPath, link)
				var image = { "alt": "", "src": link, "path": imagePath }

				// Try to read the file
				try {
					imageContent = fs.readFileSync(imagePath)
					image.content = imageContent
					if(options.renameAssets) image.src = `${randomString(12)}${path.parse(imagePath).ext}`
				} catch (error) {
					contentObject.warns.push(`Attaching an image - Cannot read the file located at "${imagePath}".`)
					return
				}

				contentObject.images.push(image)
				lastLineType = "image"
				lastLineWasEmpty = false

				line = line.replace(
					match,
					addHtmlToken(`<img class="w-full h-auto rounded-lg bentoCard smallShadow transition-shadow my-5" src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" alt="${image.alt.replace(/"/g, "\\\"")}" />`)
				)
			})
		}

		// ========= Actions that can potentially add content

		// callouts
		if(line.startsWith("> [!") || line.startsWith(">[!")){
			currentAction_set("callout")

			var tempLine = line.split("]")[1].trim()
			if(tempLine.startsWith("- ")) tempLine = tempLine.slice(2)
			line = `${line.split("]")[0]}]${tempLine}`

			// var original_calloutType = (line.split("[!")[1].split("]")[0]).toLowerCase()
			// var calloutTitle = line.split("]")[1]?.trim()
			// var calloutType = original_calloutType != "warn" && original_calloutType != "warning" && original_calloutType != "error" ? "info" : original_calloutType

			lastLineType = "callout"
			lastLineWasEmpty = false
			continue
		} else if(currentAction == "callout"){
			if(!line){
				currentAction_precedent()
				contentObject.content += `<div class="mt-4">${components.callout.replaceAll("{{ $content }}", currentValue?.trim() || "")}</div>\n`
				currentValue = ""
			} else currentValue += `${checkForBasicMarkdownSyntax(escapeHtml(line.startsWith(">") ? line.slice(1).trim() : line.trim()))}<br>`
			lastLineType = "callout"
			lastLineWasEmpty = false
			continue
		}

		// hide comments but warn about them
		else if(line.startsWith("<!--") && line.endsWith("-->")){ // (HTML comments)
			contentObject.warns.push(`Comment - ${line}`)
			if(lines[i + 1] == "") i++ // skip the next line if it's empty
			continue
		} else if(line.startsWith("%%") && line.endsWith("%%")){ // (Markdown comments)
			contentObject.warns.push(`Comment - ${line}`)
			if(lines[i + 1] == "") i++
			continue
		}

		// custom components (HTML inside of a codeblock)
		else if(line.startsWith("```component")){
			currentAction_set("custom-component")
			lastLineType = "custom-component"
			lastLineWasEmpty = false
			continue
		} else if(currentAction == "custom-component" && line.startsWith("```")){
			currentAction_precedent()
			lastLineType = "custom-component"
			lastLineWasEmpty = false
			continue
		}

		// titles (+ custom anchor)
		else if(line.startsWith("#")){
			const lineParts = line.trim().split(" ")

			var titleLevel = lineParts[0].length
			if(titleLevel > 6) titleLevel = 6

			var anchor = lineParts[lineParts.length - 1].startsWith("^") ? lineParts.pop().slice(1) : null
			if(anchor == null){ // autogenerate anchor if not specified
				anchor = lineParts.slice(1).join(" ").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^[a-zA-Z0-9\-_]+$/g, "-").replace(/^-+|-+$/g, "").slice(0, 50)
			} else { // remove anchor from line
				line = line.split(` ^${anchor}`)[0]
				if(!/^[a-zA-Z0-9\-_]+$/.test(anchor)){
					contentObject.warns.push(`Title Custom Anchor - "${anchor}" is not a valid custom anchor. It need to be composed of letters, numbers, dashes or underscores, without spaces.`)
					anchor = anchor.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^[a-zA-Z0-9\-_]+$/g, "-").replace(/^-+|-+$/g, "").slice(0, 50)
				}
			}

			line = line.replace("#".repeat(titleLevel), "").trim()

			if(!wentPastFirstTitle && line.trim() != "") {
				const ctaButtons = []
				if(contentObject.metadata?.download_android) ctaButtons.push({ platform: "Android", href: contentObject.metadata.download_android, svgPath: svgPaths.android, includeMb: true })
				if(contentObject.metadata?.download_ios) ctaButtons.push({ platform: "iOS", href: contentObject.metadata.download_ios, svgPath: svgPaths.apple, includeMb: true })
				if(contentObject.metadata?.download_windows) ctaButtons.push({ platform: "Windows", href: contentObject.metadata.download_windows, svgPath: svgPaths.windows, includeMb: false })
				if(contentObject.metadata?.download_macos) ctaButtons.push({ platform: "macOS", href: contentObject.metadata.download_macos, svgPath: svgPaths.macos, includeMb: false })
				if(contentObject.metadata?.download_linux) ctaButtons.push({ platform: "Linux", href: contentObject.metadata.download_linux, svgPath: svgPaths.linux, includeMb: true })

				contentObject.content += `<div class="mt-4 flex gap-3 max-[600px]:gap-2.5 max-[600px]:flex-col max-[600px]:[&>*]:w-full">
					${ctaButtons.map(button => components.primarybutton.replaceAll("{{ $label }}", `Télécharger pour ${button.platform}`).replaceAll("{{ $href }}", button.href).replaceAll("{{ $svgPath }}", button.svgPath).replace((button.includeMb ? "<svg " : "<svg class=\"mb-0.5\""), "<svg ")).join("\n")}
				</div>`
			}

			contentObject.content += `<div class="flex gap-1.5 ${lastLineType.startsWith("title") ? "mt-3" : "mt-8"} blogHeader">
				<h${titleLevel} id="${escapeHtml(anchor)}" class="font-semibold text-primary-content-heavy antialiased ${titleLevel < 3 ? "leading-8" : "leading-5"}" style="font-size: ${24 * Math.pow(0.9, titleLevel - 1)}px">${checkForBasicMarkdownSyntax(escapeHtml(line))}</h${titleLevel}>
				<a href="#${escapeHtml(anchor)}" onclick="copyHeaderLink(event)" class="text-link focus:underline hover:underline transition-opacity duration-100 opacity-0 focus:opacity-100 hover:opacity-100 ${titleLevel < 3 ? "leading-8" : "leading-5"}" style="font-size: ${(titleLevel > 4 ? 24 : 20) * Math.pow(0.9, titleLevel - 1)}px">#</a>
			</div>`
			wentPastFirstTitle = true
			lastLineType = `title-${titleLevel}`
		}

		// bullets points list
		else if(line.trim().startsWith("- ")){
			if(currentAction != "ul") {
				contentObject.content += "<ul class=\"mt-2.5 list-disc list-outside marker-medium pl-5 space-y-1\">\n"
				currentAction_set("ul")
			}
			contentObject.content += `<li>${checkForBasicMarkdownSyntax(escapeHtml(line.trim().slice(2)))}</li>\n`
			lastLineType = "list"
		} else if(currentAction == "ul"){
			currentAction_precedent()
			contentObject.content += "</ul>\n"
			lastLineType = "list"
		}

		// numbered list
		else if(line.trim().match(/^\d+\. /)){
			if(currentAction != "ol") {
				contentObject.content += "<ul class=\"mt-2.5 list-decimal list-outside marker-medium pl-5 space-y-1\">\n"
				currentAction_set("ol")
			}
			contentObject.content += `<li>${checkForBasicMarkdownSyntax(escapeHtml(line.trim().replace(/^\d+\. /, "")))}</li>\n`
			lastLineType = "list"
		} else if(currentAction == "ol"){
			currentAction_precedent()
			contentObject.content += "</ul>\n"
			lastLineType = "list"
		}

		// blockquote that includes blog post
		else if(line.trim().toLowerCase().startsWith("> read:")) {
			const reference = line.trim().toLowerCase().split("> read:")[1].trim().replace("[[", "").replace("]]", "")
			const searchResult = await searchReferenceFile(reference, path.dirname(options.filePath))
			if(searchResult && searchResult?.path && searchResult?.url) {
				const fileContent = fs.readFileSync(searchResult.path, "utf-8")
				const splitFileContent = fileContent.split("\n")

				const releaseDate = splitFileContent.find(line => line.trim().toLowerCase().startsWith("post_releasedate:"))?.split(":").slice(1).join(":").trim() || "UNKNOWN"
				const title = path.parse(searchResult.path)?.name?.replace(", ", " : ").replace(/"/g, "\\\"")
				var content = stripMarkdown(fileContent, true)
				if(content.length > 400) content = `${content.slice(0, 400)}...`
				if(![".", "!", "?"].includes(content[content.length - 1])) content += "." // add trailing dot if not present

				contentObject.content += `<div class="mt-5"><BlogPostCard date="${releaseDate}" title="${escapeHtml(title)}" content="${checkForBasicMarkdownSyntax(escapeHtml(content))}" href="${searchResult.url.replace(/"/g, "\\\"")}"></BlogPostCard></div>\n`
			} else {
				contentObject.warns.push(`Blog Post Card - Cannot find the referenced file "${reference}" for the blog post card (searchResult: ${searchResult}).`)
			}
			lastLineType = "blogpostcard"
		}

		// blockquote
		else if(line.trim().startsWith(">")){
			if(currentAction != "blockquote") currentAction_set("blockquote")
			currentValue += `${checkForBasicMarkdownSyntax(escapeHtml(line.trim().slice(1).trim()))}<br/>\n`
			lastLineType = "blockquote"
		} else if(currentAction == "blockquote"){
			currentAction_precedent()
			contentObject.content += `<div class="mt-4">${components.callout.replaceAll("{{ $content }}", currentValue?.trim() || "")}</div>\n`
			currentValue = ""
			lastLineType = "blockquote"
		}

		// tables
		else if(line.trim().startsWith("|") && line.trim().endsWith("|")) {
			const trimmed = line.trim()
			const isSeparator = trimmed.split("|").slice(1, -1).every(cell => /^\s*:?-+:?\s*$/.test(cell))

			if(currentAction !== "table") {
				currentAction_set("table")
				tableIsInHeader = true
				currentValue = ""
			}

			if(isSeparator) {
				tableIsInHeader = false
			} else {
				const cells = trimmed.split("|").slice(1, -1).map(cell => cell.trim())
				if(tableIsInHeader) {
					const cellsHtml = cells.map(cell => `<th class="px-4 py-2.5 text-left font-semibold text-primary-content-heavy border-b border-light-background-heavier">${checkForBasicMarkdownSyntax(escapeHtml(cell))}</th>`).join("")
					currentValue += `<thead><tr>${cellsHtml}</tr></thead><tbody>`
				} else {
					const cellsHtml = cells.map(cell => `<td class="px-4 py-2 text-primary-content border-b border-light-background-heavy">${formatTableCell(cell)}</td>`).join("")
					currentValue += `<tr class="hover:bg-light-background transition-colors">${cellsHtml}</tr>`
				}
			}

			lastLineType = "table"
			lastLineWasEmpty = false
			continue
		} else if(currentAction === "table") {
			currentAction_precedent()
			const closingBodyTag = currentValue.includes("<tbody>") ? "</tbody>" : ""
			contentObject.content += `<div class="overflow-x-auto mt-5 rounded-xl bentoCard smallShadow transition-shadow"><table class="w-full text-sm border-collapse">${currentValue}${closingBodyTag}</table></div>\n`
			currentValue = ""
			tableIsInHeader = true
			lastLineType = "table"
		}

		// default behavior
		else {
			if(line.trim() != "") {
				let marginTop = lastLineWasEmpty && lastLineType == "paragraph" ? "mt-2.5" : "mt-1"
				if(lastLineType == "image" || !wentPastFirstParagraph) marginTop = "mt-6"
				else if(lastLineType == "list") marginTop = "mt-3.5"
				else if(lastLineType.startsWith("title-")) {
					const titleLevel = parseInt(lastLineType.split("-")[1] ?? "1")
					marginTop = titleLevel < 3 ? "mt-3" : "mt-2"
				}

				contentObject.content += `<p class="${marginTop}">${checkForBasicMarkdownSyntax(escapeHtml(line))}</p>\n`
				lastLineType = "paragraph"
				wentPastFirstParagraph = true
			}
		}

		lastLineWasEmpty = line.trim() == ""
	}

	// Add all HTML tokens back to the content
	for(const token in htmlTokens){
		contentObject.content = contentObject.content.replaceAll(token, htmlTokens[token])
	}

	// Flush any unclosed table at end of file
	if(currentAction === "table") {
		const closingBodyTag = currentValue.includes("<tbody>") ? "</tbody>" : ""
		contentObject.content += `<div class="overflow-x-auto mt-5 rounded-xl bentoCard smallShadow transition-shadow"><table class="w-full text-sm border-collapse">${currentValue}${closingBodyTag}</table></div>\n`
		currentValue = ""
	}

	// Check links across the whole content
	var linkMatches = []
	linkMatches.push(...(contentObject.content.match(/\[.*?\]\(.*?\)/g) || []).map(match => { return { content: match, type: "classic" } })) // [text](url)
	linkMatches.push(...(contentObject.content.match(/\[\[.*?\]\]/g) || []).map(match => { return { content: match, type: "localreference" } })) // [[reference]])
	if(linkMatches?.length){
		for(const linkMatch of linkMatches){
			var htmlLink = ""

			if(linkMatch.type == "localreference"){
				const reference = linkMatch.content.split("[[")[1].split("]]")[0]
				const url = (await searchReferenceFile(reference, path.dirname(options.filePath)))?.url || "/404"
				htmlLink = `<a href="${url}" class="text-link hover:underline">${reference}</a>`
			} else {
				const extract = extractLinkAndText(linkMatch.content)
				var { url, content } = extract
				if(!url || !content) continue

				const isExtern = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")
				const isInternalAnchor = url.startsWith("#")
				if(isExtern) url = addRefInUrl(url, "read.johanstick.fr")

				if(content.startsWith("@") && isExtern && !isInternalAnchor) { // mention will use a specific component
					var avatarUrl = url.startsWith("https://github.com/") ? `https://github.com/${content.replace("@", "").replace(/\s/g, "")}.png?size=200` : null
					htmlLink = `<MentionInText username="${content.replace("@", "")}" href="${url}" avatarUrl="${avatarUrl}"></MentionInText>`
				} else {
					if(!isExtern) url = (await searchReferenceFile(url, path.dirname(options.filePath)))?.url || url // if it's not an extern link, try to find the file in the local assets
					htmlLink = isExtern ? `<a href="${url.replace(/"/g, "\\\"")}" target="_blank" rel="noopener noreferrer" class="text-link hover:underline">${content}</a>` : `<a href="${isInternalAnchor ? "" : options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${url.replace(/"/g, "\\\"")}" class="text-link hover:underline">${content}</a>`
				}
			}

			contentObject.content = contentObject.content.replace(linkMatch.content, htmlLink)
		}
	}

	// Final check to clean content
	contentObject.content = contentObject.content.trim()
	while(contentObject.content.startsWith("\n")) contentObject.content = contentObject.content.slice(1) // delete new lines at the beginning
	while(contentObject.content.endsWith("\n")) contentObject.content = contentObject.content.slice(0, -1) // delete new lines at the end

	return contentObject
}