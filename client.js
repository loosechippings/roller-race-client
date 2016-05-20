var socket;
var val=0;
var onelap=500.0;
var div=360/onelap;
var width=window.innerWidth, height=window.innerHeight;
var lapList=new Array();
var topLapSpeed=0,chaseHandDist=0,lapStartTime=0;
var dialCenterX=width/2, dialCenterY=height/2, dialRadius=190, tickLength=10;

connect();

function tickX(angle, radius) {
	return Math.sin(angle)*radius+dialCenterX;
}

function tickY(angle, radius) {
	return Math.cos(angle)*radius+dialCenterY;
}

dial=d3.select("body").append("svg").attr("width",width).attr("height",height).
	append("circle").
	attr("r",dialRadius).
	attr("cx",dialCenterX).
	attr("cy",dialCenterY).
	classed('dial',true);

d3.select("svg").selectAll(".ticks").data([0,Math.PI/2,Math.PI,Math.PI+Math.PI/2]).
	enter().
	append("line").attr("x1",function(d) {
		return tickX(d,dialRadius)
	}).
	attr("x2",function(d) {
		return tickX(d,dialRadius+tickLength);
	}).
	attr("y1",function(d) {
		return tickY(d,dialRadius);
	}).attr("y2",function(d) {
		return tickY(d,dialRadius+10);
	}).classed("dial","true");

chaseHand=d3.select("svg").append("line").
	attr("x1",dialCenterX).attr("y1",dialCenterY-dialRadius+50).
	attr("x2",dialCenterX).attr("y2",dialCenterY-dialRadius).
	classed("chasehand",true);
hand=d3.select("svg").append("line").
	attr("x1",dialCenterX).attr("y1",dialCenterY-dialRadius+50).
	attr("x2",dialCenterX).attr("y2",dialCenterY-dialRadius).
	classed("hand",true);
d3.select("svg").append("text").attr("x",dialCenterX-90).attr("y",dialCenterY).classed("timer","true");

function updateHand(data) {
	d3.select(".hand").data([data]).attr("transform",function(d) {
		return "rotate("+div*(d%onelap)+","+dialCenterX+","+dialCenterY+")";
	});
}

function updateChaseHand(data) {
	d3.select(".chasehand").data([data]).attr("transform",function(d) {
		return "rotate("+div*(d%onelap)+","+dialCenterX+","+dialCenterY+")";
	});
}

function connect() {
	socket=new WebSocket("ws://localhost:8081");
	console.log("connected");
	socket.onclose=function(m) {
		setTimeout(connect,500)
	};
	socket.onmessage=showMessage;
}

function formatThreeDigits(num) {
	if (num<10) {
		return "00"+num;
	} else if (num<100) {
		return "0"+num;
	} else {
		return ""+num;
	}
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
	return formatTwoDigits(mins)+":"+formatTwoDigits((secs%60))+":"+formatThreeDigits(millis%1000);
}

function updateTick(data) {
	dist=parseInt(data[0]);
	millis=formatTime(data[1]);
	d3.select(".timer").text(millis);
	updateHand([dist]);
	chaseHandDist=topLapSpeed*(Date.now()-lapStartTime);
	updateChaseHand(chaseHandDist);
}

function updateLaps(data) {
	var lapData=d3.select("svg").
						selectAll(".lap").
						data(data,function(d) {return d[1]});

	var lapUpdate=d3.transition(lapData).
							attr("transform",function(d,i) {
								var s="translate (0,"+(i*20)+")";
								return s;
							});

	var newEnter=d3.select("svg").selectAll(".lap").
		data(data,function(d) {return d[1]}).
		enter();
	
	var newText=newEnter.
		append("text").
		attr("x",dialCenterX-300).
		attr("y",dialCenterY-200).
		attr("transform",function(d,i) {
			return "translate (0,"+(i*20)+")";
		}).
		classed("lap","true").
		text(function(d) {
			return formatTime(d[0]);
		});

	newText.style("font-size","30pt").transition().ease("circle").duration(1000).style("font-size","12pt");

	lapData.exit().remove();
}

function pairUp(data) {
	var n=new Array();
	for (i=0;i<data.length;i+=2) {
		n.push([data[i],data[i+1]]);
	}
}

function showMessage(message) {
	var data=message.data.split(',');
	var recordType=data.shift();
	if (recordType=="t") {
		updateTick(data);
	} else if (recordType=="l") {
		lapList.push([data[0],data[1]]);
		lapStartTime=Date.now() //use local clock for this
		chaseHandDist=0;
		lapList.sort(function(a,b) {return a[0]-b[0]});
		if (lapList.length>10) {lapList.pop()}
		topLapSpeed=onelap/lapList[0][0];
		updateLaps(lapList);
	}
}
