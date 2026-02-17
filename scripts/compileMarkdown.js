// Based on MarkDocs CLI Markdown parser
// https://github.com/johan-perso/MarkDocs/blob/main/utils/convertMd.js

// TODO: permettre de sauter des lignes

const fs = require("fs")
const path = require("path")
const stripMarkdown = require("./stripMarkdown")
const { svgPaths } = require("./utils")
const { getAbsoluteDate } = require("../utils/dateFormatter")

function escapeHtml(text){
	if(!text) return text
	if(typeof text != "string") return text
	text = normalizeText(text)
	return text?.replace(/&/g, "&amp;")?.replace(/</g, "&lt;")?.replace(/>/g, "&gt;")?.replace(/"/g, "&quot;")?.replace(/'/g, "&#039;")
}

function checkForBasicMarkdownSyntax(text){ // check for bold, italic, strikethrough and underline
	return text
		.replace(/(\*\*|__)(?:(?!\1|<[^>]*>)(.|\n))*?\1/g, match => `<strong>${escapeHtml(match.slice(2, -2))}</strong>`) // bold
		.replace(/(\*|_)(?:(?!\1|<[^>]*>)(.|\n))*?\1/g, match => `<em>${escapeHtml(match.slice(1, -1))}</em>`) // italic
		.replace(/~~(?:(?!~~|<[^>]*>)(.|\n))*?~~/g, match => `<del>${escapeHtml(match.slice(2, -2))}</del>`) // strikethrough
		.replace(/__(?:(?!__|<[^>]*>)(.|\n))*?__/g, match => `<u>${escapeHtml(match.slice(2, -2))}</u>`) // underline
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
	let currentAction = ""
	let currentActionHistory = []
	let wentPastFirstParagraph = false

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
			contentObject.content += "<hr>"
			continue
		}

		if(currentAction != "codeblock" && currentAction != "custom-component" && line.trim().startsWith("```") && !line.trim().startsWith("```component")){
			currentAction_set("codeblock")
			const language = line.trim().slice(3).trim() || ""
			contentObject.content += `<pre><code${language ? ` class="language-${escapeHtml(language.replace(/\s/g, "-"))}"` : ""}>`
			continue
		}
		if(currentAction == "codeblock" && line.trim().startsWith("```")){
			currentAction_precedent()
			contentObject.content += "</code></pre>\n"
			continue
		}

		if(currentAction == "codeblock"){
			contentObject.content += `${escapeHtml(line)}\n`
			continue
		}

		if(currentAction != "metadata" && line.trim() == "---" && !Object.keys(contentObject.metadata).length){
			currentAction_set("metadata")
			continue
		}
		if(currentAction == "metadata" && line.trim() == "---"){
			currentAction_precedent()
			continue
		}

		if(currentAction == "metadata"){
			const key = line.split(":")[0].trim()
			const value = line.split(":").slice(1).join(":").trim()
			contentObject.metadata[key.toLowerCase()] = value
			continue
		}

		// ========= Actions that can potentially edit the content

		// images attached with the format: ![Image](/image.png)
		var imagesWithAltMatches = line.match(/!\[.*?\]\(.*?\)/g)
		if(imagesWithAltMatches?.length){
			imagesWithAltMatches.forEach(imageMatch => {
				const image = {
					"alt": checkForBasicMarkdownSyntax(escapeHtml(imageMatch.split("[")[1].split("]")[0])),
					"src": imageMatch.split("(")[1].split(")")[0],
				}

				var imagePath = path.join(options.assetsPath, image.src)
				var imageContent
				try {
					imageContent = fs.readFileSync(imagePath)
					image.content = imageContent
					image.path = imagePath
					if(options.renameAssets) image.src = `${randomString(12)}${path.parse(imagePath).ext}`

					contentObject.images.push(image)
					line = line.replace(
						imageMatch,
						image.src.endsWith(".mp4")
							? `<video class="w-full h-auto rounded-lg shadow-md" controls src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" aria-label="${image.alt.replace(/"/g, "\\\"")}" />`
							: `<img class="w-full h-auto rounded-lg shadow-md" src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" alt="${image.alt.replace(/"/g, "\\\"")}" />`
					)
				} catch (error) {
					contentObject.warns.push(`Attaching an image - Cannot read the file located at "${imagePath}".`)
				}
			})
		}

		// edit <br> in tables
		if(line.startsWith("|") && line.endsWith("|")){
			line = line.replaceAll("<br>", "<br/>")
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

			contentObject.content += "<blockquote class=\"border-l-4 border-gray-300 pl-4 italic my-3\">\n"
			continue
		} else if(currentAction == "callout"){
			if(!line){
				currentAction_precedent()
				contentObject.content += "\n</blockquote>\n\n"
			} else contentObject.content += `${checkForBasicMarkdownSyntax(escapeHtml(line.startsWith(">") ? line.slice(1).trim() : line.trim()))}<br/>\n`
			continue
		}

		// link attached with following format: ![[file name]]
		// Obsidian supports referencing any files (including other notes), but we will focus on images
		else if(line.startsWith("![[") && line.endsWith("]]")){
			const link = line.split("[[")[1].split("]]")[0]
			if(!link.endsWith(".png") && !link.endsWith(".jpg") && !link.endsWith(".jpeg") && !link.endsWith(".gif") && !link.endsWith(".webp")){
				contentObject.warns.push(`Attaching an image - The extension of the file located at "${imagePath}" is not supported. Supported extensions are: .png, .jpg, .jpeg, .gif and .webp.`)
				continue
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
				continue
			}

			contentObject.content += `<img class="w-full h-auto rounded-lg shadow-md" src="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${image.src.replace(/"/g, "\\\"")}" alt="${image.alt.replace(/"/g, "\\\"")}" />`
			contentObject.images.push(image)

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
			continue
		} else if(currentAction == "custom-component" && line.startsWith("```")){
			currentAction_precedent()
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

			contentObject.content += `<h${titleLevel}>${checkForBasicMarkdownSyntax(escapeHtml(line))} <a href="#${escapeHtml(anchor)}" onclick="copyHeaderLink(event)" class="mt-0.5 text-link text-xl hover:underline transition-opacity duration-100 opacity-0 hover:opacity-100">#</a></h${titleLevel}>\n`
		}

		// bullets points list
		else if(line.trim().startsWith("- ")){
			if(currentAction != "ul") {
				contentObject.content += "<ul class=\"mt-3 list-disc list-outside marker-medium pl-5 space-y-1\">\n"
				currentAction_set("ul")
			}
			contentObject.content += `<li>${checkForBasicMarkdownSyntax(escapeHtml(line.trim().slice(2)))}</li>\n`
		} else if(currentAction == "ul"){
			currentAction_precedent()
			contentObject.content += "</ul>\n"
		}

		// numbered list
		else if(line.trim().match(/^\d+\. /)){
			if(currentAction != "ol") {
				contentObject.content += "<ul class=\"mt-3 list-decimal list-outside marker-medium pl-5 space-y-1\">\n"
				currentAction_set("ol")
			}
			contentObject.content += `<li>${checkForBasicMarkdownSyntax(escapeHtml(line.trim().replace(/^\d+\. /, "")))}</li>\n`
		} else if(currentAction == "ol"){
			currentAction_precedent()
			contentObject.content += "</ul>\n"
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
				var content = stripMarkdown(fileContent)
				if(content.length > 400) content = `${content.slice(0, 400)}...`
				if(![".", "!", "?"].includes(content[content.length - 1])) content += "." // add trailing dot if not present

				contentObject.content += `<BlogPostCard date="${getAbsoluteDate("fr-FR", releaseDate)}" title="${escapeHtml(title)}" content="${escapeHtml(content)}" href="${searchResult.url.replace(/"/g, "\\\"")}"></BlogPostCard>\n`
			} else {
				contentObject.warns.push(`Blog Post Card - Cannot find the referenced file "${reference}" for the blog post card (searchResult: ${searchResult}).`)
			}
		}

		// blockquote
		else if(line.trim().startsWith(">")){
			if(currentAction != "blockquote") {
				contentObject.content += "<blockquote class=\"border-l-4 border-gray-300 pl-4 italic my-3\">\n"
				currentAction_set("blockquote")
			}
			contentObject.content += `${checkForBasicMarkdownSyntax(escapeHtml(line.trim().slice(1).trim()))}<br/>\n`
		} else if(currentAction == "blockquote"){
			currentAction_precedent()
			contentObject.content += "</blockquote>\n"
		}

		// default behavior
		else {
			contentObject.content += line == "" ? "\n" : `<p>${checkForBasicMarkdownSyntax(escapeHtml(line))}</p>\n`
			if(!wentPastFirstParagraph && line.trim() != "") {
				const ctaButtons = []
				if(contentObject.metadata?.download_android) ctaButtons.push({ platform: "Android", href: contentObject.metadata.download_android, svgPath: svgPaths.android })
				if(contentObject.metadata?.download_ios) ctaButtons.push({ platform: "iOS", href: contentObject.metadata.download_ios, svgPath: svgPaths.apple })
				if(contentObject.metadata?.download_windows) ctaButtons.push({ platform: "Windows", href: contentObject.metadata.download_windows, svgPath: svgPaths.windows })
				if(contentObject.metadata?.download_macos) ctaButtons.push({ platform: "macOS", href: contentObject.metadata.download_macos, svgPath: svgPaths.macos })
				if(contentObject.metadata?.download_linux) ctaButtons.push({ platform: "Linux", href: contentObject.metadata.download_linux, svgPath: svgPaths.linux })

				contentObject.content += `<div class="mt-4 flex gap-3 max-[600px]:gap-2.5 max-[600px]:flex-col max-[600px]:[&>*]:w-full">
					${ctaButtons.map(button => `<PrimaryButton label="Télécharger pour ${button.platform.replace(/"/g, "\\\"")}" href="${button.href.replace(/"/g, "\\\"")}" svgPath="${button.svgPath.replace(/"/g, "\\\"")}"></PrimaryButton>`).join("\n")}
				</div>`
				wentPastFirstParagraph = true
			}
		}
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
				var url = linkMatch.content?.split("(")?.[1]?.split(")")?.[0]
				const content = linkMatch.content?.split("[")?.[1]?.split("]")?.[0]
				if(!url || !content) continue

				const isExtern = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")

				if(content.startsWith("@") && isExtern) { // mention will use a specific component
					var avatarUrl = url.startsWith("https://github.com/") ? `https://github.com/${content.replace("@", "").replace(/\s/g, "")}.png?size=200` : null
					htmlLink = `<MentionInText username="${content.replace("@", "")}" href="${url}" avatarUrl="${avatarUrl}"></MentionInText>`
				} else {
					if(!isExtern) url = (await searchReferenceFile(url, path.dirname(options.filePath)))?.url || url // if it's not an extern link, try to find the file in the local assets
					htmlLink = isExtern ? `<a href="${url.replace(/"/g, "\\\"")}" target="_blank" rel="noopener noreferrer" class="text-link hover:underline">${content}</a>` : `<a href="${options.publicAssetsPath.replace(/"/g, "\\\"") || ""}${url.replace(/"/g, "\\\"")}" class="text-link hover:underline">${content}</a>`
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