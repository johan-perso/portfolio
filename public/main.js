// ========== Catch Global Errors
window.onerror = async function(error){
	console.error("(Error Grabber) Grabbed: ", error)
	console.error("(Error Grabber) document.readyState ==", document.readyState)

	if(document.readyState != "complete"){
		console.log("(Error Grabber) Page not loaded yet, waiting for it to load")
		await new Promise(resolve => {
			window.addEventListener("load", resolve)
		})
		console.log("(Error Grabber) Page is now loaded, showing error message on loader")
	}

	if(document.getElementById("loader__error")){
		document.getElementById("loader__error").innerText = error.message || error.stack || error
		document.getElementById("loader__error").classList.remove("hidden")
	} else {
		console.log("(Error Grabber) Loader isn't present on page, skipping display to user.")
	}
}

// ========== Main Variables
const isIOS = (/iPad|iPhone|iPod/.test(navigator.userAgent || navigator.platform)) && !window.MSStream
const constrainedWidthContainersIds = ["newsBannerContainer", "othersTextualAboutMeSections"]
var elementsToHideOnHighlight = []
var elementsToHideOnHighlightProperties = {}
var myselfContainerWidth = 200
var isLoadingPage = true
var mainResourcesLoaded = false
var hasMainLoadFunctionsRun = false
var loadingCurrentIncrement = 0
var toastsTimeout = {}
var toastsClearFunctions = {}
var currentInterfaceMode = "human"
var preloaded = {}

