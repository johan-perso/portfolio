module.exports = (text) => {
	return text
		.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
		.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
		.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
		.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
		.replace(/<u[^>]*>(.*?)<\/u>/gi, "__$1__")
		.replace(/<del[^>]*>(.*?)<\/del>/gi, "~~$1~~")
		.replace(/<s[^>]*>(.*?)<\/s>/gi, "~~$1~~")
		.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
		.replace(/<mark[^>]*>(.*?)<\/mark>/gi, "==$1==")
		.replace(/<[^>]+>/g, "") // retire les balises restantes
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&apos;/g, "'")
		.replace(/&quot;/g, "\"")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
		.trim()
}