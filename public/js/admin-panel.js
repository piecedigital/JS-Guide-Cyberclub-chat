// gets user info for admin
var myUsernameFull, myUsername, myLevel;
$.ajax({
  "url": "/query-user",
  "type": "post",
  "dataType": "json",
  data: { _csrf : csrfToken },
  success: function(data) {
    myUsernameFull = data.usernameFull;
    myUsername = myUsernameFull.toLowerCase();
    myLevel = data.accessLevel;
  },
  error: function(err1, err2, err3) {
    confirm2("There was an error retreiving your user data", function(data) {
      console.log(data);
    });
    console.log(err1.status);
    console.log(err2);
    console.log(err3);
  }
});
$.ajax({
  "url": "/chat-status",
  error: function(err1, err2, err3) {
    alert2("Don't forget to open the chat server for regular users!", function(data) {
      console.log(data);
    });
    console.log(err1.status);
    console.log(err2);
    console.log(err3);
  }
});

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

	// panel functions
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
		mainFunctions().ajax("/update-emotes", "POST", "json", { "emote" : emote, "op" : "$pull" });
	});
	// recommened emote deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes']").on("click", ".close", function() {
		var emote = $(this).parent().data("emote");
		mainFunctions().ajax("/update-recommended-emotes", "POST", "json", { "emote" : emote, "op" : "$pull" });
	});
	// banned word deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Banned Words']").on("click", ".close", function() {
		var word = $(this).parent().data("word");
		mainFunctions().ajax("/update-banned", "POST", "json", { "word" : word, "op" : "$pull" });
	});
	// banned ip deletion
	panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses']").on("click", ".close", function() {
		var addr = $(this).parent().data("addr");
		mainFunctions().ajax("/update-ips", "POST", "json", { "ip" : addr, "op" : "$pull" });
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
	panels.users.find("#item-list").on("click", ".item .name", function() {
		// variables
		var thisFirstName = $(this).attr("data-first-name"),
			thisLastName = $(this).attr("data-last-name"),
			thisEmail = $(this).attr("data-email"),
      thisBan = $(this).attr("data-is-banned") === "true" ? true : false;
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

		panels.users.find("#item-options").removeClass("invisible");
		panels.users.find(".add-window").find("label.user-gov-name").text(thisFirstName + " " + thisLastName);
		panels.users.find(".add-window").find("label.user-email").text(thisEmail);
		panels.users.find(".add-window").find("input[name='newusername']").val(thisUsername);
		panels.users.find(".add-window").find("select[name='accesslevel']")[0]
			.selectedIndex = (selectKey[thisAccessLevel]);
		panels.users.find(".add-window").find("select.edit-user").val("1");
    panels.users.find(".add-window").find("select.edit-user")[0].selectedIndex = thisBan ? 1 : 0;
	});

  // filtering user list
  $(".filter .search-users").on("keyup keydown", function(e) {
    var filter = $(this).val();
    var itemList = $(this).parent().parent().find("#item-list");
    console.log(itemList);
    if(filter) {
      $(itemList).find(".item").hide();
      $(itemList).find(".item span[data-usernamefull*=" + filter + "]").parent().show();
    } else {
      $(itemList).find(".item").show();
    };
  });

	// form submission handling
	$(document).on("submit", ".add-window", function(e) {
		var formData = $(this).serializeArray();

		var dataObj = mainFunctions().parseForm(formData);
		dataObj.adminLevel = myLevel;

		if(dataObj.newusername) {
			dataObj.originalName = thisUsername || dataObj.usernameFull;
		}
		if(dataObj.roomname) {
			dataObj.originalName = thisRoomname || dataObj.roomname;
		}
		var action = mainFunctions().parseAction(e);

		if(dataObj.ban) {
			if(dataObj.ban === "DEL") {
				confirm2("Are you sure you want to delete " + thisUsername + "? This operation cannot be reversed", function(res) {
					if(res.action === "true") {
						mainFunctions().ajax(action, "POST", "json", dataObj);
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
											mainFunctions().ajax(action, "POST", "json", dataObj);
										} else {
											alert2("Operation cancelled");
										}
									});
								} else {
									mainFunctions().ajax(action, "POST", "json", dataObj);
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
					mainFunctions().ajax(action, "POST", "json", dataObj);
				} else {
					alert2("Operation cancelled");
				}
			});
		} else {
			mainFunctions().ajax(action, "POST", "json", dataObj);
		}

		// don't send the form so the page doesn't reload
		return false;
	});

	//////////////////////////////////////////////
	// an object of functions to use externally //
	//////////////////////////////////////////////
	var mainFunctions = function(functionsCallback) {
    return {
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
      parseQuery: function(queryStr) {
        var returnObj = {};
        // console.log(queryStr)
        queryStr.split(/;[\s]*/).map(function(pairs) {
          // console.log(pairs)
          pairs = pairs.split("=");
          // console.log(pairs)
          returnObj[pairs[0]] = pairs[1];
        });

        return returnObj;
      },
  		ajax: function(url, method, dType, dataObj) {
  			dataObj._csrf = csrfToken;
        if(url.match(/null$/i)) return false;
  			$.ajax({
  				url: url,
  				type: method,
  				dataType: dType,
  				data: dataObj,
  				success: function(data) {
  					// console.log(data);
  					if(!data.quiet) alert2(data.msg);

  					if(data.action === "callback") {
  						if(typeof data.callback === "object") {
  							for(var i = 0; i < data.callback.length; i++) {
  								mainFunctions()[data.callback[i]](data.data[i], data.op[i]);
  							}
  						} else {
  							mainFunctions()[data.callback](data.data, data.op)
  						}
  					} else {
              if(typeof functionsCallback === "function") {
                functionsCallback(data);
              }
            }
  				},
  				error: function(error1, error2, error3) {
  					console.log(error1.status);
  					console.log(error2);
  					console.log(error3);
  					console.log(error1.responseText || "No response from server");
  					alert2(error1.responseText);
  				}
  			});
  		},
  		updateBannedEmotes: function(data, operation) {
  			console.log(data, operation);
  			if(operation === "$pull") {
  				// console.log("removing");

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned Emotes'] #banned-list").find(".emote[data-emote='" + data + "']").remove();

  			}
  			if(operation === "$push") {
  				// console.log("adding");
  				// console.log(data);

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned Emotes'] #banned-list").append("<li class='emote' data-emote='" + data + "'>" + data + "<div class='close'>x</div></li>");
  			}
  			socket.emit("live update", { "callback" : "updateBannedEmotes", "op" : operation, "emote" : data });
  		},
  		updateRecommendedEmotes: function(data, operation) {
  			// console.log(data, operation);
  			if(operation === "$pull") {
  				// console.log("removing");

  				panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes'] #recommended-list").find(".emote[data-emote='" + data + "']").remove();

  			}
  			if(operation === "$push") {
  				// console.log("adding");
  				// console.log(data);

  				panels.chatOpt.find("#item-options .option-box[data-section='Recommended Emotes'] #recommended-list").append("<li class='emote' data-emote='" + data + "'>" + data + "<div class='close'>x</div></li>");
  			}
  			socket.emit("live update", { "callback" : "updateRecommendedEmotes", "op" : operation, "emote" : data });
  		},
  		updateBannedWords: function(data, operation) {
  			// console.log(data, operation);
  			if(operation === "$pull") {
  				// console.log("removing");

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned Words'] #banned-list").find(".word[data-word='" + data + "']").remove();

  			}
  			if(operation === "$push") {
  				// console.log("adding");
  				// console.log(data);

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned Words'] #banned-list").append("<li class='word' data-word='" + data + "'>" + data + "<div class='close'>x</div></li>");
  			}
  			socket.emit("live update", { "callback" : "updateBannedWords", "op" : operation, "word" : data });
  		},
  		updateBannedAddrs: function(data, operation) {
  			// console.log(data, operation);
  			if(operation === "$pull") {
  				// console.log("removing");

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses'] #banned-list").find(".addr[data-addr='" + data + "']").remove();

  			}
  			if(operation === "$push") {
  				// console.log("adding");
  				// console.log(data);

  				panels.chatOpt.find("#item-options .option-box[data-section='Banned IP Addresses'] #banned-list").append("<li class='addr' data-addr='" + data + "'>" + data + "<div class='close'>x</div></li>");
  			}
  		},
  		updateRooms: function(data, operation) {
  			// console.log(data, operation);
  			if(operation) {
  				// console.log("removing");

  				panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']").parent().remove();

  				socket.emit("live update", { "callback" : "updateRooms", "op" : "remove", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
  			} else {
  				// console.log("updating");

  				var tag = panels.rooms.find("#item-list").find(".item .name[data-roomname='" + data.originalName + "']") || "";

  				if(tag.length > 0) {
  					// console.log("updating");

  					tag.attr({
  						"data-roomname": data.roomname,
  						"data-topic": data.topic,
  						"data-mods": data.minMods
  					})
  					.html(data.roomname);

  					socket.emit("live update", { "callback" : "updateRooms", "op" : "update", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
  				} else {
  					// console.log("adding");

  					panels.rooms.find("#item-list").prepend("<li class='item parent'><span class='name' data-roomname='" + data.roomname + "' data-topic='" + data.topic + "' data-mods='" + data.minMods + "'>" + data.roomname + "</span></li>");

  					socket.emit("live update", { "callback" : "updateRooms", "op" : "add", "roomname" : data.roomname, "originalName" : data.originalName, "topic" : data.topic });
  				}
  				thisRoomname = data.roomname;
  			}
  		},
  		updateUsers: function(data, operation) {
  			// console.log(data, operation);
  			if(operation) {
  				if(operation === "DEL") {
  					var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent();

  					tag.find(".name").attr("data-usernamefull", data.newName).remove();
  					thisUsername = null;

  					socket.emit("live update", { "callback" : "updateUsers", "op" : "remove", "usernameFull" : data.usernameFull, "newName" : data.newName });
  				} else {
  					// console.log("banning");

  					var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent();

  					tag.find(".number").addClass("banned-true");
  					tag.find(".name").attr("data-usernamefull", data.newName).html(data.newName);
  					thisUsername = data.newName;

  					socket.emit("live update", { "callback" : "updateUsers", "op" : "remove", "usernameFull" : data.usernameFull, "newName" : data.newName });
  				}

  			} else {
  				// console.log("updating");

  				var tag = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + data.usernameFull + "']").parent()

  				tag.find(".number").removeClass("banned-, banned-true");
  				tag.find(".name").attr("data-usernamefull", data.newName).html(data.newName);
  				thisUsername = data.newName;

  				socket.emit("live update", { "callback" : "updateUsers", "op" : "update", "usernameFull" : data.usernameFull, "newName" : data.newName, "accessLevel" : data.accessLevel });
  			}
  		},
  		updateColors: function(data, operation) {
  			// console.log(data, operation);
  			socket.emit("live update", { "callback" : "updateColors", "colorData" : data });
  		},
  		kickRegs: function() {
  			socket.emit("live update", { "callback" : "kickRegs" });
  		}
  	}
  };
  // live update
  var cookies = mainFunctions().parseQuery(document.cookie);
// console.log(cookies)
  var updateInterval = parseInt(cookies.updateInterval) || 5,
      shouldUpdate = (cookies.shouldUpdate && cookies.shouldUpdate === "true") ? true : false || true; // seconds

  function updateAdminPanel(data) {
    var collectionActions = {
      users: function() {
        // console.log(data)
        data.data.map(function(elem) {
          var element = panels.users.find("#item-list").find(".item .name[data-usernamefull='" + elem.usernameFull + "']").parent();
          if(element.length > 0) {
            $(element).find(".name")
            .attr({
              "data-username": elem.username,
              "data-usernamefull": elem.usernameFull,
              "data-first-name": elem.firstName,
              "data-last-name": elem.lastName,
              "data-email": elem.email,
              "data-accesslevel": elem.accessLevel
            })
            .text(elem.usernameFull)
            .parent().find(".number")
            .attr("class", "number" + (elem.banned ? " banned-true" : "") );
          } else {
            if(elem.username !== myUsername) {
              panels.users.find("#item-list")
              .append(
                $("<li>")
                .addClass("item parent")
                .append(
                  $("<span>")
                  .addClass("name")
                  .attr({
                    "data-username": elem.username,
                    "data-usernamefull": elem.usernameFull,
                    "data-first-name": elem.firstName,
                    "data-last-name": elem.lastName,
                    "data-email": elem.email,
                    "data-accesslevel": elem.accessLevel
                  })
                  .text(elem.usernameFull),
                  $("<span>")
                  .attr("className", "number")
                )
              )
            };
          };
        });
      },
      rooms: function() {
        // console.log(data)
        var currentRooms = [];
        panels.rooms.find("#item-list").find(".item.parent").map(function(ind, elem) {
          currentRooms.push($(elem).find(".name")[0].attributes["data-roomname"].value);
        });
        // console.log(currentRooms)
        data.data.map(function(elem) {
          var parent = panels.rooms.find("#item-list"),
              element = parent.find(".item .name[data-roomname='" + elem.roomname + "']").parent();

          if(element.length > 0) {
            // removeu room from list of current rooms
            var currRoomIndex = currentRooms.indexOf(elem.roomname);
            if(currRoomIndex >= 0) {
              currentRooms.splice( currRoomIndex, 1 );
            };

            // update an existing room
            $(element).find(".name")
            .attr({
              "data-roomname": elem.username,
              "data-topic": elem.usernameFull,
              "data-mods": elem.firstName
            })
            .text(elem.roomname)
          } else {
            // add a non-existant room
            panels.rooms.find("#item-list")
            .prepend(
              $("<li>")
              .addClass("item parent")
              .html(
                $("<span>")
                .attr({
                  "class": "name",
                  "data-roomname": elem.roomname,
                  "data-roomnameHyph": elem.roomnameHyph,
                  "data-topic": elem.topic,
                  "data-mods": elem.minMods
                })
                .text(elem.roomname)
              )
            )
          };
        });
        // console.log(currentRooms)
        // remove remaining rooms as they no longer exist
        currentRooms.map(function(elem) {
          panels.rooms.find("#item-list").find(".item .name[data-roomname='" + elem + "']").parent().remove();
        });
      },
      chatOptions: function() {
        // console.log(data);
        var sections = {

          levelColors: {
            name: "Access Level Colors",
            type: null
          },
          bannedWords: {
            name: "Banned Words",
            adjective: "word",
            type: "list"
          },
          bannedEmotes: {
            name: "Banned Emotes",
            adjective: "emote",
            type: "list"
          },
          recommendedEmotes: {
            name: "Recommended Emotes",
            adjective: "emote",
            type: "list"
          }
        };

        data.data.map(function(elem) {
          var optionSection = panels.chatOpt.find("#item-options"),
          currentSection = sections[elem.optionName].name,
          adjective = sections[elem.optionName].adjective;

          if(sections[elem.optionName].type === "list") {
            var list = optionSection.find("[data-section='"+currentSection+"']").find("#banned-list");
            if(list.length === 0) {
              list = optionSection.find("[data-section='"+currentSection+"']").find("#recommended-list");
            };
            // console.log(list)

            var currentItems = [];
            $(list).find("li").map(function(ind, elem2) {
              currentItems.push($(elem2)[0].attributes["data-"+adjective].value);
            });
            if(list.length > 0) {
              elem.list.map(function(listItem) {
                var existingItem = $(list).find("li[data-"+adjective+"='"+listItem+"']");
                // remove item from currentItems
                var existanceIndex = currentItems.indexOf(listItem);
                if(existanceIndex >= 0) {
                  currentItems.splice(existanceIndex, 1);
                };

                if(existingItem.length === 0) {
                  $(list).append(
                    $("<li>")
                    .attr({
                      class: adjective,
                      "data-word": listItem,
                      "data-emote": listItem
                    })
                    .text(listItem)
                    .append(
                      $("<div>")
                      .addClass("close")
                      .text("X")
                    )
                  );
                }
              });

              currentItems = currentItems.filter(function(item) {
                $(list).find("li[data-"+adjective+"='"+item+"']").remove();
              });
            }
          } else {
            var colorList = optionSection.find("[data-section='"+currentSection+"']");
            var itemsKeys = Object.keys(elem.list);
            itemsKeys.map(function(key) {
              $(colorList).find("input[name='"+key+"Color']").val(elem.list[key]);
            });
          }
        });
      }
    };
    collectionActions[data.collection]();
  };
  var startQueryCount = function() {
    var queryForData = function() {
      // console.log("I'm updating!");
      var collections = [{ name : "users", use : true }, { name : "rooms", use : true }, { name : "chatOptions", use : true }];
      collections.map(function(coll) {
        if(coll.use) {
          mainFunctions(updateAdminPanel).ajax("/get-db-data/" + coll.name, "POST", "json", { "collection" : coll.name });
        }
      });

    };
    // call this function if shouldUpdate is true
    if(shouldUpdate) queryForData();
    setTimeout(function() {
      startQueryCount();
    }, updateInterval * 1000);
  };
  startQueryCount();

  // catch all forms with interfere in their class
  $("form.interfere").on("submit", function(e) {
    e.preventDefault();

    // if form has class panel-opt
    if($(e.target).hasClass("panel-opt")) {
      var formData = $(e.target).serializeArray(),
      formDataObj = {};
      formData.map(function(elem) {
        formDataObj[elem.name] = elem.value;
      });
      updateInterval = parseInt(formDataObj.interval);
      shouldUpdate = (formDataObj.update === "true") ? true : false;

      document.cookie = "updateInterval=" + updateInterval;
      document.cookie = "shouldUpdate=" + shouldUpdate;
      alert2("Changes Saved");
    };
  });
}());
