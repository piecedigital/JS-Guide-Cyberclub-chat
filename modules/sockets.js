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
					Room.findOne({ "roomname" : obj.room }, { "_id" : 0, "roomname" : 1, "minMods" : 1, "topic" : 1 }, function(roomQErr, roomQDoc) {
        		if(roomQErr) throw roomQErr;

        		if(roomQDoc) {
							socket.join(obj.room);
        			thisRoom = obj.room;
							console.log(obj.room, thisRoom);

							var userObj = {
								"username": obj.usernameFull.toLowerCase(),
								"usernameFull" : obj.usernameFull
							};

							Room.update({ "roomname" : obj.room }, { "$push" :{ "users" : userObj } });
							
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

				io.to(socket.id).emit("update", {
					"msg": "You have left the room " + obj.room
				});

				io.emit("new entry", {
					"msg": obj.username + "has left ",
					"usernameFull": obj.usernameFull,
					"displayName": obj.displayName,
					"room": null
				});
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

				var callbacks = {
					updateBannedWords: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "word" : obj.word });
					},
					updateRooms: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "roomname" : obj.roomname, "originalName" : obj.originalName, "topic" : obj.topic });
					},
					updateUsers: function() {
						io.emit("real time update", { "callback" : obj.callback, "operation" : obj.op, "usernameFull" : obj.username, "newName" : obj.newName });
					}
				};
				callbacks[obj.callback]();
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