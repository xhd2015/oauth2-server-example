let mysql = require('mysql')
let conn = mysql.createConnection({
	host: '10.227.27.107',
	port:3306,
        user: 'user_r',
        password: 'Xpassword',
        database: 'account'
})

// table definition:
// CREATE TABLE `t_user` (
//   `id` bigint(20) NOT NULL AUTO_INCREMENT,
//   `name` varchar(255) NOT NULL DEFAULT '' COMMENT 'user name',
//   `password` varchar(255) NOT NULL DEFAULT '',
//   PRIMARY KEY (`id`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='user info';

conn.connect()

// queue a query
conn.query("SELECT count(*) FROM t_user",function(err,rows,fields){
	if(err){
		throw err
	}
	console.log(rows)
})


// send all request
conn.end()
