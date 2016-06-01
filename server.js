var serialport=require("serialport");
var SerialPort=serialport.SerialPort;
var WebSocketServer=require("ws").Server;
var wss=new WebSocketServer({port: 8081});
var connections=new Array;
var t=0;
var lapCounter=0, lapStartTime=Date.now(), lapLength=500;
var lapList=new Array();
var dist=0,lapTime=0;
var speedHist=[], speedDist=0, speedTime=0;

wss.on('connection', handleConnection);

function handleConnection(client) {
	console.log("new client");
	connections.push(client);
	broadcastAllLaps(JSON.stringify(lapList));
}

function completedALap() {
	return (parseInt(t/lapLength)!=lapCounter);
}

function updateLaps() {
	console.log("LAP");
	
	var now=Date.now();
	lapCounter=parseInt(t/lapLength);
	var lap=[now-lapStartTime,now];
	lapStartTime=now;
	lapList.push(lap);
	lapTime=0;
	lapList.sort(function(a,b) {return a[0]-b[0]})
	if (lapList.length>10) {lapList.pop()}
	broadcastLaps(lap);
}

function broadcastAllLaps(data) {
	broadcast("a,"+data.toString());
}

function broadcastLaps(data) {
	broadcast("l,"+data.toString());
}

function broadcastTick(msg) {
	broadcast("t,"+msg);
}

function updateSpeed(data) {
	var newData=[parseFloat(data[0]),parseInt(data[1])];
	speedHist.push(newData);
	speedDist+=newData[0];
	speedTime+=newData[1];
	if (speedHist.length>200) {
		var old=speedHist.shift()
		speedDist-=old[0];
		speedTime-=old[1];
	}
	return speedDist/speedTime*60*60; //m to Km, millis to secs, secs to mins, mins to hours
}

function handleData(message) {
	var data=message.split(',');
	t+=parseFloat(data[0]);
	var speed=updateSpeed(data);
	lapTime+=parseInt(data[1]);
	var msg=t+","+lapTime+","+speed;
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
	handleData(((Math.random()*0.5)+0.5)+",50");
	setTimeout(tick,50);
}

if (process.argv.length>2 && process.argv[2]=="-t") {
	console.log("test mode");
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
