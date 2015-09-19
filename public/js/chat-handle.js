String.prototype.multiply = function(times) {
	var arr = [];
	var tick = 0;
	while(tick < times) {
		arr.push(this);
		tick++;
	}

	return arr.join("");
};

function checkMutes(myMutes, user) {	
	var userReg = new RegExp(user, "gi");
	for(var i = 0; i < myMutes.length; i++) {
		if(myMutes[i].match(userReg)) {
			return true;
		}
	}
}

// generate private message window
var generatePM = function(initName, reciName) {
	var frameName = reciName + "-frame";

	$(".pm-box[data-id='" + frameName + "']").remove();

	var theCloser = $("<div>").addClass("tool closer").html("&#x2716;"),
			theMover = $("<div>").addClass("tool mover").html("&#x2630;"),
			theSpinner = $("<div>").addClass("spinner"),
			theFrame = $("<iframe>").attr({
				"name": frameName,
				"frameborder": 0,
				"width": "100%",
				"height": "100%"
			}),
			theForm = $("<form>").attr({
				"id": frameName,
				"target": frameName,
				"action": "/pm/" + initName + "/" + reciName,
				"method": "post"
			}).html( $("<input>").attr({ "type": "hidden" }) ),
			theScript = $("<script>").html("$('#" + frameName + "').submit()");

	$("#pm-section > div > div").append(
		$("<div>").attr({ "class" : "pm-box", "data-id" : frameName }).html(
			$("<div>").addClass("parent").attr({
				"style": "width: 100%; height: 100%; padding: 0 0 1.4em"
			}).append(
				$("<div>").addClass("tools").append(
					theCloser,
					theMover
					),
				theFrame,
				theForm,
				theScript
				)
			)
		);
};

$(document).on("mousedown", ".pm-box .closer", function() {
	$(this).parent().parent().parent().remove();
});

$(document).on("mousedown", ".pm-box .mover", function() {
	$(this).parent().parent().parent().toggleClass("closed");
});

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
	room = "door",
	myColor = "red",
	myLevel = $("#user-data").data("access"),
	myMutes = [];

