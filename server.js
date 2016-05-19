var serialport=require("serialport");
var SerialPort=serialport.SerialPort;
var WebSocketServer=require("ws").Server;
var wss=new WebSocketServer({port: 8081});
var connections=new Array;
var t=0;
var starttime=Date.now();

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("new client");
	connections.push(client);
}

setTimeout(tick,500);

function tick() {
	msg=(t+=5)+","+(Date.now()-starttime);
	broadcast(msg);
	setTimeout(tick,50);
}

function broadcast(data) {
	for (c in connections) {
		connections[c].send(data+"",function ack(error) {
			if (error) {
				console.log("client diconnect");
				connections.splice(c,1);
			}
		});
	}
}

serialport.list(
	function(err,ports) {
		ports.forEach(function(port) {
			console.log(port.comName);
		})
	}
);
