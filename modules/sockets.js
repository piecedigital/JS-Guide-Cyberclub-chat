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
						"msg": "Welcome, " + obj.username + ", to the Guide Cyberclub chat! Please select one of our available rooms to begin chatting."
					});
				} else {
					Room.findOne({ "roomname" : obj.room }, { "_id" : 0, "roomname" : 1, "minMods" : 1, "topic" : 1 }, function(roomQErr, roomQDoc) {
        		if(roomQErr) throw roomQErr;

        		if(roomQDoc) {
							socket.leave(thisRoom);
							socket.join(obj.room);
        			thisRoom = obj.room;
        			
							io.to(socket.id).emit("enter room", {
								"msg": "Joined " + obj.room,
								"room": obj.room
							});
							io.to(socket.id).emit("new entry", {
								"msg": "Joined " + obj.room,
								"user": obj.username,
								"userDisplay": obj.displayName,
								"room": obj.room
							});
        		} else {
        			io.io(socket.id).emit("command", { "msg" : "Room does not exist" });
        		}
        	});
				}
			})
			.on("chat message", function(obj) {
			})
			.on("disconnect", function() {
				console.log("disconnected");
			});
		}
	}
}