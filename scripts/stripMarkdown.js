module.exports = (text) => {
	text = text
		.replace(/^---[\s\S]*?---\n?/g, "") // YAML front matter => (removed)

		.replace(/%%.*?%%/g, "") // %%comment%% => (removed)

		.replace(/```[\s\S]*?```/g, "") // ```code block``` => (removed)
		.replace(/`[^`\n]+`/g, "$1") // `code` => code

		.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1") // ![alt](url) => alt
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) => text

		.replace(/^#{1,6}\s+.*$/gm, "") // remove titles and their content

		.replace(/(\*\*|__)(.*?)\1/g, "$2") // bold => text
		.replace(/(\*|_)(.*?)\1/g, "$2") // italic => text
		.replace(/~~(.*?)~~/g, "$1") // strikethrough => text
		.replace(/==(.*?)==/g, "$1") // highlight => text

		.replace(/^>\s+/gm, "") // blockquote => text

		.replace(/^\s*[-*+]\s+/gm, "") // unordered list => text
		.replace(/^\s*\d+\.\s+/gm, "") // ordered list => text

		.replace(/^(-{3,}|\*{3,}|_{3,})\s*$/gm, "") // horizontal rule => (removed)

		.normalize("NFC") // normalize unicode characters
		.trim()

	return text.split("\n")[0]
}