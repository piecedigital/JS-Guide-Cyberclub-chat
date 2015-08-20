console.log("required game-sockets module\r\n");

module.exports = function(io, db) {
	return {
		socketHandler: function(socket) {
			console.log("socketHandler called");
			var Room;

			socket// continued "on" events
			.on("join", function(obj) {
				console.log("'join' socket function");
				console.log(obj);

				if(obj.room === "chat") {
					io.emit("update", {
						"msg": "Welcome to the Guide Cyberclub chat! Please select one of our available rooms to begin chatting."
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