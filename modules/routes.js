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

var account = require("./accounts"),
		getIP = require("./acquire-ip");

var User = db.collection("users"),
		Pending = db.collection("pending"),
		Sess = db.collection("sessions"),
		Room = db.collection("rooms"),
		Chat = db.collection("chatOptions");
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

//start db for routes
db.open(function(err, db) {
	if(err) throw err;

	// GET requests
	app
		.get('/', function(req, res, next) {
			var session = req.cookies["sessId"] || "";
			var IP = getIP.getIP2();
			
			Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$in" : [IP] } }, function(chatQErr, chatQDoc) {
				if(chatQErr) throw chatQErr;

				if(!chatQDoc) {
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
				} else {
					res.redirect("/banned/ip");
				}
			});
		})
		.get("/login", function(req, res, next) {
			var session = req.cookies["sessId"] || "";
			var IP = getIP.getIP2();
			
			Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$in" : [IP] } }, function(chatQErr, chatQDoc) {
				if(chatQErr) throw chatQErr;

				if(!chatQDoc) {
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
				} else {
					res.redirect("/banned/ip");
				}
			});
		})
		.get("/signup", function(req, res, next) {
			var session = req.cookies["sessId"] || "";
			var IP = getIP.getIP2();
			
			Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$in" : [IP] } }, function(chatQErr, chatQDoc) {
				if(chatQErr) throw chatQErr;

				if(!chatQDoc) {
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
				} else {
					res.redirect("/banned/ip");
				}
			});
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
			var IP = getIP.getIP2();
			
			Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$in" : [IP] } }, function(chatQErr, chatQDoc) {
				if(chatQErr) throw chatQErr;

				if(!chatQDoc) {
					console.log("ip is not banned");

					if(session) {
			      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
			        if(sessQErr) throw sessQErr;

			        if(sessQDoc) {
			          User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
			            if(err2) throw err2;

			            if(userQDoc) {
			            	// key variables needed before rendering the page
			            	var keyVars = {
			            		"rooms": null,
			            		"users": null,
			            		"bannedWords": null,
			            		"bannedAddrs": null
			            	};
			            	// options for handling chat
			            	var chatOptions = [{
			            		"wordBans": true,
			            		"name": "Banned Words"
			            	},
			            	{
			            		"addresses": true,
			            		"name": "Banned IP Addresses"
			            	}];
			            	// check a given object of variables
			            	var checkVars = function(obj) {
			            		var clear = true;
			            		for(var key in obj) {
			            			if(!keyVars[key]) {
			            				clear = false;
			            				//console.log(obj);
			            			}
			            		}
			            		if(clear) {
			            			//console.log(obj);
			            			var dest = (userQDoc.accessLevel === "admin") ? "admin-chat" : "chat";

			            			//console.log(keyVars);

				  							res.render(dest, { "title" : "GCC Admin Panel", "username" : userQDoc.usernameFull, "accessLevel" : (userQDoc.accessLevel.replace(/\s/gi, "-")), "room" : "", "disable" : "disabled", "rooms" : keyVars.rooms, "bannedWords" : keyVars.bannedWords, "bannedAddrs" : keyVars.bannedAddrs, "users" : keyVars.users, "chatOptions" : chatOptions });
			            		}
			            	}

			            	Room.find({}).toArray(function(roomQErr, roomQDoc) {
			            		if(roomQErr) throw roomQErr;

			            		if(roomQDoc) {
			            			keyVars.rooms = roomQDoc;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.rooms = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	User.find({ "accessLevel" : { "$in" : [ "regular", "teen mod", "junior mod", "moderator" ] } }).toArray(function(userQErr, userQDoc) {
			            		if(userQErr) throw userQErr;

			            		if(userQDoc) {
			            			keyVars.users = userQDoc;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.users = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	Chat.findOne({ "optionName" : "bannedWords" }, function(chatQErr, chatQDoc) {
			            		if(chatQErr) throw chatQErr;

			            		//console.log(chatQDoc)
			            		if(chatQDoc) {
			            			keyVars.bannedWords = chatQDoc.list;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.bannedWords = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	Chat.findOne({ "optionName" : "bannedAddrs" }, function(chatQErr, chatQDoc) {
			            		if(chatQErr) throw chatQErr;

			            		//console.log(chatQDoc)
			            		if(chatQDoc) {
			            			keyVars.bannedAddrs = chatQDoc.list;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.bannedAddrs = [];
			            			checkVars(keyVars);
			            		}
			            	});

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
				} else {
					res.redirect("/banned/ip");
				}
			});
		})
		.get('/admin-chat', function(req, res, next) {
			var session = req.cookies["sessId"] || "";
			var IP = getIP.getIP2();

			Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$in" : [IP] } }, function(chatQErr, chatQDoc) {
				if(chatQErr) throw chatQErr;

				if(!chatQDoc) {
					if(session) {
			      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
			        if(sessQErr) throw sessQErr;

			        if(sessQDoc) {
			          User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
			            if(userQErr) throw userQErr;

			            if(userQDoc) {
			            	// key variables needed before rendering the page
			            	var keyVars = {
			            		"rooms": null,
			            		"users": null,
			            		"bannedWords": null,
			            		"bannedAddrs": null
			            	};
			            	// options for handling chat
			            	var chatOptions = [{
			            		"wordBans": true,
			            		"name": "Banned Words"
			            	},
			            	{
			            		"addresses": true,
			            		"name": "Banned IP Addresses"
			            	}];
			            	// check a given object of variables
			            	var checkVars = function(obj) {
			            		var clear = true;
			            		for(var key in obj) {
			            			if(!keyVars[key]) {
			            				clear = false;
			            				//console.log(obj);
			            			}
			            		}
			            		if(clear) {
			            			//console.log(obj);
			            			var dest = (userQDoc.accessLevel === "admin") ? "admin-chat" : "chat";

				  							res.render(dest, { "title" : "GCC Admin Panel", "username" : userQDoc.usernameFull, "room" : "", "disable" : "disabled", "rooms" : keyVars.rooms, "bannedWords" : keyVars.bannedWords, "bannedAddrs" : keyVars.bannedAddrs, "users" : keyVars.users, "chatOptions" : chatOptions });
			            		}
			            	}

			            	Room.find({}).toArray(function(roomQErr, roomQDoc) {
			            		if(roomQErr) throw roomQErr;

			            		if(roomQDoc) {
			            			keyVars.rooms = roomQDoc;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.rooms = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	User.find({ "accessLevel" : { "$in" : [ "regular", "teen mod", "junior mod", "moderator" ] } }).toArray(function(userQErr, userQDoc) {
			            		if(userQErr) throw userQErr;

			            		if(userQDoc) {
			            			keyVars.users = userQDoc;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.users = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	Chat.findOne({ "optionName" : "bannedWords" }, function(chatQErr, chatQDoc) {
			            		if(chatQErr) throw chatQErr;

			            		//console.log(chatQDoc)
			            		if(chatQDoc) {
			            			keyVars.bannedWords = chatQDoc.list;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.bannedWords = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	Chat.findOne({ "optionName" : "bannedAddrs" }, function(chatQErr, chatQDoc) {
			            		if(chatQErr) throw chatQErr;

			            		//console.log(chatQDoc)
			            		if(chatQDoc) {
			            			keyVars.bannedAddrs = chatQDoc.list;
			            			checkVars(keyVars);
			            		} else {
			            			keyVars.bannedAddrs = [];
			            			checkVars(keyVars);
			            		}
			            	});
			            	/*
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
			            	*/

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
										/*
										var chatOptions = [{
			            		"bannedWords": true,
			            		"name": "Banned Words"
			            	}];
										*/
										/*
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
										*/

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
				} else {
					res.redirect("/banned/ip");
				}
			});
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
		.get('/banned/:type', function(req, res, next) {
			var type = req.params.type.toUpperCase();

			res.status(404).send("Your " + type + " has been banned. Contact the administrator directly to resolve this issue.");
		})
		.get("*", function(req, res, next) {
			res.send("Error 404: page not found");
			var IP = getIP.getIP2();
			//console.log(IP, typeof IP);
			var session = req.cookies["sessId"] || "";
			
			if(session) {
	      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
	        if(sessQErr) throw sessQErr;

	        if(sessQDoc) {
						User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
	            if(err2) throw err2;

	            if(userQDoc) {
	            	User.update({ "username" : userQDoc.username }, { "$set" : { "currentIp" : IP } });

	            } else {
	            	console.log("user not present. no file write");
	            }
	          });
	        } else {
	        	console.log("sessiion not present. no file write");
	        }
	      });
			} else {
				console.log("session cookie not present. no file write");
			}
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
			
			var roomname = req.body.roomname || "",
					roomnameHyph = req.body.roomname.replace(/\s/g, "-").toLowerCase(),
					originalName = req.body.originalName || "",
					originalNameHyph = req.body.originalName.replace(/\s/g, "-").toLowerCase() || "",
					minMods = req.body.minmods,
					topic = req.body.topic || "nothing",
					op = req.body.op || false;

			if(roomname) {
				var sendRes = function() {
					res.status(200).send({
						"msg": "success",
						"action": "callback",
						"callback": "updateRooms",
						"data": {
							"roomname": roomname,
							"originalName": originalName,
							"minMods": minMods,
							"topic": topic
						},
						"op": op
					});
				};
				
				if(!op) {
					Room.update({ "roomnameHyph" : originalNameHyph }, { "roomname" : roomname, "roomnameHyph" : roomnameHyph, "minMods" : minMods, "topic" : topic }, { "upsert" : true }, function(roomQErr, roomQDoc) {
						if(err) throw err;

						if(roomQDoc && roomQDoc.result.ok) {
							sendRes();
						}
					});
				} else {
					Room.remove({ "roomnameHyph" : roomnameHyph }, function(roomQErr, roomQDoc) {
						if(err) throw err;

						if(roomQDoc && roomQDoc.result.ok) {
							sendRes();
						}
					});
				}

			} else {
				res.status(417).send("Unacceptable room name");
			}
		})
		.post("/update-banned", function(req, res, next) {
			console.log("update banned words function")
			console.log(req.body);
			
			var word = req.body.word || "",
					op = req.body.op || "$push";

			if(word) {
				var updateObj = {};
				updateObj[op] = { "list" : word } 

				Chat.update({ "optionName" : "bannedWords" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
					if(chatQErr) throw chatQErr;

					if(chatQDoc && chatQDoc.result.ok) {
						res.status(200).send({
							"msg": "success",
							"action": "callback",
							"callback": "updateBannedWords",
							"data": word,
							"op": op
						});
					}
				});

			} else {
				res.status(417).send("Unacceptable room name");
			}
		})
		.post("/update-ips", function(req, res, next) {
			console.log("update banned IPs function")
			console.log(req.body);

			var ip = req.body.ip || [],
					op = req.body.op || "$push";

			console.log(ip, typeof ip);
			if(typeof ip === "object") {
				for(var key in req.body) {
					if(key.match(/addr[1-4]/)) {
						if(!req.body[key]) {
							console.log("issue", req.body[key]);
							ip = "";
							return;
						} else
						ip.push(req.body[key]);
					}
				}
				ip = ip.join(".");
			}
			console.log("IP address: ", ip, typeof ip);
			if(ip) {
				var updateObj = {};
				updateObj[op] = { "list" : ip } 


				Chat.update({ "optionName" : "bannedAddrs" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
					if(chatQErr) throw chatQErr;

					if(chatQDoc && chatQDoc.result.ok) {
						res.status(200).send({
							"msg": "success",
							"action": "callback",
							"callback": "updateBannedAddrs",
							"data": ip,
							"op": op
						});
					}
				});

			} else {
				res.status(417).send("Unacceptable IP address name");
			}
		})
		;
});	
module.exports = app;