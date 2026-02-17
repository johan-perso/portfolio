const { JSDOM } = require("jsdom")
const { Readability } = require("@mozilla/readability")

function getReadingTime(htmlContent) {
	const dom = new JSDOM(htmlContent)

	const reader = new Readability(dom.window.document)
	const article = reader.parse()

	if (!article || !article.textContent) return { minutes: 0, words: 0 }

	const words = article.textContent.trim().split(/\s+/).length
	const wordsPerMinute = 220 // avg reading speed
	const totalMinutes = Math.ceil(words / wordsPerMinute)

	return {
		minutes: totalMinutes,
		words: words
	}
}

module.exports = getReadingTime