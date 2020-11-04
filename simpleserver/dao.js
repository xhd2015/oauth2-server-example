// UserDAO represents user store with DB
// models preview:
//    t_user   { id, name, password }
//    t_token  { id, token, client_id, user_id,expire_at}  # use JWT, no need to
//    validate token
//    t_code   { id, code,client_id,redirect_url, expire_at }
//    t_client { id(string), secret, name }
//
//
//  tables: 
class UserDAO {
	constructor(db){
		this.db = db
	}

	async getUser(username){
		return await this.db.queryOne("SELECT * FROM t_user WHERE name = ?",[username])
	}

	async getUserByToken(token){
	}

	async countUser(){
		let count = await this.db.query("SELECT COUNT(*) FROM t_user")
		return count
	}

	async addUser(user){
		let name = user.name
		if(!name){
			throw new Error("empty name")
		}
		let userID
		await this.db.newTransaction(async function(conn){
			let countQuery = await conn.query("SELECT COUNT(*) cnt FROM t_user WHERE name = ?",[name])
			if(countQuery[0].cnt > 0){
				throw new Error("user already exist:" + name)
			}
			let insert = await conn.execute("INSERT INTO t_user SET ?",user)
			// if same user already exist, do not insert
			userID = insert.insertId
		})
		return userID
	}

	async loginUser(name,password){
		let user = await this.getUser(name)
		if(user == null || user.password != password){
			throw Error("wrong password or username")
		}
		return user
	}

	// id is 
	async addClient(name){
		if(!name){
			throw Error("client name is required")
		}
		let clientID = dec.randomShortString()
		let clientSecret = dec.randomString()
		let client = { id:clientID, secret:clientSecret,name }
		await this.db.execute("INSERT INTO t_client SET ?",client)
		return client
	}

	async validateClient(clientID,clientSecret){
		let client = await this.db.queryOne("SELECT * FROM t_client WHERE id = ?", [clientID])
		if(client == null){
			throw Error("client not found:" + clientID)
		}
		if(client.secret !== clientSecret){
			throw Error("wrong client secret:" + clientID)
		}
		return client
	}

	// generate authentication code for later use
	async generateAuthCode(){
		// any code is allowed
		//
	}

	async getAuthCode(code){
	}

	async generateToken(){
		// we will use jwt
	}
}

module.exports = UserDAO

if(require.main === module){
	(async function(){
		let dao = new UserDAO();
		let user = { name:"yy", password:"zz" }
		await dao.addUser(user)
		let dbUser = await dao.getUser(user.name)
		console.log("dbUser = ", dbUser)

		let cnt = await dao.countUser()

		console.log(`cnt = ${cnt}`)
	})()
}
