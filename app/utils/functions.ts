export const setThemeScript = `
(function() {
	try {
		const theme = localStorage.getItem('theme') || 'system';
		const root = document.documentElement;
		if (theme === 'system') {
			const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
			root.setAttribute('data-theme', systemTheme);
		} else {
			root.setAttribute('data-theme', theme);
		}
	} catch (e) {
		console.error('Failed to set theme:', e);
	}
})();
`
export function getFlagEmoji(language: string | null, url: string) {
	const ignoredTlds = ['com', 'org', 'net', 'info', 'gov', 'edu']
	const fallbackFlag = '🇺🇸 (?)'

	let lang = language?.split('-')[1] || language

	if ((!lang || lang.toLowerCase() === 'und') && url) {
		const hostname = new URL(url).hostname
		const tld = hostname.split('.').pop()?.toLowerCase()

		if (tld && !ignoredTlds.includes(tld)) lang = tld
	}

	if (
		!lang ||
		lang.toLowerCase() === 'und' ||
		ignoredTlds.includes(lang.toLowerCase()) ||
		lang.toLowerCase() === 'en'
	) {
		return fallbackFlag
	}

	try {
		const codePoints = lang
			.toUpperCase()
			.slice(0, 2)
			.split('')
			.map((char) => 127397 + char.charCodeAt(0))
		return String.fromCodePoint(...codePoints)
	} catch {
		return fallbackFlag
	}
}
