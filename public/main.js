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

        machineBtn.setAttribute('disabled', 'true')
        humanBtn.removeAttribute('disabled')
    } else if(mode == 'human') {
        slider.style.left = `${humanBtn.offsetLeft}px`
        slider.style.width = `${humanBtn.offsetWidth}px`

        humanBtn.setAttribute('disabled', 'true')
        machineBtn.removeAttribute('disabled')
    }
}