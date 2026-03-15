var translations = {
	fr: require("./fr.json"),
	en: require("./en.json")
}

function getLanguage(routePath){
	var language
	routePath = routePath.trim()

	// Consider that the param is a language, or a path containing a language as first part (ex: "/en/..." or "/fr/...")
	if(Object.keys(translations).includes(routePath)) language = routePath.trim()
	else language = routePath.replace("/", "").slice(0, 2)

	if(!Object.keys(translations).includes(language)) return translations.en ? "en" : (translations?.[0] || `Language not found for routePath '${routePath}'`)

	return language
}

module.exports.detectLang = getLanguage
module.exports.translations = translations

module.exports.getValue = (routePath, key) => {
	var language = getLanguage(routePath)

	var translation = translations[language]
	if(!translation){
		console.error(`Translation not found for language '${language}'`)
		return `Translation not found for language '${language}'`
	}

	var keys = key.split(".")
	for(var i = 0; i < keys.length; i++){
		translation = translation[keys[i]]
		if(translation) continue
		else break
	}
	if(translation) return translation

	console.error(`Translation not found for key '${key}'`)
	return `Translation not found for key '${key}'`
}