var fs = require("fs");

function cleanHosts(){
	var hosts = fs.readFileSync('/etc/hosts');
	//Trim the excess newlines
  	hosts = (hosts.toString()).trim();
  	//Split into newlines
  	hosts = hosts.split("\n");
  	//If it has seen the CDevReporter tag
  	var sawtag = false;
  	//The new hosts file
	var newhosts = "";
	//For each hosts line
	hosts.forEach(function(value, index) {
		//If it hasn't seen the tag
      	if(!sawtag){
       		//If it see's the tag
       	    if(value.indexOf("#<CDevReporter>") == 0){
             	sawtag = true;
            }else{
                newhosts += value + "\n";
            }
      	}else{
        	//If it see's the end tag
            if(value.indexOf("#</CDevReporter>") == 0){
                sawtag = false;
            }
       	}
	});
	//Trim the new hosts
	newhosts = newhosts.trim();
	//Save the changes
	fs.writeFileSync('/etc/hosts', newhosts);
	//Log
  	console.log("hosts cleaned");
}

module.exports.clean = cleanHosts;