// ========== Main Events
document.addEventListener("DOMContentLoaded", async () => {
	const startTime = Date.now()
	var loadingIncrementInterval
	var finishedLoading = false
	var intervalDelay = 50
	var incrementLevel = 1.5

	console.log("DOM fully loaded and parsed")
	document.getElementById("loader__progressContainer").classList.remove("opacity-0")
	document.getElementById("loader__background").classList.add("duration-700")
	incrementLoader(2)

	setTimeout(() => {
		if(isLoadingPage){
			console.warn("15sec since DOMContentLoaded, partially hiding loader.")
			document.getElementById("loader__error").innerText = "Le chargement prend plus de temps que prévu, vous pouvez peut-être actualiser la page ou vérifier votre connexion internet."
			document.getElementById("loader__error").classList.remove("hidden")
			document.getElementById("loader__background").style.opacity = 0.8
		}
	}, 15000)

	function updateInterval() {
		if(loadingIncrementInterval) clearInterval(loadingIncrementInterval)

		loadingIncrementInterval = setInterval(() => {
			if(!isLoadingPage) return clearInterval(loadingIncrementInterval)
			incrementLoader(incrementLevel)

			// If we are close to finishing but we still don't have main resources, halt the loader
			if(!finishedLoading && loadingCurrentIncrement >= 90 && !mainResourcesLoaded) {
				incrementLevel = 0
				console.log("Halting loader increment (waiting for main resources)")
				updateInterval()
			}

			// Slow down the loading (even more) if we are still loading
			else if(!finishedLoading && loadingCurrentIncrement > 20 && !mainResourcesLoaded) {
				intervalDelay += 15
				incrementLevel = loadingCurrentIncrement > 80 ? 0.25 : 0.75
				console.log(`Slowing down loader interval to ${intervalDelay}ms (waiting for main resources)`)
				updateInterval()
			}

			// Slow down the loading if we are still loading
			else if(!finishedLoading && loadingCurrentIncrement > 60 && mainResourcesLoaded) {
				intervalDelay += 7
				if(loadingCurrentIncrement > 80) intervalDelay += 15
				if(loadingCurrentIncrement > 90) intervalDelay += 25
				if(loadingCurrentIncrement > 95) intervalDelay += 400
				if(loadingCurrentIncrement > 98) intervalDelay += 1000

				console.log(`Slowing down loader interval to ${intervalDelay}ms`)
				updateInterval()
			}

			// If we finished loading, speed up the loading
			else if(finishedLoading && intervalDelay > 5 && mainResourcesLoaded && incrementLevel != 2.5 && incrementLevel != 4 && incrementLevel != 6) {
				intervalDelay = 45
				incrementLevel = Date.now() - startTime > 500
					? 2.5 // if loading took more than 0.5s, use 2.5% increments
					: Date.now() - startTime > 350
						? 4 // if loading took more than 0.3s, use 2.5% increments
						: 6 // if loading was very fast, use 6% increments to make it look smoother
				console.log(`Speeding up loader interval to ${intervalDelay}ms and increment level to ${incrementLevel}% (finished loading)`)
				updateInterval()
			}
		}, intervalDelay)
	}
	updateInterval() // call once, recursive calls will be made inside

	// Wait for fonts to load
	if(document.fonts && document.fonts.ready) {
		console.log("Waiting for fonts to load...")
		await document.fonts.ready
		console.log("Fonts loaded.")
	} else {
		console.warn("document.fonts API not supported, skipping font load wait.")
	}

	// Wait for additional main load functions
	while(!hasMainLoadFunctionsRun) {
		console.log("Waiting for main load functions to complete...")
		await new Promise(resolve => setTimeout(resolve, 200))
	}

	console.log(`Started loading at ${new Date(startTime).toLocaleTimeString()}`)
	console.log(`It was ${Date.now() - startTime} ms since DOMContentLoaded`)
	finishedLoading = true

	while(loadingCurrentIncrement < 95) {
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	if(loadingIncrementInterval) clearInterval(loadingIncrementInterval)
	await hideLoader()
})
window.onload = async function(){
	mainResourcesLoaded = true
	console.log("All resources finished loading! (event onload called)")

	adjustSegmentedControlSlider("human") // ensure slider is well positioned on load
	switchInterface("human", true) // performs initial width math operations
	window.onresize() // perform initial width adjustments
	initDropdown()

	elementsToHideOnHighlight = [
		document.getElementById("sectionHeaderAboutMe"),
		document.getElementById("firstName"),
		document.getElementById("skills"),
		document.getElementById("socialButtons"),
		document.getElementById("aiOptionsSections"),
		document.getElementById("newsBannerContainer"),
		document.getElementById("contactSection"),
		document.getElementById("footerSection"),
		...document.getElementsByClassName("mapComponent"),
		...document.getElementsByClassName("bentoCard")
	]

	const isUsingSafari = navigator.vendor && navigator.vendor.indexOf("Apple") > -1 && navigator.userAgent && navigator.userAgent.indexOf("CriOS") == -1 && navigator.userAgent.indexOf("FxiOS") == -1
	if(isUsingSafari) Array.from(document.getElementsByClassName("browserSvgIcon")).forEach(el => {
		const strokeWidth = el.querySelectorAll("path")?.[0]?.getAttribute("stroke-width") || "1.2"
		const strokeColor = el.querySelectorAll("path")?.[0]?.getAttribute("stroke") || "currentColor"

		el.setAttribute("viewBox", "0 0 14 14")
		el.setAttribute("fill", "none")
		el.innerHTML = `<g clip-path="url(#clip0_20_1012)">
			<path d="M9.47334 4.52667L8.42101 7.68309C8.36373 7.85493 8.26723 8.01107 8.13915 8.13915C8.01107 8.26723 7.85493 8.36373 7.68309 8.42101L4.52667 9.47334L5.57901 6.31692C5.63628 6.14508 5.73278 5.98894 5.86086 5.86086C5.98894 5.73278 6.14508 5.63628 6.31692 5.57901L9.47334 4.52667Z" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
			<path d="M7.00002 12.8334C10.2217 12.8334 12.8334 10.2217 12.8334 7.00002C12.8334 3.77836 10.2217 1.16669 7.00002 1.16669C3.77836 1.16669 1.16669 3.77836 1.16669 7.00002C1.16669 10.2217 3.77836 12.8334 7.00002 12.8334Z" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>
			</g>
			<defs>
			<clipPath id="clip0_20_1012">
			<rect width="14" height="14" fill="currentColor"/>
			</clipPath>
			</defs>
		`
	})

	if(["/", "/index", "/index.html"].includes(window.location.pathname)) {
		preloaded.llmsTxt = await fetch("/llms.txt").then(response => {
			if(!response.ok) throw new Error(`Failed to prefetch llms.txt: ${response.status} ${response.statusText}`)
			return response.text()
		}).catch(error => {
			console.error(error)
			return null
		})
	} else disableCopyMarkdownButton()

	if(window.innerWidth < 390) { // hardcoded switch positions for some projects cards
		swapTwoElements(
			document.getElementById("smallprojectcard_yourdownloader"),
			document.getElementById("largeprojectcard_findmeme")
		)
	}

	if(document.querySelector(".blogPost")) {
		Array.from(document.querySelectorAll(".aiChoiceDropdownButton")).forEach(btn => {
			if(!btn.hasAttribute("hrefprefix") || !btn.getAttribute("hrefprefix").length) return
			btn.setAttribute("href", btn.getAttribute("hrefprefix") + encodeURIComponent(`Résume-moi cet article de blog en une liste de points clés, évoque les éléments les plus importants à savoir, et raconte moi quelques détails sur l'auteur de ce post.\n\nURL de l'article : ${window.location.href}\n\nDétails sur l'auteur : https://johanstick.fr ; https://johanstick.fr/llms.txt`))
		})
	}

	Array.from(document.getElementsByClassName("blogPostCardLink")).forEach(el => {
		if(!el.hasAttribute("href") || !el.getAttribute("href").length) return
		if(el.getAttribute("target") == "_blank") return // already opens in new tab, no need to add referrer info in url
		const elHref = el.getAttribute("href")
		const currentHref = (window.location.href || "").replace(`${window.location.protocol}//${window.location.host}`, "")
		el.setAttribute("href", `${elHref}${elHref.includes("?") ? "&" : "?"}from=${encodeURIComponent(currentHref.endsWith("/") ? currentHref : `${currentHref}/`)}`)
	})

	const fromParamsInThisUrl = new URLSearchParams(window.location.search)?.get("from")
	if(fromParamsInThisUrl?.length) Array.from(document.getElementsByClassName("goBackButton")).forEach(card => {
		card.setAttribute("href", fromParamsInThisUrl)
	})

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			// If we are in machine mode, return to human mode
			if(currentInterfaceMode == "machine") return switchInterface("human")

			// Close dropdown menu
			closeDropdown()
		}
	})

	const audiosToPreload = [
		{ name: "haptic", src: "/medias/audios/haptic.mp3" },
		{ name: "notif", src: "/medias/audios/notif.mp3" },
		{ name: "switch", src: "/medias/audios/switch.mp3" },
	]
	for(const audioInfo of audiosToPreload) {
		try {
			console.log(`Preloading audio "${audioInfo.name}" from "${audioInfo.src}"...`)
			preloaded[audioInfo.name] = new Audio(audioInfo.src)
			preloaded[audioInfo.name].load()
		} catch(error) {
			console.error(`Failed to preload audio "${audioInfo.name}":`, error)
		}
	}

	hasMainLoadFunctionsRun = true

	document.querySelector("#skill_student > div > p > span.skill_additional")?.setAttribute("title", `Très exactement ${((Date.now() - new Date("2008-03-07")) / 31557600000).toFixed(7)} ans 🤓`)
}

