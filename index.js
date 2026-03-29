if(!process.versions.bun) console.warn("⚠️ Warning: It is recommended to run this server using Bun for better library compatibility.")

const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")
const getReadingTime = require("./utils/readingTime")
const htmlToMarkdown = require("./utils/htmlToMarkdown")
const { getRelativeTime, getAbsoluteDate } = require("./utils/dateFormatter")
const { escapeHtml } = require("./utils/normalization")
const roc = require("roc-framework")

const NodeCache = require("node-cache")
const caches = new NodeCache({ stdTTL: 60 * 60 * 24 * 30 }) // cache with a default of 30 days

const { translations, detectLang, getValue, translationsEmojis } = require("./public/translations/util")
globalThis.detectLang = detectLang
globalThis.getValue = getValue

const contentDir = {
	base: path.join(__dirname, "content"),
	raw: path.join(__dirname, "content", "raw"),
	compiled: path.join(__dirname, "content", "compiled"),
	attachments: path.join(__dirname, "content", "attachments"),
}
const tocComponentHtml = fs.readFileSync(path.join(__dirname, "public", "components", "Toc.html"), "utf-8")
const publicAssetsPath = "/medias/content/"

const contentFiles = {
	redirections: {},
	_index: {}
}
const mainVersion = require("./package.json").version
const isProduction = process.env.NODE_ENV === "production"

const cachesEligibleExt = [".png", ".jpg", ".svg", ".webp", ".gif", ".mp3", ".mp4", ".ttf", ".woff2", ".json", ".css", ".js"]
function isEligibleForCache(filePath) {
	return cachesEligibleExt.includes(path.extname(filePath))
}

async function executeCommandInConsole(command, options = {}){
	var spawnedProcess = childProcess.exec(command)
	await new Promise((resolve, reject) => {
		spawnedProcess.stdout.on("data", data => {
			if(typeof data == "string") console.log(`> ${data.trim().split("\n").join("\n> ")}`)
			else process.stdout.write(data)
		})
		spawnedProcess.stderr.on("data", data => {
			if(typeof data == "string") console.error(`> ${data.trim().split("\n").join("\n> ")}`)
			else process.stderr.write(data)
		})
		spawnedProcess.on("close", code => {
			if(code === 0) resolve()
			else reject(new Error(`Process exited with code ${code}`))
		})
	})
	return true
}

function getBlogDocument(filePath, frontmatter){
	if(!filePath) throw new Error("filePath is required to get a blog document.")
	if(isProduction && caches.has(`blogDocument-${filePath}`)) {
		console.log(`Blog document "${filePath}" found in cache.`)
		return caches.get(`blogDocument-${filePath}`)
	}

	const originalBlogHtml = fs.readFileSync(path.join("public", "blog_post_template.html"), "utf-8")
	const blogContent = fs.readFileSync(path.join(contentDir.compiled, filePath), "utf-8")

	var readTime = caches.get(`readTime-${filePath}`)
	if(!readTime) {
		readTime = getReadingTime(blogContent).minutes
		caches.set(`readTime-${filePath}`, readTime)
		console.log(`Calculated reading time for blog post located at file "${filePath}": ${readTime} minutes (now cached)`)
	}

	const bannerPhysicalPath = frontmatter?.banner ? path.join(contentDir.attachments, frontmatter.banner) : null
	var bannerWebPath
	if(frontmatter?.banner && !fs.existsSync(bannerPhysicalPath)) {
		console.warn(`⚠️ Banner image specified in frontmatter of blog post located at file "${filePath}" not found at path: ${bannerPhysicalPath} - The banner will not be displayed.`)
	} else if(frontmatter?.banner) {
		bannerWebPath = frontmatter?.banner ? path.join(publicAssetsPath, frontmatter.banner).replace(/\\/g, "/") : null
	}

	var toReturn = {
		originalBlogHtml,
		blogContent,
		readTime,
		bannerWebPath
	}
	if(isProduction) caches.set(`blogDocument-${filePath}`, toReturn)
	return toReturn
}

