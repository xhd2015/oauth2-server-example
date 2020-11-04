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
pool.getConnection(function(err,conn){
	if(err)throw err
	conn.query("SELECT count(*) FROM t_user",function(err,results,fields){
		if(err)throw err
		console.log(results)
	})
})

// let getConnection = util.promisify(pool.getConnection); // must  use ; here to avoid parse the source as util.promisify(...)(...)
// 
// (async function(){
// 	let conn = await getConnection()
// 	let query = util.promisify(conn.query)
// 
// 	let res = await query("SELECT count(*) FROM t_user")
// 	console.log(res)
// 
// 	// do not need to end the connection
// 	// it will be returned to the Pool
// })()
