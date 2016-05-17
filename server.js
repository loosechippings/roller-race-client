var serialport=require("serialport");
var SerialPort=serialport.SerialPort;
var WebSocketServer=require("ws").Server;
var wss=new WebSocketServer({port: 8081});
var connections=new Array;
var t=0;

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("new client");
	connections.push(client);
}

setTimeout(tick,500);

function tick() {
	broadcast(t++);
	setTimeout(tick,500);
}

function broadcast(data) {
	for (c in connections) {
		connections[c].send(data+"",function ack(error) {
			if (error) {
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
