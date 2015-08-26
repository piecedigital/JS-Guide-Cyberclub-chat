var username,
		roomname;

// PANEL functions
var panels = {
	chatOpt: $(".panel.chat-opt"),
	rooms: $(".panel.rooms"),
	users: $(".panel.users")
}
// chat options panel
panels.chatOpt.find("#item-list .item").on("click", ".name", function() {
	var itemOptions = $(this).data("ind");
	console.log(itemOptions);

	// DOM manipulation
	panels.chatOpt.find("#item-options").find("#option-box").addClass("hidden");
	panels.chatOpt.find("#item-options").find("#option-box[data-section='1']").addClass("hidden");
	
	panels.chatOpt.find("#item-options").find("#option-box[data-section='" + itemOptions + "']").removeClass("hidden");
});
// banned ip deletion
panels.chatOpt.find("#item-options #option-box[data-section='Banned IP Addresses']").on("click", ".close", function() {
	var addr = $(this).parent().data("addr");
	functions.ajax("/update-ips", "POST", "json", { "ip" : addr, "op" : "$pull" });
});
// banned word deletion
panels.chatOpt.find("#item-options #option-box[data-section='Banned Words']").on("click", ".close", function() {
	var word = $(this).parent().data("word");
	functions.ajax("/update-banned", "POST", "json", { "word" : word, "op" : "$pull" });
});
// rooms panel
panels.rooms.find("#item-list .item").on("click", ".name", function() {
	// variables
	roomname = $(this).data("roomname");
	var mods = parseInt($(this).data("mods"));
	var topic = $(this).data("topic");

	// DOM manipulation
	panels.rooms.find("#item-options").find(".title").text("Edit Room: " + roomname);

	panels.rooms.find("#item-options").find("input[name='roomname']").val(roomname);
	
	panels.rooms.find("#item-options").find("select").find("option[data-ind='" + (mods) + "']").attr("selected", true);
	
	panels.rooms.find("#item-options").find("input[name='topic']").val(topic);

	panels.rooms.find("#item-options").find("input[type='checkbox']").val(false);

	panels.rooms.find("#item-options").find(".hide").removeClass("hidden-force");
});
//(adding tab)
panels.rooms.find("#item-list .add").on("click", ".name", function() {
	// variables
	roomname = null;

	// DOM manipulation
	panels.rooms.find("#item-options").find(".title").text("Add Room");

	panels.rooms.find("#item-options").find("input[name='roomname']").val("");
	
	panels.rooms.find("#item-options").find("select").find("option[data-ind='2']").attr("selected", true);
	
	panels.rooms.find("#item-options").find("input[name='topic']").val("");
	
	panels.rooms.find("#item-options").find("input[type='checkbox']").val(false);

	panels.rooms.find("#item-options").find(".hide").addClass("hidden-force");
});
// users panel
panels.users.find("#item-list .item").on("click", ".name", function() {
	// variables
	username = $(this).data("username");

	// DOM manipulation
	panels.users.find("#item-options").removeClass("invisible");
	panels.users.find(".add-window").find("input[name='newUsername']").val(username);
	panels.users.find(".add-window").find("input[name='ban']").val(false);
});

// form submission handling
$(document).on("submit", ".add-window", function(e) {
	var formData = $(this).serializeArray();

	var dataObj = functions.parseForm(formData);
	if(dataObj.newUsername) {
		dataObj.originalName = username || dataObj.username;
	}
	if(dataObj.roomname) {
		dataObj.originalName = roomname || dataObj.roomname;
	}
	var action = functions.parseAction(e);

	if(dataObj.ban) {
		var conf = confirm("Are you sure you want to ban " + username + "?");
		if(conf) {
			functions.ajax(action, "POST", "json", dataObj);
		}
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
		return e.target.action.split(/(http(s)?[:\/\/a-z]*[.:][a-z0-9]*)/i).pop();
	},
	ajax: function(url, method, dType, dataObj) {
		$.ajax({
			url: url,
			type: method,
			dataType: dType,
			data: dataObj,
			success: function(data) {
				console.log(data);
				alert(data.msg);

				if(data.action === "callback") {
					functions[data.callback](data.data, data.op)
				}
			},
			error: function(error1, error2, error3) {
				console.log(error1.status);
				console.log(error2);
				console.log(error3);
				console.log(error1.responseText);
				alert(error1.responseText);
			}
		});
	},
	updateBannedWords: function(data, operation) {
		console.log(data, operation);
		if(operation === "$pull") {
			console.log("removing");

			panels.chatOpt.find("#item-options #banned-list").find(".word[data-word='" + data + "']").remove();
			
		}
		if(operation === "$push") {
			console.log("adding");
			console.log(data);

			panels.chatOpt.find("#item-options #banned-list").append("<li class='word' data-word='" + data + "'>" + data + "<div class='close'>x</div></li>");
		}
	},
	updateRooms: function(data, operation) {
		console.log(data, operation);
		if(operation) {
			console.log("removing");

			panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']").parent().remove();
			
		} else {
			var tag = panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']") || "";
			
			console.log(tag);

			if(tag.length > 0) {
				console.log("updating");

				tag.attr({
					"data-roomname": data.roomname,
					"data-topic": data.topic,
					"data-mods": data.mindMods
				})
				.html(data.roomname);
			} else {
				console.log("adding");

				panels.rooms.find("#item-list").prepend("<li class='item parent'><span class='name' data-roomname='" + data.roomname + "' data-topic='" + data.topis + "' data-mods='" + data.mindMods + "'>" + data.roomname + "</span><span class='number'></span></li>");
			}
			roomname = data.roomname;
		}
	},
	updateUsers: function(data, operation) {
		console.log(data, operation);
		if(operation) {
			console.log("removing");

			var tag = panels.users.find("#item-list").find(".item .name[data-username='" + data.username + "']").parent();

			tag.find(".number").addClass("banned-true");
			tag.find(".name").attr("data-username", data.newName).html(data.newName);
			username = data.newName;
			
		} else {
			console.log("updating");

			var tag = panels.users.find("#item-list").find(".item .name[data-username='" + data.username + "']").parent()
			
			tag.find(".number").removeClass("banned-, banned-true");
			tag.find(".name").attr("data-username", data.newName).html(data.newName);
			username = data.newName;
		}
	}
}