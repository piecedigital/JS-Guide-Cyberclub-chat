var getData = function (data) {
  var obj = {};
  data.serializeArray()
    .map(function(elem) {
    obj[elem.name] = elem.value;
  });
  return obj;
}

var confirm2 = function(msg, cb) {
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").append(
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": true,
	          }),
	          $("<button>").text("OK")
	        )
	      )
	    )
    )
  );

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();
    
    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });
}
var alert2 = function(msg, cb) {
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").append(
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": true,
	          }),
	          $("<button>").text("OK")
	        ),
	        $("<form>").append(
	          $("<input>").attr({
	            "type": "hidden",
	            "name": "action",
	            "value": false,
	          }),
	          $("<button>").text("Cancel")
	        )
	      )
	    )
    )
  );

  $(document).on("click", ".alert form button", function(e) {
    e.preventDefault();
    
    var data = getData( $(this).parent() );
    $(".alert").parent().remove();
    if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });
}
var prompt2 = function(msg, defaultVal, cb) {
  $("body").append(
    $("<div>").addClass("alert-box").html(
    	$("<div>").addClass("alert").attr({
      "type": "post"
	    }).append(
	      $("<p>").text(msg),
	      $("<div>").addClass("commands").html(
	      	$("<form>").addClass("top-form").append(
	      		$("<input>").attr({
	      			"type": "text",
	      			"name": "response",
	      			"value": defaultVal || ""
	      		}),
		        $("<form>").addClass("true").append(
		          $("<input>").attr({
		            "type": "hidden",
		            "name": "action",
		            "value": true,
		          }),
		          $("<button>").text("OK")
		        ),
		        $("<form>").addClass("false").append(
		          $("<input>").attr({
		            "type": "hidden",
		            "name": "action",
		            "value": false,
		          }),
		          $("<button>").text("Cancel")
		        )
	      	)
	      )
	    )
    )
  );

  $(document).on("keydown", ".alert .top-form", function(e) {
  	if(e.keyCode === 13) {
	  	return false;
  	}
  	return false;
  });

  $(document).on("submit", ".alert form form.true", function(e) {
    e.preventDefault();
  	var data = getData( $(this).parent() );
  	data.action = "true";
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });
  $(document).on("click", ".alert form form.true button", function(e) {
    e.preventDefault();
  	var data = getData( $(this).parent().parent() );
  	data.action = "true";
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });

  $(document).on("submit", ".alert form form.false", function(e) {
    e.preventDefault();
    var data = getData( $(this) );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });
  $(document).on("submit", ".alert form form.false button", function(e) {
    e.preventDefault();
    var data = getData( $(this).parent() );
  	$(".alert-box").remove();
  	if(typeof cb === "function") {
    	return cb(data);
    }
    return null;
  });
}

~(function(){
	var socket = io();

	var thisUsername,
			thisRoomname;

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
		thisUsername = $(this).attr("data-usernameFull");

		// DOM manipulation
		panels.users.find("#item-options").removeClass("invisible");
		panels.users.find(".add-window").find("input[name='newUsername']").val(thisUsername);
		panels.users.find(".add-window").find("input[name='ban']").attr("checked", false);
	});

	// form submission handling
	$(document).on("submit", ".add-window", function(e) {
		var formData = $(this).serializeArray();

		var dataObj = functions.parseForm(formData);
		if(dataObj.newUsername) {
			dataObj.originalName = thisUsername || dataObj.usernameFull;
		}
		if(dataObj.roomname) {
			dataObj.originalName = thisRoomname || dataObj.roomname;
		}
		var action = functions.parseAction(e);

		if(dataObj.ban) {
			alert2("Are you sure you want to ban " + thisUsername + "?", function(res) {
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
										confirm2("Operation cancelled");
									}
								});
							} else {
								functions.ajax(action, "POST", "json", dataObj);
							}
						} else {
							confirm2("Operation cancelled");
						}
					});
				} else {
					confirm2("Operation cancelled");
				}
			})
		} else 
		if(dataObj.op) {
			var conf = confirm("Are you sure you want to remove " + dataObj.roomname + "?");
			if(conf) {
				functions.ajax(action, "POST", "json", dataObj);
			}
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
			return e.target.action.split(/(http(s)?[:\/\/][a-z]*[.:][a-z0-9]*)/i).pop();
		},
		ajax: function(url, method, dType, dataObj) {
			$.ajax({
				url: url,
				type: method,
				dataType: dType,
				data: dataObj,
				success: function(data) {
					console.log(data);
					confirm2(data.msg);

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
					confirm2(error1.responseText);
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
				console.log("removing");

				var tag = panels.users.find("#item-list").find(".item .name[data-usernameFull='" + data.usernameFull + "']").parent();

				tag.find(".number").addClass("banned-true");
				tag.find(".name").attr("data-usernameFull", data.newName).html(data.newName);
				thisUsername = data.newName;

				socket.emit("live update", { "callback" : "updateUsers", "op" : "remove", "usernameFull" : data.usernameFull, "newName" : data.newName });
				
			} else {
				console.log("updating");

				var tag = panels.users.find("#item-list").find(".item .name[data-usernameFull='" + data.usernameFull + "']").parent()
				
				tag.find(".number").removeClass("banned-, banned-true");
				tag.find(".name").attr("data-usernameFull", data.newName).html(data.newName);
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