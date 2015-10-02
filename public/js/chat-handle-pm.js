String.prototype.multiply = function(times) {
	var arr = [];
	var tick = 0;
	while(tick < times) {
		arr.push(this);
		tick++;
	}

	return arr.join("");
};

~(function () {
	var socket = io(),
	usernameFull = $("#user-data").data("usernamefull"),
	username = usernameFull.toLowerCase(),
	displayName = usernameFull,
	//userList = [],
	windowFocus = true,
	unread = 0,
	originalTitleMention = "▉" + $("title").html(),
	//originalTitleMention = "&#x2589;" + $("title").html(),
	originalTitle = $("title").html(),
	showTitle = originalTitle;
	room = $("#room").data("room"),
	myColor = "red",
	myLevel = $("#user-data").data("access");

	//get relative of chat log for new users
	function logDate(time){
		time = time || "";
		var period = "am";
		var now = (time) ? new Date(time) : new Date();
		var hours = now.getHours();
		var minutes = now.getMinutes();
		if(hours > 12){ hours -= 12; period = "pm"}
		if(hours === 0){ hours = 12;}
		if(minutes < 10){ minutes = "0" + minutes;}
		return hours + ":" + minutes + " " + period;
	}
	var autoScroll = true;
	function scrollToBottom() {
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	}

	socket.emit("join", { "room" : room, "usernameFull" : usernameFull, "pm" : true });

	socket.on("illegal", function(res){
		alert(res);
	});

	$(window).focus(function() {
		windowFocus = true;
		unread = 0;
		showTitle = originalTitle;
		$("title").html(showTitle);
	}).blur(function() {
		windowFocus = false;
	});
	
	$("#chat-val").keydown(function(k){
		if( $("#chat-val").val() ) {
			$("#chat-form button").addClass("full");
		}
	});

	//socket response on chat response
	socket.on("chat response", function(data){
		$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <span class='user " + data.level + " " + data.color + "' data-displayname='" + data.displayName + "' data-usernamefull='" + data.usernameFull + "'> " + data.displayName + "</span>: " + "<p class='chat-text'>" + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		console.log(data)
	});

	//socket response on chat me response
	socket.on("chat me response", function(data){
		$("#messages").append($("<li class='chat " + data.color + "'>").html("<span class='time-code'>[" + logDate() + "]</span> <p class='chat-text'><span class='user " + data.level + "' data-displayname='" + data.displayName + "' data-usernamefull='" + data.usernameFull + "'> " + data.displayName + "</span> " + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		console.log(data)
	});
	//socket response on update
	socket.on("update", function(data){
		$("#messages").append($("<li class='update'>").html("[UPDATE] " + data.msg) );
		scrollToBottom();
	});



//////////////////////////////////
//////////////////////////////////
// jQuery testing area
//////////////////////////////////
//////////////////////////////////

	//socket responses on room entry
	socket.on("real time update", function(data){
		console.log(data);

		var callbacks = {
			updateUsers: function() {
				if(data.op === "remove") {
					$("#room-list").find(".room .user[data-usernameFull='" + data.usernameFull + "']").remove();
					window.location.href = "/banned/account";
				};
				if(data.op === "update") {
					$("#room-list").find(".room .user[data-usernameFull='" + data.usernameFull + "']").attr({
						"data-usernameFull": data.newName
					});
					if(data.usernameFull === usernameFull) {
						alert("your username has been changed. You browser must now be refreshed.");
						window.location.reload(true);
					}
				};
			},
			updateColors: function() {
				var css =
				".regular {\n\r"+
					"box-shadow: inset 0 -.4em 0 0 " + data.colorData.regular + ",\n\r"+
					"inset 0 .4em 0 0 " + data.colorData.regular + " !important;\n\r"+
				"}\n\r"+
				".teen-mod {\n\r"+
					"box-shadow: inset 0 -.4em 0 0 " + data.colorData.teenMod + ",\n\r"+
					"inset 0 .4em 0 0 " + data.colorData.teenMod + " !important;\n\r"+
				"}\n\r"+
				".junior-mod {\n\r"+
					"box-shadow: inset 0 -.4em 0 0 " + data.colorData.juniorMod + ",\n\r"+
					"inset 0 .4em 0 0 " + data.colorData.juniorMod + " !important;\n\r"+
				"}\n\r"+
				".moderator {\n\r"+
					"box-shadow: inset 0 -.4em 0 0 " + data.colorData.moderator + ",\n\r"+
					"inset 0 .4em 0 0 " + data.colorData.moderator + " !important;\n\r"+
				"}\n\r"+
				".admin {\n\r"+
					"box-shadow: inset 0 -.4em 0 0 " + data.colorData.admin + ",\n\r"+
					"inset 0 .4em 0 0 " + data.colorData.admin + " !important;\n\r"+
				"}";

				$("#level-colors").text(css);
			}
		};

		callbacks[data.callback]();
	});
	//filter chat for links and emites
	function regexFilter(filter, person){

		//smiles
		filter = filter.replace(/((http(s)?[:\/\/]*))?([a-z0-9\-]*[.])([a-z0-9\-]*[.])?([a-z]{2,3})(.*)?/ig, "[deleted link]")
			.replace(/[a-z]{1,}([._-]*)?[a-z]{1,}@[a-z]*.[a-z]*/ig, "[deleted email]");


		//emoticons/////////////
		// convert emoji string matches to images
		function emojify(str) {
			var emoteMatches = str.match(/[:][a-z\_]*[:]/gi) || [];
			var str = emojione.toImage(str);
			var emojioneHTML = document.createElement('span');
			emojioneHTML.innerHTML = str;
			emojioneMatches = $(emojioneHTML).find(".emojione");
			//console.log($(d).find(".emojione"));
			for(var i = 0; i < emojioneMatches.length; i++) {
				//console.log("of match: ", emojioneMatches)
				$(emojioneMatches[i]).attr("title", emoteMatches[i]);
			}
			var finalHTML = $(emojioneHTML).html();
			console.log(finalHTML);
			return finalHTML
		}

		filter = emojify(filter);

		//match mentions////////////
		var regDisplayName = new RegExp("@" + displayName, "gi");
		if(filter.match(regDisplayName) && person.toLowerCase() !== displayName.toLowerCase() ){
			filter = filter.replace(regDisplayName, "<span class='mention'>@"+displayName+"</span>");
			showTitle = originalTitleMention;
			if(windowFocus) {
				$("title").html(originalTitle);
			} else {
				unread++;
				$("title").text( "(" + unread + ") " + showTitle);
			}

		} else {
			if(windowFocus) {
				showTitle = originalTitle;
				$("title").html(originalTitle);
			} else {
				unread++;
				$("title").text("(" + unread + ") " + showTitle);
			}
		}

		return filter;
	}

	//chat message submission
	$('#chat-form').submit(function(){
		socket.emit("chat message", { "room" : room, "msg" : $("#chat-val").val(), "usernameFull" : usernameFull, "displayName" : displayName, "color" : myColor, "level" : myLevel });
		$("#chat-val").val("");
		$("#chat-form button").removeClass("full");
		$("#chat-val button").removeClass("full");
		return false;
	});
	// link warning
	$('#chat-box #messages').on('click', 'a', function(event) {
		var result = confirm("You are about to leave this page to visit a link posted in the chat. \n\r\n\r Do you wish to continue?");
		if (!result) {
			event.preventDefault();
		}
	})

	$("#chat-val").focus();

}());