window.onresize = function(force = false){
	if(force) console.log("Window resized (forced)", { width: window.innerWidth, height: window.innerHeight })
	if(!force && currentInterfaceMode != "human") return // ignore resizes if content is hidden (machine mode for example)
	adjustSegmentedControlSlider(currentInterfaceMode) // readjust segmented control slider when font size changes
	applyDynamicEllipsis()

	if(window.innerWidth > 1220) {
		myselfContainerWidth = document.getElementById("myselfContainer").clientWidth
		if(window.innerWidth < 1000) { // min width based on screen width
			var _myselfContainerWidth = window.innerWidth - document.getElementById("mainContent").clientWidth - 130
			// var _myselfContainerWidth = (window.innerWidth * 0.3) - 100 // the main content section takes 70%, so 30% is left for the sidebar
			if(_myselfContainerWidth < 170) _myselfContainerWidth = 170 // absolute min width
			myselfContainerWidth = _myselfContainerWidth
		}
		if(myselfContainerWidth < 170) myselfContainerWidth = 170 // absolute min width
		for(var id of constrainedWidthContainersIds) {
			var element = document.getElementById(id)
			if(!element) {
				console.warn(`Element with id "${id}" not found for width adjustment.`)
				continue
			}
			element.style.width = `${myselfContainerWidth}px`
			element.classList.remove("opacity-0") // hide resizing weird rendering at page loading
		}
	} else { // ignore resizes on screen smaller than 1200px
		for(var id of constrainedWidthContainersIds) {
			var element = document.getElementById(id)
			if(!element) {
				console.warn(`Element with id "${id}" not found for width (un?)adjustment.`)
				continue
			}
			element.style.width = "auto"
			element.classList.remove("opacity-0")
		}
	}

	setTimeout(() => { // readjust segmented control slider when font size changes
		adjustSegmentedControlSlider(currentInterfaceMode)
	}, 300)
}