function generateCanonicalTags(_originalPath){
	// Generate canonical tag
	var properPath = _originalPath.split("?")[0].split("#")[0].trim()
	if(!properPath.endsWith("/")) properPath += "/"
	if(properPath.length < 2) properPath = "/en/"
	var html = `<link rel="canonical" href="https://johanstick.fr${properPath}" />`

	// Add every language version as alternate links for SEO
	const pathWithoutLang = properPath.length < 3 ? properPath : properPath.split("/").slice(2).join("/") // remove the potential language prefix from the path (ex: /en/example -> example)
	Object.keys(translations).forEach(lang => {
		var langPath = `${lang}/${pathWithoutLang}`
		html += `\n<link rel="alternate" href="https://johanstick.fr/${langPath}" hreflang="${lang}">`
	})
	html += `\n<link rel="alternate" href="https://johanstick.fr/en/${pathWithoutLang}" hreflang="x-default">`

	return html
}

// Main function, prepare and start the server
async function main(){
	var perfNow = performance.now()
	console.log("Preparing the server...")

	// Check for compiled content, compile it if not found
	var compiledContentFolder = fs.existsSync(contentDir.compiled) ? fs.readdirSync(contentDir.compiled) : []
	if(!compiledContentFolder || compiledContentFolder.length < 1) {
		console.log("Compiled content not found. Compiling content...")
		await executeCommandInConsole(`${process.versions.bun ? "bun run" : "node"} scripts/compileContent.js`)
		compiledContentFolder = fs.existsSync(contentDir.compiled) ? fs.readdirSync(contentDir.compiled) : []
	}
	if(!compiledContentFolder.includes("git_repo_details.json")) await require("./scripts/getGitDetails").saveGitDetails(process.cwd(), path.join(contentDir.compiled, "git_repo_details.json"))

	// Add some compiled content files to memory
	const requiredFiles = ["redirections", "_index", "git_repo_details"]
	requiredFiles.forEach(fileName => {
		const filePath = path.join(contentDir.compiled, `${fileName}.json`)
		if(!fs.existsSync(filePath)) throw new Error(`Required content file "${fileName}.json" not found in compiled content folder.`)

		const fileContent = JSON.parse(fs.readFileSync(filePath, "utf-8"))
		if(!fileContent || typeof fileContent != "object") throw new Error(`Content file "${fileName}.json" is not valid. Found:`, fileContent)
		contentFiles[fileName] = fileContent

		if(fileName == "git_repo_details") globalThis.gitRepoDetails = fileContent
		if(fileName == "_index") {
			const compileDate = fileContent?.compileDate
			if(!compileDate) throw new Error("\"_index.json\" file does not contain a \"compileDate\" property.")
			if(isNaN(new Date(compileDate).getTime())) throw new Error(`"compileDate" property in "_index.json" is not a valid date. Found: ${compileDate}`)
			if(new Date(compileDate) > new Date()) throw new Error(`"compileDate" property in "_index.json" is in the future. Found: ${compileDate}`)
			if(new Date(compileDate) < new Date(Date.now() - (1000 * 60 * 60 * 24 * 7))) console.warn(`⚠️ "compileDate" property in "_index.json" is older than 7 days. Found: ${compileDate}\n  Consider recompiling the content if you are in development mode.`)
		}
	})

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
	const cacheControlHeader = server.isDev ? "no-cache" : "max-age=7200" // 7200sec = 2h

	// Parse blog documents from content index
	const blogDocuments = Object.values(contentFiles._index).filter(content => content?.isBlogArticle).sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0))
	const visibleBlogDocuments = blogDocuments.filter(content => (content?.visibility || content?.frontmatter?.visibility) != "hidden")

	globalThis.blogDocumentsCards = {}
	globalThis.recentsBlogArticlesMachineCards = {}
	globalThis.recentsBlogArticlesCards = {}
	Object.keys(translations).forEach(lang => {
		const publishedOnText = translations[lang]?.blog?.publishedOn || "Published on %%DATE%%"
		const readingTimeText = translations[lang]?.blog?.articleDetails?.readingTime || "%%MINUTES%% min read"

		globalThis.blogDocumentsCards[lang] = visibleBlogDocuments.map(content => {
			content = content?.[lang] || content?.en || content?.fr || Object.values(content).filter(c => c?.isBlogArticle)[0] // fallback to another supported language
			if(!content) return

			const { readTime, bannerWebPath } = getBlogDocument(content?.compiledPath || `${content?.slug}.html`, content?.frontmatter)
			const banner = bannerWebPath ? `<img src="${bannerWebPath.replace(/"/g, "\\\"")}" alt="" class="w-full h-auto aspect-video object-cover rounded-lg mt-4 bentoCard smallShadow duration-300 transition-shadow" />` : ""
			const href = `${(content.slug ? `/${lang}/${content.slug}` : undefined) || content.url || "#"}?from=/articles`

			return `<div class="bentoCard smallShadow rounded-[18px] text-primary-content font-normal text-sm w-full h-full p-5 transition-all duration-300 overflow-hidden">
			<div class="inline items-start justify-between min-w-0">
				<a href="${href}" class="hover:text-link hapticAudioOnHover w-fit duration-300 transition-colors font-medium text-base 2xl:text-[17px] overflow-hidden text-ellipsis line-clamp-2 text-primary-content-heavy">
					${content.lang != lang ? `${translationsEmojis[content.lang]}&nbsp;` : ""}${(content.title || "").replace(/"/g, "&quot;")}
				</a>
				<p class="mt-1 2xl:mt-[3px] text-sm line-clamp-2 text-primary-content-light">${publishedOnText.replace("%%DATE%%", getAbsoluteDate(lang == "fr" ? "fr-FR" : "en-US", new Date(content?.frontmatter?.post_releasedate)))} • ${readingTimeText.replace("%%MINUTES%%", readTime || "0")}</p>

				${banner ? `<a href="${href}" class="hapticAudioOnHover">
					${banner}
				</a>` : `<p class="mt-3 font-normal text-primary-content-light overflow-hidden break-words text-ellipsis line-clamp-5 leading-snug">${(content.firstParagraph || "").replace(/"/g, "&quot;")}</p>`}
			</div>
		</div>`
		}).join("\n")

		globalThis.recentsBlogArticlesMachineCards[lang] = visibleBlogDocuments.slice(0, 5).map(content => {
			content = content?.[lang] || content?.en || content?.fr || Object.values(content).filter(c => c?.isBlogArticle)[0] // fallback to another supported language
			if(!content) return

			const href = content?.slug || content?.url || "#"
			return `<p><span class="text-stone-400">-</span> <a target="_blank" class="hover:underline decoration-blue-500" href="${href}/?from=/"><span>[${(content.title || "").replace(/\[/g, "\\[").replace(/\]/g, "\\]")}]</span><span class="text-stone-400 break-all">(/${href})</span></a></p>`
		}).join("\n")

		globalThis.recentsBlogArticlesCards[lang] = visibleBlogDocuments.slice(0, 3).map(content => {
			content = content?.[lang] || content?.en || content?.fr || Object.values(content).filter(c => c?.isBlogArticle)[0] // fallback to another supported language
			if(!content) return

			return `<BlogPostCard
				date="${content?.frontmatter?.post_releasedate || ""}"
				title="${(content.title || "").replace(/"/g, "&quot;")}"
				content="${(content.firstParagraph || "").replace(/"/g, "&quot;")}"
				href="${content.slug || content.url || "#"}"
			></BlogPostCard>`
		}).join("\n")
	})

	// Register routes from content files
	server.registerRoutes(contentFiles.redirections.keyValue.map(redirection => {
		return {
			method: "get",
			path: redirection.origine,
			options: {
				redirect: redirection.destination
			}
		}
	}))
	server.registerRoutes(blogDocuments.flatMap(content => {
		var reqPath = content.slug || content.url
		if(!reqPath) {
			const contentInAnyLang = Object.values(content).filter(c => c?.isBlogArticle && (c?.slug || c?.url))[0]
			reqPath = contentInAnyLang?.slug || contentInAnyLang?.url
		}
		if(!reqPath) return []

		const cleanReqPath = reqPath.startsWith("/") ? reqPath : `/${reqPath}`
		return [
			{ method: "get", path: cleanReqPath }, // routes without language prefix
			...(Object.keys(translations)).map(lang => ({ method: "get", path: `/${lang}${cleanReqPath}` })) // routes with language prefixes (ex: /en/example, /fr/example, etc.)
		]
	}))

	// Listen for incoming requests
	server.on("request", async (req, res) => {
		if(req.method == "GET" && req.simplifiedPath == "version") return res.send(200, mainVersion, { headers: { "Content-Type": "text/plain" } })
		if(req.method == "GET" && req.simplifiedPath == "blog") return res.redirect(302, "/") // hide template file

		// Add trailing slash to avoid duplicate content and better SEO
		if(req.method == "GET" && !req.path.endsWith("/") && !path.extname(req.path)) {
			return res.redirect(302, `${req.path}/${Object.keys(req.query).length ? `?${new URLSearchParams(req.query).toString()}` : ""}`)
		}

		// Extract language prefix (if present) and slug from the request path
		let cleanPath = (req.path.startsWith("/") ? req.path.substring(1) : req.path) || ""
		let pathSegments = cleanPath.split("/")
		let potentialLang = pathSegments[0]
		let slugToFind = cleanPath

		// If the first segment in the URL looks like a code language (two character), we consider it as a language prefix
		if (pathSegments.length > 1 && potentialLang.length === 2) {
			if (!Object.keys(translations).includes(potentialLang)) {
				// If language prefix is invalid, redirect to english version
				return res.redirect(302, `/en/${pathSegments.slice(1).join("/")}${Object.keys(req.query).length ? `?${new URLSearchParams(req.query).toString()}` : ""}`)
			}

			slugToFind = pathSegments.slice(1).join("/") // remove the language prefix for slug searching
		}

		// Serve blog documents
		if(slugToFind.length > 2 && slugToFind.endsWith("/")) slugToFind = slugToFind.slice(0, -1) // remove trailing slash if exists
		const foundBlogDocumentInAllLanguages = blogDocuments.find(doc => doc.slug == slugToFind) || contentFiles._index[`${slugToFind}.html`] || contentFiles._index[`${req.path.startsWith("/") ? req.path.substring(1) : req.path}.html`]
		if(req.method == "GET" && foundBlogDocumentInAllLanguages) {
			console.log("=".repeat(50))
			console.log(`Got a request to ${req.path} - Serving blog document with slug: ${foundBlogDocumentInAllLanguages.slug || foundBlogDocumentInAllLanguages.url}\nDocument in all available languages:`, foundBlogDocumentInAllLanguages)

			var foundBlogDocument = foundBlogDocumentInAllLanguages[potentialLang]
			var fallbackLangUsed = false
			if(!foundBlogDocument) {
				foundBlogDocument = foundBlogDocument?.en || foundBlogDocument?.fr || Object.values(foundBlogDocumentInAllLanguages).find(c => c?.isBlogArticle) // fallback to english or any other available language
				fallbackLangUsed = foundBlogDocument?.lang ?? true
			}
			if(!foundBlogDocument) {
				console.warn(`Blog document found for slug "${slugToFind}" but it does not contain any content for the requested language "${potentialLang}" or english. This should not happen as the slug is generated from the content files, but it is handled just in case. Redirecting to homepage.`)
				return res.redirect(302, "/")
			}

			const { originalBlogHtml, blogContent, readTime, bannerWebPath } = getBlogDocument(foundBlogDocument.compiledPath, foundBlogDocument?.frontmatter)

			const tocContentHtml = foundBlogDocument?.toc?.map(tocItem => {
				const childrensHtml = tocItem?.childrens?.map(child => `<li><a href="#${child.anchor}" class="toc-link block py-1.5 pl-9 hover:text-link transition-colors">${escapeHtml(child.title)}</a></li>`).join("\n")
				return `<li>
					<a href="#${tocItem.anchor}" class="toc-link block py-1.5 pl-7 hover:text-link transition-colors">${escapeHtml(tocItem.title)}</a>
					<ul class="flex flex-col">
						${childrensHtml}
					</ul>
				</li>`
			}).join("\n")

			const editedBlogHtml = originalBlogHtml
				.replaceAll("%%BLOG_TITLE%%", foundBlogDocument?.title)
				.replaceAll("%%BLOG_BANNER%%", !bannerWebPath ? "" : `<img src="${bannerWebPath}" alt="" class="w-full h-auto rounded-lg mt-6 bentoCard smallShadow duration-300 transition-shadow" />`)
				.replaceAll("%%BLOG_DETAILS_READ_TIME%%", readTime)
				.replaceAll("%%BLOG_DETAILS_EDIT_DATE%%", foundBlogDocument?.frontmatter?.post_editdate ? getAbsoluteDate(potentialLang == "fr" ? "fr-FR" : "en-US", new Date(foundBlogDocument.frontmatter.post_editdate)) : "")
				.replaceAll("%%BLOG_DETAILS_RELEASE_DATE%%", getAbsoluteDate(potentialLang == "fr" ? "fr-FR" : "en-US", new Date(foundBlogDocument?.frontmatter?.post_releasedate)))
				.replaceAll("%%BLOG_DETAILS_RELEASE_RELATIVE_DATE%%", getRelativeTime(potentialLang == "fr" ? "fr-FR" : "en-US", new Date(foundBlogDocument?.frontmatter?.post_releasedate), "ago"))

				.replaceAll("%%BLOG_DETAILS_PROJECT_PERIOD%%", foundBlogDocument?.frontmatter?.post_date || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_THEME%%", foundBlogDocument?.frontmatter?.post_theme || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_AUTHOR%%", foundBlogDocument?.frontmatter?.post_author || "")
				.replaceAll("%%BLOG_DETAILS_PROJECT_COAUTHORS%%", foundBlogDocument?.frontmatter?.post_coauthors || "")

				.replaceAll("%%BLOG_DETAILS_LINK_SOURCECODE%%", foundBlogDocument?.frontmatter?.link_sourcecode || "")
				.replaceAll("%%BLOG_DETAILS_LINK_DEMO%%", foundBlogDocument?.frontmatter?.link_demo || "")
				.replaceAll("%%BLOG_DETAILS_LINK_ANDROID%%", foundBlogDocument?.frontmatter?.download_android || "")
				.replaceAll("%%BLOG_DETAILS_LINK_IOS%%", foundBlogDocument?.frontmatter?.download_ios || "")
				.replaceAll("%%BLOG_DETAILS_LINK_WINDOWS%%", foundBlogDocument?.frontmatter?.download_windows || "")
				.replaceAll("%%BLOG_DETAILS_LINK_MACOS%%", foundBlogDocument?.frontmatter?.download_macos || "")
				.replaceAll("%%BLOG_DETAILS_LINK_LINUX%%", foundBlogDocument?.frontmatter?.download_linux || "")

				.replaceAll("%%BLOG_ROBOTS_RULES%%", foundBlogDocument?.frontmatter?.visibility == "hidden" ? "noindex" : "index")
				.replaceAll("%%BLOG_CONTENT%%", blogContent)
				.replaceAll("%%BLOG_TOC%%", tocComponentHtml.replaceAll("%%TOC_CONTENT%%", tocContentHtml))
				.replaceAll("%%TOC_CLASSES%%", foundBlogDocument?.toc?.length > 0 ? "" : "hidden")

				.replaceAll("%%BLOG_METADATA_TITLE%%", foundBlogDocument?.title ? escapeHtml(htmlToMarkdown(foundBlogDocument.title)) : "")
				.replaceAll("%%BLOG_METADATA_DESCRIPTION%%", foundBlogDocument?.firstParagraph ? escapeHtml(htmlToMarkdown(foundBlogDocument.firstParagraph)) : "")
				.replaceAll("%%BLOG_METADATA_URL%%", `https://johanstick.fr${req.path.endsWith("/") ? req.path.trim() : `${req.path}/`}`)
				.replaceAll("%%BLOG_METADATA_AUTHOR%%", foundBlogDocument?.frontmatter?.post_author ? escapeHtml(htmlToMarkdown(foundBlogDocument.frontmatter.post_author)) : "")
				.replaceAll("%%BLOG_METADATA_PUBLISHED_TIME%%", foundBlogDocument?.frontmatter?.post_releasedate ? new Date(foundBlogDocument.frontmatter.post_releasedate).toISOString() : "")
				.replaceAll("%%BLOG_METADATA_IMAGES_HTML%%", !bannerWebPath ? "" : `<meta name="twitter:card" content="summary_large_image" />\n<meta property="og:image" content="https://johanstick.fr${bannerWebPath}" />\n<meta name="twitter:image" content="https://johanstick.fr${bannerWebPath}">`)
				.replaceAll("%%CANONICAL_TAG%%", generateCanonicalTags(req.path))
				.replaceAll("%%BLOG_TRANSLATION_WARNING%%", !fallbackLangUsed ? "" : `<p style="padding-bottom: 12px">${translationsEmojis?.[fallbackLangUsed] ? `${translationsEmojis[fallbackLangUsed]}&nbsp;` : ""}${translations[potentialLang]?.blog?.translationFallbackWarning || "This article is not available in your language, showing fallback version."}</p>`)

			const htmlResponse = await server.renderPage(editedBlogHtml, { file: path.join(__dirname, "public", "blog_post_template.html"), path: req.path })
			console.log("=".repeat(50))
			return res.send(200, htmlResponse, { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
		}

		// Redirections from content file, should not be used but still here as a fallback
		const foundRedirection = contentFiles?.redirections?.keyValue?.find(r => r?.origine == req?.path || r?.origine == `${req?.path}/` || `/${r?.origine}` == req?.path)
		if(req.method == "GET" && foundRedirection) return res.redirect(302, foundRedirection.destination)

		// Serve attachments from content folder
		if(req.method == "GET" && req.path.startsWith(publicAssetsPath) && res.initialAction.type == "404") {
			var requestedFilePath = path.join(contentDir.attachments, req.path.substring(publicAssetsPath.length))
			if(fs.existsSync(requestedFilePath) && fs.statSync(requestedFilePath).isFile()) {
				return res.sendFile(200, requestedFilePath, { headers: { "Cache-Control": isEligibleForCache(requestedFilePath) ? cacheControlHeader : "no-cache" } })
			}
			else return res.send(404, "Not Found", { headers: { "Content-Type": "text/plain" } })
		}

		// If URL ends with multiple slashes, remove the extra slashes
		if(req.path.endsWith("//")) {
			return res.redirect(302, `${req.path.replace(/\/+$/, "/")}${Object.keys(req.query).length ? `?${new URLSearchParams(req.query).toString()}` : ""}`)
		}

		// If no langs prefixes, detect user language and redirect with the appropriate lang prefix
		if(
			req.method == "GET" &&
			cleanPath.length &&
			!Object.keys(translations).includes(potentialLang) &&
			(
				res.initialAction.type == "404" ||
				(res.initialAction.type != "redirect" && res.initialAction.type != "sendJs" && res.initialAction.type != "sendFile")
			)
		) {
			var userLanguage = req.headers["accept-language"] ? req.headers["accept-language"].split(",")[0].split(";")[0].trim().toLowerCase() : "en"
			if(userLanguage.includes("-")) userLanguage = userLanguage.split("-")[0] // keep only the first part of the language code (ex: "en" from "en-US")
			if(!Object.keys(translations).includes(userLanguage)) userLanguage = "en" // fallback to english if user language is not supported
			res.redirect(302, `/${userLanguage}${req.path.startsWith("/") ? req.path : `/${req.path}`}${Object.keys(req.query).length ? `?${new URLSearchParams(req.query).toString()}` : ""}`)
			return
		}

		// Allows accesses pages with langs prefixes
		if(req.method == "GET" && cleanPath.length && Object.keys(translations).includes(potentialLang)) {
			const pathWithoutLang = `/${pathSegments.slice(1).join("/")}`
			var pathWithoutLangWithoutTrailingSlash = pathWithoutLang.endsWith("/") ? pathWithoutLang.slice(0, -1) : pathWithoutLang
			pathWithoutLangWithoutTrailingSlash = pathWithoutLangWithoutTrailingSlash.startsWith("/") ? pathWithoutLangWithoutTrailingSlash.substring(1) : pathWithoutLangWithoutTrailingSlash
			pathWithoutLangWithoutTrailingSlash = pathWithoutLangWithoutTrailingSlash.toLowerCase()
			if(pathWithoutLangWithoutTrailingSlash == "index" || pathWithoutLangWithoutTrailingSlash == "index/") return res.redirect(302, `/${potentialLang}/`) // redirect to homepage if trying to access "index"
			if(pathWithoutLangWithoutTrailingSlash.length < 1) pathWithoutLangWithoutTrailingSlash = "index"

			const allowedPages = ["index", "articles"]
			if(allowedPages.includes(pathWithoutLangWithoutTrailingSlash)) {
				const generatedPage = await server.renderPage(fs.readFileSync(path.join(__dirname, "public", `${pathWithoutLangWithoutTrailingSlash}.html`), "utf-8"), { file: path.join(__dirname, "public", "index.html"), path: req.path })
				return res.send(200, generatedPage.replace("%%CANONICAL_TAG%%", generateCanonicalTags(req.path)), { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
			} else return res.redirect(302, `/${potentialLang}/`) // redirect to homepage if the page is not in the allowed list
		}

		if(res.initialAction.type == "sendHtml") res.send(200, res.initialAction.content.replace("%%CANONICAL_TAG%%", generateCanonicalTags(req.path)), { headers: { "Content-Type": "text/html", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendJs") res.send(200, res.initialAction.content, { headers: { "Content-Type": "application/javascript", "Cache-Control": cacheControlHeader } })
		else if(res.initialAction.type == "sendFile") res.sendFile(200, res.initialAction.content, { headers: { "Cache-Control": isEligibleForCache(req.path) ? cacheControlHeader : "no-cache" } })
		else if(res.initialAction.type == "redirect") res.redirect(302, res.initialAction.content)
		else if(res.initialAction.type == "404") res.redirect(302, "/")
		else res.send(500, "Internal Server Error", { headers: { "Content-Type": "text/plain" } })
	})

	server.start()
}

main()