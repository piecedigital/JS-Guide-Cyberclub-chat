console.log("required game-sockets module\r\n");

module.exports = function(io, db) {
	var User = db.collection("users"),
		Room = db.collection("rooms"),
		Chat = db.collection("chatOptions");
	return {
		socketHandler: function(socket) {
			console.log("socketHandler called");
			var thisRoom;

			socket// continued "on" events
			.on("join", function(obj) {
				console.log("'join' socket function");
				console.log(obj);

				if(!obj.room) {
					thisRoom = obj.room;
					io.to(socket.id).emit("update", {
						"msg": "Welcome, " + obj.usernameFull + ", to the Guide Cyberclub chat! Please select one of our available rooms to begin chatting."
					});

					User.update({ "usernameFull" : obj.usernameFull }, { "$set" : { "socket" : socket.id } });
				} else {
					// joins a user to the room
					Room.findOne({ "roomname" : obj.room }, function(roomQErr, roomQDoc) {
        		if(roomQErr) throw roomQErr;

        		if(roomQDoc) {
							var joinUser = function() {
								socket.join(obj.room);
			    			thisRoom = obj.room;
								console.log(obj.room, thisRoom);

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
									"room": obj.room
								});
							};

							var currentMods = 0;
							userElem = roomQDoc.users;
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
				console.log("'leave' socket function");
				console.log(obj);

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
					console.log("'chat message' socket function");
					console.log(obj);
					obj.msg = obj.msg.replace(/[<]/gi, "&lt;")
						.replace(/[>]/gi, "&gt;");

					if(obj.msg.match(/^(\/me)/gi)) {
						obj.msg = obj.msg.replace(/^(\/me)/gi, "")
						io.in(thisRoom).emit("chat me response", { "msg" : obj.msg, "usernameFull" : obj.usernameFull, "displayName" : obj.displayName, "color" : obj.color, "level" : obj.level });
					} else {
						io.in(thisRoom).emit("chat response", { "msg" : obj.msg, "usernameFull" : obj.usernameFull, "displayName" : obj.displayName, "color" : obj.color, "level" : obj.level });
					}
				}
			})
			.on("live update", function(obj) {
				console.log("'live update' socket function");
				console.log(obj);
				/*
				var callbacks = {
					updateBannedWords: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "word" : obj.word });
					},
					updateRooms: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "roomname" : obj.roomname, "originalName" : obj.originalName, "topic" : obj.topic });
					},
					updateUsers: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "usernameFull" : obj.usernameFull, "newName" : obj.newName });
					},
					updateUsers: function() {
						io.emit("real time update", { "callback" : obj.callback, "colorData" : data });
					}
				};
				*/
				io.emit("real time update", obj);
				//callbacks[obj.callback]();
			})
			.on("example", function(obj) {
				console.log("'' socket function");
				console.log(obj);
			})
			.on("disconnect", function() {
				console.log("disconnected", socket.id);

				User.findOne({ "socket" : socket.id }, function(userQErr, userQDoc) {
					if(userQErr) throw userQErr;

					if(userQDoc) {
						console.log(userQDoc);

						io.emit("new entry", {
							"msg": userQDoc.username + " has left",
							"usernameFull": userQDoc.usernameFull,
							"displayName": userQDoc.usernameFull,
							"room": null
						});

						Room.update({}, { "$pull" :{ "users" : { "username" : userQDoc.username} } }, { "multi" : true } );
					}
				});
			});
		}
	}
}