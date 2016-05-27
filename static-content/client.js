// todo
// measure size of the text and arrange correctly
// make page reactive
// persist lap data (s3?)
// add player name
// tidy code

var socket;
var val=0;
var onelap=500.0;
var div=360/onelap;
var width=window.innerWidth, height=window.innerHeight;
var lapList=new Array();
var topLapSpeed=0,chaseHandDist=0;
var dialCenterX=width/2, dialCenterY=height/2, dialRadius=300, tickLength=10;
var timerTextSize;
var lapListX=dialCenterX-dialRadius-100, lapListY=dialCenterY-dialRadius;
var handLength=dialRadius/3;
var lapAnimation=false,lapAnimationDuration=2000;
var speedHist=[];

connect();

function tickX(angle, radius) {
	return Math.sin(angle)*radius+dialCenterX;
}

function tickY(angle, radius) {
	return Math.cos(angle)*radius+dialCenterY;
}

dial=d3.select("svg").attr("width",width).attr("height",height).
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
	}).classed("ticks","true");

var chaseHand=d3.select("svg").append("line").
	attr("x1",dialCenterX).attr("y1",dialCenterY-dialRadius+handLength).
	attr("x2",dialCenterX).attr("y2",dialCenterY-dialRadius).
	classed("chasehand",true);

var hand=d3.select("svg").append("line").
	attr("x1",dialCenterX).attr("y1",dialCenterY-dialRadius+handLength).
	attr("x2",dialCenterX).attr("y2",dialCenterY-dialRadius).
	classed("hand",true);

var timer=d3.select("svg")
	.append("text")
	.classed("timer","true")
	.text("88:88:888");
timerTextSize=timer[0][0].getBBox();
timer.attr("x",dialCenterX-timerTextSize.width/2).attr("y",dialCenterY+timerTextSize.height/4);

var speedText=d3.select("svg")
	.append("text")
	.attr("x",dialCenterX-timerTextSize.width/2).attr("y",dialCenterY+timerTextSize.height);
speedText.classed("speedo","true");

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
	socket.onmessage=handleMessage;
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
	// stop updating timer when the lap animation is going on
	if (!lapAnimation) {
		timer.text(millis);
	}
	updateHand([dist]);
	chaseHandDist=topLapSpeed*data[1];
	updateChaseHand(chaseHandDist);
}

function resetLapAnimation() {
	lapAnimation=false;
}

function setupLapList(data) {
	var lapSelection=d3.select("svg")
		.selectAll(".lap")
		.data(data,function(d) {
			return d[1]}
		);

	lapSelection
		.enter()
		.append("text")
		.attr("x",lapListX)
		.attr("y",lapListY)
		.attr("transform",function(d,i) {
			return "translate (0,"+(i*20)+") scale(0.5,0.5)";
		})
		.text(function (d) {return formatTime(d[0])})
		.style("font-size","40pt")
		.classed("lap","true");
	
	lapSelection
		.attr("transform",function(d,i) {
			return "translate (0,"+(i*20)+") scale(0.5,0.5)";
		});

	lapSelection
		.exit()
		.remove();
		
}

function animateNewLapData(data) {
	lapAnimation=true;
	// can we do this with an event listener on the transition??
	setTimeout(resetLapAnimation,1000);

	timer.text("");

	var lapData=d3.select("svg").
		selectAll(".lap").
		data(data,function(d) {
			return d[1]}
		);

	lapData.
		transition().
		duration(lapAnimationDuration).
		attr("transform",function(d,i) {
			var s="translate (0,"+(i*20)+") scale(0.5,0.5)";
			return s;
		});

	var newText=lapData.
		enter().
		append("text").
		attr("x",dialCenterX-timerTextSize.width/2).
		attr("y",dialCenterY).
		classed("lap","true").
		text(function(d) {
			return formatTime(d[0]);
		}).
		style("font-weight","900");

	newText.style("font-size","40pt")
		.style("weight","900")
		.transition()
		.ease("circle")
		.duration(lapAnimationDuration)
		//.style("font-size","16pt")
		.style("weight","300")
		.attr("x",lapListX)
		.attr("y",lapListY)
		.attr("transform",function(d,i) {
			return "translate (0,"+(i*20)+") scale (0.5,0.5)";
		})
		.style("font-weight","400");

	lapData.exit().transition().duration(lapAnimationDuration).attr("opacity","0").remove();
}

function formatSpeed(speed) {
	return parseInt(speed*10)/10;
}

function updateSpeed(data) {
	var newData=[parseInt(data[0]),parseInt(data[1])];
	speedHist.push(newData);
	if (speedHist.length>20) {speedHist.shift()}
	var dist=newData[0]-speedHist[0][0];
	var time=newData[1]-speedHist[0][1];
	var speed=dist/time*60*60; //m to Km, millis to secs, secs to mins, mins to hours
	speedText.text(formatSpeed(speed));
}

function handleMessage(message) {
	var data=message.data.split(',');
	var recordType=data.shift();
	if (recordType=="t") {
		updateTick(data);
		updateSpeed(data);
	} 
	else if (recordType=="l") {
		chaseHandDist=0;
		if (lapList.length<10 || data[0]<lapList[lapList.length-1][0]) {
			lapList.push([data[0],data[1]]);
			lapList.sort(function(a,b) {return a[0]-b[0]});
			if (lapList.length>10) {lapList.pop()}
			topLapSpeed=onelap/lapList[0][0];
			animateNewLapData(lapList);
		}
	}
	else if (recordType="a") {
		lapList=JSON.parse(data);
		setupLapList(lapList);
		topLapSpeed=onelap/lapList[0][0];
	}
}
