const UserDAO = require("./dao")
const db = require("./db")

class SimpleAuthServer {
	constructor(){
		this.dao = new UserDAO(new db.DB())
	}

	allowClientRedirect(clientID,redirectURL){
		// only validate if the clientID exists
		// and if the redirectURL is valid(must have http:// or
		// https://)
		return true
	}

	// auth  the user
	// returns
	// - true    if name & password match
	// - false   otherwise
	async isUserCredentialValid(name,password){
		try{
			await this.dao.loginUser(name,password)
			return true
		}catch(e){
			return false
		}
	}

	// generate auth code for a client with its URL
	// the code is generated,and saved in the server storage
	// returns the code
	generateAuthorizationCode(clientID,redirectURL){
		return clientID + redirectURL
	}

	// validate if the client is good or not
	// used by: /token
	// returns
	// - true    if validated
	// - false   otherwise
	isClientValid(clientID,clientSecret){
		return true
	}

	// validate if the authorization code is valid
	//
	// or if the code is expired
	// returns
	//  - Object associated with user before
	AuthorizationCodeValid(code,clientID,redirectURL){
		return {code,clientID, redirectURL}
	}

	// generate an Access Token
	// this could be a JWT token that contains necessary
	// user information
	generateAccessToken(){
		return "token"
	}
}

module.exports = SimpleAuthServer
