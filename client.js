var socket;

connect();

text=d3.select("body").append("p").text("-");
dial=d3.select("body").append("svg").
	append("circle").
	attr("r",50).attr("cx",50).attr("cy",50);
dial.classed('dial',true);

function connect() {
	try {
		socket=new WebSocket("ws://localhost:8081");
		socket.onopen=openSocket;
		socket.onmessage=showMessage;
	} catch (e) {
		setTimeout(connect,500);
	}
}

function openSocket() {
	text.text("0");
}

function showMessage(message) {
	text.text(message.data);
}
