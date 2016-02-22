var getData = function (data) {
  var obj = {};
  data.serializeArray()
    .map(function(elem) {
    obj[elem.name] = elem.value;
  });
  return obj;
}

~(function(){
	var socket = io();

	var thisUsername,
			thisRoomname,
			thisAccessLevel;

	// PANEL functions
	var panels = {
		chatOpt: $(".panel.chat-opt"),
		rooms: $(".panel.rooms"),
		users: $(".panel.users")
	}
	// chat options panel
	panels.chatOpt.find("#item-list .item").on("click", ".name", function() {
		var itemOptions = $(this).attr("data-ind");
		console.log(itemOptions);

		// DOM manipulation
		panels.chatOpt.find("#item-options").find(".option-box").addClass("hidden");
		
		panels.chatOpt.find("#item-options").find(".option-box.option-" + itemOptions + "").removeClass("hidden");
	});
	// banned emote deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Banned Emotes']").on("click", ".close", function() {
		var emote = $(this).parent().data("emote");
		functions.ajax("/update-emotes", "POST", "json", { "emote" : emote, "op" : "$pull" });
	});
	// recommened emote deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes']").on("click", ".close", function() {
		var emote = $(this).parent().data("emote");
		functions.ajax("/update-recommended-emotes", "POST", "json", { "emote" : emote, "op" : "$pull" });
	});
	// banned word deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Banned Words']").on("click", ".close", function() {
		var word = $(this).parent().data("word");
		functions.ajax("/update-banned", "POST", "json", { "word" : word, "op" : "$pull" });
	});
	// banned ip deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses']").on("click", ".close", function() {
		var addr = $(this).parent().data("addr");
		functions.ajax("/update-ips", "POST", "json", { "ip" : addr, "op" : "$pull" });
	});
	// rooms panel
	panels.rooms.find("#item-list").on("click", ".item .name", function() {
		// variables
		thisRoomname = $(this).attr("data-roomname");
		var mods = parseInt($(this).attr("data-mods"));
		var topic = $(this).attr("data-topic");
		console.log($(this).data("roomname"), thisRoomname)

		// DOM manipulation
		panels.rooms.find("#item-options").find(".title").text("Edit Room: " + thisRoomname);

		panels.rooms.find("#item-options").find("input[name='roomname']").val(thisRoomname);
		
		panels.rooms.find("#item-options").find("select").find("option[data-ind='" + (mods) + "']").attr("selected", true);
		
		panels.rooms.find("#item-options").find("input[name='topic']").val(topic);

		panels.rooms.find("#item-options").find("input[type='checkbox']").attr("checked", false);

		panels.rooms.find("#item-options").find(".hide").removeClass("hidden-force");
	});
	//(adding tab)
	panels.rooms.find("#item-list").on("click", ".add .name", function() {
		// variables
		thisRoomname = null;

		// DOM manipulation
		panels.rooms.find("#item-options").find(".title").text("Add Room");

		panels.rooms.find("#item-options").find("input[name='roomname']").val("");
		
		panels.rooms.find("#item-options").find("select").find("option[data-ind='2']").attr("selected", true);
		
		panels.rooms.find("#item-options").find("input[name='topic']").val("");
		
		panels.rooms.find("#item-options").find("input[type='checkbox']").attr("checked", false);

		panels.rooms.find("#item-options").find(".hide").addClass("hidden-force");
	});
	// users panel
	panels.users.find("#item-list .item").on("click", ".name", function() {
		// variables
		thisUsername = $(this).attr("data-usernamefull");
		thisAccessLevel = $(this).attr("data-accesslevel");
		// DOM manipulation
		var selectKey = {
			"regular": 0,
			"teen mod": 1,
			"junior mod": 2,
			"moderator": 3,
			"admin": 4
		};
console.log(selectKey[thisAccessLevel]);
		panels.users.find("#item-options").removeClass("invisible");
		panels.users.find(".add-window").find("input[name='newusername']").val(thisUsername);
		panels.users.find(".add-window").find("select[name='accesslevel']")[0]
			.selectedIndex = (selectKey[thisAccessLevel]);
		panels.users.find(".add-window").find("input[name='ban']").attr("checked", false);
	});

	// form submission handling
	$(document).on("submit", ".add-window", function(e) {
		var formData = $(this).serializeArray();

		var dataObj = functions.parseForm(formData);
		if(dataObj.newusername) {
			dataObj.originalName = thisUsername || dataObj.usernameFull;
		}
		if(dataObj.roomname) {
			dataObj.originalName = thisRoomname || dataObj.roomname;
		}
		console.log(e)
		var action = functions.parseAction(e);

		if(dataObj.ban) {
			if(dataObj.ban === "DEL") {
				confirm2("Are you sure you want to delete " + thisUsername + "? This operation cannot be reversed", function(res) {
					if(res.action === "true") {
						functions.ajax(action, "POST", "json", dataObj);
					} else {
						alert2("Operation cancelled");
					}
				});
			} else {
				confirm2("Are you sure you want to ban " + thisUsername + "?", function(res) {
					if(res.action === "true") {
						prompt2("Please provide a reason for this account ban.", "Your behavior did not align with the rules of the chat room.", function(res) {
							if(res.action === "true") {
								dataObj.reason = res.response;
								if(dataObj.ban === "IP") {
									prompt2("Please provide a reason for this IP ban.", "The activty from this connection exhibited an inordinate degree of offenses.", function(res) {
										if(res.action === "true") {
											dataObj.reasonIp = res.response;
											functions.ajax(action, "POST", "json", dataObj);
										} else {
											alert2("Operation cancelled");
										}
									});
								} else {
									functions.ajax(action, "POST", "json", dataObj);
								}
							} else {
								alert2("Operation cancelled");
							}
						});
					} else {
						alert2("Operation cancelled");
					}
				});
			}
		} else
		if(dataObj.op) {
			confirm2("Are you sure you want to remove " + dataObj.roomname + "?", function(res) {
				conf = res.action;
				console.log(conf)
				if(res.action === "true") {
					functions.ajax(action, "POST", "json", dataObj);
				} else {
					alert2("Operation cancelled");
				}
			});
		} else {
			functions.ajax(action, "POST", "json", dataObj);
		}

		// don't send the form so the page doesn't reload
		return false;
	});

	//////////////////////////////////////////////
	// an object of functions to use externally //
	//////////////////////////////////////////////
	var functions = {
		parseForm: function(data) {
			var obj = {};
			for(var i = 0; i < data.length; i++) {
				obj[data[i].name] = data[i].value;
			}

			return obj;
		},
		parseAction: function(e) {
			return e.currentTarget.action.split(/(http(s)?[:\/\/][a-z]*[.:][a-z0-9]*)/i).pop();
		},
		ajax: function(url, method, dType, dataObj) {
			dataObj._csrf = csrfToken;
			console.log(method)
			$.ajax({
				url: url,
				type: method,
				dataType: dType,
				data: dataObj,
				success: function(data) {
					console.log(data);
					alert2(data.msg);

					if(data.action === "callback") {
						if(typeof data.callback === "object") {
							for(var i = 0; i < data.callback.length; i++) {
								functions[data.callback[i]](data.data[i], data.op[i]);
							}
						} else {
							functions[data.callback](data.data, data.op)
						}
					}
				},
				error: function(error1, error2, error3) {
					console.log(error1.status);
					console.log(error2);
					console.log(error3);
					console.log(error1.responseText);
					alert2(error1.responseText);
				}
			});
		},
		updateBannedEmotes: function(data, operation) {
			console.log(data, operation);
			if(operation === "$pull") {
				console.log("removing");

				panels.chatOpt.find("#item-options .option-box[data-section='Banned Emotes'] #banned-list").find(".emote[data-emote='" + data + "']").remove();
				
			}
			if(operation === "$push") {
				console.log("adding");
				console.log(data);

				panels.chatOpt.find("#item-options .option-box[data-section='Banned Emotes'] #banned-list").append("<li class='emote' data-emote='" + data + "'>" + data + "<div class='close'>x</div></li>");
			}
			socket.emit("live update", { "callback" : "updateBannedEmotes", "op" : operation, "emote" : data });
		},
		updateRecommendedEmotes: function(data, operation) {
			console.log(data, operation);
			if(operation === "$pull") {
				console.log("removing");

				panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes'] #recommended-list").find(".emote[data-emote='" + data + "']").remove();
				
			}
			if(operation === "$push") {
				console.log("adding");
				console.log(data);

				panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes'] #recommended-list").append("<li class='emote' data-emote='" + data + "'>" + data + "<div class='close'>x</div></li>");
			}
			socket.emit("live update", { "callback" : "updateRecommendedEmotes", "op" : operation, "emote" : data });
		},
		updateBannedWords: function(data, operation) {
			console.log(data, operation);
			if(operation === "$pull") {
				console.log("removing");

				panels.chatOpt.find("#item-options .option-box[data-section='Banned Words'] #banned-list").find(".word[data-word='" + data + "']").remove();
				
			}
			if(operation === "$push") {
				console.log("adding");
				console.log(data);

				panels.chatOpt.find("#item-options .option-box[data-section='Banned Words'] #banned-list").append("<li class='word' data-word='" + data + "'>" + data + "<div class='close'>x</div></li>");
			}
			socket.emit("live update", { "callback" : "updateBannedWords", "op" : operation, "word" : data });
		},
		updateBannedAddrs: function(data, operation) {
			console.log(data, operation);
			if(operation === "$pull") {
				console.log("removing");

				panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses'] #banned-list").find(".addr[data-addr='" + data + "']").remove();
				
			}
			if(operation === "$push") {
				console.log("adding");
				console.log(data);

				panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses'] #banned-list").append("<li class='addr' data-addr='" + data + "'>" + data + "<div class='close'>x</div></li>");
			}
		},
		updateRooms: function(data, operation) {
			console.log(data, operation);
			if(operation) {
				console.log("removing");

				panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']").parent().remove();
				
				socket.emit("live update", { "callback" : "updateRooms", "op" : "remove", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
			} else {
				console.log("updating");
				
				var tag = panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']") || "";

				if(tag.length > 0) {
					console.log("updating");

					tag.attr({
						"data-roomname": data.roomname,
						"data-topic": data.topic,
						"data-mods": data.minMods
					})
					.html(data.roomname);

					socket.emit("live update", { "callback" : "updateRooms", "op" : "update", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
				} else {
					console.log("adding");

					panels.rooms.find("#item-list").prepend("<li class='item parent'><span class='name' data-roomname='" + data.roomname + "' data-topic='" + data.topic + "' data-mods='" + data.minMods + "'>" + data.roomname + "</span><span class='number'>0</span></li>");

					socket.emit("live update", { "callback" : "updateRooms", "op" : "add", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
				}
				thisRoomname = data.roomname;
			}
		},
		updateUsers: function(data, operation) {
			console.log(data, operation);
			if(operation) {
				if(operation === "DEL") {
					var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent();

					tag.find(".name").attr("data-usernamefull", data.newName).remove();
					thisUsername = null;

					socket.emit("live update", { "callback" : "updateUsers", "op" : "remove", "usernameFull" : data.usernameFull, "newName" : data.newName });
				} else {
					console.log("banning");

					var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent();

					tag.find(".number").addClass("banned-true");
					tag.find(".name").attr("data-usernamefull", data.newName).html(data.newName);
					thisUsername = data.newName;

					socket.emit("live update", { "callback" : "updateUsers", "op" : "remove", "usernameFull" : data.usernameFull, "newName" : data.newName });
				}
				
			} else {
				console.log("updating");

				var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent()
				
				tag.find(".number").removeClass("banned-, banned-true");
				tag.find(".name").attr("data-usernamefull", data.newName).html(data.newName);
				thisUsername = data.newName;

				socket.emit("live update", { "callback" : "updateUsers", "op" : "update", "usernameFull" : data.usernameFull, "newName" : data.newName });
			}
		},
		updateColors: function(data, operation) {
			console.log(data, operation);
			socket.emit("live update", { "callback" : "updateColors", "colorData" : data });
		}
	}
}());