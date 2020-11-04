// public library
const express = require('express');
const cookieParser = require('cookie-parser')
const axios = require("axios")

// project library
const {injectAsyncMethods,requestLog} = require('../lib/express_enhance')
const dec = require('../lib/dec')

const app = express()
const clientID = "clientDemo"
const clientSecret = "clientSecretDemo"

let clientBase = "http://10.227.27.107:3001"
let clientCallback = "http://10.227.27.107:3001/auth/callback"
let authServerBase = "http://10.227.27.107:3000"
let authServer = {
	base: authServerBase,
	auth: authServerBase + "/auth",
	token:authServerBase + "/token",
}

injectAsyncMethods(app)
app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser())
app.use(requestLog)

// app.useAsync(async function(req,res){
// })

let tokenCache = {}
let stateStore = {}
let tokenStore = {}

// validate all uri request, this should be used as an nginx auth_request
// backend(i.e. auth proxy)
// read Authorization header,and parse token
// - if token is valid and contains user name, set X-User-Name to user name and
// return
// - otherwise remember the redirect uri, then issue a request to auth server
app.getAsync("/validate", async function(req,res){
	let authHeader = req.get("Authorization")
	let token
	if(authHeader && authHeader.startsWith("Bearer ")){
		token = authHeader.slice("Bearer ".length)
	}

	let tokenCached 
	if(token){
		tokenCached = tokenCache[token]
		if(tokenCache==null || tokenCache.exp == null || tokenCache.exp <= Math.floor(Date.now()/1000) || !tokenCache.name){
			delete tokenCache[token]
			tokenCached = null
		}
	}

	if(tokenCached!=null){
		res.set("X-User-Name",tokenCached.name)
		res.sendStatus(200)
		return
	}

	// first read from header,then from query
	let method = (req.get("X-Method") || "").toUpperCase()
	let redirect_uri = req.get("X-Redirect-URI")

	if(method != "GET" && method != "DELETE" && method != "HEADER"){
		let uri
		try{
			uri = new URL(redirect_uri)
		}catch(e){
			res.status(400).json({error:"bad redirect_uri"})
			return
		}
		redirect_uri = uri.origin // force root
	}

	// validate failed, generate a state
	let state = dec.randomShortString()

	// save the uri, and restore later
	// only restore get uri, post are not repeated
	stateStore[state] = {
		exp: Math.floor(Date.now()/1000) + 60*60,
		redirect_uri
	}
	res.redirect(authServer.auth +"?" + new URLSearchParams({
		state,
		response_type:"code",
		client_id:clientID,
		redirect_uri:clientCallback, // this redirect_uri is not uri provided by the client,but the client callback
	}).toString())
})

// this is workflow after call authorization server's /auth
app.getAsync("/auth/callback",async function(req,res){
	let {state,code,error} = req.query
	if(!code){
		if(!error){
			error = "internal error: authorization failed"
		}
		res.status(400).json(error)
		return
	}
	let stateStored 
	if(state){
		stateStored = stateStore[state]
		if(stateStored==null || stateStored.exp==null || stateStored.exp <= Math.floor(Date.now()/1000)){
			delete stateStore[state]
			stateStored = null
		}
	}
	if(stateStored==null){
		console.log("state not present or expired")
		res.status(400).json({error:"internal error:authorization error"})
		return
	}
	let {redirect_uri} = stateStored
	let resp = await axios.post(authServer.token,new URLSearchParams({
		code,
		client_id:  clientID,
		client_secret: clientSecret,
		grant_type:"authorization_code",
		redirect_uri,
	}))
	console.log("resp.data",resp.data)

	let {access_token,expires_in} = resp.data
	if(!access_token){
		console.log("access_token not present")
		res.status(400).json({error:"internal error:authorization error"})
		return
	}
	console.log("access_token:" ,access_token)
	let exp
	if(expires_in!=null && expires_in>0){
		exp = Math.floor(Date.now()/1000) + expires_in
	}else{
		exp = Math.floor(Date.now()/1000) + 3600
	}

        let {name}= dec.decodeJWTPayload(access_token)
	if(!name){
		console.log("access_token does not contain name")
		res.status(400).json({error:"internal error:authorization error"})
		return
	}

	tokenStore[access_token] = {exp,name}

	res.set("X-Token", access_token)
	res.set("X-Redirect-URI", redirect_uri)
	res.set("X-User-Name",name)

	res.send("Authorization succeed")
})

app.getAsync("/hello",function(req,res){
	res.send("hello")
})

app.listen(3001)
