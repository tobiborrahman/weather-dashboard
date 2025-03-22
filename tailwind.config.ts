module.exports = {
	content: [
		'./pages/**/*.{js,ts,jsx,tsx}',
		'./components/**/*.{js,ts,jsx,tsx}',
	],
	theme: {
		extend: {
			backgroundImage: {
				'custom-bg': "url('/background.jpg')", // Add your custom background image
			},
		},
	},
	plugins: [],
};
