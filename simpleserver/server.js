// framework
const express = require('express');
const cookieParser = require('cookie-parser')

// library for this project
const {injectAsyncMethods,requestLog} = require('../lib/express_enhance')
const SimpleAuthServer = require('./SimpleAuthServer')
const {UserService} = require('./user')
const dec = require('../lib/dec')

const app = express()
const authServer = new SimpleAuthServer()
const userService = new UserService()

const jwtSecret = "server_+auth_+"

injectAsyncMethods(app)
app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser()) // make req.cookies available
app.use(requestLog)
// error handling
app.use(function(err,req,res,next){
	console.error(err.stack)
	if(res.headerSent){
		return next(err)
	}
	res.status(400)
	res.json({error: err.msg})
})


function issueGrantCodeRedirect(res,client_id,redirect_uri,response_type,state){
	// redirect to the specified url
	if(!redirect_uri || !response_type){
		throw "empty redirect_uri or response_type"
	}

	if(response_type!="code"){
		throw "unsupported response_type:" + response_type
	}
	// generate grant code
	// code => token map, this code is allowed to retrieve a token and
	// optionally a refresh token
	let code = authServer.generateAuthorizationCode(client_id, redirect_uri)
	let url
	try{
		url = new URL(redirect_uri)
	}catch(e){
		throw "bad redirect url"
	}
	url.searchParams.append("code",code)
	url.searchParams.append("state",state)

	res.redirect(url.toString())
}

// what is the responsibility of /auth?
// auth validates the user's credential and send back to the 
// client service a grant code, laterly, the client service request
// token with the grant code
// example: http://localhost:5001/auth?response_type=code&client_id=sample-client-id&redirect_uri=http://localhost:5000/callback
app.getAsync("/auth",function(req,res){
	let {state,response_type, client_id, redirect_uri} = req.query

	if(!client_id || !redirect_uri || !response_type){
		throw "empty client_id,redirect_uri or response_type"
	}

	if(response_type!="code"){
		throw "unsupported response_type:" + response_type
	}

	if(!authServer.allowClientRedirect(client_id, redirect_uri)){
		throw "redirection not allowed:"+redirect_uri
	}

	// if already logged in, just redirect
	let { token } = req.cookies
	console.log("auth token:",token)
	if(token){
		let tokenValid = false
		let info
		try{
			info = dec.validateJWT(token,jwtSecret)
			console.log("decode jwt token:",info)
			if(info.exp != null && info.exp > Math.floor(Date.now() / 1000)){
				tokenValid = true
			}
		}catch(e){
			// token is invalid
			console.error("error validate jwt token:",e)
		}

		if(tokenValid){
			console.log("token is valid:", token)
			// can just redirect
			issueGrantCodeRedirect(res,client_id,redirect_uri,response_type,state)
			return
		}

		// token invalid
		res.clearCookie("token")
		res.clearCookie("name")
	}

	let params = new URLSearchParams({
		state,
		client_id,
		redirect_uri,
		response_type,
	})

	res.redirect("/static/login.html?" + params.toString())
})

// serve a html page to the user to provide username&password input
app.getAsync("/static/login.html",function(req,res){
	let {state,response_type, client_id, redirect_uri} = req.query
	
	// optional
// 	if(!client_id || !redirect_uri || !response_type){
// 		throw "empty client_id,redirect_uri or response_type"
// 	}
	client_id = client_id || ""
	redirect_uri  = redirect_uri || ""
	response_type = response_type || ""
	state = state || ""

	let html = `<html>
	<head><title>login</title></head>
	<body>
	        <p>go to <a href="register.html">register</a></p>
		<form method="get" action="/login">
		   <input hidden name="state" value="${state}"/>
		   <input hidden name="client_id" value="${client_id}"/>
		   <input hidden name="response_type" value="${response_type}"/>
		   <input hidden name="redirect_uri" value="${redirect_uri}"/>
		   <label>Name:</label>
		   <input name="name"/>
		   <br/>
		   <label>Password:</label>
		   <input name="password" type="password"/>
		   <br/>
		   <button type="submit">Login</button>
		</form>
	</body>
</html>`
	res.send(html)
})

