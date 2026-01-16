// ========== Main Variables
var myselfContainerWidth = 200
var toastsTimeout = {}
var toastsClearFunctions = {}

// ========== Main Events
window.onload = async function(){
	switchInterface('human') // performs initial width math operations
	initDropdown()

	myselfContainerWidth = document.getElementById('myselfContainer').clientWidth
	for(var id of ['segmentedControls', 'newsBannerContainer', 'othersTextualAboutMeSections']) {
		var element = document.getElementById(id)
		if(!element) {
			console.warn(`Element with id "${id}" not found for width adjustment.`)
			continue
		}
		element.style.width = `${myselfContainerWidth}px`
		element.classList.remove('opacity-0') // hide resizing weird rendering at page loading
	}
}

// ========== Human/Machine Interface
function switchInterface(mode) {
    const humanBtn = document.getElementById('segmentedControl-button-human')
    const machineBtn = document.getElementById('segmentedControl-button-machine')
    const slider = document.getElementById('slider')

    if(mode == 'machine') {
        slider.style.left = `${machineBtn.offsetLeft}px`
        slider.style.width = `${machineBtn.offsetWidth}px`

		humanBtn.classList.add('hover:shadow-inner')
		machineBtn.classList.remove('hover:shadow-inner')
        machineBtn.setAttribute('disabled', 'true')
        humanBtn.removeAttribute('disabled')
    } else if(mode == 'human') {
        slider.style.left = `${humanBtn.offsetLeft}px`
        slider.style.width = `${humanBtn.offsetWidth}px`

		machineBtn.classList.add('hover:shadow-inner')
		humanBtn.classList.remove('hover:shadow-inner')
        humanBtn.setAttribute('disabled', 'true')
        machineBtn.removeAttribute('disabled')
    }
}

// ========== Dropdown
function initDropdown() {
	const dropdownButton = document.getElementById('dropdown-button')
	const dropdownMenu = document.getElementById('dropdown-menu')
	if (!dropdownButton || !dropdownMenu) return

	dropdownButton.addEventListener('click', (e) => {
		e.stopPropagation()
		toggleDropdown()
	})

	document.addEventListener('click', (e) => { // close menu by clicking outside
		if (!dropdownMenu.contains(e.target) && !dropdownButton.contains(e.target)) {
			closeDropdown()
		}
	})

	document.addEventListener('keydown', (e) => { // close menu with Escape
		if (e.key === 'Escape') {
			closeDropdown()
		}
	})
}

function toggleDropdown() {
	const dropdownMenu = document.getElementById('dropdown-menu')
	const dropdownChevron = document.getElementById('dropdown-chevron')

	if (dropdownMenu.classList.contains('hidden')) {
		dropdownMenu.classList.remove('hidden')
		dropdownChevron.style.transform = 'rotate(180deg)'
	} else closeDropdown()
}

function closeDropdown() {
	const dropdownMenu = document.getElementById('dropdown-menu')
	const dropdownChevron = document.getElementById('dropdown-chevron')

	dropdownMenu.classList.add('hidden')
	dropdownChevron.style.transform = 'rotate(0deg)'
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

	const text = document.createElement('p')
	text.textContent = message
	text.classList = 'flex items-center justify-center'

    const toast = document.createElement('div')
    toast.className = `toast z-50 fixed bottom-4 ${isShortScreen ? '' : 'right-4'} bg-blur px-5 py-2 border-2 border-light-background-heavy bg-[rgba(248,248,248,0.4)] text-primary-content font-medium rounded-full bg-heavy-blur`
	toast.id = randomId
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(100px)'
    toast.style.transition = 'opacity 200ms ease-out, transform 200ms ease-out'
    toast.style.boxShadow = '0px 4px 4px rgba(223,223,223,0.45);'
    toast.appendChild(text)

    if(!isShortScreen) {
		toast.style.width = `${myselfContainerWidth + 40}px`
	} else {
		toast.style.width = `${(screenWidth - 40) > 100 ? (screenWidth - 40) : screenWidth}px`
		toast.style.left = '50%'
		toast.style.transform = 'translate(-50%, 0)'
		toast.style.textAlign = 'center'
	}

    document.body.appendChild(toast)
    void toast.offsetWidth // force trigger animation
	if(!isShortScreen) toast.style.transform = 'translateY(0)'
    toast.style.opacity = '1'

	if(duration == 0) {
		duration = (message.length * 90)
		console.log(`Toast duration set to ${duration}ms for message length ${message.length}`)
	}
	if(duration < 3000) duration = 3000 // min 3s
	if(duration > 15000) duration = 15000 // max 15s

	toastsClearFunctions[randomId] = () => {
		toast.style.opacity = '0'
		if(!isShortScreen) toast.style.transform = 'translateY(100px)'
		toast.addEventListener('transitionend', () => {
			try { document.getElementById(randomId).remove() } catch(e) {}
		})
	}
    toastsTimeout[randomId] = setTimeout(() => {
		toastsClearFunctions[randomId]()
		delete toastsTimeout[randomId]
		delete toastsClearFunctions[randomId]
	}, duration)
}

// ========== Others Features
function copyLlmsTxt() {
	var AiBrandIcon = document.getElementById('aidropdown-copymarkdown').querySelector('.AiBrandIcon')
	AiBrandIcon.classList.add('text-green-600')

	// TODO: prefetch and copy llms.txt
	// TODO: turn button default-color again
}
function copyCryptoAddress(crypto) {
	switch(crypto) {
		case 'eth':
			navigator.clipboard.writeText('0x1e198e9Df0519bE9E759E8995518D1A5F8025F0a')
			showToast('Adresse Ethereum copiée dans le presse-papier !')
			break
		case 'btc':
			navigator.clipboard.writeText('bc1q4ghg2wve6yneadxy58fz5m77jmwyxxtk94jxfj')
			showToast('Adresse Bitcoin copiée dans le presse-papier !')
			break
		case 'sol':
			navigator.clipboard.writeText('CfCVJBGqsqiAJ7rDCkUwvMYsmkzSLcjL7CQ1RmBiwfoP')
			showToast('Adresse Solana copiée dans le presse-papier !')
			break
		default:
			console.warn(`Unknown crypto type: ${crypto}`)
			showToast('Type de cryptomonnaie inconnu, veuillez signalez ce problème.')
			return
	}
}