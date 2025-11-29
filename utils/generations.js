const codeCache = new Set()

export const generateUniqueCode = (prefix, length = 7) => {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let code
	do {
		code = `${prefix}-${Array.from(
			{ length },
			() => chars[Math.floor(Math.random() * chars.length)]
		).join('')}`
	} while (codeCache.has(code))
	codeCache.add(code)
	return code
}

export const generateHashedCode = async code => {
	const encoder = new TextEncoder()
	const data = encoder.encode(code)
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('')
}
