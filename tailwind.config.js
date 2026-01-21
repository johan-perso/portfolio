/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./public/**/*.{html,js,json}'],
	plugins: [],
	daisyui: {
		logs: false
	},
	theme: {
		extend: {
			fontFamily: {
				'header': ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
				'body': ['Bricolage Grotesque', 'system-ui', 'sans-serif'],
			},
			colors: {
				'primary-background': '#FFFFFF',
				'primary-header': '#181818',
				'primary-content': '#383838',
				'primary-content-heavy': '#1B1B1B',
				'primary-content-light': '#5E6269',

				'light-background': '#F8F8F8',
				'light-background-heavy': '#F1F1F1', // 60% #F8F8F8
				'light-background-heavier': '#E7E7E7',
				'light-content': '#98A2B3',

				'link': '#2563EB',
			}
		},
	},
}