const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function hash(data,code){
	let _hash = crypto.createHash(code);
	_hash.update(data)
	return _hash.digest('hex')
}

function hashsha256(data){
	return hash(data,'sha256')
}
function randomNumber(){
	return (Math.random()*10000000 + 1000).toFixed()
}
function randomString(){
	return hashsha256(String(randomNumber()))
}

function randomShortString(){
	return hashsha256(String(randomNumber())).slice(0,16)
}

// payload can have exp:Math.floor(Date.now() / 1000) + (60 * 60), to expire in
// an hour
function signJWT(payload,secret){
     return jwt.sign(payload,secret);
}

function validateJWT(token,secret){
     return jwt.verify(token,secret)
}

module.exports = {
	hash,
	hashsha256,
	randomNumber,
	randomString,
	randomShortString,
	signJWT,
	validateJWT,
}
