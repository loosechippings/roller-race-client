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
	console.log(message);
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

var SerialPort=serialport.SerialPort;
var portName="/dev/ttyUSB0"

var arduino=new SerialPort(portName, {
	baudRate: 9600,
	parser: serialport.parsers.readline("\n")
});

arduino.on("open", function() {console.log("port open")});
arduino.on("data", handleData);