window.onhashchange = function(event){
	if(window.location.hash == "#contact"){
		highlightSection(document.getElementById("contactSection"))
		haptic("pulse", 5)
	} else if(window.location.hash == "#donate"){
		highlightSection(document.getElementById("donationSection"), true)
		haptic("pulse", 5)
	}
}

// ========== Human/Machine Interface
var isSwitching = false
async function switchInterface(mode, silent = false) {
	console.log(`Switching interface to "${mode}" mode...`)
	if(isSwitching) return console.warn("Already switching interface, ignoring new switch request.")
	if(!document.getElementById("machineViewContent")) return console.warn("Machine view content element not found, cannot switch interface.")
	if(!silent) haptic("pulse", 15)
	isSwitching = true

	const appContainer = document.querySelector(".appContainer")
	const machineViewContent = document.getElementById("machineViewContent")

	const humanBtn = document.getElementById("segmentedControl-button-human")
	const machineBtn = document.getElementById("segmentedControl-button-machine")

	if(mode == "machine") {
		adjustSegmentedControlSlider(mode)

		humanBtn?.classList.add("hover:shadow-inner")
		machineBtn?.classList.remove("hover:shadow-inner")
		machineBtn?.setAttribute("disabled", "true")
		humanBtn?.removeAttribute("disabled")
		await new Promise(resolve => setTimeout(resolve, 350))

		document.documentElement.style.overflow = "hidden"
		if(appContainer) appContainer.style.overflow = "hidden"
		if(machineViewContent) {
			machineViewContent.classList.remove("hidden", "pointer-events-none")
			if(!silent) playAudio("switch")
			await new Promise(resolve => setTimeout(resolve, 50))
			machineViewContent.classList.add("opacity-100", "scale-100")
			machineViewContent.classList.remove("opacity-0", "scale-95")
			machineViewContent.style.borderRadius = "0px"
			machineViewContent.style.boxShadow = "none"
		}

		await new Promise(resolve => setTimeout(resolve, 700))
		if(appContainer) appContainer.style.display = "none"
		document.documentElement.style.overflow = ""
	} else if(mode == "human") {
		document.documentElement.style.overflow = "hidden"
		if(appContainer) {
			appContainer.style.display = ""
			appContainer.style.overflow = "hidden"
		}
		if(machineViewContent) {
			machineViewContent.classList.add("pointer-events-none")
			machineViewContent.classList.add("opacity-0", "scale-95")
			machineViewContent.classList.remove("opacity-100", "scale-100")
			machineViewContent.style.borderRadius = "16px"
			machineViewContent.style.boxShadow = "0 0 60px 30px rgba(0,0,0,0.4)"

			if(!silent) playAudio("switch")
			await new Promise(resolve => setTimeout(resolve, 700))
			machineViewContent.classList.add("hidden")
		}
		if(appContainer) appContainer.style.overflow = ""
		document.documentElement.style.overflow = ""

		adjustSegmentedControlSlider(mode)

		machineBtn?.classList.add("hover:shadow-inner")
		humanBtn?.classList.remove("hover:shadow-inner")
		humanBtn?.setAttribute("disabled", "true")
		machineBtn?.removeAttribute("disabled")

		window.onresize(true) // readjust widths and segmented control slider
	}

	currentInterfaceMode = mode
	isSwitching = false
}
function adjustSegmentedControlSlider(interfaceMode) {
	const humanBtn = document.getElementById("segmentedControl-button-human")
	const machineBtn = document.getElementById("segmentedControl-button-machine")
	const slider = document.getElementById("slider")
	if(!humanBtn || !machineBtn || !slider) return

	if(interfaceMode == "human") {
		slider.style.left = `${humanBtn.offsetLeft}px`
		slider.style.width = `${humanBtn.offsetWidth}px`
	} else if(interfaceMode == "machine") {
		slider.style.left = `${machineBtn.offsetLeft}px`
		slider.style.width = `${machineBtn.offsetWidth}px`
	}
}

