var serialport=require("serialport");
var SerialPort=serialport.SerialPort;
var WebSocketServer=require("ws").Server;
var wss=new WebSocketServer({port: 8081});
var connections=new Array;
var t=0;
var starttime=Date.now();
var lapCounter=0, lapStartTime=0, lapLength=500;
var lapList=new Array();
var dist=0,startTime=0;

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("new client");
	connections.push(client);
}

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
	broadcastLaps(lap);
}

function broadcastLaps(data) {
	broadcast("l,"+data.toString());
}

function broadcastTick(msg) {
	broadcast("t,"+msg);
}

function handleData(message) {
	data=message.split(',');
	t=data[0];
	var msg=t+","+data[1]
	broadcastTick(msg);
	if (completedALap()) {
		updateLaps();
	}
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

function tick() {
	handleData((dist+=((Math.random()*3)+1))+","+(Date.now()-startTime));
	setTimeout(tick,100);
}

if (process.argv.length>2 && process.argv[2]=="-t") {
	console.log("test mode");
	startTime=Date.now();
	tick();
}
else {
	var SerialPort=serialport.SerialPort;
	var portName="/dev/ttyUSB0"

	var arduino=new SerialPort(portName, {
		baudRate: 9600,
		parser: serialport.parsers.readline("\n")
	});

	arduino.on("open", function() {console.log("port open")});
	arduino.on("data", handleData);
}
