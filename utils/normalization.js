function escapeHtml(text){
	if(!text) return text
	if(typeof text != "string") return text
	text = normalizeText(text)
	return text?.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp")?.replace(/</g, "&lt;")?.replace(/>/g, "&gt;")?.replace(/"/g, "&quot;")?.replace(/'/g, "&apos;").replace(/’/g, "&apos;")
}

function normalizeText(text){
	if(!text) return text
	if(typeof text != "string") return text
	text = text.replace(/\r/g, "").replace(/\t/g, "")
	text = text.replace(/\n{3,}/g, "\n\n") // replace 3 or more new lines with only 2 new lines
	text = text.replace(/ {2,}/g, " ") // replace 2 or more spaces with only 1 space
	text = text.replace(/'/g, "'") // replace special apostrophes with simple ones
	text = text.replace(/…/g, "...") // replace special ellipsis with three simple points
	return text.normalize("NFC") // avoid issues wih some unicode characters such as emojis or weird chatgpt-ahh spaces
}

module.exports = {
	escapeHtml,
	normalizeText
}