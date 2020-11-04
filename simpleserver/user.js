// user services
const UserDAO = require("./dao")
const db = require("./db")

class UserService {
	constructor(){
		this.dao = new UserDAO(new db.DB())
	}

	async addUser(name,password){
		if(!name || !password){
			throw new Error("empty name or password")
		}
		let user = {name,password}
		await this.dao.addUser(user)
	}
}

module.exports = {
	UserService,
}
