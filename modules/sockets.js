console.log("required game-sockets module\r\n");

var bannedWords = [];
var bannedEmotes = [];
module.exports = function(io, db) {
	var User = db.collection("users"),
		Room = db.collection("rooms"),
		Chat = db.collection("chatOptions");
		// pull data for banned words and phrases
		//console.log(bannedWords, bannedEmotes);

  	String.prototype.multiply = function(times) {
			var arr = [];
			var tick = 0;
			while(tick < times) {
				arr.push(this);
				tick++;
			}

			return arr.join("")
		};
	return {
		socketHandler: function(socket) {
			//console.log("socketHandler called");
			var thisRoom;

			socket// continued "on" events
			.on("join", function(obj) {
				//console.log("'join' socket function");
				//console.log(obj);

				if(!obj.room) {
					thisRoom = obj.room;
					io.to(socket.id).emit("update", {
						"msg": "Welcome, " + obj.usernameFull + ", to the Guide Cyberclub chat! Please select one of our available rooms to begin chatting."
					});
				} else {
					if(obj.pm) {
						socket.join(obj.room);
						return;
					}

					User.update({ "usernameFull" : obj.usernameFull }, { "$set" : { "socket" : socket.id } });

					// joins a user to the room
					Room.findOne({ "roomname" : obj.room }, function(roomQErr, roomQDoc) {
        		if(roomQErr) throw roomQErr;

        		if(roomQDoc) {
							var joinUser = function() {
								socket.join(obj.room);
			    			thisRoom = obj.room;
								//console.log(obj.room, thisRoom);

								var userObj = {
									"username": obj.usernameFull.toLowerCase(),
									"usernameFull": obj.usernameFull,
									"accessLevel": obj.accessLevel
								};

								Room.update({ "roomname" : obj.room }, { "$push" : { "users" : userObj } }, { "multi" : true });
								
								io.to(socket.id).emit("enter room", {
									"msg": "Joined " + obj.room,
									"room": obj.room
								});
								io.emit("new entry", {
									"msg": obj.usernameFull + " has joined ",
									"usernameFull": obj.usernameFull,
									"displayName": obj.displayName,
									"accessLevel": obj.accessLevel,
									"room": obj.room
								});
							};

							var currentMods = 0;
							userElem = roomQDoc.users || [];
							for(var i = 0; i < userElem.length; i++) {
								if(userElem[i].accessLevel === "admin" || userElem[i].accessLevel === "moderator") {
									currentMods++;
								}
							};
        			if(currentMods >= roomQDoc.minMods) {
        				joinUser();
        			} else {
								if(obj.accessLevel === "moderator" || obj.accessLevel === "admin") {
									joinUser();
								} else {
									io.to(socket.id).emit("update", {
										"msg": "There are not enough admins in this room for you to join. There must be at least " + roomQDoc.minMods + " adult mod" + ( (roomQDoc.minMods > 1 || roomQDoc.minMods === 0) ? "s" : "" ) + " in the room. There are currently " + currentMods + "."
									});
								}
        			}
        		} else {
        			io.to(socket.id).emit("command", { "msg" : "Room does not exist" });
        		}
        	});
				}
			})
			.on("leave", function(obj) {
				//console.log("'leave' socket function");
				//console.log(obj);

				socket.leave(obj.room);

				Room.update({}, { "$pull" : { "users" : { "username" : obj.usernameFull.toLowerCase() } } }, { "multi" : true });

				io.to(socket.id).emit("leave room", {
					"msg": "Left " + obj.room,
					"room": "door"
				});

				io.emit("new entry", {
					"msg": obj.usernameFull + " has left ",
					"usernameFull": obj.usernameFull,
					"displayName": obj.displayName,
					"room": null
				});
				if(obj.accessLevel === "admin" || obj.accessLevel === "moderator") {
					Room.findOne({ "roomname" : obj.room }, function(roomQErr, roomQDoc) {
						if(roomQErr) throw roomQErr;

						if(roomQDoc) {
							var currentMods = 0;
							userElem = roomQDoc.users;
							for(var i = 0; i < userElem.length; i++) {
								if(userElem[i].accessLevel === "admin" || userElem[i].accessLevel === "moderator") {
									currentMods++;
								}
							};

							if(currentMods < roomQDoc.minMods) {
								io.to(socket.id).emit("update", {
									"msg": "There are an insufficient number of mods in this room. You will now be moved out of this room."
								});
								io.in(obj.room).emit("kick", { "roomname" : obj.room });
							}
						}
					});
				}
			})
			.on("chat message", function(obj) {
				if(obj.msg) {
					//console.log("'chat message' socket function");
					//console.log(obj);
					obj.msg = obj.msg.replace(/[<]/gi, "&lt;")
						.replace(/[>]/gi, "&gt;");

					////console.log("banned stuff - ", bannedWords, bannedEmotes)
					// filter out banned words
					for(var i = 0; i < bannedWords.length; i++) {
						var banReg = new RegExp(bannedWords[i], "gi")
						obj.msg = obj.msg.replace(banReg, "*".multiply(bannedWords[i].length));
					}
					// filter out banned emotes
					var rpCode =  "&#58;";
					for(var i = 0; i < bannedEmotes.length; i++) {
						var banReg = new RegExp(bannedEmotes[i], "gi");
						var match = obj.msg.match(banReg) || [];
						match = (match[0]) ? match[0].replace(/[:]/gi, rpCode) : match;
						obj.msg = obj.msg.replace(banReg, match);
					}

					// check if command or regular message
					if(obj.msg.match(/^(\/me)/gi)) {
						obj.msg = obj.msg.replace(/^(\/me)(\s)?/gi, "");

						io.in(obj.room).emit("chat me response", { "msg" : obj.msg, "usernameFull" : obj.usernameFull, "displayName" : obj.displayName, "color" : obj.color, "level" : obj.level });
					} else
					if(obj.msg.match(/^(\/topic)/gi)) {
						Room.findOne({ "roomname" : obj.room }, function(roomQErr, roomQDoc) {
							if(roomQErr) throw roomQErr;

							if(roomQDoc) {
								obj.msg = obj.msg.replace(/^(\/topic)(\s)?/gi, "");
								io.in(obj.room).emit("update", { "msg" : "The topic for " + roomQDoc.roomname + " is <span class='bold'>" + roomQDoc.topic + "</span>" });
							}
						});

					} else {
						io.in(obj.room).emit("chat response", { "msg" : obj.msg, "usernameFull" : obj.usernameFull, "displayName" : obj.displayName, "color" : obj.color, "level" : obj.level });
					}
				}
			})
			.on("live update", function(obj) {
				//console.log("'live update' socket function");
				//console.log(obj);
				
				var callbacks = {
					updateBannedWords: function() {
						if(obj.op === "$push") {
							bannedWords.push(obj.word);
						}
						if(obj.op === "$pull") {
							bannedWords.splice(bannedWords.indexOf(obj.word), 1);
						}
					},
					updateBannedEmotes: function() {
						if(obj.op === "$push") {
							bannedEmotes.push(obj.emote);
						}
						if(obj.op === "$pull") {
							bannedEmotes.splice(bannedEmotes.indexOf(obj.emote), 1);
						}
					},
					updateRooms: function() {
						io.emit("real time update", obj);
					},
					updateUsers: function() {
						io.emit("real time update", obj);
					},
					updateColors: function() {
						io.emit("real time update", obj);
						io.emit("update", {
							"msg": "The color user roles have been updated. Regular users: <span class='color-box' style='width: 1em; height: 1em; background-color: " + obj.colorData.regular + "; border-radius: .5em; display: inline-block;'></span>, teen mod: <span class='color-box' style='width: 1em; height: 1em; background-color: " + obj.colorData.teenMod + "; border-radius: .5em; display: inline-block;'></span>, junior mod: <span class='color-box' style='width: 1em; height: 1em; background-color: " + obj.colorData.juniorMod + "; border-radius: .5em; display: inline-block;'></span>, adult moderator: <span class='color-box' style='width: 1em; height: 1em; background-color: " + obj.colorData.moderator + "; border-radius: .5em; display: inline-block;'></span>, admin: <span class='color-box' style='width: 1em; height: 1em; background-color: " + obj.colorData.admin + "; border-radius: .5em; display: inline-block;'></span>."
						});
					}
				};
				
				callbacks[obj.callback]();
			})
			.on("private message", function(obj) {
				io.emit("generate pm", obj)
			})
			.on("console.log", function() {
				console.log(JSON.stringify(arguments));
			})
			.on("example", function(obj) {
				//console.log("'' socket function");
				//console.log(obj);
			})
			.on("disconnect", function() {
				//console.log("disconnected", socket.id);

				User.findOne({ "socket" : socket.id }, function(userQErr, userQDoc) {
					if(userQErr) throw userQErr;

					if(userQDoc) {
						//console.log(userQDoc);

						io.emit("new entry", {
							"msg": userQDoc.username + " has left",
							"usernameFull": userQDoc.usernameFull,
							"displayName": userQDoc.usernameFull,
							"room": null
						});

						Room.update({}, { "$pull" : { "users" : { "username" : userQDoc.username} } }, { "multi" : true } );
					}
				});
			});
		},
		populateBans: function(n) {
			//console.log("populate bans called");

			Chat.findOne({ "optionName" : "bannedWords" }, function(chatQErr, chatQDoc) {
	  		if(chatQErr) throw chatQErr;

	  		//console.log("searching words...");
	  		////console.log(chatQDoc)
	  		if(chatQDoc) {
	  			bannedWords = chatQDoc.list;
	  			//console.log("found some")
	  		} else {
	  			bannedWords = [];
	  			//console.log("found none")
	  		}
	  		//console.log("bannedWords", bannedWords);
	  	});
	  	Chat.findOne({ "optionName" : "bannedEmotes" }, function(chatQErr, chatQDoc) {
	  		if(chatQErr) throw chatQErr;

	  		//console.log("searching emotes...");
	  		////console.log(chatQDoc)
	  		if(chatQDoc) {
	  			bannedEmotes = chatQDoc.list;
	  			//console.log("found some")
	  		} else {
	  			bannedEmotes = [];
	  			//console.log("found none")
	  		}
	  		//console.log("bannedEmotes", bannedEmotes);
	  	});
		}
	}
}