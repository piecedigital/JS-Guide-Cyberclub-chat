console.log("required routes module\r\n");

var app = require('express')(),
		fs = require("fs"),
		bcrypt = require("bcryptjs"),
		MongoClient  = require("mongodb"),
		ObjectId = require("mongodb").ObjectID,
		hb = require("hbs");

// mongodb config
var Server = MongoClient.Server,
Db = MongoClient.Db,
db = new Db("GCC-db", new Server("localhost", 27017));

var account = require("./accounts");

var User = db.collection("users"),
		Pending = db.collection("pending"),
		Sess = db.collection("sessions");
//sass compile
var sass = require('node-sass');
sass.render({
  file: "./private/sass/style.scss",
  outputStyle: "expanded",
  outFile: "./public/css/styl.css"
}, function(err, result) {
	if(err) throw err;

	//console.log(result.css.toString());
	fs.writeFile('./public/css/style.css', result.css.toString(), function (err) {
	  if (err) throw err;

	  console.log('CSS rendered and saved');
	});
});

// custom handlebars
hb.registerHelper('ifCond', function(v1, v2, options) {
  if(v1 === v2) {
    return options.fn(this);
  }
  return options.inverse(this);
});

//start db for routes
db.open(function(err, db) {
	if(err) throw err;

	// GET requests
	app
		.get('/', function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
	  				User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
							if(userQErr) throw userQErr;

							if(userQDoc) {
								res.redirect("/chat");
							} else {
								res.redirect("/signup");
							}
						});
	        } else {
	        	res.clearCookie("sessId");
	  				res.redirect('/login');
	        }
	      });
			} else {
				res.redirect('/signup');
			}
		})
		.get("/login", function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
						User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
							if(userQErr) throw userQErr;

							if(userQDoc) {
								var dest = (userQDoc.accessLevel === "admin") ? "/admin-chat" : "/chat";
								
								res.redirect(dest);
							} else {
								res.redirect("/signup");
							}
						});
	        } else {
	        	res.clearCookie("sessId");
						res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "", "log-checked" : "checked" });
	        }
	      });
			} else {
				res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "", "log-checked" : "checked" });
			}
		})
		.get("/signup", function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
						User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
	            if(err2) throw err2;

	            if(userQDoc) {
	            	var rooms = {
	            		"lobby": {
	            			"roomName": "Lobby",
	            			"users": [{
	            				"username": "user1"
	            			},
	            			{
	            				"username": "user2"
	            			},
	            			{
	            				"username": "user3"
	            			}]
	            		},
	            		"main": {
	            			"roomName": "Main",
	            			"users": [{
	            				"username": "user"
	            			}]
	            		}
	            	};

								var chatOptions = [{
	            		"name": "Emoticon"
	            	}];

	            	console.log(userQDoc);

	            	var dest = (userQDoc.accessLevel === "admin") ? "admin-chat" : "chat";

		  					res.render(dest, { "title" : "Guide Cyberclub Chat", "username" : userQDoc.usernameFull, "room" : "", "disable" : "disabled", "rooms" : rooms, "chatOptions" : chatOptions });

	            } else {
	            	res.clearCookie("sessId");
	        			res.redirect("/signup");
	            }
	          });
	        } else {
	        	res.clearCookie("sessId");
						res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "checked", "log-checked" : "" });
	        }
	      });
			} else {
				res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "checked", "log-checked" : "" });
			}
		})
		.get("/logout", function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
				Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
					if(sessQErr) throw sessQErr;

					if(sessQDoc) {
						Sess.remove({ "_id" : new ObjectId(session) });
						res.clearCookie("sessId");
						res.redirect("/");
					} else {
						res.clearCookie("sessId");
						res.redirect("/");
					}
				});
			} else {
				res.redirect("/");
			}
		})
		.get('/chat', function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
	          User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
	            if(err2) throw err2;

	            if(userQDoc) {
	            	var roomsToHave = ["lobby", "main"];
	            	var rooms = {
	            		"lobby": {
	            			"roomName": "Lobby",
	            			"minMods": 1,
	            			"topic": "Nothing",
	            			"users": [{
	            				"username": "user"
	            			}]
	            		},
	            		"main": {
	            			"roomName": "Main",
										"minMods": 2,
	            			"topic": "Nothing",
	            			"users": [{
	            				"username": "user"
	            			}]
	            		}
	            	}
	            	var arr = roomsToHave.map(function(elem) {
	            		return rooms[elem];
	            	});
	            	
	            	var dest = (userQDoc.accessLevel === "admin") ? "admin-chat" : "chat";
		  					res.render(dest, { "title" : "Guide Cyberclub Chat", "username" : userQDoc.usernameFull, "room" : "", "disable" : "disabled", "rooms" : rooms });

	            } else {
	        			res.redirect("/signup");
	            }
	          });
	        } else {
	        	res.clearCookie("sessId");
	        	res.redirect("/login");
	        }
	      });
			} else {
				res.redirect("/signup");
			}
		})
		.get('/admin-chat', function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
	          User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
	            if(userQErr) throw userQErr;

	            if(userQDoc) {
	            	var rooms = {
	            		"lobby": {
	            			"roomName": "Lobby",
	            			"minMods": 1,
	            			"topic": "Nothing",
	            			"users": [{
	            				"username": "user1"
	            			},
	            			{
	            				"username": "user2"
	            			},
	            			{
	            				"username": "user3"
	            			}]
	            		},
	            		"main": {
	            			"roomName": "Main",
	            			"minMods": 2,
	            			"topic": "Nothing",
	            			"users": [{
	            				"username": "user"
	            			}]
	            		}
	            	}

	            	/*
	            	var chatOptions = [{
	            		"emoticons": true,
	            		"name": "Emoticons",
	            		"items": [{
	            			"name": "smile",
	            			"path": "/",
	            			"stringMatch": [":)", ":smile:"]
	            		},
	            		{
	            			"name": "frown",
	            			"path": "/",
	            			"stringMatch": [":(", ":frown:"]
	            		}]
	            	},
	            	{
	            		"bannedWords": true,
	            		"name": "Banned Words",
	            		"items": ["fuck", "fucker", "fucking", "shitter", "shitting", "shit", "damnit", "damn it", "dammit", "cunt", "nig", "nigger", "asshole"]
	            	}];
								*/
								var chatOptions = [{
	            		"bannedWords": true,
	            		"name": "Banned Words",
	            		"items": ["fuck", "fucker", "fucking", "shitter", "shitting", "shit", "damn", "damnit", "damn it", "dammit", "cunt", "nig", "nigger", "asshole"]
	            	}];

	            	var users = [{
	            		"username": "user1",
	            		"color": "red",
	            		"accessLevel": "regular"
	            	},
	            	{
	            		"username": "user2",
	            		"color": "blue",
	            		"accessLevel": "regular"
	            	},
	            	{
	            		"username": "user3",
	            		"color": "green",
	            		"accessLevel": "regular"
	            	}]

	            	var dest = (userQDoc.accessLevel === "admin") ? "admin-chat" : "chat";

		  					res.render(dest, { "title" : "GCC Admin Panel", "username" : userQDoc.usernameFull, "room" : "", "disable" : "disabled", "rooms" : rooms, "chatOptions" : chatOptions, "users" : users });

	            } else {
	        			res.clearCookie("sessId");
	        			res.redirect("/signup");
	            }
	          });
	        } else {
	        	res.clearCookie("sessId");
	        	res.redirect("/login");
	        }
	      });
			} else {
				res.redirect("/signup");
			}
		})
		.get('/validate', function(req, res, next) {
			var key = req.query.key;
			console.log(key)

			if(key) {
	      Pending.findOne({ "validationId" : key }, function(pendQErr, pendQDoc) {
	      	if(pendQErr) throw pendQErr;

	      	if(pendQDoc) {
	      		var strippedDoc = {
	      			"email": pendQDoc.email,
              "username": pendQDoc.username,
              "usernameFull": pendQDoc.usernameFull,
              "password": pendQDoc.password,
              "created": pendQDoc.created,
              "accessLevel": pendQDoc.accessLevel
	      		};

	      		User.insert(strippedDoc, function(userQErr, userQDoc) {
	      			if(userQErr) throw userQErr;

	      			if(userQDoc) {
	      				Pending.remove({ "validationId" : key }, function(remQErr, remQDoc) {
	      					if(remQErr) throw remQErr;

	      					if(remQDoc) {
	      						res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"Account confirmed. Please login", "sign-checked" : "", "log-checked" : "checked" });
	      					}
	      				});
	      			}
	      		});
	      	} else {
	      		res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"Pending account could not be located.", "sign-checked" : "checked", "log-checked" : "" });
	      	}
	      });
			} else {
				res.redirect("/login");
			}
		})
		.get('/cancel', function(req, res, next) {
			var key = req.query.key;

			if(key) {
				Pending.remove({ "validationId" : key }, function(remQErr, remQDoc) {
					if(remQErr) throw remQErr;

					if(remQDoc) {
						res.render("signUpIn", { "title" : "Sign Up/Login", "msg" :"Account cancelled successfully.", "sign-checked" : "", "log-checked" : "checked" });
					}
				});
			} else {
				res.redirect("/login");
			}
		})
		.get('/logout', function(req, res, next) {
			var session = req.cookies["sessId"] || "";

			if(session) {
	      Sess.remove({ "_id" : new ObjectId(session) });
	      res.clearCookie("sessId");
	      res.redirect("/login");
			} else {
				res.redirect("/login");
			}
		})
		.get("*", function(req, res, next) {
			res.send("Error 404: page not found");
		});

	// POST requests
	app
	  //POST request for user signup
		.post("/signup", account(db).signup)
		//POST request for user logins
		.post("/login", account(db).login)
		//POST requests for admin panel
		.post("/adjust-user", account(db).updateUser)
		.post("/update-rooms", function(req, res, next) {
			console.log("update rooms function")
			console.log(req.body);
			if(!req.body.roomname) {
				res.status(417).send("Unacceptable room name")
			}
		})
		;
});	
module.exports = app;