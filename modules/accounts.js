console.log("required store module\r\n");

var app = require('express')(),
    bcrypt = require("bcryptjs"),
    MongoClient  = require("mongodb"),
    ObjectId = require("mongodb").ObjectID;

var mailer = require("./mailer");


// (Assuming you're using express - expressjs.com)
// Get the credit card details submitted by the form
module.exports = function(db) {
  var User = db.collection("users"),
      Pending = db.collection("pending"),
      Sess = db.collection("sessions"),
      IPA = db.collection("bannedIPs"),
      Chat = db.collection("chatOptions");

  var generateKey = function(Save, dbObj, email, usernameFull, msgToUser, res) {
    console.log("creating match ID...");

    // creates a library of characters to crea a key from
    var keyLibrary = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-0123456789".split("");
    // numbers each attempt
    var tries = 1;

    // internal function to make the actual key
    var makeKey = function(re) {
      re = re || "";
      console.log(re + "generating ID... attempt " + tries);
      // creates variables to...
      var count = 8 + (Math.round(Math.random() * 2)),// ... create the maximum length of the string...
        itter = 0,// ... sets an variable for the while loop that should not pass the "count" variable...
        key = "";// ... and the outside declaration of the "key" variable.

      // adds a new character to the key string while "itter" is not
      while(itter <= count) {
        itter++;
        // picks a random character out of the "keyLibrary"
        key += keyLibrary[Math.round(Math.random() * (keyLibrary.length - 1))];
      }

      console.log("Generated id: " + key);

      // checks for a duplicate key
      Pending.findOne({ "validationId" : key }, function(pendQErr, pendQDoc) {
        if(pendQErr) throw pendQErr;

        if(pendQDoc) {
          console.log("duplicate id: " + key);
          tries++; 
          makeKey("re");
        } else {
          saveAccount(Save, dbObj, email, usernameFull, msgToUser, res, key);
        }
      });

    };// end makeKey

    makeKey();
  }// end generateId

  var saveAccount = function(Save, dbObj, email, usernameFull, msgToUser, res, validationId) {
    dbObj.validationId = validationId;

    Pending.insert(dbObj, function(insertErr, insertedDoc) {
      if(insertErr) throw insertErr;

      if(insertedDoc) {
        console.log("account created \n\r");

        mailer("Confirm admin profile", email, usernameFull, "A new user, " + usernameFull + ", has submitted the form for admin access.<br><br>If this is an approved user please click the link below to confirm this new account:<br><br>http://localhost:8081/validate?key=" + validationId + "<br><br>If this is not an approved user submission, use this link to cancel the request: http://localhost:8081/cancel?key=" + validationId).mailPost();

        res.render("signupin", { "title" : "Sign Up/Login", "msg" : msgToUser, "sign-checked" : "", "log-checked" : "checked" });
      }
    });
  };

  return {
    signup: function(req, res, next) {
      //sets up variables that's be used
      var email = req.body.email.toLowerCase() || "",
          username = req.body.username.toLowerCase() || "",
          usernameFull = req.body.username || "",
          password = req.body.password || "",
          passwordConf = req.body.passwordconfirm || "";
          console.log(req.body);

      // sets this variable to either the User variable or Admin variable, depending on the form submitted
      var Save = req.body.formtype;

      //check whether the user submitted the form with all parameters. if not
      //then the alternative is to re-render the page with the appropriate message
      //explaining why
      if(email && username && password && passwordConf) {
        //checks for valid password
        if(email.match(/([a-z0-9])*([.][a-z0-9]*)?([@][a-z0-9]*[.][a-z]{1,3})([.][a-z]{1,2})?/i)) {
          if(!username.match(/[\/\\ \-\9\0\[\]\\[\]\s`~!@#$%^&*=+\?<>,.]/gi)) {
            if(password === passwordConf) {
              User.findOne({ "username" : username }, function(userQErr, userQDoc) {
                if(userQErr) throw userQErr;

                //if there is no doc returned then the username is not taken, the next actions proveed.
                //if there is a doc returned then there the username is taken
                //and the page is re-rendered with the message telling the user it's taken
                if(!userQDoc) {
                  //regCheck is a Regular Expression check for unwanted characters
                  //in the username. if they don't exist then the next operation
                  // continues. if they do exist then the user is notified
                  var regCheck = username.match(/[\\~`!@#\$%\^&\*()+=|\/\.,<>]/gi);
                  if(!regCheck) {
                    //generates a random salt number between 0 and 10
                    var salt = Math.round( (Math.random() + 4) + (Math.round(Math.random() * 6)) );
                    salt = (salt < 4) ? 4 : salt;
                    console.log("salt: " + salt);
                    //this is where the password is hashed with one of 4-10 salts
                    bcrypt.hash(password, salt, function(hashErr, hash) {
                      if(hashErr) throw hashErr;

                      insertAccount(hash);
                    });
                    //inserts the user into the database and then sends them an email to confirm
                    function insertAccount(hash) {
                      var dbObj = {
                        "email": email,
                        "username": username,
                        "usernameFull": usernameFull,
                        "password": hash,
                        "created": new Date().getTime(),
                        "accessLevel": "regular"
                      };
                      var msgToUser = "Your account has been created. You may now login",
                          validationId = "";

                      if(Save === "admin") {
                        dbObj.accessLevel = "admin";
                        msgToUser = "Your admin account has been created. You account is now awaiting approval";
                        generateKey(Save, dbObj, email, usernameFull, msgToUser, res);
                      } else {
                        User.insert(dbObj, function(insertErr, insertedDoc) {
                          if(insertErr) throw insertErr;

                          if(insertedDoc) {
                            console.log("account created \n\r");

                            res.render("signupin", { "title" : "Sign Up/Login", "msg" : msgToUser, "sign-checked" : "", "log-checked" : "checked" });
                          }
                        });
                      }
                    }
                  } else {
                    //error message to the user if there are illegal characters in
                    //their desired username
                    res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Illegal characters in your username: " + regCheck.join(" "), "sign-checked" : "checked", "log-checked" : "" });
                  }
                } else {
                  //error message to the user if their desired username is taken
                  res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Username is already taken", "sign-checked" : "checked", "log-checked" : "" });
                }
              });
            } else {
              res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Passwords to not match", "sign-checked" : "checked", "log-checked" : "" });
            }
          } else {
            var illMatch = username.match(/[\/\\ \-\9\0\[\]\\[\]\s`~!@#$%^&*=+\?<>,.]/gi),
                illLength = illMatch.length,
                S = (illLength > 1) ? "s" : "";
            //error message to the user if their username contains illegal characters
            res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Username contains " + illLength + " illegal character" + S + ": " + illMatch, "sign-checked" : "checked", "log-checked" : "" });
          }
        } else {
          //error message to the user if the email isn't valid
          res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Email is invalid", "sign-checked" : "checked", "log-checked" : "" });
        }
      } else {
        //error message to the user if they don't submit the data in full
        res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Please fill out the form", "sign-checked" : "checked", "log-checked" : "" });
      }
    },
    login: function(req, res, next) {
      //sets up variables that's be used
      var username = req.body.username.toLowerCase() || "",
          usernameFull = req.body.username || "",
          password = req.body.password || "",
          session = req.cookies["sessId"] || "";
          console.log(req.body);
      //check whether the user submitted the form with all parameters. if not
      //then the alternative is to re-render the page with the appropriate message
      //explaining why
      if(username && password) {
        console.log("username and password present");
        if(!session) {
          console.log("no session key found, proceeding login");

          User.findOne({ "username" : username }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;
            //checks whether a user with the given username was found
            //if it was then proceed. if not then it notifies the user that their
            //account could not be found
            console.log("searching for user");
            if(userQDoc) {
              if(!userQDoc.banned) {
                console.log("username found");
                //bcrypt checks the given password against the username in the
                //database. if it's true then it proceeds to log them in.
                //if not the the user is notified that the provided password is
                //invalid
                //console.log(userQDoc);
                usernameFull = userQDoc.usernameFull;
                bcrypt.compare(password, userQDoc.password, function(bcErr, bcSuccess) {
                  if(bcErr) throw bcErr;

                  if(bcSuccess) {
                    console.log("password matches");
                    Sess.insert({ "user" : username, "time" : new Date().getTime() }, function(sessQErr, sessQDoc) {
                      if(sessQErr) throw sessQErr;
                      
                      //sets the coookie sessId
                      var newSession = sessQDoc.ops[0]._id;
                      console.log("session created. _id:" + newSession);
                      res.cookie("sessId", newSession);

                      var dest = (userQDoc.accessLevel === "admin") ? "/admin-chat" : "/chat";
                      res.redirect(dest);
                    });
                  } else {
                    console.log("password doesn't match");
                    res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Password does not match", "sign-checked" : "", "log-checked" : "checked" });
                  }
                });
              } else {
                res.redirect("/banned/account");
              }
            } else {
              console.log("user not found");
              res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "User not found", "sign-checked" : "", "log-checked" : "checked" });
            }
          });
        } else {
          console.log("session id present, proceed with session confirmation");
          Sess.findOne({ "_id" : new ObjectId(session) }, function(err, doc) {
            if(err) throw err;

            if(doc) {
              console.log("session found");
              User.findOne({ "username" : doc.user }, function(err2, doc2) {
                if(err2) throw err2;

                if(doc2) {
                  console.log("user matches session, redirecting to profile");
                  res.redirect("/profile");
                } else {
                  console.log("user doesn't match session. clearing sessId and redirection to login");
                  res.clearCookie("sessId");
                  res.redirect("/login");
                }
              });
            } else {
              console.log("no session. clearing sessId and redirecting to login");
              res.clearCookie("sessId");
              res.redirect("/login");
            }
          });
        }
      } else {
        console.log("username and password not present");
        res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Please fill out the form", "sign-checked" : "", "log-checked" : "checked" });
      }
    },
    updateUser: function(req, res, next){
      console.log("update user function");
      console.log(req.body);
      var newUsername = req.body.newUsername || "",
          originalName = req.body.originalName || "",
          accessLevel = req.body.accessLevel || "",
          ban = req.body.ban || "";
      if(!ban) {
        User.update({ "username" : originalName }, { "$set" : { "username" : newUsername, "accessLevel" : accessLevel, "banned" : "" } }, function(userQErr, userQDoc) {
          if(userQErr) throw userQErr;

          if(userQDoc && userQDoc.result.ok) { 
            res.status(200).send({
              "msg": "success",
              "action": "callback",
              "callback": "updateUsers",
              "data": {
                "username": originalName,
                "newName": newUsername
              },
              "op": ban
            });
          }
        });

      } else {
        if(ban === "ACC") {
          User.update({ "username" : originalName }, { "$set" : { "banned" : true } }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;

            if(userQDoc && userQDoc.result.ok) { 
              res.status(200).send({
                "msg": "success",
                "action": "callback",
                "callback": "updateUsers",
                "data": {
                  "username": originalName,
                  "newName": newUsername
                },
                "op": ban
              });
            }
          });
        }
        if(ban === "IP") {
          User.findOne({ "username" : req.originalName }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;

            if(userQDoc) {
              User.update({ "username" : originalName }, { "$set" : { "banned" : true } });
              Chat.update({ "optionName" : "bannedAddrs" }, updateObj, { "upsert" : true }, function(chatQErr, chatQDoc) {
                if(chatQErr) throw chatQErr;

                if(chatQDoc && chatQDoc.result.ok) {
                  res.status(200).send({
                    "msg": "success",
                    "action": "callback",
                    "callback": ["updateUsers", "updateBannedAddrs"],
                    "data": [{
                      "username": originalName,
                      "newName": newUsername
                    },
                    userQDoc.currentIp],
                    "op": ban
                  });
                } else {
                  res.status(417).send("DB write error");
                }
              });
            } else {
              res.status(417).send("User not found");
            }
          });
        }
      }
    }
  }
}