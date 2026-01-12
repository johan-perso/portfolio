/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./public/**/*.{html,js,json}'],
	plugins: [],
	daisyui: {
		logs: false
	},
	theme: {
		extend: {
			colors: {
				'primary-background': '#FFFFFF',
				'primary-header': '#181818',
				'primary-content': '#383838',
				'link': '#2563EB',
			}
		},
	},
}