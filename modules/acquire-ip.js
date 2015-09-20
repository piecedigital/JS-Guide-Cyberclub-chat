console.log("required acquire-ip module\n\r");

var dns = require('dns'),
		os = require('os'),
		ifaces = os.networkInterfaces();

module.exports = {
	getIP: function() {
		var IP = "";
		dns.lookup(os.hostname(), function (err, add, fam) {
		  if(err) throw err;

		  console.log('addr: '+add);
		  IP = add;
		});
		return IP;
	},
	getIP2: function() {
		for(var key in ifaces) {
			var IP;
			ifaces[key].map(function(face) {
				if(face.family !== "IPv4" || face.internal !== false) {
					return; // http://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js
				}

				console.log(key, face.address);
				IP = face.address;
			});
			return IP;
		};
	},
	getIP3: function(req) {
		var IP = req.headers['x-forwarded-for'] || 
			     req.connection.remoteAddress || 
			     req.socket.remoteAddress ||
			     req.connection.socket.remoteAddress ||
			     "0.0.0.0";
		return IP;
	}
}