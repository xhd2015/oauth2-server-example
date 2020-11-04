class MemoryModel{
	constructor(options){
		options = options || {}
		this.accessToken = options.accessToken
		this.refreshToken = options.refreshToken
		this.authorizationCode = options.authorizationCode
		this.client = options.client
		this.token = options.token
	}

	// optional, default use generated
	async generateAccessToken(client,user,scope){
		console.log(`generateAccessToken:client=${JSON.stringify(client)}, user=${JSON.stringify(user)},scope=${JSON.stringify(scope)}`)
		return this.accessToken
	}

	// optional, default use generated
	async generateRefreshToken(client,user,scope){
		console.log(`generateRefreshToken:client=${JSON.stringify(client)}, user=${JSON.stringify(user)},scope=${JSON.stringify(scope)}`)
		return this.refreshToken
	}

	// optional, default use generated
	async generateAuthorizationCode(client,user,scope){
		console.log(`generateAuthorizationCode:client=${JSON.stringify(client)}, user=${JSON.stringify(user)},scope=${JSON.stringify(scope)}`)
		return this.authorizationCode
	}
	// get client attribute
	async getClient(clientID,clientSecret){
		console.log(`getClient:clientID=${JSON.stringify(clientID)}, clientSecret=${JSON.stringify(clientSecret)}`)
		return this.client
	}
	async saveToken(token,client,user){
		console.log(`saveToken:token=${JSON.stringify(token)},client=${JSON.stringify(client)},user=${JSON.stringify(user)}`)
		this.token = token
		token.client = client
		token.user = user
		return this.token
	}
	//required if authorization_code grant enabled
	async revokeAuthorizationCode(code){
		console.log(`revokeAuthorizationCode:code=${JSON.stringify(code)}`)
	}

	// optional, if not present any scope is allowed
	async validateScope(user,client,scope){
		console.log(`validateScope:code=${JSON.stringify(code)},client=${JSON.stringify(client)},scope=${JSON.stringify(scope)}`)
		return true
	}

	// required, if authorization_code grant is allowed
	async saveAuthorizationCode(code,client,user){
		console.log(`saveAuthorizationCode:code=${JSON.stringify(code)},client=${JSON.stringify(client)},user=${JSON.stringify(user)}`)
		return code
	}

	// required, if refresh_token grant is allowed
	async revokeToken(token){
		console.log(`revokeToken:token=${JSON.stringify(token)}`)
		return true
	}

	// required, if OAuth2Server#authenticate() is used.
	async getAccessToken(accessToken){
		console.log(`getAccessToken:accessToken=${JSON.stringify(accessToken)}`)
		return this.token
	}
}

module.exports = MemoryModel
