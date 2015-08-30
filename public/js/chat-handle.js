~(function () {
	var socket = io(),
	usernameFull = $("#username").data("username"),
	username = usernameFull.toLowerCase(),
	displayName = username,
	userList = [], listArray = [],
	windowFocus = true,
	unread = 0,
	originalTitleMention = "&#x2589;" + $("title").html(),
	originalTitle = $("title").html(),
	showTitle = originalTitle;
	room = "door",
	myColor = "black";

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
	//get user list
	socket.on("user list", function(list){
		listArray = list.split(/[,.]/gi);
		listArray.pop();
		userList = list;
		$("#user-list").text(userList);
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
		var matchedUser = new RegExp("\\b(" + subStr + ")", "gi");
		$("#list-box").html("");
		listArray.map(function(elem, index){
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
			$("#chat button").addClass("full");
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
		$("#chat-box input[type='submit']").prop("disabled", false);
		//attach the full user names to the input value
		$("#chat-val").val( $("#chat-val").val() + $("#list-box li:nth-child(" + selection +
		 ")").data("name").split("").slice(subStr.length).join("") );
		//hide list box
		$("#list-box").css({"display": "none"});
		selection = 1;
	}

	//socket response on chat log
	socket.on("chat log", function(time, who, msg){
		$("#messages").append($("<li class='chat'>").html("[<span class='log'>" + logDate(time) + "</span>] <span class='user'> " + who + "</span>: " + "<p class='chat-text'>" + regexFilter(msg, who) + "</p>" ) );
		$("#messages")[0].scrollTop = $("#messages")[0].scrollHeight;
	});
	//socket response on chat response
	socket.on("chat response", function(data){
		$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <span class='user " + data.color + "'> " + data.user + "</span>: " + "<p class='chat-text'>" + regexFilter(data.msg, data.user) + "</p>" ) );
		console.log(data)
		scrollToBottom();
	});
	//socket response on update

	socket.on("update", function(data){
		$("#messages").append($("<li class='update'>").html("[UPDATE] " + data.msg) );
		scrollToBottom();
	});
	
	//socket response on command
	socket.on("command", function(msg){
		$("#messages").append($("<li class='command'>").html("[COMMAND] " + msg) );
		scrollToBottom();
	});

	//socket responses on room entry
	socket.on("enter room", function(data){
		$("#messages").append($("<li class='plain'>").html(data.msg) );
		$("#room-list").find(".room").removeClass("inside");
		$("#room-list").find(".room[data-roomname='" + data.room + "']").addClass("inside");
		$("#chat-box #chat-form").find("#chat-val, button").attr("disabled", false);
		var room = data.room;
		console.log(data, room)
		scrollToBottom();
	});
	socket.on("new entry", function(data){
		$("#room-list .room ul").find(".user[data-username='" + data.username + "']").remove();
		$("#room-list").find(".room[data-roomname='" + data.room + "'] ul").append("<li class='user parent' data-username='" + data.username + "'>" + data.userDisplay + "</li>");
		scrollToBottom();
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
		//smiles
		filter = filter.replace(/(:\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
		filter = filter.replace(/(:\-\))/ig, "<img id='smile' src='/images/emojis/smile.png'>");
		//indifferents
		filter = filter.replace(/\B(:\/)\B/ig, "<img id='indif' src='/images/emojis/indif.png'>");
		filter = filter.replace(/(:\-\/)/ig, "<img id='indif' src='/images/emojis/indif.png'>");
		//match mentions
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
		return filter;
	}

	//chat message submission
	$('#chat-form').submit(function(){
		socket.emit("chat message", { "msg" : $("#chat-val").val(), "user" : displayName, "color" : myColor });
		$("#chat-val").val("");
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

	$("body").append("<ul id='new-context-menu'><li data-option='join'>Join</li></ul>");
	var click = false, current, roomname;
	$("#room-list").on("mousedown", ".room", function(e) {
		if(e.buttons === 2) {
			document.oncontextmenu = function() {
				return false;
			};
			roomname = $(this).data("roomname");
			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
		} else {
			if(current === $(this).data("roomname")) {
				console.log("current: ", current);
				current = null;
				
				roomname = $(this).data("roomname");
				socket.emit("join", { "room" : roomname, "username" : username, "displayName" : displayName });
			} else {
				$(this).toggleClass("open");
				current = $(this).data("roomname");
				
				setTimeout(function() {
					current = null;
					console.log("current: ", current);
				}, 250);
			}
		}
	});

	$("#new-context-menu").on("click", "li", function() {
		var options = {
			join: function() {
				socket.emit("join", { "room" : roomname, "username" : username, "displayName" : displayName });
			},
			leave: function() {
				socket.emit("join", { "room" : roomname, "username" : username, "displayName" : displayName });
			}
		};

		var opt = $(this).data("option");
		console.log(opt)
		options[opt]();
	});


	$(document).on("click", function(e) {
		$("#new-context-menu").css({
			"display": "none"
		});
		document.oncontextmenu = null;
	});
}());