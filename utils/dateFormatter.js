const translations = {
	"fr": {
		"dateFormatter": {
			"additional": {
				"since": { "label": "depuis", "type": "prefix" },
				"ago": { "label": "il y a", "type": "prefix" }
			},
			"justnow": "à l'instant",
			"hour": (n) => n <= 1 ? "heure" : "heures",
			"yesterday": "hier",
			"beforeYesterday": "avant-hier",
			"day": (n) => n <= 1 ? "jour" : "jours",
			"week": (n) => n <= 1 ? "semaine" : "semaines",
			"lastMonth": "le mois dernier",
			"months": (n) => "mois"
		}
	},
	"en": {
		"dateFormatter": {
			"additional": {
				"since": { "label": "since", "type": "prefix" },
				"ago": { "label": "ago", "type": "suffix" }
			},
			"justnow": "just now",
			"hour": (n) => n <= 1 ? "hour" : "hours",
			"yesterday": "yesterday",
			"beforeYesterday": "2 days ago",
			"day": (n) => n <= 1 ? "day" : "days",
			"week": (n) => n <= 1 ? "week" : "weeks",
			"lastMonth": "last month",
			"months": (n) => n <= 1 ? "month" : "months"
		}
	}
}

function checkDateValidity(dateTime) {
	var isValid = true

	try {
		if(!(dateTime instanceof Date)) dateTime = new Date(dateTime)

		if(isNaN(dateTime)) isValid = false
		else if(isNaN(dateTime?.getTime())) isValid = false
		else if(dateTime.toString() === "Invalid Date") isValid = false
	} catch (error) { isValid = false }

	if(dateTime === "Invalid Date") return false
	return isValid
}

function getRelativeTime(locale, dateTime, additional) {
	if(!checkDateValidity(dateTime)) return "Invalid Date"
	if(!(dateTime instanceof Date)) dateTime = new Date(dateTime)

	const now = new Date()
	const diffInMs = now - dateTime
	const diffInSeconds = Math.floor(diffInMs / 1000)
	const diffInMinutes = Math.floor(diffInSeconds / 60)
	const diffInHours = Math.floor(diffInMinutes / 60)
	const diffInDays = Math.floor(diffInHours / 24)

	const lang = locale.startsWith("fr") ? "fr" : "en"
	const t = translations[lang].dateFormatter

	// Add prefix / suffix
	let prefix = ""
	let suffix = ""
	if(additional && t.additional[additional]) {
		const info = t.additional[additional]
		if(info.type === "prefix") {
			prefix = `${info.label} `
		} else if(info.type === "suffix") {
			suffix = ` ${info.label}`
		}
	}

	// If the date is in the future, we return the absolute date
	if(diffInMs < 0) return getAbsoluteDate(locale, dateTime)

	if(diffInMinutes < 1) return t.justnow // less than a minute
	if(diffInHours < 1) return `${prefix}${diffInMinutes} min ${suffix}`.trim() // less than an hour
	if(diffInDays < 1) return `${prefix}${diffInHours} ${t.hour(diffInHours)} ${suffix}`.trim() // less than a day

	// Yesterday or the day before it (make sense in French)
	if(diffInDays === 1) {
		const isSpecialPrefix = (prefix.trim() === "depuis" || prefix.trim() === "since")
		return `${isSpecialPrefix ? prefix : ""}${t.yesterday}`
	}
	if(diffInDays === 2 && lang === "fr") {
		const isSpecialPrefix = (prefix.trim() === "depuis")
		return `${isSpecialPrefix ? prefix : ""}${t.beforeYesterday}`
	}

	if(diffInDays < 7) return `${prefix}${diffInDays} ${t.day(diffInDays)} ${suffix}`.trim() // less than a week

	if(diffInDays < 30) { // less than a month
		const weeks = Math.floor(diffInDays / 7)
		return `${prefix}${weeks} ${t.week(weeks)} ${suffix}`.trim()
	}

	// Less than a year
	if(diffInDays < 365) {
		const months = Math.floor(diffInDays / 30)
		if(months === 1) {
			const isSince = (prefix.trim() === "depuis")
			const isAgo = (suffix.trim() === "ago")
			return `${isSince ? prefix : ""}${t.lastMonth}${isAgo ? suffix : ""}`.trim()
		}
		return `${prefix}${months} ${t.months(months)} ${suffix}`.trim()
	}

	// If it's more than a year, we return the absolute date
	return getAbsoluteDate(locale, dateTime)
}

function getAbsoluteDate(locale, dateTime) {
	if(!checkDateValidity(dateTime)) return "Invalid Date"
	if(!(dateTime instanceof Date)) dateTime = new Date(dateTime)
	return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(dateTime)
}

module.exports = {
	getRelativeTime,
	getAbsoluteDate
}