// ========== Dropdown
var isDropdownOpen = false
function initDropdown() {
	const dropdownButton = document.getElementById("dropdown-button")
	const dropdownMenu = document.getElementById("dropdown-menu")
	if (!dropdownButton || !dropdownMenu) return

	dropdownButton.addEventListener("click", (e) => {
		e.stopPropagation()
		haptic("click")
		playAudio("haptic")
		toggleDropdown()
	})

	document.addEventListener("click", (e) => { // close menu by clicking outside
		if (!e.isTrusted) return console.warn("Ignoring an untrusted click event (it may come from JS haptics)")
		if (isDropdownOpen && !dropdownMenu.contains(e.target) && !dropdownButton.contains(e.target) && !dropdownMenu.classList.contains("hidden")) {
			closeDropdown()
		}
	})
}

function toggleDropdown() {
	const dropdownMenu = document.getElementById("dropdown-menu")
	const dropdownChevron = document.getElementById("dropdown-chevron")

	if (dropdownMenu.classList.contains("hidden")) {
		dropdownMenu.classList.remove("hidden")
		dropdownMenu.style.opacity = "0"
		dropdownMenu.style.transform = "scaleY(0.95)"

		setTimeout(() => {
			requestAnimationFrame(() => {
				dropdownMenu.style.opacity = "1"
				dropdownMenu.style.transform = "scaleY(1)"
			})
			isDropdownOpen = true
		}, 10)

		dropdownChevron.style.transform = "rotate(180deg)"
	} else closeDropdown()
}

function closeDropdown() {
	const dropdownMenu = document.getElementById("dropdown-menu")
	const dropdownChevron = document.getElementById("dropdown-chevron")
	if(!dropdownMenu || !dropdownChevron) return
	if(dropdownMenu.classList.contains("hidden")) return
	isDropdownOpen = false

	haptic("click")
	playAudio("haptic")
	dropdownMenu.style.opacity = "0"
	dropdownMenu.style.transform = "scaleY(0.95)"

	setTimeout(() => {
		dropdownMenu.classList.add("hidden")
	}, 150)

	dropdownChevron.style.transform = "rotate(0deg)"
}

// ========== Toast Notification
function showToast(message, duration = 0) {
	// Check if there is already existing toast
	for(const id in toastsTimeout) {
		if(toastsTimeout.hasOwnProperty(id)) {
			clearTimeout(toastsTimeout[id])
			toastsClearFunctions[id]()
			delete toastsTimeout[id]
			delete toastsClearFunctions[id]
		}
	}

	const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
	const isShortScreen = screenWidth < 500

	const randomId = `toast-${Math.random().toString(36)}${Date.now().toString(36)}`
	console.log(`Showing toast (id=${randomId} ; isShortScreen = ${isShortScreen}): "${message}"`)

	const text = document.createElement("p")
	text.textContent = message
	text.classList = "flex items-center justify-center"

	const toast = document.createElement("div")
	toast.className = `toast z-50 fixed bottom-4 ${isShortScreen ? "" : currentInterfaceMode == "human" ? "right-4" : "right-8"} px-5 py-2 border-2 ${currentInterfaceMode == "human" ? "border-light-background-heavy bg-[rgba(248,248,248,0.4)] text-primary-content" : "border-light-background/30 bg-[rgba(98,98,98,0.6)] text-white/90"} font-medium rounded-full bg-blur-xl`
	toast.id = randomId
	toast.style.opacity = "0"
	toast.style.transform = "translateY(100px)"
	toast.style.transition = "opacity 200ms ease-out, transform 200ms ease-out"
	toast.style.boxShadow = currentInterfaceMode == "human" ? "0px 2px 6px rgba(0,0,0,0.2)" : "0px 2px 6px rgba(255,255,255,0.1)"
	toast.appendChild(text)

	if(!isShortScreen) {
		toast.style.width = `${myselfContainerWidth + 40}px`
	} else {
		toast.style.width = `${(screenWidth - 40) > 100 ? (screenWidth - 40) : screenWidth}px`
		toast.style.left = "50%"
		toast.style.transform = "translate(-50%, 0)"
		toast.style.textAlign = "center"
	}

	haptic("light")
	playAudio("notif")
	document.body.appendChild(toast)
	void toast.offsetWidth // force trigger animation
	if(!isShortScreen) toast.style.transform = "translateY(0)"
	toast.style.opacity = "1"

	if(duration == 0) {
		duration = (message.length * 90)
		console.log(`Toast duration set to ${duration}ms for message length ${message.length}`)
	}
	if(duration < 3000) duration = 3000 // min 3s
	if(duration > 15000) duration = 15000 // max 15s

	toastsClearFunctions[randomId] = () => {
		toast.style.opacity = "0"
		if(!isShortScreen) toast.style.transform = "translateY(100px)"
		toast.addEventListener("transitionend", () => {
			try { document.getElementById(randomId).remove() } catch(e) {}
		})
	}
	toastsTimeout[randomId] = setTimeout(() => {
		haptic("click")
		toastsClearFunctions[randomId]()
		delete toastsTimeout[randomId]
		delete toastsClearFunctions[randomId]
	}, duration)
}

