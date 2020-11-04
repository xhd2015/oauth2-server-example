let mysql = require('mysql');
let util = require('util');

let pool  = mysql.createPool({
	connectionLimit : 10,
	host: '10.227.27.107',
	port:3306,
	user: 'user_r',
	password: 'Xpassword',
        database: 'account'

});

// must use bind, because this is an instance method
let getConnection = util.promisify(pool.getConnection).bind(pool); // must  use ; here to avoid parse the source as util.promisify(...)(...)

(async function(){
	let conn = await getConnection()
	let query = util.promisify(conn.query).bind(conn)

	let res = await query("SELECT count(*) FROM t_user")
	console.log(res)

	// do not need to end the connection
	// it will be returned to the Pool
})()
