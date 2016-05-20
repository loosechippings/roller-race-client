var serialport=require("serialport");
var SerialPort=serialport.SerialPort;
var WebSocketServer=require("ws").Server;
var wss=new WebSocketServer({port: 8081});
var connections=new Array;
var t=0;
var starttime=Date.now();
var lapCounter=0, lapStartTime=0, lapLength=500;
var lapList=new Array();

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("new client");
	connections.push(client);
}

setTimeout(tick,500);

function completedALap() {
	return (parseInt(t/lapLength)!=lapCounter);
}

function updateLaps() {
	var now=Date.now();
	lapCounter=parseInt(t/lapLength);
	var lap=[now-lapStartTime,now];
	lapStartTime=now;
	lapList.push(lap);
	lapList.sort(function(a,b) {return a[0]-b[0]})
	if (lapList.length>10) {lapList.pop()}
	console.log(lapCounter);
	broadcastLaps(lap);
}

function broadcastLaps(data) {
	broadcast("l,"+data.toString());
}

function broadcastTick(msg) {
	broadcast("t,"+msg);
}

function tick() {
	msg=(t+=5)+","+(Date.now()-starttime);
	broadcastTick(msg);
	if (completedALap()) {
		updateLaps();
	}
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
