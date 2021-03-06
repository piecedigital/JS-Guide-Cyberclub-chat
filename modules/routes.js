console.log("required routes module\r\n");

var serverOn = false;

var app = require('express')(),
		fs = require("fs"),
		bcrypt = require("bcryptjs"),
		MongoClient  = require("mongodb"),
		ObjectId = require("mongodb").ObjectID,
		hb = require("hbs");

var config = require("./config"),
		account = require("./accounts"),
		getIP = require("./acquire-ip"),
		csrf = require("csurf");

var csrfProtection = csrf({ cookie : true })

//sass compile
var sass = require('node-sass');
sass.render({
  file: "./private/sass/style.scss",
  outputStyle: "expanded",
  outFile: "./public/css/style.css"
}, function(err, result) {
	if(err) throw err;
	////console.log(result.css.toString());
	fs.writeFile('./public/css/style.css', result.css.toString(), function (err) {
	  if (err) throw err;

	  console.log('CSS rendered and saved\r\n');
	});
});

// mongodb config
 MongoClient.connect(config.mongolabURL
  , function(err, db) {
  	if(err) throw err;

		var User = db.collection("users"),
				Pending = db.collection("pending"),
				Sess = db.collection("sessions"),
				Room = db.collection("rooms"),
				Chat = db.collection("chatOptions");

		// clears the users in rooms on server start
		Room.update({}, { "$set" : { "users" : [] } }, { "multi" : true });
		Sess.remove({}, { "multi" : true });
		var hour = 60 * 60;
		//Sess.log_events.createIndex({ "creationTime" : 1 }, { "expiresAfterSeconds" : hour });

	  var getRouteByAccess = function(userQDoc, slash) {
	  	slash = slash || "";
	    return slash + ( (userQDoc.accessLevel === "master" || userQDoc.accessLevel === "moderator" || userQDoc.accessLevel === "admin") ? "admin-chat" : "chat" );
	  };
		//////////////////////
		//// GET requests ////
		//////////////////////
		app
			.get(/\/.*/, function(req, res, next) {
				var IP = getIP.getIP3(req);
				// console.log("req ip", IP);
				// console.log(req.headers)
				// console.log(IP, typeof IP);
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
		            if(err2) throw err2;

		            if(userQDoc) {
		            	User.update({ "username" : userQDoc.username }, { "$set" : { "currentIp" : IP || "0.0.0.0" } });

		            } else {
		            	//console.log("user not present. no file write");
		            }
		          });
		        } else {
		        	//console.log("sessiion not present. no file write");
		        }
		      });
				} else {
					//console.log("session cookie not present. no file write");
				}
				Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$elemMatch" : { "ip" : IP } } }, function(chatQErr, chatQDoc) {
					if(chatQErr) throw chatQErr;

					if(!chatQDoc) {
						// console.log(req.headers.host)
						res.setHeader("X-Frame-Options", ["ALLOW-FROM", `http://${req.headers.host}`]);
						next();
					} else {
						if(!req.originalUrl.match(/\/banned\/ip/)) {
							res.redirect("banned/ip");
						} else {
							// console.log(req.headers.host)
							res.setHeader("X-Frame-Options", ["ALLOW-FROM", `http://${req.headers.host}`]);
							next();
						}
					}
				});
			})
			.get('/', function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
		  				User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
								if(userQErr) throw userQErr;

								if(userQDoc) {
									var dest = getRouteByAccess(userQDoc, "/");

									res.redirect(dest);
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
			.get("/login", csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
								if(userQErr) throw userQErr;

								if(userQDoc) {
									if(!userQDoc.banned) {
										var dest = getRouteByAccess(userQDoc, "/");

										res.redirect(dest);
									} else {
										res.redirect('/banned/account/' + userQDoc.usernameFull)
									}
								} else {
									res.redirect("/signup");
								}
							});
		        } else {
		        	res.clearCookie("sessId");
							res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
		        }
		      });
				} else {
					res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
				}
			})
			.get("/signup", csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
		            if(err2) throw err2;

		            if(userQDoc) {
		            	//console.log(userQDoc);
		            	if(!userQDoc.banned) {
			            	var dest = getRouteByAccess(userQDoc, "/");

				  					res.redirect(dest);
		            	} else {
		            		res.redirect('/banned/account/' + userQDoc.usernameFull)
		            	}
		            } else {
		            	res.clearCookie("sessId");
		        			res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
		            }
		          });
		        } else {
		        	res.clearCookie("sessId");
							res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
		        }
		      });
				} else {
					res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
				}
			})
			.get("/add-names", csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
								if(userQErr) throw userQErr;

								if(userQDoc) {
									if(!userQDoc.banned) {
                    if(!userQDoc.firstName && !userQDoc.lastName) {
											res.render("add-names", { "title" : "Add first and last name", "msg" :"", csrfToken : req.csrfToken() });
                    } else {
                    	var dest = getRouteByAccess(userQDoc, "/");

											res.redirect(dest);
                    }

									} else {
										res.redirect('/banned/account/' + userQDoc.usernameFull)
									}
								} else {
									res.redirect("/signup");
								}
							});
		        } else {
		        	res.clearCookie("sessId");
							res.render("signupin", { "title" : "Sign Up/Login", "msg" :"", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
		        }
		      });
				} else {
					res.redirect("/signup");
				}
			})
			.get("/admin-signup", csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
		            if(err2) throw err2;

		            if(userQDoc) {
		            	//console.log(userQDoc);
		            	if(!userQDoc.banned) {
			            	var dest = getRouteByAccess(userQDoc, "/");

				  					res.redirect(dest);
		            	} else {
		            		res.redirect('/banned/account/' + userQDoc.usernameFull)
		            	}
		            } else {
		            	res.clearCookie("sessId");
		        			res.redirect("/admin-signup");
		            }
		          });
		        } else {
		        	res.clearCookie("sessId");
							res.render("admin-signup", { "title" : "Admin Sign Up", "msg" : "", csrfToken : req.csrfToken() });
		        }
		      });
				} else {
					res.render("admin-signup", { "title" : "Admin Sign Up", "msg" : "", csrfToken : req.csrfToken() });
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
			.get('/admin-chat', function(req, res, next) {
				res.redirect("/chat");
			})
			.get('/chat', csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
		          User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
		            if(err2) throw err2;

		            if(userQDoc) {
		            	if(!userQDoc.banned) {
            				if(!serverOn && (userQDoc.accessLevel !== "master" && userQDoc.accessLevel !== "admin" && userQDoc.accessLevel !== "moderator")) {
		            			res.render("offline", {});
		            		} else {
				            	// key variables needed before rendering the page
				            	var keyVars = {
				            		"rooms": null,
				            		"users": null,
				            		"bannedEmotes": null,
				            		"bannedWords": null,
				            		"bannedAddrs": null,
				            		"levelColors": null,
				            		"recommendedEmotes": null
				            	};
				            	// options for handling chat
				            	var chatOptions = [
					            	{
					            		"wordBans": true,
					            		"name": "Banned Words"
					            	},
					            	{
					            		"emoteBans": true,
					            		"name": "Banned Emotes"
					            	},
					            	{
					            		"emoteRecs": true,
					            		"name": "Recommended Emotes"
					            	},
					            	{
					            		"addresses": true,
					            		"name": "Banned IP Addresses"
					            	},
					            	{
					            		"levelColors": true,
					            		"name": "Access Level Colors"
					            	},
					            	{
					            		"chatStatus": true,
					            		"name": "Chat Status",
					            		"status": serverOn
					            	}
				            	];
				            	// check a given object of variables
				            	var checkVars = function(obj) {
				            		var clear = true;
				            		for(var key in obj) {
				            			if(!keyVars[key]) {
				            				clear = false;
				            				////console.log(obj);
				            			}
				            		}
				            		if(clear) {
				            			////console.log(obj);
				            			//console.log(userQDoc);

				            			//console.log(keyVars);
				            			var dest = getRouteByAccess(userQDoc);

					            		res.render(dest, { "title" : "GCC Admin Panel", "room" : "", "disable" : "disabled", "rooms" : keyVars.rooms, "bannedEmotes" : keyVars.bannedEmotes, "recommendedEmotes" : keyVars.recommendedEmotes, "bannedWords" : keyVars.bannedWords, "bannedAddrs" : keyVars.bannedAddrs, "users" : keyVars.users, "levelColors" : keyVars.levelColors, "chatOptions" : chatOptions, csrfToken : req.csrfToken() });
					            		chatOptions = null;
					            		keyVars = null;
				            		}
				            	}

				            	// pull data for rooms
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
				            	// pull data for users for the admin
				            	User.find({ "username" : { "$not" : { "$eq" : userQDoc.username } } }).toArray(function(userQErr, userQDoc) {
				            		if(userQErr) throw userQErr;

				            		if(userQDoc) {
				            			keyVars.users = userQDoc;
				            			checkVars(keyVars);
				            		} else {
				            			keyVars.users = [];
				            			checkVars(keyVars);
				            		}
				            	});
				            	// pull data for access level color indicators
				            	Chat.findOne({ "optionName" : "levelColors" }, function(chatQErr, chatQDoc) {
				            		if(chatQErr) throw chatQErr;

				            		////console.log(chatQDoc)
				            		if(chatQDoc) {
				            			keyVars.levelColors = chatQDoc.list;
				            			checkVars(keyVars);
				            		} else {
				            			keyVars.levelColors = {};
				            			checkVars(keyVars);
				            		}
				            	});
				            	// pull data from db and populate only if admin or mod
				            	if(userQDoc.accessLevel === "master" || userQDoc.accessLevel === "admin" || userQDoc.accessLevel === "moderator") {
					            	// pull data for banned emotes
					            	Chat.findOne({ "optionName" : "bannedEmotes" }, function(chatQErr, chatQDoc) {
					            		if(chatQErr) throw chatQErr;

					            		////console.log(chatQDoc)
					            		if(chatQDoc) {
					            			keyVars.bannedEmotes = chatQDoc.list;
					            			checkVars(keyVars);
					            		} else {
					            			keyVars.bannedEmotes = [];
					            			checkVars(keyVars);
					            		}
					            	});
					            	// pull data for recommended emotes
					            	Chat.findOne({ "optionName" : "recommendedEmotes" }, function(chatQErr, chatQDoc) {
					            		if(chatQErr) throw chatQErr;

					            		////console.log(chatQDoc)
					            		if(chatQDoc) {
					            			keyVars.recommendedEmotes = chatQDoc.list;
					            			checkVars(keyVars);
					            		} else {
					            			keyVars.recommendedEmotes = [];
					            			checkVars(keyVars);
					            		}
					            	});
					            	// pull data for banned words and phrases
					            	Chat.findOne({ "optionName" : "bannedWords" }, function(chatQErr, chatQDoc) {
					            		if(chatQErr) throw chatQErr;

					            		////console.log(chatQDoc)
					            		if(chatQDoc) {
					            			keyVars.bannedWords = chatQDoc.list;
					            			checkVars(keyVars);
					            		} else {
					            			keyVars.bannedWords = [];
					            			checkVars(keyVars);
					            		}
					            	});
												// pull data for banned IP addresses
					            	Chat.findOne({ "optionName" : "bannedAddrs" }, function(chatQErr, chatQDoc) {
					            		if(chatQErr) throw chatQErr;

					            		////console.log(chatQDoc)
					            		if(chatQDoc) {
					            			keyVars.bannedAddrs = chatQDoc.list;
					            			checkVars(keyVars);
					            		} else {
					            			keyVars.bannedAddrs = [];
					            			checkVars(keyVars);
					            		}
					            	});
				            	} else {
				            		// ... otherwise, set empty but positive values
				            		keyVars.bannedEmotes = [];
												keyVars.recommendedEmotes = [];
												keyVars.bannedWords = [];
												keyVars.bannedAddrs = [];
			            			checkVars(keyVars);
				            	}
		            		}
		            	} else {
		            		res.clearCookie("sessId");
		        				res.redirect('/banned/account/' + userQDoc.usernameFull);
		            	}
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
			.get('/validate', csrfProtection, function(req, res, next) {
				var key = req.query.key;
				//console.log(key)

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

	      						res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Account confirmed. Please login", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
		      				});
		      			}
		      		});
		      	} else {
		      		res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Pending account could not be located.", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
		      	}
		      });
				} else {
					res.redirect("/login");
				}
			})
			.get("/request-pass", csrfProtection, function(req, res, next) {
				var session = req.cookies["sessId"] || "";

				if(session) {
		      Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
		        if(sessQErr) throw sessQErr;

		        if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
								if(userQErr) throw userQErr;

								if(userQDoc) {
									if(!userQDoc.banned) {
										var dest = getRouteByAccess(userQDoc, "/");

										res.redirect(dest);
									} else {
										res.redirect('/banned/account/' + userQDoc.usernameFull)
									}
								} else {
									res.render("request-pass", { "title" : "Request password change", csrfToken : req.csrfToken() });
								}
							});
		        } else {
		        	res.clearCookie("sessId");
							res.render("request-pass", { "title" : "Request password change", csrfToken : req.csrfToken() });
		        }
		      });
				} else {
					res.render("request-pass", { "title" : "Request password change", csrfToken : req.csrfToken() });
				}
			})
			.get("/change-pass", csrfProtection, function(req, res, next) {
				var key = req.query.key;
	      //console.log(key)

	      if(key) {
	        Pending.findOne({ "validationId" : key }, function(pendQErr, pendQDoc) {
	          if(pendQErr) throw pendQErr;

	          if(pendQDoc) {
	            res.render("change-pass", { "title" : "Change your password", "key" : key, csrfToken : req.csrfToken() });
	          } else {
	            res.redirect("/login");
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
							res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Account cancelled successfully.", "sign-checked" : "", "log-checked" : "checked" });
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
			.get('/banned/account/:user', function(req, res, next) {
				var username = req.params.user;

				User.findOne({ 'usernameFull' : username }, function(userQErr, userQDoc) {
					if(userQErr) throw userQErr;

					if(userQDoc) {
						if(userQDoc.banned) {
							res.clearCookie("sessId");
							res.status(200).send('Your account ' + username + ' has been banned.<br><br>Reason: ' + userQDoc.banned + '.<br><br>Contact the administrator directly to resolve this issue.<br><br><a href="http://guidemagazine.org">Go to Guide Magazine</a><br><br><a href="/">return Home</a>');
						} else {
							res.redirect('/');
						}
					} else {
						res.clearCookie("sessId");
						res.redirect('/');
					}
				})
			})
			.get('/banned/ip', function(req, res, next) {
				var IP = getIP.getIP3(req);

				Chat.findOne({ 'optionName' : 'bannedAddrs', 'list' : { '$elemMatch' : { 'ip' : IP } } }, { 'list' : { '$elemMatch' : { 'ip' : IP } } }, function(chatQErr, chatQDoc) {
					if(chatQErr) throw chatQErr;

					if(chatQDoc) {
						var ipData = chatQDoc.list[0];

						res.clearCookie("sessId");
						res.status(200).send('Your IP has been banned.<br><br>Reason: ' + ipData.reason + '<br><br>This type of ban is due to a very serious offense.<br><br>Contact the administrator directly to resolve this issue.<br><br><a href="http://guidemagazine.org">Go to Guide Magazine</a><br><br><a href="/">return Home</a>');
					} else {
						res.redirect("/");
					}
				});
			})
			.get('/tracker', function(req, res) {
				res.status(200).send('pixel tracker');
				console.log('PIXEL TRACKER WORKED!')
			})
			.get('/app-check', function(req, res) {
				res.status(200).send({"message" : "Server is online"});
			})
			.get('/chat-status', function(req, res) {
				if(serverOn) {
					res.status(200).send({"message" : "Server is online"});
				} else {
					res.status(400).send({"message" : "Server is offline"});
				};
			})
			.get("/downloads", function(req, res, next) {
				res.render("downloads", { "title" : "Download the desktop client for your system of choice" });
			})
			.get('*', function(req, res, next) {
	      res.render("error", { error: 404, message: "Page Not Found" });
			})
			;

		///////////////////////
		//// POST requests ////
		///////////////////////
		app
			.post("/update-server", csrfProtection, function(req, res, next) {
				var status = req.body.status.toLowerCase();

				if(status === "online") {
					serverOn = true;
					res.status(200).send({
						"msg": "success"
					})

					return false;
				}
				if(status === "offline") {
					serverOn = false;
					res.status(200).send({
						"msg": "success",
						"action": "callback",
						"callback": "kickRegs",
						"data": "kick regular users",
						"op": "kick regular users"
					})

					return false;
				}

				res.status(404).send("Error setting the chat status");
				console.log("Possibly a tempered form");
			})
			.post("/signup", csrfProtection, account(db).signup)
			.post("/admin-signup", csrfProtection, account(db, true).signup)
			.post("/login", csrfProtection, account(db).login)
			.post("/add-names", csrfProtection, account(db).addNames)
			.post("/request-pass", csrfProtection, account(db).requestPass)
			.post("/update-pass", csrfProtection, account(db).updatePass)
			.post("/adjust-user", csrfProtection, account(db).updateUser)
			.post("/query-user", csrfProtection, account(db).queryUser)
			.post("/populate-users", csrfProtection, function(req, res, next) {
				Room.find({}, { "_id" : 0, "roomname" : 1, "users" : 1 }).toArray(function(roomQErr, roomQDoc) {
      		if(roomQErr) throw roomQErr;

      		if(roomQDoc) {
      			console.log(roomQDoc);

      			res.status(200).send({
      				"msg": "success",
      				"data": roomQDoc
      			})
      		} else {
      			res.status(417).send("Error");
      		}
      	});
			})
			.post("/get-app-data", csrfProtection, function(req, res, next) {
				var request = req.body.request || "";

				var requests = {
					emotes: function() {
						// pull data for recommended emotes
          	Chat.findOne({ "optionName" : "recommendedEmotes" }, function(chatQErr, chatQDoc) {
          		if(chatQErr) throw chatQErr;

          		if(chatQDoc) {
          			res.status(200).send({
          				"data": chatQDoc.list
          			});
          		} else {
          			res.status(204).send({
          				"msg": "Collection doesn't exist. Can create.",
          				"data": []
          			});
          		}
          	});
					}
				}

				requests[request]();
			})
			.post("/update-rooms", csrfProtection, function(req, res, next) {
				//console.log("update rooms function")
				//console.log(req.body);

				var roomname = req.body.roomname || "",
						roomnameHyph = req.body.roomname.replace(/\s/g, "-").toLowerCase(),
						originalName = req.body.originalName || "",
						originalNameHyph = req.body.originalName.replace(/\s/g, "-").toLowerCase() || "",
						minMods = req.body.minmods,
						topic = req.body.topic || "nothing",
						op = req.body.op || false;

				if(roomname && !roomname.match(/^(door)$/i) && roomname.match(/[a-z0-9\s]*/gi) && !roomname.match(/^[\s]*$/gi)) {

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
						Room.update({ "roomnameHyph" : originalNameHyph }, { "$set" : { "roomname" : roomname, "roomnameHyph" : roomnameHyph, "minMods" : minMods, "topic" : topic } }, { "upsert" : true }, function(roomQErr, roomQDoc) {
							if(err) throw err;

							if(roomQDoc && roomQDoc.result.ok) {
								sendRes();
							}
						});
					} else {
						Room.remove({ "roomnameHyph" : originalNameHyph }, function(roomQErr, roomQDoc) {
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
			.post("/update-emotes", csrfProtection, function(req, res, next) {
				//console.log("update banned words function")
				//console.log(req.body);

				var emote = req.body.emote || "",
						op = req.body.op || "$push";

				if(emote) {
					emote = emote.replace(/[:]/gi, "");
					emote = ":" + emote + ":";

					var updateObj = {
					};
					updateObj[op] = { "list" : emote }



					Chat.update({ "optionName" : "bannedEmotes" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
						if(chatQErr) throw chatQErr;

						if(chatQDoc && chatQDoc.result.ok) {
							res.status(200).send({
								"msg": "success",
								"action": "callback",
								"callback": "updateBannedEmotes",
								"data": emote,
								"op": op
							});
						}
					});

				} else {
					res.status(417).send("Unacceptable emote keyword");
				}
			})
			.post("/update-recommended-emotes", csrfProtection, function(req, res, next) {
				var emote = req.body.emote || "",
						op = req.body.op || "$push";

				if(emote) {
					emote = emote.replace(/[:]/gi, "");
					emote = ":" + emote + ":";

					var updateObj = {
					};
					updateObj[op] = { "list" : emote }



					Chat.update({ "optionName" : "recommendedEmotes" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
						if(chatQErr) throw chatQErr;

						if(chatQDoc && chatQDoc.result.ok) {
							res.status(200).send({
								"msg": "success",
								"action": "callback",
								"callback": "updateRecommendedEmotes",
								"data": emote,
								"op": op
							});
						}
					});

				} else {
					res.status(417).send("Unacceptable emote keyword");
				}
			})
			.post("/update-banned", csrfProtection, function(req, res, next) {
				//console.log("update banned words function")
				//console.log(req.body);

				var word = req.body.word || "",
						op = req.body.op || "$push";

				if(word) {
					var updateObj = {
					};
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
			.post("/update-ips", csrfProtection, function(req, res, next) {
				//console.log("update banned IPs function")
				//console.log(req.body);

				var ip = req.body.ip || [],
						op = req.body.op || "$push",
						reason = req.body.reason || "The activty from this connection exhibited an inordinate degree of offenses.";

				//console.log(ip, typeof ip);
				if(typeof ip === "object") {
					for(var key in req.body) {
						if(key.match(/addr[1-4]/)) {
							if(!req.body[key]) {
								//console.log("issue", req.body[key]);
								ip = "";
								return;
							} else
							ip.push(req.body[key]);
						}
					}
					ip = ip.join(".");
				}
				//console.log("IP address: ", ip, typeof ip);

				if(ip) {
					var banIp = function() {
						var updateObj = {
						};
						updateObj[op] = { "list" : { "ip" : ip } }
						if(op === "$push") {
							updateObj[op].list.reason = reason;
						}

						Chat.update({ "optionName" : "bannedAddrs" }, updateObj, { "multi" : true, "upsert" : true }, function(chatQErr, chatQDoc) {
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
					}
					if(op === "$push"){
						Chat.findOne({ "optionName" : "bannedAddrs", "list" : { "$elemMatch" : { "ip" : ip } } }, function(chatQErr, chatQDoc) {
							if(chatQErr) throw chatQErr;

							if(chatQDoc) {
								res.status(417).send("IP is already banned");
							} else {
								banIp();
							}
						});
					} else {
						banIp();
					}
				} else {
					res.status(417).send("Unacceptable IP address name");
				}
			})
			.post("/update-colors", csrfProtection, function(req, res, next) {
				//console.log("update user colors function")
				//console.log(req.body);

				var regCol = req.body.regularColor || "grey",
						teenCol = req.body.teenModColor || "#00c800",
						junCol = req.body.juniorModColor || "orange",
						modCol = req.body.moderatorColor || "blue",
						adCol = req.body.adminColor || "red";
				colorsObj = {
					"regular": regCol,
					"teenMod": teenCol,
					"juniorMod": junCol,
					"moderator": modCol,
					"admin": adCol
				}
				updateObj = {
					"$set": {
						"optionName": "levelColors",
						"list": colorsObj
					}
				};

				Chat.update({ "optionName" : "levelColors" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
					if(chatQErr) throw chatQErr;

					if(chatQDoc && chatQDoc.result.ok) {
						res.status(200).send({
							"msg": "success",
							"action": "callback",
							"callback": "updateColors",
							"data": colorsObj,
							"op": "update"
						});
					}
				});
			})
			.post("/pm/:initiator/:receiver", csrfProtection, function(req, res, next) {
				var room = req.params.initiator + req.params.receiver;
				var session = req.cookies["sessId"] || "";

				if(session) {
					Sess.findOne({ "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
						if(sessQErr) throw sessQErr;

						if(sessQDoc) {
							User.findOne({ "username" : sessQDoc.user }, function(userQErr, userQDoc) {
								if(userQErr) throw userQErr;

								if(userQDoc) {
									if(userQDoc.usernameFull === req.params.initiator
										||
										userQDoc.usernameFull === req.params.receiver) {
										var name = (userQDoc.usernameFull === req.params.initiator) ? req.params.receiver : req.params.initiator;

										res.render("pmsg", { "title" : "Chat w/ " + name, "room" : room, "usernameFull" : userQDoc.usernameFull, "username" : userQDoc.username, "alert" : true, "layout" : "private-layout" });
									} else {
										res.status(404).send("incorrect room");
									}
								} else {
									res.status(404).send("user not found");
								}
							});
						} else {
							res.status(404).send("not allowed");
						}
					});
				}
			})
			.post("/get-db-data/:collection", csrfProtection, function(req, res, next) {
				var collection = req.params.collection;

				var queryParams = {
					users: {
						_id: 0,
						usernameFull: 1,
						username: 1,
						firstName: 1,
						lastName: 1,
						email: 1,
						accessLevel: 1,
						banned: 1
					},
					rooms: {
						_id: 0
					},
					chatOptions: {
						_id: 0
					}
				};

				db.collection(collection).find({}, queryParams[collection]).toArray( function(dbQErr, dbQData) {
					if(dbQErr) throw dbQErr;

					if(dbQData) {
						// console.log(dbQData)
						res.status(200).send({
							"msg": "success",
							"data": dbQData,
							"collection": collection,
							"quiet": true
						});
					} else {
						res.status(404).send("Collection could not be located");
					}
				});
			})
			.post("/report-violation", csrfProtection, function(req, res) {
				console.log("report URI", req.body["csp-report"]);
			})
			.post("*", csrfProtection, function(req, res) {
				res.status(404).send('Error 404: page not found');
			})
			;

});
module.exports = app;