// ========== Highlight Sections
function highlightSection(section, smallShadow = false) {
	if(!section || !(section instanceof HTMLElement)) {
		console.warn("highlightSection: Invalid section provided.")
		return
	}
	if(section.classList.contains("highlighting")) {
		console.warn("highlightSection: Section is already being highlighted.")
		return
	}

	haptic("click")
	section.scrollIntoView({
		behavior: "smooth",
		block: "center"
	})

	const originalBoxShadow = section.style.boxShadow // store for later revert

	section.style.position = "relative"
	section.style.zIndex = "50"
	section.style.borderRadius = "16px"
	section.style.transition = "box-shadow 500ms ease-out, transform 500ms ease-out"
	section.classList.add("highlighting")

	// Wait for scroll to finish before applying highlight
	setTimeout(() => {
		haptic("click")

		// Dim other elements
		for(var elem of elementsToHideOnHighlight) {
			if(!elem) continue
			if(section == elem || elem.classList.contains("highlighting")) continue // skip highlighted section itself
			if(section.id == "donationSection" && elem.id == "footerSection") continue // bc footer is inside of donation section

			elementsToHideOnHighlightProperties[elem] = {
				opacity: elem.style.opacity,
				transition: elem.style.transition
			}
			elem.style.transition = "opacity 500ms ease-out"
			elem.style.opacity = 0.25
		}

		section.style.boxShadow = `
			0 0 0 6px rgba(255, 255, 255, 0.05),
			0 0 0 ${smallShadow ? "6" : "7"}px rgba(59, 130, 246, 0.4),
			0 0 40px 4px rgba(59, 130, 246, 0.2),
			0 10px 30px rgba(0, 0, 0, 0.2)
		`
		section.style.transform = "scale(1.02)"
	}, 500)

	// Revert styles after a short moment
	setTimeout(() => {
		haptic("click")

		for(var elem of elementsToHideOnHighlight) {
			if(!elem) continue
			if(section == elem || elem.classList.contains("highlighting")) continue // skip highlighted section itself
			if(section.id == "donationSection" && elem.id == "footerSection") continue // bc footer is inside of donation section

			elem.style.opacity = elementsToHideOnHighlightProperties[elem].opacity
			setTimeout(() => elem.style.transition = elementsToHideOnHighlightProperties[elem].transition, 600)
		}

		section.style.boxShadow = originalBoxShadow
		section.style.transform = ""
		section.classList.remove("highlighting")
	}, 1200)
}

// ========== Loader Functions
function incrementLoader(percentage) {
	loadingCurrentIncrement += percentage
	console.log(`Incrementing loader to ${loadingCurrentIncrement}% (+${percentage}%)`)
	if(loadingCurrentIncrement > 100) loadingCurrentIncrement = 100
	document.getElementById("loader__progressBar").style.width = `${loadingCurrentIncrement}%`
}
async function hideLoader(instant = false){
	if(!isLoadingPage) return console.warn("hideLoader called but page is already marked as not loading.")

	console.log("Hiding loader...")
	isLoadingPage = false
	document.getElementById("loader__progressContainer").style.opacity = 0
	if(!instant) await new Promise(resolve => setTimeout(resolve, 250))
	document.getElementById("loader__background").style.opacity = 0
	setTimeout(() => { document.getElementById("loader__background").remove() }, instant ? 100 : 1000)

	setTimeout(() => {
		if(window.location.hash == "#contact" || window.location.hash == "#donate") window.onhashchange()
	}, 100)
}

