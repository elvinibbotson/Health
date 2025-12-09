function id(el) {
	return document.getElementById(el);
}
function pad(n) {
	// console.log('pad '+n+' to 5 chars - starting from '+n.length);
	var num=n;
	console.log('n: '+n+' ('+n.length+' chars)');
	while(num.length<5) num='&nbsp;'+num;
	return num;
}
'use strict';
// GLOBAL VARIABLES
var scr={}; // screen size .w & .h and cursor coordinates .x & .y
// var db=null;
var logs=[];
var log=null;
var logIndex=null;
var currentLog=null;
var view='listView';
var currentDialog=null;
var dragStart={};
var canvas=null;
var background=null;
var canvasL=0;
var intervalX=0;
var intervalY=0;
var months="JanFebMarAprMayJunJulAugSepOctNovDec";
var backupDay;
var height=1.725; // 1725mm (5'8")
// var root; // OPFS root directory
// DRAG TO GO BACK
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
    // console.log('start drag at '+dragStart.x+','+dragStart.y+' view is '+view);
})
id('main').addEventListener('touchmove', function(event) {
	var x=event.changedTouches[0].clientX-dragStart.x;
	x+=canvasL;
	id('graphPanel').style.left=x+'px';
	// id('graphBackground').style.left=0;
	// console.log('graphPanel.x: '+x+';  background.x: '+id('graphBackground').style.left);
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    // console.log('drag '+drag.x+','+drag.y+' view is '+view);
    if(view=='listView') {
    	if(Math.abs(drag.y)>50) return; // ignore vertical drag
    	if(drag.x<-50) { // drag right to show graph
    		console.log('drag.x is '+drag.x);
    		view='graph';
    		id('listPanel').style.display='none';
    		id('heading').style.display='none';
    		id('buttonNew').style.display='none';
    		drawGraph();
    	}
    	else if((drag.x>50)&&(currentDialog)) toggleDialog(currentDialog,false); // drag left to close dialog
    }
    else { // drag vertically to return to list view
    	canvasL-=drag.x;
    	// console.log('canvas left: '+canvasL);
    	if(Math.abs(drag.x)>50) return; // ignore horizontal drags
    	if(Math.abs(drag.y)>50) {
    		view='listView';
    		id('graphPanel').style.display='none';
    		id('graphBackground').style.display='none';
    		id('listPanel').style.display='block';
    		id('heading').style.display='block';
    		id('buttonNew').style.display='block';
    	}
    }
})
// TAP ON HEADER
id('heading').addEventListener('click',function() {toggleDialog('dataDialog',true);})
// NEW BUTTON
id('buttonNew').addEventListener('click', function() { // show the log dialog
	console.log("show add log dialog with today's date and delete button disabled");
	var d=new Date().toISOString();
	id('logDate').value=d.substr(0,10);
	id('logWeight').value=null;
	id('logFat').value=null;
	id('logMTB').value=null;
	id('logAir').value=null;
	// id('logCons').value=null;
	log={};
	id("buttonDeleteLog").style.display='none';
	// id("buttonDeleteLog").disabled=true;
	// id('buttonDeleteLog').style.color='gray';
	id('buttonAddLog').style.display='block';
	// id('button.addLog').disabled=false;
	id('buttonSaveLog').style.display='none';
	// id('button.saveLog').disabled=true;
	toggleDialog('logDialog',true);
});
// ADD NEW LOG
id('buttonAddLog').addEventListener('click',function() {
	log.date=id('logDate').value;
	log.weight=id('logWeight').value;
	log.fat=id('logFat').value;
	log.mtb=id('logMTB').value;
	log.air=id('logAir').value;
    toggleDialog('logDialog',false);
    console.log("add new log - date: "+log.date);
	logs.push(log);
	save();
	populateList();
})
// SAVE EDITED LOG
id('buttonSaveLog').addEventListener('click', function() {
	log.date=id('logDate').value;
	log.weight=id('logWeight').value;
	log.fat=id('logFat').value;
	log.mtb=id('logMTB').value;
	log.air=id('logAir').value;
    toggleDialog('logDialog',false);
	console.log("save log - date: "+log.date);
	save(); // WAS saveData();
	populateList();
});
// DELETE LOG
id('buttonDeleteLog').addEventListener('click', function() {
	var text=log.date; // initiate delete log
	console.log("delete log date "+text+' show confirm dialog');
	toggleDialog("deleteDialog", true);
	id('deleteText').innerHTML=text;
});
// CONFIRM DELETE
id('buttonDeleteConfirm').addEventListener('click', function() {
	console.log("delete log - "+logIndex); // confirm delete log
	console.log('date: '+log.date);
	logs.splice(logIndex,1);
	save(); // WAS saveData();
	populateList();
	toggleDialog('deleteDialog', false);
});
// SHOW/HIDE DIALOGS
function  toggleDialog(d, visible) {
    console.log('toggle '+d+' - '+visible);
    if(currentDialog) id(currentDialog).style.display='none';
    if(visible) {
    	currentDialog=d;
    	id(d).style.display='block';
    }
    id('buttonNew').style.display=(visible)?'none':'block';
    id('curtain').style.height=(visible)?'100%':'0';
}
// OPEN SELECTED LOG FOR EDITING
function openLog() {
	console.log("open log: "+logIndex);
	log=logs[logIndex];
	console.log('log date: '+log.date);
	toggleDialog('logDialog',true);
	id('logDate').value=log.date;
	id('logWeight').value=log.weight;
	id('logFat').value=log.fat;
	id('logMTB').value=log.mtb;
	id('logAir').value=log.air;
	// id('logCons').value=log.cons;
	id('buttonDeleteLog').style.display='block';
	id('buttonAddLog').style.display='none';
	id('buttonSaveLog').style.display='block';
}
// POPULATE LOGS LIST
function populateList() {
	console.log("populate list with "+logs.length+' logs');
	id('list').innerHTML=""; // clear list
	var html="";
	var d="";
	var mon=0;
	var mtbMiles=airMile=0;
  	for(var i=logs.length-1; i>=0; i--) { // list latest first
  		console.log('log '+i+': '+logs[i].weight+' '+logs[i].fat+' '+logs[i].mtb+' '+logs[i].air);
  		if(logs[i].mtb<1) logs[i].mtb='';
  		if(logs[i].air<1) logs[i].air='';
  		var listItem=document.createElement('li');
		listItem.index=i;
	 	listItem.classList.add('log-item');
		listItem.addEventListener('click', function(){logIndex=this.index; openLog();});
		var itemText=document.createElement('span');
		d=logs[i].date;
		mon=parseInt(d.substr(5,2))-1;
		mon*=3;
		d=months.substr(mon,3)+" "+d.substr(2,2);
		html='<span class="grey">'+d+'</span><span class="red">'+pad(logs[i].weight)+'</span><span class="orange">'+pad(logs[i].fat)+'</span><span class="blue">'+pad(logs[i].mtb)+'</span><span class="green">'+pad(logs[i].air)+'</span>';
		itemText.innerHTML=html;
		listItem.appendChild(itemText);
		id('list').appendChild(listItem);
  	}
}
// DRAW GRAPH
function drawGraph() {
	var letters='JFMAMJJASOND';
	var margin=90; // bottom margin to allow space for Android controls
	var intervalV=10; // 10kg interval for horizontal gridlines
	var n=logs.length-1;
	console.log('graph spans '+n+' months');
	console.log('screen width: '+scr.w+'; intervalX: '+intervalX);
	canvasL=(14-n)*intervalX;
	console.log('start with canvasL: '+canvasL);
	id('graphPanel').style.left=canvasL+'px';
	id("graphPanel").style.width=(n*intervalX+10)+'px';
	id('canvas').width=n*intervalX+10;
	id('graphBackground').style.display='block';
	id('graphPanel').style.display='block';
	// clear canvases
	background.clearRect(0,0,scr.w,scr.h);
	canvas.clearRect(0,0,id('canvas').width+10,scr.h);
	background.fillStyle='black';
	background.fillRect(0,0,scr.w,24); // header - black background
	background.font='16px Monospace';
	background.fillStyle='hotpink';
	background.fillText('weight',25,20);
	background.fillStyle='lightgreen';
	background.fillText('BMI',100,20);
	background.fillStyle='orange';
	background.fillText('fat',175,20);
	background.fillStyle='skyblue';
	background.fillText('miles',250,20);
	background.lineWidth=1;
	// draw horizontal gridlines and labels on background
	for(i=0;i<10;i++) {
		background.fillStyle='white';
		background.fillText((i)*intervalV,2,scr.h-margin-i*intervalY-5); // kg at 100px intervals
		// background.fillStyle='orange';
		// background.fillText((i+12)*intervalV,24,scr.h-margin-i*intervalY-5); // % at 100px intervals
	}
	// background.fillStyle='hotpink'; // vertical axis labels
	// background.fillText('kg',2,scr.h-margin-9*intervalY+20);
	// background.fillStyle='orange';
	// background.fillText('%',24,scr.h-margin-9*intervalY+20);
	background.strokeStyle='silver'; // grey lines
	background.beginPath();
	for(i=0;i<10;i++) {
		background.moveTo(0,scr.h-margin-i*intervalY);
		background.lineTo(scr.w,scr.h-margin-i*intervalY); // grey lines
	}
	background.stroke();
	// DRAW GRAPHS
	var startLog=1; // defaults to second log (for month intervals)
	var mon=-1;
	canvas.strokeStyle='silver'; // grey lines
	canvas.font='20px Monospace';
	canvas.fillStyle='white'; // white text
	console.log('draw vertical gridlines');
	canvas.beginPath();
	var i=startLog-1;
	console.log('first gridline is for '+logs[i].date+'; startLog is '+startLog);
	var m=0;
	var year=0;
	while(i<logs.length) {
		x=Math.floor(i*intervalX);
		console.log('gridline '+i+' at '+x);
		canvas.moveTo(x,scr.h-margin);
		canvas.lineTo(x,scr.h-margin-10*intervalY); // vertical gridline
		m=parseInt(logs[i].date.substr(5,2))-1;
		canvas.fillText(letters.charAt(m),x,scr.h-margin-10*intervalY-5); // month letter just above and below grid
		canvas.fillText(letters.charAt(m),x,scr.h-margin-5);
		if(m<1) {
			year=logs[i].date.substr(0,4);
			canvas.fillText(year,x,scr.h-margin-10*intervalY-24); // YYYY above month labels
		}
		i++;
	}
	canvas.stroke();
	// first draw weight chart
	canvas.strokeStyle='hotpink';
	canvas.setLineDash([]);
	canvas.lineWidth=3;
	canvas.beginPath();
	i=startLog;
	x=Math.floor((i-1)*intervalX);
	var val=0;
	console.log('start from log '+i+' - weight');
	while(i<logs.length) {
		val=logs[i].weight;
		console.log('weight '+i+': '+val+'kg');
		val*=intervalY/intervalV; // convert kg to pixels
		console.log('ie '+val+'px');
		x+=intervalX;
		var y=scr.h-margin-val;
		if(i==startLog) canvas.moveTo(x,y);
		else canvas.lineTo(x,y);
		i++;
	}
    canvas.stroke();
    // next draw fat chart
    console.log('fat');
    canvas.strokeStyle='orange';
    canvas.setLineDash([]);
    canvas.beginPath();
    i=startLog;
    x=Math.floor((i-1)*intervalX);
    while(i<logs.length) {
		val=logs[i].fat;
		console.log('fat '+i+': '+val+'%');
		val*=intervalY/intervalV; // convert kg fat to pixels
		x+=intervalX
		var y=scr.h-margin-val;
		if(i==startLog) canvas.moveTo(x,y);
		else canvas.lineTo(x,y);
		i++;
	}
	canvas.stroke();
	// miles cycled...
	console.log('miles');
	canvas.strokeStyle='skyblue';
	canvas.setLineDash([]);
    canvas.beginPath();
    i=startLog;
    x=Math.floor((i-1)*intervalX);
    while(i<logs.length) {
    	if(logs[i-1].mtb=='') logs[i-1].mtb=logs[i].mtb;
    	if(logs[i-1].air=='') logs[i-1].air=logs[i].air;
		val=(logs[i].mtb-logs[i-1].mtb)+(logs[i].air-logs[i-1].air);
		val*=intervalY/intervalV; // convert miles to pixels
		x+=intervalX;
		var y=scr.h-margin-val;
		canvas.moveTo(x,scr.h-margin);
		canvas.lineTo(x,y);
		i++;
	}
	canvas.stroke();
	// finally, draw BMI dots
    canvas.beginPath();
    i=startLog;
    x=Math.floor((i-1)*intervalX);
    while(i<logs.length) {
    	var val=logs[i].weight;
    	val/=(height*height); // BMI
    	console.log('BMI: '+val);
    	if(val<25) canvas.fillStyle='lightgreen';
		else if((val<18)||(val<30)) canvas.fillStyle='yellow';
		else canvas.fillStyle='hotpink';
    	val*=intervalY/intervalV; // convert to pixels
    	x+=intervalX;
		var y=scr.h-margin-val;
		console.log('y: '+y);
		canvas.moveTo(x,y);
		canvas.arc(x,y,4,0,2*Math.PI);
		canvas.fill();
    	i++;
    }
    canvas.fill();
}
function selectLog() {
	if(currentLog) currentLog.children[0].style.backgroundColor='gray'; // deselect any previously selected item
    itemIndex=parseInt(logIndex);
	log=logs[logIndex];
	console.log("selected item: "+logIndex);
	currentLog=id('list').children[logIndex];
	currentLog.style.backgroundColor='black'; // highlight new selection
}
// DATA
function load() {
	var data=localStorage.getItem('HealthData');
	if(!data) {
		id('dataMessage').innerText='No data - restore backup?';
		id('backupButton').disabled=true;
		toggleDialog('dataDialog',true);
		return;
	}
	console.log('data: '+data.length+' bytes');
    logs=JSON.parse(data);
    console.log(logs.length+' logs read');
    logs.sort(function(a,b) {return Date.parse(a.date)-Date.parse(b.date)}); // date order
	populateList();
	var today=Math.floor(new Date().getTime()/86400000);
	var days=today-backupDay;
	console.log(days+' days since last backup');
	if(days>4) { // backup reminder every 5 days
		id('dataMessage').innerText=days+' days since last backup';
		id('restoreButton').disabled=true;
		toggleDialog('dataDialog',true);
	}
}
function save() {
	var data=JSON.stringify(logs);
	window.localStorage.setItem('HealthData',data);
	console.log('data saved to HealthData');
}
id('backupButton').addEventListener('click',backup);
id('restoreButton').addEventListener('click',function() {
	var event = new MouseEvent('click',{
		bubbles: true,
		cancelable: true,
		view: window
	});
	fileChooser.dispatchEvent(event);
	fileChooser.onchange=(event)=>{
		var file=id('fileChooser').files[0];
    	console.log("file name: "+file.name);
    	var fileReader=new FileReader();
    	fileReader.addEventListener('load', function(evt) {
			console.log("file read: "+evt.target.result);
    		var data=evt.target.result;
    		logs=JSON.parse(data);
    		console.log(logs.length+' logs');
    		save();
    		console.log('data imported and saved');
    		load();
    	});
    	fileReader.readAsText(file);
	}
	id('dataMessage').innerText='';
	id('backupButton').disabled=false;
	toggleDialog('dataDialog',false);
});
function backup() {
  	console.log("save backup");
  	var fileName="HealthData.json";
  	var json=JSON.stringify(logs);
	var blob=new Blob([json],{type:"data:application/json"});
  	var a=document.createElement('a');
	a.style.display='none';
    var url=window.URL.createObjectURL(blob);
	console.log("data ready to save: "+blob.size+" bytes");
   	a.href=url;
   	a.download=fileName;
    document.body.appendChild(a);
    a.click();
	id('dataMessage').innerText='';
	id('restoreButton').disabled=false;
	toggleDialog('dataDialog',false);
	backupDay=Math.floor(new Date().getTime()/86400000);
	window.localStorage.setItem('backupDay',backupDay);
}
// START-UP CODE
scr.w=screen.width;
scr.h=screen.height;
console.log('screen size: '+scr.w+'x'+scr.h+'px');
id('main').style.width=scr.w+'px';
intervalX=scr.w/14; // 14 intervals visible across graph
intervalY=scr.h/12; // 12 intervals vertically 
console.log('intervals: '+intervalX+'x'+intervalY+'px');
id("canvas").width=scr.w;
id("canvas").height=scr.h;
console.log('canvas size: '+id("canvas").width+'x'+id("canvas").height);
id("background").width=scr.w;
id("background").height=scr.h;
canvas=id('canvas').getContext('2d');
background=id('background').getContext('2d');
backupDay=window.localStorage.getItem('backupDay');
if(!backupDay) backupDay=0;
console.log('last backup on day '+backupDay);
load();
// implement service worker if browser is PWA friendly 
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Health/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}
