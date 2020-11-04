function isAsyncFuntion(f){
	if(f===undefined)return false
	return Object.getPrototypeOf(async function(){}) === Object.getPrototypeOf(f)
}

function callHandler(handler,method,app,...args){
		if(!isAsyncFuntion(handler)){
			method.call(app,...args,handler)
		}else{
			// handle error to next
			method.call(app,...args,function(req,res,next){
				// handler is Promise
				handler(req,res,next).catch(next)
			})
		}
}

// get,post with async support
function makeAsyncWrapper(app,method){
        return function(path,handler){
		callHandler(handler,method,app,path)
	}
}

function injectAsyncMethods(app){
	app.getAsync =  function(path,handler){
		callHandler(handler,app.get,app,path)
	}
	app.postAsync =  function(path,handler){
		callHandler(handler,app.post,app,path)
	}
	app.useAsync =  function(handler){
		callHandler(handler,app.use,app)
	}
}

function requestLog(req,res,next){
	console.log(`request received >>>> ${req.originalUrl}`)
	let start = Date.now()
	next()
	console.log(`request response <<<< ${req.originalUrl}, cost:${Date.now() - start}ms`)
}

module.exports = {
	injectAsyncMethods,
	requestLog,
}