// ========== Haptics/Audios Feedbacks
function playAudio(name) {
	if(!preloaded[name]) return console.warn(`Audio "${name}" not found in preloaded audios.`)
	try {
		preloaded[name].currentTime = 0
		preloaded[name].play()
	} catch(error) {
		console.error(`Failed to play audio "${name}":`, error)
	}
}
async function haptic(type, pulseAmount = 3) {
	if(!["click", "light", "pulse"].includes(type)) throw new Error(`Haptic: Invalid haptic type: ${type}`)

	if(!navigator.vibrate && !isIOS) throw new Error("Haptic: Vibration API not supported on this device (navigator.vibrate missing, system is not iOS).")
	switch (type) {
	case "click":
		console.log("Haptic: click")
		if(navigator.vibrate) navigator.vibrate(10)
		else if(isIOS) _ios_haptic()
		break
	case "light":
		console.log("Haptic: light")
		if(navigator.vibrate) navigator.vibrate(40)
		else if(isIOS) for (let i = 0; i < 10; i++) {
			_ios_haptic()
			await new Promise(resolve => setTimeout(resolve, 3))
		}
		break
	case "pulse":
		console.log("Haptic: pulse")
		if(navigator.vibrate) navigator.vibrate([pulseAmount * 40, 50].flat())
		else if(isIOS) for (let i = 0; i < pulseAmount; i++) {
			_ios_haptic()
			await new Promise(resolve => setTimeout(resolve, 90))
		}
		break
	}
}
var _ios_currentHapticLabel = 0
var _ios_hapticLabels = []
function _ios_haptic() {
	console.log("Triggered _ios_haptic")
	var label

	if(_ios_hapticLabels.length < 5) {
		const inputId = `ios-haptic-${Date.now()}`

		const input = document.createElement("input")
		input.setAttribute("type", "checkbox")
		input.setAttribute("id", inputId)
		input.setAttribute("switch", "")
		input.style.display = "none"

		label = document.createElement("label")
		label.setAttribute("for", inputId)
		label.appendChild(input)
		label.style.display = "none"

		document.body.appendChild(label)
		_ios_hapticLabels.push(label)
	} else {
		label = _ios_hapticLabels[_ios_currentHapticLabel]
		_ios_currentHapticLabel = (_ios_currentHapticLabel + 1) % _ios_hapticLabels.length
	}

	console.log(`Haptic: Triggering iOS haptic feedback using label click (inputId: ${label.getAttribute("for")} ; _ios_currentHapticLabel index: ${_ios_currentHapticLabel})`)
	label.click()
}

// ========== Others Features
function goBack(event) { // eslint-disable-line no-unused-vars
	if(event) {
		event.preventDefault()
		event.stopPropagation()
		haptic("click")
		playAudio("haptic")
	}

	const fromParamsInThisUrl = new URLSearchParams(window.location.search).get("from")
	if(fromParamsInThisUrl) {
		console.log(`Going back to "${fromParamsInThisUrl}" (from URL parameter)`)
		window.location.replace(fromParamsInThisUrl)
	} else {
		console.log("No 'from' URL parameter found, going back to previous page")
		history.back()
	}
}
function disableCopyMarkdownButton() {
	const aiDropdownCopyMarkdown = document.getElementById("aidropdown-copymarkdown")
	if(!aiDropdownCopyMarkdown) return
	aiDropdownCopyMarkdown.setAttribute("disabled", "true")
	aiDropdownCopyMarkdown.setAttribute("href", "")
	aiDropdownCopyMarkdown.classList.add("cursor-not-allowed", "opacity-50")
	aiDropdownCopyMarkdown.classList.remove("hover:scale-[1.015]", "hover:bg-light-background")
}
function applyDynamicEllipsis() {
	document.querySelectorAll(".dynamic-ellipsis").forEach(el => {
		// Get original text, in case we already truncated it before
		let text = (el.getAttribute("original-text") || el.textContent).trim()
		if(!el.hasAttribute("original-text")) el.setAttribute("original-text", text)
		el.textContent = text // reset to original text for measurement

		// Reduce text, character by character, until it fits in the parent
		while (el.scrollHeight > (el.parentElement.clientHeight - 10) && text.length > 0) { // 10px padding buffer (6-20 also works)
			text = text.slice(0, -1)
			el.textContent = `${text}...`
		}
	})
}
function swapTwoElements(el1, el2) {
	if(!el1 || !el2 || !el1.parentNode || !el2.parentNode) {
		console.warn("swapTwoElements: Invalid elements provided.")
		return
	}

	const el1Next = el1.nextSibling
	const el2Next = el2.nextSibling
	const el1Parent = el1.parentNode
	const el2Parent = el2.parentNode

	if(el1Parent === el2Parent) { // same parent: simple swap
		el1Parent.insertBefore(el2, el1)
		el1Parent.insertBefore(el1, el2Next)
	} else { // different parents: swap positions
		el2Parent.insertBefore(el1, el2)
		el1Parent.insertBefore(el2, el1Next)
	}
}

