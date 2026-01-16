// ========== Main Events
window.onload = async function(){
	switchInterface('human') // performs initial width math operations
	initDropdown()

	const myselfContainerWidth = `${document.getElementById('myselfContainer').clientWidth}px`
	for(var id of ['segmentedControls', 'newsBannerContainer', 'othersTextualAboutMeSections']) {
		var element = document.getElementById(id)
		if(!element) {
			console.warn(`Element with id "${id}" not found for width adjustment.`)
			continue
		}
		element.style.width = myselfContainerWidth
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
function showToast(message, duration=3000) {
	const toast = document.createElement('div')
	toast.className = 'fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg opacity-0 transition-opacity duration-300 z-50'
	toast.innerText = message
	document.body.appendChild(toast)

	// Trigger reflow to apply the transition
	void toast.offsetWidth
	toast.style.opacity = '1'

	setTimeout(() => {
		toast.style.opacity = '0'
		toast.addEventListener('transitionend', () => {
			document.body.removeChild(toast)
		})
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
			showToast('Adresse Ethereum/Base copiée dans le presse-papier !', 2000)
			break
		case 'btc':
			navigator.clipboard.writeText('bc1q4ghg2wve6yneadxy58fz5m77jmwyxxtk94jxfj')
			showToast('Adresse Bitcoin copiée dans le presse-papier !', 2000)
			break
		case 'sol':
			navigator.clipboard.writeText('CfCVJBGqsqiAJ7rDCkUwvMYsmkzSLcjL7CQ1RmBiwfoP')
			showToast('Adresse Solana copiée dans le presse-papier !', 2000)
			break
		default:
			console.warn(`Unknown crypto type: ${crypto}`)
			return
	}
}