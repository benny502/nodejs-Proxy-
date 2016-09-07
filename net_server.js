'use strict';
var util = require('util');
var EventEmitter = require('events');
var net = require('net');


// var server = net.createServer(function(connection){


// 	var body = [];

// 	connection.on('data',header_data);

// 	function header_data(truck){
// 		console.log('header data');
// 		console.log(truck.toString());
// 		body.push(truck);
// 		var buffer = Buffer.concat(body);
// 		if(find_body_position(buffer)==-1) return;
// 		connection.removeListener('data',header_data);
// 	 	var headerInfo = parse_header(buffer);
// 		var client = net.createConnection(80,headerInfo.host,function(){
// 			console.log('proxy:',headerInfo.path);
// 		});




// 		client.on('data',function(data){
// 			console.log('client data');
// 			connection.write(data);
// 		});

// 		connection.on('data',function(data){
// 			console.log('connection data');
// 			client.write(data);
// 		});

// 		client.on('end',client_end);

// 		client.on('error',function(e){
// 			console.log(e.message);
// 		});



// 		client.write(buffer);

// 		function client_end(){
// 			connection.removeListener('data',client_end);
// 			connection.destroy();
// 			console.log('client end');
// 		}
// 	}

// 	connection.on('end',function(){
// 		console.log('connection end');
// 	});


// 	connection.on('ss_connect',function(buffer){
// 		console.log('ss_connect');

// 	});


// 	connection.on('error:',function(e){
// 		console.log(e.message);
// 	});

// });

// server.on('error',function(e){
// 	console.log(e.message);
// });

function parse_header(buffer){
	var header = buffer.toString('utf8');
	var headerInfo = {};
	headerInfo.method = header.match(/^\w+/)[0];
	headerInfo.path = header.match(/^\w+ (\S+)/)[1];
	headerInfo.host = header.match(/Host: (\S+)/)[1];
	console.log(headerInfo);
	return headerInfo;
}

function parse_request(buffer)

{

	var s = buffer.toString('utf8');

	var method = s.split('\n')[0].match(/^([A-Z]+)\s/)[1];

	if (method == 'CONNECT')

	{

		var arr = s.match(/^([A-Z]+)\s([^:\s]+):(\d+)\sHTTP\/(\d.\d)/);

		if (arr && arr[1] && arr[2] && arr[3] && arr[4])

			return { method: arr[1], host:arr[2], port:arr[3],httpVersion:arr[4] };

	}

	else

	{

		var arr = s.match(/^([A-Z]+)\s([^\s]+)\sHTTP\/(\d.\d)/);

		if (arr && arr[1] && arr[2] && arr[3])

		{

			var host = s.match(/Host:\s+([^\n\s\r]+)/)[1];

			if (host)

			{

				var _p = host.split(':',2);

				return { method: arr[1], host:_p[0], port:_p[1]?_p[1]:80, path: arr[2],httpVersion:arr[3] };

			}

		}

	}

	return false;

}


// function find_body_position(b){

// 	for(var i=0,len=b.length-3;i < len;i++){

// 		if (b[i] == 0x0d && b[i+1] == 0x0a && b[i+2] == 0x0d && b[i+3] == 0x0a){

// 			return i+4;

// 		}

// 	}

// 	return -1;

// }

process.on('uncaughtException', function(err){

	console.log("\nError!!!");

	console.log(err);

});


// server.listen(80,function(){
// 	console.log('listening on port 80...');
// });



function Server(){
	this.List = [];
	this.destList = [];
	EventEmitter.call(this);
	var server = net.createServer(onCreate);


	var self = this;
	function onCreate(sock){
		self.List.push(sock);
		sock.on('data',function(truck){
					//console.log(sock);
			sock.emit('sock_data',self.List.indexOf(sock),truck);
		});

		sock.on('sock_data',onClientData)
	}

	function onClientData(idx,truck){
		var headerInfo = parse_request(truck);console.log(headerInfo);
		var dest = net.createConnection(headerInfo.host);

		console.log('proxy:',headerInfo.path);

		dest.on('data',function(data){
			dest.emit('dest_data',self.destList.indexOf(dest),data);
		});

		dest.on('dest_data',function(index,data){
			if(self.List[index].writable){
				self.List[index].write(data);
				//self.List[index].end();
			}		
		});

		dest.on('end',function(){
			if(self.List[self.destList.indexOf(dest)]){
				self.List[self.destList.indexOf(dest)].end();
			}
		});

		if(headerInfo.method="CONNECT"){
			self.List[idx].write(new Buffer("HTTP/1.1 200 Connection established\r\nConnection: close\r\n\r\n"));
		}

		if(dest.writable){
			dest.write(truck);
			dest.end();
		}
		self.destList[idx] = dest;
	}

	server.listen(80,function(){
		console.log('listening on port 80...');
	});

}

util.inherits(Server, EventEmitter);

var server = new Server();