// ========== Copy to Clipboard Functions
function copyLlmsTxt() { // eslint-disable-line no-unused-vars
	var AiBrandIcon = document.getElementById("aidropdown-copymarkdown").querySelector(".AiBrandIcon")
	AiBrandIcon.classList.add("text-green-600")

	if(!preloaded.llmsTxt) {
		showToast("La page est toujours en cours de chargement, veuillez réessayer dans un instant.")
		console.warn("llms.txt is not preloaded, cannot copy.")
		haptic("pulse")
	} else {
		navigator.clipboard.writeText(preloaded.llmsTxt)
		showToast("Le résumé du site au format Markdown a été copié !")
	}

	setTimeout(() => {
		haptic("click")
		AiBrandIcon.classList.remove("text-green-600")
	}, 3000)
}
function copyCryptoAddress(crypto) { // eslint-disable-line no-unused-vars
	switch(crypto) {
	case "eth":
		navigator.clipboard.writeText("0x1e198e9Df0519bE9E759E8995518D1A5F8025F0a")
		showToast("Adresse Ethereum copiée dans le presse-papier !")
		break
	case "btc":
		navigator.clipboard.writeText("bc1q4ghg2wve6yneadxy58fz5m77jmwyxxtk94jxfj")
		showToast("Adresse Bitcoin copiée dans le presse-papier !")
		break
	case "sol":
		navigator.clipboard.writeText("CfCVJBGqsqiAJ7rDCkUwvMYsmkzSLcjL7CQ1RmBiwfoP")
		showToast("Adresse Solana copiée dans le presse-papier !")
		break
	default:
		console.warn(`Unknown crypto type: ${crypto}`)
		showToast("Type de cryptomonnaie inconnu, veuillez signalez ce problème.")
	}
}
var isAnimatingCopy = false
function copyMachineView() { // eslint-disable-line no-unused-vars
	const machineViewContent = document.getElementById("machineViewContent")
	const textContent = machineViewContent?.innerText || machineViewContent?.textContent || ""
	navigator.clipboard.writeText(textContent.trim())

	if(isAnimatingCopy) return console.warn("Already animating copy, ignoring new copy request.")
	haptic("click")
	playAudio("haptic")
	isAnimatingCopy = true

	const copyIcon = document.getElementById("machineViewCopyIcon")
	const checkIcon = document.getElementById("machineViewCheckIcon")
	if(copyIcon && checkIcon) {
		// Crossfade: copy icon out, check icon in (scale up)
		copyIcon.classList.add("opacity-0", "scale-50")
		checkIcon.classList.remove("opacity-0", "scale-50")
		checkIcon.classList.add("opacity-100", "scale-100")

		setTimeout(() => {
			// Crossfade back: check icon out, copy icon in
			checkIcon.classList.add("opacity-0", "scale-50")
			checkIcon.classList.remove("opacity-100", "scale-100")
			copyIcon.classList.remove("opacity-0", "scale-50")

			isAnimatingCopy = false
		}, 2000)
	}
}
function copyHeaderLink(event) { // eslint-disable-line no-unused-vars
	event.stopPropagation()
	const hash = event.target.getAttribute("href") || `#${event.currentTarget.id}`
	location.hash = hash
	navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}${hash}`)
	showToast("Lien vers cette section copié dans le presse-papier !")
}