app.getAsync("/static/register.html", function(req,res){
	let html = `<html>
	<head><title>register</title></head>
	<body>
		<form method="get" action="/register">
		   <label>Name:</label>
		   <input name="name"/>
		   <br/>
		   <label>Password:</label>
		   <input name="password" type="password"/>
		   <br/>
		   <button type="submit">Register</button>
		</form>
	</body>
</html>`
	res.send(html)
})

app.getAsync("/static/welcome.html", function(req,res){
	let html = `<html>
	<head><title>register</title></head>
	<body>
	   <div id="welcome" hidden="hidden">
	      <p>Welcome <span id="username"></span>
	      <span>,you can <a href="/logout">logout</a></span>
	      </p>
	   </div>
	   <div id="login" hidden="hidden">
	     <p>Welcome, please <a href="/static/login.html">login</a></p>
	   </div>
	</body>
	<script>
	   function getCookie(name){
	        let cookie=document.cookie.split("; ").filter(e => e.startsWith(name + "="))
		if(cookie==null || cookie.length==0){
		   return null
		}
		return cookie[0].slice(name.length+1)
	   }
	   let token=getCookie("token")
	   let name=getCookie("name")
	   if(!token || !name){
	        login.hidden = false 
	   }else{
	        welcome.hidden = false
		username.innerHTML = name
	   }
	</script>
</html>`
	res.send(html)
})

// generate jwt token,set it to cookie, and return the token
function setCookieUser(res,name){
	let jwt = dec.signJWT({
		name,
		exp:Math.floor(Date.now() / 1000) + (60 * 60)
	},jwtSecret)

	res.cookie("token",jwt)
	res.cookie("name",name)
	return jwt
}
app.getAsync("/register", async function(req,res){
	let {name ,password} = req.query
	if(!name|| !password){
		throw new Error("empty name or password")
	}

	await userService.addUser(name,password)

	setCookieUser(res,name)
	res.redirect("/static/welcome.html")
})

app.getAsync("/login", async function(req,res){
	// the redirect_uri is the client callback, which should 
	// make a request to /token
	let { state,response_type, client_id, redirect_uri} = req.query
	let { name, password } = req.query


	if(!name || !password){
		throw "empty name or password"
	}

	if(!await authServer.isUserCredentialValid(name,password)){
		throw "possibly wrong name or password"
	}

	// will clear tokens
	res.clearCookie("token")
	res.clearCookie("name")
	let token = setCookieUser(res,name)

	if(!client_id){
		// redirect to welcome
		res.redirect("/static/welcome.html")
	}else{
		issueGrantCodeRedirect(res,client_id,redirect_uri,response_type,state)
	}
})

app.getAsync("/logout", async function(req,res){
	res.clearCookie("token")
	res.clearCookie("name")
	res.redirect("/static/login.html")
})

// after /auth, the client service will issue a /token request to get the token
// and has a state paramter
// and that token is set to cookie: token
// this should be a POST method
app.postAsync("/token",function(req,res){
	let q = Object.assign({}, req.body,req.query)
	let {state,client_id, client_secret,code,grant_type} = q
	if(!client_id || !client_secret || !code || !grant_type){
		throw "empty client_id,client_secret,code,grant_type,or redirect_uri"
	}
	if(grant_type !== 'authorization_code'){
		throw 'unsupported grant_type:' + grant_type
	}

	if(!authServer.isClientValid(client_id,client_secret)){
		throw "wrong client_id or client_secret"
	}

	let token = authServer.generateAccessToken()

	// resposne with token
	res.json({
		token,
	})
})

app.listen(3000)
