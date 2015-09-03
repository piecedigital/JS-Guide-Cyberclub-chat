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
	displayName = username,
	userList = [],
	windowFocus = true,
	unread = 0,
	originalTitleMention = "&#x2589;" + $("title").html(),
	originalTitle = $("title").html(),
	showTitle = originalTitle;
	room = "door",
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
	function scrollToBottom() {
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	}

	socket.emit("join", { "username" : username});

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

	//socket response on chat log
	/*
	socket.on("chat log", function(time, who, msg){
		$("#messages").append($("<li class='chat'>").html("[<span class='log'>" + logDate(time) + "</span>] <span class='user'> " + who + "</span>: " + "<p class='chat-text'>" + regexFilter(msg, who) + "</p>" ) );
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	});
	*/
	
	//socket response on chat response
	socket.on("chat response", function(data){
		var matchedUser = checkMutes();
		if(!matchedUser) {
			$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <span class='user " + data.level + " " + data.color + "'> " + data.user + "</span>: " + "<p class='chat-text'>" + regexFilter(data.msg, data.user) + "</p>" ) );
			scrollToBottom();
		}
		console.log(data)
	});

	//socket response on chat me response
	socket.on("chat me response", function(data){
		var matchedUser = checkMutes(data.user);
		if(!matchedUser) {
			$("#messages").append($("<li class='chat " + data.color + "'>").html("<span class='time-code'>[" + logDate() + "]</span> <p class='chat-text'><span class='user " + data.level + "'> " + data.user + "</span> " + regexFilter(data.msg, data.user) + "</p>" ) );
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
	
	//socket responses on room entry
	socket.on("user list", function(data){
	});

	//socket responses on room entry
	socket.on("enter room", function(data){
		$("#messages").append($("<li class='plain'>").html(data.msg) );
		$("#room-list").find(".room").removeClass("inside");
		$("#room-list").find(".room[data-roomname='" + data.room + "']").addClass("inside");
		$("#chat-box #chat-form").find("#chat-val, button").attr("disabled", false);
		room = data.room;
		console.log(data, room)
		scrollToBottom();
	});
	socket.on("new entry", function(data){
		$("#room-list .room ul").find(".user[data-username='" + data.user + "']").remove();
		$("#room-list").find(".room[data-roomname='" + data.room + "'] ul").append("<li class='user parent' data-username='" + data.user + "'>" + data.userDisplay + "</li>");
		scrollToBottom();
	});
	////////////////////////////////
	////////////////////////////////
$("#room-list").find(".room[data-roomname='" + "OPEN" + "']").attr({
						"data-roomname": "data.roomname",
						"data-topic": "data.topic"
					}).find(".name").text("CHANGED");
//////////////////////////////////
//////////////////////////////////

	//socket responses on room entry
	socket.on("live update", function(data){
		$("#messages").append($("<li class='plain'>").html(data.msg) );
		$("#room-list").find(".room").removeClass("inside");
		$("#room-list").find(".room[data-roomname='" + data.room + "']").addClass("inside");
		$("#chat-box #chat-form").find("#chat-val, button").attr("disabled", false);

		var callbacks = {
			updateBannedWords: function() {
				if(data.operation === "$pull") {
					bannedArr.splice(bannedArr.indexOf(data.word), 1);
				}
				if(data.operation === "$push") {
					bannedArr.push(data.word);
				}
			},
			updateRooms: function() {
				if(data.operation === "remove") {
					$("#room-list").find(".room[data-roomname='" + data.room + "']").remove();
				};
				if(data.operation === "update") {
					$("#room-list").find(".room[data-roomname='" + "OPEN" + "']").attr({
						"data-roomname": "data.roomname",
						"data-topic": "data.topic"
					}).find(".name").text("CHANGED");
				};
				if(data.operation === "add") {$("#room-list ul").append( $("<li>").attr({
						"data-roomname": data.roomname,
						"data-topic": data.topic,
						"class": "room block parent"
					}).html( $("<span>").addClass(".name").text(data.roomname) ) );
				};
			},
			updateUsers: function() {
				if(data.operation === "remove") {
					$("#room-list").find(".room .user[data-username='" + data.username + "']").remove();
				};
				if(data.operation === "update") {
					$("#room-list").find(".room .user[data-username='" + data.username + "']").attr({
						"data-username": data.username
					}).text(data.username);
				};
			}
		};
		callbacks[obj.callback];
	});
	//filter chat for links and emites
	function regexFilter(filter, person){
		regUser = new RegExp( displayName, "gi"),

		//smiles
		filter = filter.replace(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig, "<a href='" +
		 filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) +
		  "' target='_blank'>" +
		   filter.match(/(http(s)?[:\/\/]*)([a-z0-9\-]*)([.][a-z0-9\-]*)([.][a-z]{2,3})?([\/a-z0-9?=%_\-&#]*)?/ig) +
		    "</a>");

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
		if(filter.match(regUser) && person.toLowerCase() !== displayName.toLowerCase() ){
			filter = filter.replace(regUser, "<span class='mention'>@"+displayName+"</span>");
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
			filter = filter.replace( bannedArr[i], bannedArr[i][0] + ("*").multiply( (bannedArr[i].length-2) ) );
		}
		return filter;
	}

	//chat message submission
	$('#chat-form').submit(function(){
		socket.emit("chat message", { "msg" : $("#chat-val").val(), "user" : displayName, "color" : myColor, "level" : myLevel });
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
	var roomOpts = ["Join", "leave"];
	var userOpts = ["Mention", "Message", "mute"];

	function populateContext(arr) {
		if(arr) {
			for(var i = 0; i < arr.length; i++) {
				$("#new-context-menu").append("<li data-option='" + arr[i].toLowerCase() + "'>" + arr[i] + "</li>");
			};
		}
	};

	var click = false, current, roomname;
	$("#room-list").on("mousedown", ".room .name", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			roomname = $(this).parent().data("roomname");
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
				
				roomname = $(this).parent().data("roomname");
				socket.emit("join", { "room" : roomname, "username" : username, "displayName" : displayName });
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

	$("#messages").on("mousedown", ".user", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			roomname = $(this).data("username");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
		} else {
			var val = $("#chat-val").val("");
			var user = $(this).data("username");
			$("#chat-val").val( val + "@" + user);
		}
	});

	$("#new-context-menu").on("click", "li", function() {
		var options = {
			join: function() {
				socket.emit("join", { "room" : roomname, "username" : username, "displayName" : displayName });
			},
			leave: function() {
				socket.emit("leave", { "room" : roomname, "username" : username, "displayName" : displayName });
			}
		};

		function muteUser(user) {
			myMutes.push(user);
		}

		var opt = $(this).data("option");
		console.log(opt)
		options[opt]();
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