String.prototype.multiply = function(times) {
	var arr = [];
	var tick = 0;
	while(tick <= times) {
		arr.push(this);
		tick++;
	}

	return arr.join("");
};

~(function () {
	var socket = io(),
	usernameFull = $("#user-data").data("username"),
	username = usernameFull.toLowerCase(),
	displayName = usernameFull,
	//userList = [],
	windowFocus = true,
	unread = 0,
	originalTitleMention = "▉" + $("title").html(),
	//originalTitleMention = "&#x2589;" + $("title").html(),
	originalTitle = $("title").html(),
	showTitle = originalTitle;
	room = "door",
	currentMods = 0,
	myColor = "red",
	myLevel = $("#user-data").data("access"),
	myMutes = [];

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

	socket.emit("join", { "usernameFull" : usernameFull});

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

	/*
	//get caret positon
	function getCaretPos(input) {
  // Internet Explorer Caret Position (TextArea)
    if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange();
        var bookmark = range.getBookmark();
        var caret_pos = bookmark.charCodeAt(2) - 2;
    } else {
        // Firefox Caret Position (TextArea)
        if (input.setSelectionRange)
          var caret_pos = input.selectionStart;
    }
    return caret_pos;
	}
	*/
/* MENTINO SECTION/////////////////
   Uncomment later if useable////////////
	//mention
	var caretPosition = 0, selection = 1, subStr, listLen;
	//check for keyup events
	$("#chat-val").on("keyup", function(){
		if ( $(this).val().charAt( getCaretPos(this) - 1).match(/[@]/gi) ){
			//show list box
			console.log("prep mention");
			$("#list-box").css({"display": "inline-block"});
			caretPosition = getCaretPos(this) - 1;
		}
		if ( $(this).val().charAt( getCaretPos(this) - 1).match(/[\s]/gi) || $(this).val().charAt( getCaretPos(this) - 1) === "" ){
			//hide list box
			$("#list-box").css({"display": "none"});
		}
		subStr = $(this).val().split("").slice(caretPosition+1).join("");
		var matchedUser = new RegExp("\b(" + subStr + ")", "gi");
		$("#list-box").html("");
		userList.map(function(elem, index){
			if (elem.match(matchedUser) && $("#list-box").attr("style") === "display: inline-block;") {
				var match = elem.replace(matchedUser, "<span class='match-box-str'>"+subStr+"</span>");
				$("#list-box").append("<li class='matched-user' data-index='" + (index+1) + "' data-name='" + elem + "'>" + match + "</li>");
			}
		});
		$("#list-box li:nth-child(" + selection + ")").addClass("selected");
	});
	//check for keydown events
	$("#chat-val").keydown(function(k){
		if( $("#chat-val").val() ) {
			$("#chat-form button").addClass("full");
		}

		listLen = $("#list-box .matched-user").size();
		//check for enter key
		if (k.keyCode === 13){
			if ( $("#list-box").attr("style") === "display: inline-block;" ) {
				selectMention();
				return false;
			}
		}
		//check for up key
		if (k.keyCode === 38) {
			selection--;
			if (selection < 1){ selection = listLen}
			$("#list-box li").removeClass("selected");
			return false;
		}
		//check for down key
		if (k.keyCode === 40) {
			selection++;
			if (selection > listLen){ selection = 1}
			$("#list-box li").removeClass("selected");
			return false;
		}
	});
	//mouse hover over user mention
	$(document).on({
		mouseenter: function(){
			$(".matched-user").removeClass("selected");
			selection = $(this).data("index");
			$(this).addClass("selected");
		}
	}, ".matched-user");
	//mouse press on user mention
	$(document).on("click", ".matched-user",function(){
		selectMention();
	});

	function selectMention(){
		//re-enable the submit button
		$("#chat-box button[type='submit']").prop("disabled", false);
		//attach the full user names to the input value
		$("#chat-val").val( $("#chat-val").val() + $("#list-box li:nth-child(" + selection +
		 ")").data("name").split("").slice(subStr.length).join("") );
		//hide list box
		$("#list-box").css({"display": "none"});
		selection = 1;
	}
*/
	//socket response on chat log
	/*
	socket.on("chat log", function(time, who, msg){
		$("#messages").append($("<li class='chat'>").html("[<span class='log'>" + logDate(time) + "</span>] <span class='user'> " + who + "</span>: " + "<p class='chat-text'>" + regexFilter(msg, who) + "</p>" ) );
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	});
	*/
	
	//socket response on chat response
	socket.on("chat response", function(data){
		var matchedUser = checkMutes(data.usernameFull);
		if(!matchedUser) {
			$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <span class='user " + data.level + " " + data.color + "' data-username='" + data.displayName + "' data-usernameFull='" + data.usernameFull + "'> " + data.displayName + "</span>: " + "<p class='chat-text'>" + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		}
		console.log(data)
	});

	//socket response on chat me response
	socket.on("chat me response", function(data){
		var matchedUser = checkMutes(data.usernameFull);
		if(!matchedUser) {
			$("#messages").append($("<li class='chat " + data.color + "'>").html("<span class='time-code'>[" + logDate() + "]</span> <p class='chat-text'><span class='user " + data.level + "' data-displayname='" + data.displayName + "' data-usernameFull='" + data.username + "'> " + data.displayName + "</span> " + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		}
		console.log(data)
	});
	//socket response on update
	socket.on("update", function(data){
		$("#messages").append($("<li class='update'>").html("[UPDATE] " + data.msg) );
		scrollToBottom();
	});
	
/*
	//socket response on command
	socket.on("command", function(msg){
		$("#messages").append($("<li class='command'>").html("[COMMAND] " + msg) );
		scrollToBottom();
	});
*/
	/*
	//socket responses on room entry
	socket.on("user list", function(data){
	});
	*/

	//socket responses on room entry
	socket.on("enter room", function(data){
		$("#messages").append($("<li class='plain'>").html(data.msg) );
		$("#room-list").find(".room").removeClass("inside");
		$("#room-list").find(".room[data-roomname='" + data.room + "']").addClass("inside");
		$("#chat-box #chat-form").find("#chat-val, button").attr("disabled", false);
		room = data.room;
		console.log(data, room);
		scrollToBottom();
	});
	socket.on("leave room", function(data){
		$("#messages").append($("<li class='plain'>").html(data.msg) );
		$("#room-list").find(".room").removeClass("inside");
		$("#chat-box #chat-form").find("#chat-val, button").attr("disabled", true);
		room = data.room;
		console.log(data, room);
		scrollToBottom();
	});
	socket.on("kick", function(data){
		console.log("kick", data, room);
		socket.emit("leave", { "room" : room, "usernameFull" : usernameFull, "displayName" : displayName, "accessLevel" : myLevel });
		scrollToBottom();
	});
	socket.on("new entry", function(data){
		$("#room-list .room ul").find(".user[data-username='" + (data.usernameFull.toLowerCase()) + "']").remove();
		$("#room-list").find(".room[data-roomname='" + data.room + "'] ul").append("<li class='user parent' data-usernameFull='" + data.usernameFull + "' data-username='" + (data.usernameFull.toLowerCase()) + "' data-displayname='" + data.displayName + "'>" + data.displayName + "</li>");
		console.log(data, room);
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
			updateBannedWords: function() {
				if(data.op === "$pull") {
					bannedArr.splice(bannedArr.indexOf(data.word), 1);
				}
				if(data.op === "$push") {
					bannedArr.push(data.word);
				}
			},
			updateRooms: function() {
				if(data.op === "remove") {
					console.log("remove room", data);

					$("#room-list").find(".room[data-roomname='" + data.originalName + "']").remove();
					if(room === data.originalName) {
						socket.emit("leave", { "room" : data.originalName, "usernameFull" : usernameFull, "displayName" : displayName });
						room = "door";
					}
				};
				if(data.op === "update") {
					console.log("update room", data);

					$("#room-list").find(".room[data-roomname='" + data.originalName + "']").attr({
						"data-roomname": data.roomname,
						"data-topic": data.topic
					}).find(".name").text(data.roomname);
				};
				if(data.op === "add") {
					console.log("add room", data);

					$("#room-list > ul").append( $("<li>").attr({
						"data-roomname": data.roomname,
						"data-topic": data.topic,
						"class": "room block parent"
					}).html( $("<span>").addClass("name").text(data.roomname) ).append("<ul>") );
				};
			},
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
		filter = filter.replace(/((http(s)?[:\/\/]*))?([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig, "[deleted link]")
			.replace(/[a-z]{1,}([._-]*)?[a-z]{1,}@[a-z]*.[a-z]*/ig, "[deleted email]");

		//emoticons/////////////
		var smileMatch = /(:[\-]?\)){1}/ig;
		var indifMatch = /(\B(:[\-]?\/)\B){1}/ig;

		//match smile emote
		var smileEmote = filter.match(smileMatch) || [];
		filter = filter.replace(smileMatch, "<span class='emote'><span>" + smileEmote[0] + "</span></span>");

		//match indif emote
		var indifEmote = filter.match(indifMatch) || [];
		filter = filter.replace(indifMatch, "<span class='emote'><span>" + indifEmote[0] + "</span></span>");

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
		//filter banned words
		for(var i = 0; i < bannedArr.length; i++) {
			filter = filter.replace( bannedArr[i], ("*").multiply( (bannedArr[i].length-1) ) );
		}
		return filter;
	}

	//chat message submission
	$('#chat-form').submit(function(){
		socket.emit("chat message", { "msg" : $("#chat-val").val(), "usernameFull" : usernameFull, "displayName" : displayName, "color" : myColor, "level" : myLevel });
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

	///////////////////////////
	// interface interactions//
	///////////////////////////
	$("body").append("<ul id='new-context-menu'></ul>");
	var roomOpts = ["Join", "Leave"];
	var userOpts = ["Mention", "Message", "Mute", "Unmute"];

	function populateContext(arr) {
		if(arr) {
			$("#new-context-menu").html("");
			for(var i = 0; i < arr.length; i++) {
				$("#new-context-menu").append("<li data-option='" + arr[i].toLowerCase() + "'>" + arr[i] + "</li>");
			};
		}
	};

	var click = false, current, contextRoomname, contextUsername, contextUserdisp;
	var options = {
		join: function() {
			socket.emit("join", { "room" : contextRoomname, "usernameFull" : usernameFull, "displayName" : displayName, "accessLevel" : myLevel });
		},
		leave: function() {
			socket.emit("leave", { "room" : room, "usernameFull" : usernameFull, "displayName" : displayName, "accessLevel" : myLevel });
		},
		mention: function() {
			var val = $("#chat-val").val();
			$("#chat-val").val( val + "@" + contextUsername + " ");
		},
		message: function() {
			if(myLevel !== "moderator" || myLevel !== "admin") {
				alert("You do not have appropriate permission to send messages");
			}
		},
		mute: function() {
			myMutes.push(contextUsername);
		},
		unmute: function() {
			myMutes.splice( (myMutes.indexOf(contextUsername)), 1 );
		}
	};

	$("#room-list").on("mousedown", ".room .name", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			contextRoomname = $(this).parent().data("roomname");
			populateContext(roomOpts);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
		} else {
			if(current === $(this).parent().data("roomname")) {
				console.log("current: ", current);
				current = null;
				
				contextRoomname = $(this).parent().data("roomname");
				if(room !== "door") {
					options.leave();
				}
				options.join();
			} else {
				$(this).parent().toggleClass("open");
				current = $(this).parent().data("roomname");
				
				setTimeout(function() {
					current = null;
					console.log("current: ", current);
				}, 250);
			}
		}
	});

	$("#room-list").on("mousedown", ".user", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("username");
			contextUserdisp = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
		} else {
			var val = $("#chat-val").val();
			var userDisp = $(this).data("displayname");
			$("#chat-val").val( val + "@" + userDisp + " ");
		}
	});

	$("#messages").on("mousedown", ".user", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("username");
			contextUsername = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
		} else {
			var val = $("#chat-val").val();
			var userDisp = $(this).data("displayname");
			$("#chat-val").val( val + "@" + userDisp + " ");
		}
	});

	$("#new-context-menu").on("click", "li", function() {
		function muteUser(user) {
			myMutes.push(user);
		}

		var opt = $(this).data("option");
		console.log(opt);

		options[opt.toLowerCase()]();
	});


	$(document).on("click", function(e) {
		$("#new-context-menu").css({
			"display": "none"
		}).html("");
		document.oncontextmenu = null;
	});
}());

function checkMutes(user) {	
	var userReg = new RegExp(user, "gi");
	for(var i = 0; i < myMutes.length; i++) {
		if(myMutes[i].match(userReg)) {
			return true;
		}
	}
}