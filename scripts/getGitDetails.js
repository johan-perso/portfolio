const fs = require("fs")
const path = require("path")
const childProcess = require("child_process")

async function getGitDetails(cwd){
	const gitFolder = path.join(cwd, ".git")
	if(!fs.existsSync(gitFolder)) return null
	console.log(`Retrieving Git details in ${gitFolder}`)
	var details = {}

	// Get the last commit hash
	try {
		var hash = childProcess.execSync("git rev-parse --short HEAD", { cwd }).toString().trim()
		details.hash = hash
	} catch (err) {
		console.warn("Unable to use Git CLI to get the last commit hash. Trying fallback method...")
	}

	// Fallback: try to read from .git folder directly
	if(!details?.hash?.length) try {
		const headPath = path.join(cwd, ".git", "HEAD")
		const headContent = (await fs.promises.readFile(headPath, "utf8")).toString().trim()
		if(headContent.startsWith("ref:")){
			const refPath = headContent.split(" ")[1]
			const fullRefPath = path.join(cwd, ".git", refPath)
			details.hash = (await fs.promises.readFile(fullRefPath, "utf8")).toString().trim().slice(0, 7) // short hash
		} else details.hash = headContent.slice(0, 7)
	} catch (err) {
		console.warn("Unable to get Git commit hash using fallback method as well.")
		console.warn(err)
	}

	if(!details?.hash?.length) {
		console.warn("Git commit hash could not be accessed. Canceling Git details retrieval.")
		return { hash: null, message: null }
	}

	// Get the last commit message
	try {
		var message = childProcess.execSync("git rev-list --max-count=1 --no-commit-header --format=%B HEAD", { cwd }).toString().trim()
		details.message = message
	} catch (err) {
		console.warn("Unable to use Git CLI to get the last commit message. Trying fallback method...")
	}

	// Fallback: try to read from .git folder directly
	if(!details?.message?.length) try {
		const logPath = path.join(cwd, ".git", "logs", "HEAD")
		const logContent = (await fs.promises.readFile(logPath, "utf8")).toString().trim()
		const lastLine = logContent.split("\n").slice(-1)[0]
		details.message = lastLine.split("\t")[1] || null
	} catch (err) {
		console.warn("Unable to get Git commit message using fallback method as well.")
		console.warn(err)
	}

	// Get the remote URL for the repo
	try {
		var remoteUrl = childProcess.execSync("git remote get-url origin", { cwd }).toString().trim()
		details.remoteUrl = remoteUrl
	} catch (err) {
		console.warn("Unable to use Git CLI to get the remote URL from origin. Trying fallback method...")
	}

	// Fallback: try to read from .git/config file directly
	if(!details?.remoteUrl?.length) try {
		const configPath = path.join(cwd, ".git", "config")
		const configContent = (await fs.promises.readFile(configPath, "utf8")).toString()
		const remoteOriginMatch = configContent.match(/\[remote "origin"\][^[]*?url\s*=\s*(.+)/)
		if(remoteOriginMatch) details.remoteUrl = remoteOriginMatch[1].trim()
	} catch (err) {
		console.warn("Unable to get Git remote URL using fallback method as well.")
		console.warn(err)
	}

	if(details.remoteUrl.endsWith("/")) details.remoteUrl = details.remoteUrl.slice(0, -1) // remove trailing slash if exists
	if(details.remoteUrl) details.commitUrl = `${details.remoteUrl}/commit/${details.hash}`

	console.log("Git details retrieved:", details)
	return details
}

module.exports.getGitDetails = getGitDetails
module.exports.saveGitDetails = async function(cwd, outputPath){
	const details = await getGitDetails(cwd)
	if(!details) return null
	if(!fs.existsSync(path.dirname(outputPath))) fs.mkdirSync(path.dirname(outputPath), { recursive: true })
	await fs.promises.writeFile(outputPath, JSON.stringify(details, null, 2), "utf8")
	console.log(`Git details saved to ${outputPath}`)
	return details
}