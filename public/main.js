// ========== Main Events
window.onload = async function(){
	switchInterface('human') // performs initial width math operations
	initDropdown()
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

// ========== Others Features
function copyLlmsTxt() {
	var AiBrandIcon = document.getElementById('aidropdown-copymarkdown').querySelector('.AiBrandIcon')
	AiBrandIcon.classList.add('text-green-600')

	// TODO: prefetch and copy llms.txt
	// TODO: turn button default-color again
}