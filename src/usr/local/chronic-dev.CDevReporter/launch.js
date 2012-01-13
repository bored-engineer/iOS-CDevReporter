var watcherPref = require('watch-tree').watchTree("/var/mobile/Library/Preferences", {'sample-rate': 10});
var watcherCrash = require('watch-tree').watchTree("/var/mobile/Library/Logs/CrashReporter", {'sample-rate': 6000});
var zlib = require('zlib');
var path = require('path');
var http = require('http');
var fs = require("fs");
var exec = require('child_process').exec;
var cleanHosts = require("./clean.js").clean

var enabled = false;
var ecid = "";
var loc = "/var/mobile/Library/Logs/CrashReporter/";

//Trim function
String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g,"");
}

//Clean on startup
cleanHosts();

//Read the hosts file
var hosts = fs.readFileSync('/etc/hosts');
//Add the lines to the hosts file
hosts = hosts.toString() + "\n#<CDevReporter>\n127.0.0.1	iphonesubmissions.apple.com\n#</CDevReporter>\n"
//Save
fs.writeFileSync('/etc/hosts', hosts);
//Log
log("hosts updated");

//Watch the pref file for changes
watcherPref.on('fileCreated', function(path) {
	if(path == "/var/mobile/Library/Preferences/com.chronic-dev.CDevReporter.plist"){
		log("Created");
		updateECID();
	}
}).on('fileModified', function(path) {
	if(path == "/var/mobile/Library/Preferences/com.chronic-dev.CDevReporter.plist"){
		log("Modified");
		updateECID();
	}
});

//Watch the Crash directory
watcherCrash.on('fileCreated', function(path) {
	updateECID();
});

//Update the enabled status
function updateEnabled(cb){
	//Log
	log("Checking/Changing enable status");
	//Get the pref value
	exec('plutil -key "enabled" /var/mobile/Library/Preferences/com.chronic-dev.CDevReporter.plist', function (err, enabledvalue, stderr) {
		//Log
		log("Read enabled value of: "+(enabledvalue.trim() != "0"));
		//If enabled
		enabled = (enabledvalue.trim() != "0") ? true : false;
		//run the cb
		cb();
	});
}

//Begin logging
log("Launched");

//Update the ecid value and launch
function updateECID(){
	//Using com.innoying.ecid execute ECID to get the hex ecid
	exec('ECID-CDevReporter', function (err, hexecid, stderr) {
		ecid = parseInt(hexecid, 16);
		log("Got ECID: "+ecid)
		//Check if the reported is enabled
	    updateEnabled(function(){
	    	//Log
	    	log("Launching.");
	    	fs.readdir(loc, function(err, files){
	    		files.forEach(function(file, index){
	    			files[index] = loc + file;
	    		});
				//Run handle function
				handleFiles(err, files, ecid);
				//Log
				log("Launched.");
			});
	    }); 
	});
}

//Multi-part form stuff----------------------------------------------------------------------------------------------
function EncodeFieldPart(boundary,name,value) {
    var return_part = "--" + boundary + "\r\n";
    return_part += "Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n";
    return_part += value + "\r\n";
    return return_part;
}

function EncodeFilePart(boundary,type,name,filename) {
    var return_part = "--" + boundary + "\r\n";
    return_part += "Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n";
    return_part += "Content-Type: " + type + "\r\n\r\n";
    return return_part;
}
//-------------------------------------------------------------------------------------------------------------------

//Pad numbers with zeros function
function pad(number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
    return str;
}

//Interval Check
setInterval(updateECID, 3600000);

//Handle the files
function handleFiles(err, files, ecid){
	if(!enabled){
		//Log
		log("Not continuing due to user disabling CDevReporter")
		//Exit
		return false;
	}
	//Log the number of files
	log( "Found " + files.length + " new file(s)." );
	//Create a boundary object
	var boundary = Math.random();
	//Create a request object
	var request = [];
	//Add ecid to request
	request.push(new Buffer(EncodeFieldPart(boundary, 'ecid', ecid+""), 'ascii'));
	//New files list without dirs
	var newfiles = [];
	//Loop for each file
	files.forEach(function (file, index) {
		if(fs.statSync(file).isFile()){
			//Add to newfiles
			newfiles.push(file);
	  		//Log
	  		log( "Found file " + file );
	  		//Gzip ALL THE FILES!!! (actually one at a time)
	  		zlib.gzip(fs.readFileSync(file), function(err, result){
	  			//Log
	  			log( "Gzipped " + file );
		  		//Create a temp array to hold the file data
		  		var temp = [];
	  			//Add to the form
	  			temp.push(new Buffer(EncodeFilePart(boundary, 'application/x-gzip', "file"+pad(index, 4), path.basename(file)+".gz"), 'ascii'));
	  			temp.push(result);
	  			temp.push(new Buffer("\r\n--" + boundary + "--\r\n", 'ascii'));
	  			//Add temp to the end of request
	  			request.push.apply(request, temp);
	  			//If this is the last 
	  			if(newfiles.length == ((request.length-1)/3)){
					//Log
	  				log("Attempting Upload");
	  				//Upload
	  				upload(request, boundary, newfiles);
	  			}
	  		});
		}
	});
}

//Upload function
function upload(request, boundary, files){
	//Create a length variable
	var length = 0;
	//For each part of the request array
  	for(var i = 0; i < request.length; i++) {
  		//Add the length to the total
    	length += request[i].length;
  	}
  	//Setup the post options
  	var post_options = {
    	host: 'battleground-fw2ckdbmqg.elasticbeanstalk.com',
    	port: '80',
    	path: '/upload.jsp',
    	method: 'POST',
    	headers : {
    	    'Content-Type' : 'multipart/form-data; boundary=' + boundary,
    	    'Content-Length' : length
    	}
  	};
  	//Create a post request
  	var post_request = http.request(post_options, function(response){
    	//Make sure this is utf8
    	response.setEncoding('utf8');
    	//Create a data var
    	var data = "";
    	//On data response
    	response.on('data', function(chunk){
    		//Append chunk to data
      		data += chunk;
    	});
    	//On the request ending
    	response.on('end', function(){
    		//If the upload was successful
    		if(response.statusCode == 200 && data.trim() == "SUCCESS"){
    			//Log
    			log("Success uploading " + files.length + " file(s).");
    			//For each file
    			files.forEach(function(file){
    				log("Deleting "+file);
    				//Delete the file
    				fs.unlink(file);
    			});
    			log("Done. Sleeping.");
    		}else{
    			//Display the errors
    			log("Error uploading the server replied:");
      			log(data);
      			log("With status code: " + response.statusCode)
      		}
    	});
  	});
  	//Add error catch and log
  	post_request.on('error', function(e) {
  		log('problem with request: ' + e.message);
	});
  	//For each part of the request
  	for (var i = 0; i < request.length; i++) {
  		//Send it
  	  	post_request.write(request[i]);
  	}
  	//End the post
  	post_request.end();
}

//Log function
function log(string){
	string = string + "";
	if(DEBUG == true){
		console.log(string);
	}
}

//Start
updateECID();

//Catch errors
process.on('uncaughtException', function (exception) {
   	console.log(exception);
});
