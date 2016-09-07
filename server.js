var http = require('http');
var https = require('https');
var url = require('url');

var server = http.createServer(function(request,response){
	//console.log('path:',url.parse(request.url).path);
	//console.log(request.headers);
	var pathname = url.parse(request.url).pathname;

	if(request.url){

		console.log('proxy:',request.url);
		var options = {};
		options.hostname = url.parse(request.url).hostname;
		options.path = url.parse(request.url).path;
		options.headers = request.headers;
		options.method = request.method;
		try{

			var req = http.request(options,function(res){
				var body = [];
				res.on('data',function(trunk){
					body.push(trunk);
				}).on('end',function(){
					body = Buffer.concat(body);
					if(res.statusCode!=0){
						response.writeHead(res.statusCode,res.headers);
						response.end(body);
					}
				});
			});
			req.on('error',function(e){
				console.log('request-error:',e.message);
			});
			req.on('upgrade',function(res, socket, upgradeHead){
				console.log(res);
			});
			req.end();

		}catch(e){
			console.log('request-exception:',e.message);
		}
	}


});


server.on('error',function(e){
	console.log('server-exception:',e.message);
});

server.listen(80);

console.log('listening on port 80');


