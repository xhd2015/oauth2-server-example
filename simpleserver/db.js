let mysql = require('mysql');
let util = require('util');
let dec = require('../lib/dec')

class DB {
	constructor(){
		this.pool  = mysql.createPool({
			connectionLimit : 10,
			host: '10.227.27.107',
			port:3306,
			user: 'user_r',
			password: 'Xpassword',
			database: 'account'
		});
		this.getConnection = util.promisify(this.pool.getConnection).bind(this.pool)
	}

	async newConnection(){
		let conn = await this.getConnection()
		return new Connection(conn)
	}

	async newTransaction(fn){
		let conn = await this.newConnection()
		let dao = this

		let transPromise = new Promise(function(resolve,reject){
			let dbConn = conn.getConnection()
			dbConn.beginTransaction(function(err){
				if(err) return reject(err)
				return ((async function(){
					await fn.call(conn,conn)
					resolve() // must be resolved
				})()).then(async function(){
					dbConn.commit(function(err){
						if(err){
							return reject(err)
						}
					})
				}).catch(async function(e){
					await util.promisify(dbConn.rollback).bind(dbConn)()
					throw e
				})
			})

		})
		await transPromise
	}

	// shortcut methods
	async query(sql,args){
		return await (await this.newConnection()).query(sql,args)
	}
	async queryOne(sql,args){
		return await (await this.newConnection()).queryOne(sql,args)
	}
	async count(sql,args){
		return await (await this.newConnection()).count(sql,args)
	}
	async execute(sql,args){
		return await (await this.newConnection()).execute(sql,args)
	}
}

class Connection {
	constructor(conn){
		this.conn = conn
	}

	getConnection(){
		return this.conn
	}

	async query(sql,args){
		// console.log("queryConn:sql,args = ",sql,args)
		let query = util.promisify(this.conn.query).bind(this.conn)
		return await query(sql,args)
	}

	async queryOne(sql,args){
		let resultSet = await this.query(sql,args)
		if(resultSet.length==0){
			return null
		}
		return resultSet[0]
	}

	async count(sql,args){
		let resultSet = await this.query(sql,args)
		if(resultSet.length === 0){
			throw new Error("invalid sql to count, result empty:" + sql)
		}
		if(resultSet.length !== 1){
			throw new Error("invalid sql to count, result more 1 row:" + sql)
		}
		if(Object.keys(resultSet[0])!=1){
			throw new Error("invalid result,expects one column:" + sql)
		}
		for(let k in resultSet[0]){
			return resultSet[0][k]
		}
	}

	async execute(sql,args){
		return await this.query(sql,args)
	}
}

module.exports = {
	DB,
	Connection,
}
