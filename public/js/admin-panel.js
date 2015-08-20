var username;

// PANEL functions
var panels = {
	rooms: $(".panel.rooms"),
	users: $(".panel.users")
}
// rooms panel
panels.rooms.find("#item-list .item .name").on("click", function() {
	// variables
	roomName = $(this).data("roomname");
	mods = parseInt($(this).data("mods"));
	topic = $(this).data("topic");

	// DOM manipulation
	panels.rooms.find("#item-options").find(".title").text("Edit Room: " + roomName);

	panels.rooms.find("#item-options").find("input[name='roomname']").attr("value", roomName);
	panels.rooms.find("#item-options").find("select").find("option[data-ind='" + (mods) + "']").attr("selected", true);
	panels.rooms.find("#item-options").find("input[name='topic']").attr("value", topic);
});
//(adding tab)
panels.rooms.find("#item-list .add .name").on("click", function() {
	// DOM manipulation
	panels.rooms.find("#item-options").find(".title").text("Add Room");

	panels.rooms.find("#item-options").find("input[name='roomname']").attr("value", "");
	panels.rooms.find("#item-options").find("select").find("option[data-ind='2']").attr("selected", true);
	panels.rooms.find("#item-options").find("input[name='topic']").attr("value", "");
});
// users panel
panels.users.find("#item-list .item .name").on("click", function() {
	// variables
	username = $(this).data("username");

	// DOM manipulation
	panels.users.find("#item-options").removeClass("invisible");
	panels.users.find(".add-window").find("input[name='newUsername']").attr("value", username);
});

// form submission handling
$(".add-window").on("submit", function(e) {
	var formData = $(this).serializeArray();

	var dataObj = functions.parseForm(formData);
	dataObj.originalName = username;
	var action = functions.parseAction(e);

	if(dataObj.ban) {
		var conf = confirm("Are you sure you want to ban " + username + "?");
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
			},
			error: function(error1, error2, error3) {
				console.log(error1.status);
				console.log(error2);
				console.log(error3);
				console.log(error1.responseText);
			}
		});
	}
}