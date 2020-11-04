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

// validate all uri request
app.getAsync("/validate", async function(req,res){
	let {token} = req.cookies

	let tokenCached 
	if(token){
		tokenCached = tokenCache[token]
		if(tokenCache==null || tokenCache.exp == null || tokenCache.exp <= Math.floor(Date.now()/1000) || !tokenCache.name){
			delete tokenCache[token]
			tokenCached = null
		}
	}

	if(tokenCached!=null){
		res.set("X-Username",tokenCached.name)
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
	let resp = await axios.post(authServer.token,new URLSearchParams({
		code,
		client_id:  clientID,
		client_secret: clientSecret,
		grant_type:"authorization_code",
	}))
	console.log("token resp:",resp.data)
	res.send({"auth": resp.data})
})

app.getAsync("/hello",function(req,res){
	res.send("hello")
})

app.listen(3001)
