window.onload = async function(){
	switchInterface('human') // performs initial setup
}

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