// socket log
var socketLog = function() {
	socket.emit("console.log", arguments);
}
//
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

	$("#chat-val").keydown(function(k){
		if( $("#chat-val").val() ) {
			$("#chat-form button").addClass("full");
		}
	});
	
	//socket response on chat response
	socket.on("chat response", function(data){
		var matchedUser = checkMutes(myMutes, data.usernameFull);
		if(!matchedUser) {
			$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <span class='user " + data.level + "' data-displayname='" + data.displayName + "' data-usernameFull='" + data.usernameFull + "'> " + data.displayName + "</span>: " + "<p class='chat-text' style='color:" + data.color + "'>" + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		}
		console.log(data)
	});

	//socket response on chat me response
	socket.on("chat me response", function(data){
		var matchedUser = checkMutes(myMutes, data.usernameFull);
		if(!matchedUser) {
			$("#messages").append($("<li class='chat'>").html("<span class='time-code'>[" + logDate() + "]</span> <p class='chat-text' style='color: " + data.color + "'><span class='user " + data.level + "' data-displayname='" + data.displayName + "' data-usernameFull='" + data.usernameFull + "'> " + data.displayName + "</span> " + regexFilter(data.msg, data.displayName) + "</p>" ) );
			scrollToBottom();
		}
		console.log(data)
	});
	//socket response on update
	socket.on("update", function(data){
		$("#messages").append($("<li class='update'>").html("[UPDATE] " + data.msg) );
		scrollToBottom();
	});
	
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
		$("#room-list").find(".room[data-roomname='" + data.room + "'] ul").append("<li class='user parent' data-usernameFull='" + data.usernameFull + "' data-username='" + (data.usernameFull.toLowerCase()) + "' data-displayname='" + data.displayName + "'><span class='icon " + data.accessLevel + "'></span>" + data.displayName + "</li>");
		console.log(data, room);
		scrollToBottom();
	});
	socket.on("generate pm", function(data) {
		if(data.to === usernameFull) {
			generatePM(data.from, data.to);
		}
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
					var currTopic = $("#room-list").find(".room[data-roomname='" + data.originalName + "']").attr("data-topic");

					$("#room-list").find(".room[data-roomname='" + data.originalName + "']").attr({
						"data-roomname": data.roomname,
						"data-topic": data.topic
					}).find(".name").text(data.roomname);
					if(room === data.roomname) {
						$("#messages").append($("<li class='update'>").html("[UPDATE] The room topic is now: <span class='bold'>" + data.topic + "</span>") );
						scrollToBottom();
					}
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
					if(usernameFull === data.usernameFull) {
						window.location.href = "/banned/account";
					}
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
				"}"+
				"/*room list icon*/"+
				".icon.regular {"+
					"background: " + data.colorData.regular + ";"+
				"}"+
				".icon.teen-mod {"+
					"background: " + data.colorData.teenMod + ";"+
				"}"+
				".icon.junior-mod {"+
					"background: " + data.colorData.juniorMod + ";"+
				"}"+
				".icon.moderator {"+
					"background: " + data.colorData.moderator + ";"+
				"}"+
				".icon.admin {"+
					"background: " + data.colorData.admin + ";"+
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

	///////////////////////////
	// interface interactions//
	///////////////////////////
	$("body").append("<ul id='new-context-menu'></ul>");
	var roomOpts = ["Join", "Leave"];
	var userOpts = ["Mention", "Message", "Mute", "Unmute", "cancel"];

	function populateContext(arr) {
		if(arr) {
			$("#new-context-menu").html("");
			for(var i = 0; i < arr.length; i++) {
				$("#new-context-menu").append("<li data-option='" + arr[i].toLowerCase() + "'>" + arr[i] + "</li>");
			};
		}
	};

	var click = false, cancel = true, currentRoom, contextRoomname, contextUsername, contextUserdisp, fingerPos={};
	var options = {
		join: function() {
			socket.emit("join", { "room" : contextRoomname, "usernameFull" : usernameFull, "displayName" : displayName, "accessLevel" : myLevel });
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		leave: function() {
			socket.emit("leave", { "room" : room, "usernameFull" : usernameFull, "displayName" : displayName, "accessLevel" : myLevel });
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		mention: function() {
			var val = $("#chat-val").val();
			$("#chat-val").val( val + "@" + contextUsername + " ");
			contextUsername = null;
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		message: function() {
			if(myLevel === "admin" || myLevel === "moderator") {
				socket.emit("private message", { "to" : contextUsername, "from" : usernameFull });
				generatePM(usernameFull, contextUsername);
			} else {
				$("#messages").append($("<li class='plain'>").html("You do not have appropriate authority to send private messages.") );
				scrollToBottom();
			}
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		mute: function() {
			var cxtLC = contextUsername.toLowerCase();

			if(cxtLC !== username) {
				if(myMutes.indexOf(cxtLC) < 0) {
					myMutes.push(cxtLC);
					$("#room-list .room ul").find(".user[data-username='" + (cxtLC) + "']").find(".icon").addClass("muted");
				}
			}
			contextUsername = null;
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		unmute: function() {
			myMutes.splice( (myMutes.indexOf(contextUsername.toLowerCase())), 1 );
			$("#room-list .room ul").find(".user[data-username='" + (contextUsername.toLowerCase()) + "']").find(".icon").removeClass("muted");
			contextUsername = null;
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		cancel: function() {
			console.log("cancel", cancel);
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		}
	};

	$(document).on({
		mousedown:  function(e) {
			if(e.buttons) {
				console.log("doc first")
				if(cancel) {
					$("#new-context-menu").css({
						"display": "none"
					}).html("");
					document.oncontextmenu = null;
				}
			}
		},
		touchstart:  function(e) {
			if(!e.buttons) {
				console.log("doc first")
				if(cancel) {
					$("#new-context-menu").css({
						"display": "none"
					}).html("");
					document.oncontextmenu = null;
				}
			}
		},
		scroll:  function(e) {
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		touchmove:  function(e) {
			$("#new-context-menu").css({
				"display": "none"
			}).html("");
			document.oncontextmenu = null;
		},
		mouseup: function(e) {
			if(e.buttons) {
				click = false;
				console.log("up");
				setTimeout(function() {
					currentRoom = null;
					console.log("current: ", currentRoom);
				}, 250);
			}
		},
		touchend:  function() {
			if(!e.buttons) {
				//socketLog("touche end")
				click = false;
				console.log("up");
				setTimeout(function() {
					currentRoom = null;
					console.log("current: ", currentRoom);
				}, 250);
			}
		}
	});

	$("#room-list").on("mousedown", ".room .name", function(e) {
		if(e.buttons) {
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
				cancel = false;
				setTimeout(function() {
					cancel = true;
				}, 10);
			} else {
				if(currentRoom === $(this).parent().data("roomname")) {
					console.log("current: ", currentRoom);
					currentRoom = null;
					
					contextRoomname = $(this).parent().data("roomname");
					if(room !== "door") {
						options.leave();
					}
					options.join();
					cancel = true;
				} else {
					$(this).parent().toggleClass("open");
					currentRoom = $(this).parent().data("roomname");
					click = true;
					cancel = true;
					setTimeout(function() {
						currentRoom = null;
					}, 250);
					console.log("current: ", currentRoom);
				}
			}			
		}
	});
	
	$("#room-list").on("touchstart", ".room .name", function(e) {
		if(!e.buttons) {
			if(currentRoom === $(this).parent().data("roomname")) {
				console.log("current: ", currentRoom);
				currentRoom = null;
				
				contextRoomname = $(this).parent().data("roomname");
				if(room !== "door") {
					options.leave();
				}
				options.join();
				cancel = true;
			} else {
				$(this).parent().toggleClass("open");
				currentRoom = $(this).parent().data("roomname");
				cancel = false;
				console.log("current: ", currentRoom);
				setTimeout(function() {
					cancel = true;
					currentRoom = null;
					console.log("current: ", currentRoom);
				}, 250);
			}
		}
	});

	$("#room-list").on("mousedown", ".user", function(e) {
		if(e.buttons) {
			e.stopPropagation();
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("usernamefull");
			contextUserdisp = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
			cancel = false;
			setTimeout(function() {
				cancel = true;
				socketLog(cancel);
			}, 10);
		}
	});

	$("#room-list").on("touchstart", ".user", function(e) {
		if(!e.buttons) {
			e.stopPropagation();
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("usernamefull");
			contextUserdisp = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
			cancel = false;
			setTimeout(function() {
				cancel = true;
			}, 10);
		}
	});

	$("#messages").on("mousedown", ".user", function(e) {
		e.stopPropagation();
		if(e.buttons) {
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("usernamefull");
			contextUserdisp = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
			cancel = false;
			setTimeout(function() {
				cancel = true;
			}, 10);
		}
	});

	$("#messages").on("touchstart", ".user", function(e) {
		if(!e.buttons) {
			document.oncontextmenu = function() {
				return false;
			};
			contextUsername = $(this).data("usernamefull");
			contextUserdisp = $(this).data("displayname");
			populateContext(userOpts);
			console.log("user right clicked", this);

			$("#new-context-menu").css({
				"top": e.clientY,
				"left": e.clientX,
				"display": "block"
			});
			click = true;
			cancel = false;
			setTimeout(function() {
				cancel = true;
			}, 10);
		}
	});

	$("#new-context-menu").on("mousedown", "li", function(e) {
		if(e.buttons) {
			var opt = $(this).data("option");
			console.log(opt);

			options[opt.toLowerCase()]();
		}
	});

	$("#new-context-menu").on("touchstart", "li", function(e) {
		if(!e.buttons) {
			var opt = $(this).data("option");
			console.log(opt);

			options[opt.toLowerCase()]();
		}
	});

	$("#chat-box .tab").on("mousedown", function(e) {
		if(e.buttons) {
			if(e.buttons === 1) {
				$("#chat-box").toggleClass("open-side");
			}
		}
	});

	$("#chat-box .tab").on("touchstart", function(e) {
		if(!e.buttons) {
			$("#chat-box").toggleClass("open-side");
		}
	});

	$("#chat-box div #tools").on("mousedown", "#timestamp", function(e) {
		if(e.buttons) {
			if(e.buttons === 1) {
				var checked = $(this).prop("checked");
				if(checked) {
					$("#messages").removeClass("show-time");
				} else {
					$("#messages").addClass("show-time");
				}
			}
		}
	});

	$("#chat-box div #tools").on("touchstart", "#timestamp", function(e) {
		if(!e.buttons) {
			var checked = $(this).prop("checked");
			if(checked) {
				$("#messages").removeClass("show-time");
			} else {
				$("#messages").addClass("show-time");
			}
		}
	});

}());