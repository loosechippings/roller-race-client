var socket;
var val=0;
var onelap=500.0;
var div=360/onelap;
var width=800, height=500;

connect();

dial=d3.select("body").append("svg").attr("width",width).attr("height",height).
	append("circle").
	attr("r",190).
	attr("cx",400).
	attr("cy",200).
	classed('dial',true);
hand=d3.select("svg").append("line").
	attr("x1",400).attr("y1",60).
	attr("x2",400).attr("y2",10).
	classed("hand",true);
d3.select("svg").append("text").attr("x",310).attr("y",200).classed("timer","true");

function updateHand(data) {
	d3.select(".hand").data([data]).attr("transform",function(d) {
		return "rotate("+div*(d%onelap)+",400,200)";
	});
}

function connect() {
	socket=new WebSocket("ws://localhost:8081");
	console.log("connected");
	socket.onclose=function(m) {
		setTimeout(connect,500)
	};
	socket.onopen=openSocket;
	socket.onmessage=showMessage;
}

function openSocket() {
	text.text("0");
}

function formatTwoDigits(num) {
	if (num<10) {
		return "0"+num;
	} else {
		return ""+num;
	}
}

function formatTime(millis) {
	secs=parseInt(millis/1000);
	mins=parseInt(secs/60);
	return formatTwoDigits(mins)+":"+formatTwoDigits((secs%60))+":"+(millis%1000);
}

function showMessage(message) {
	data=message.data.split(',');
	dist=parseInt(data[0]);
	millis=formatTime(data[1]);
	d3.select(".timer").text(millis);
	updateHand([dist]);
}
