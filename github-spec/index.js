var bodyParser = require('body-parser');
var express = require('express');
var OAuthServer = require('express-oauth-server');
// var memoryModel= require('express-oauth-server/examples/memory/model');
var MemoryModel = require("./model")

var app = express();
var model = new MemoryModel({
	// the client present client_id
	// to get the client attributes
	client:{
		id:"x",
		grants:["authorization_code"],
		redirectUris:["http://10.227.27.107/authcallback"]
	},
	token:{
		accessToken:"accessToken",
		accessTokenExpiresAt: new Date(2025, 11, 17),
		client:null, // set later
		user:{
			"note":"a user that transparent to the oauth server",
			"name":"me"
		},
	}
})
model.token.client = model.client

app.oauth = new OAuthServer({
  model, // See https://github.com/oauthjs/node-oauth2-server for specification
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(app.oauth.authorize({
	// access_token as a parameter in query
	allowBearerTokensInQueryString:true
}));
app.use(function(req,res,next){
	console.log("next")
	next()
})

app.use(function(req, res) {
	console.log("access protected resource")
	res.send('Secret area');
});

app.listen(3000);

console.log("server started")
