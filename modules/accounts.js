console.log("required accounts module\r\n");

var app = require('express')(),
    bcrypt = require("bcryptjs"),
    MongoClient  = require("mongodb"),
    ObjectId = require("mongodb").ObjectID,
    csrf = require("csurf");

var mailer = require("./mailer");


// (Assuming you're using express - expressjs.com)
// Get the credit card details submitted by the form
module.exports = function(db) {
  var User = db.collection("users"),
      Pending = db.collection("pending"),
      Sess = db.collection("sessions"),
      IPA = db.collection("bannedIPs"),
      Chat = db.collection("chatOptions");

  var generateKey = function(cb) {
    //console.log("creating match ID...");

    // creates a library of characters to crea a key from
    var keyLibrary = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-0123456789".split("");
    // numbers each attempt
    var tries = 1;

    // internal function to make the actual key
    var makeKey = function(re) {
      re = re || "";
      //console.log(re + "generating ID... attempt " + tries);
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

      //console.log("Generated id: " + key);

      // checks for a duplicate key
      Pending.findOne({ "validationId" : key }, function(pendQErr, pendQDoc) {
        if(pendQErr) throw pendQErr;

        if(pendQDoc) {
          //console.log("duplicate id: " + key);
          tries++; 
          makeKey("re");
        } else {
          return cb(key);
        }
      });

    };// end makeKey

    makeKey();
  }// end generateId

  return {
    signup: function(req, res, next) {
      //sets up variables that's be used
      var email = req.body.email.toLowerCase() || "",
          username = req.body.username.toLowerCase() || "",
          usernameFull = req.body.username || "",
          password = req.body.password || "",
          passwordConf = req.body.passwordconfirm || "";
          //console.log(req.body);

      // sets this variable to either the User variable or Admin variable, depending on the form submitted
      var Save = req.body.formtype;

      //check whether the user submitted the form with all parameters. if not
      //then the alternative is to re-render the page with the appropriate message
      //explaining why
      if(email && username && password && passwordConf) {
        //checks for valid password
        if(email.match(/([a-z0-9])*([.][a-z0-9]*)?([@][a-z0-9]*[.][a-z]{1,3})([.][a-z]{1,2})?/i)) {
          var underDashMatch = username.match(/_-/gi) || [];
          if(username.match(/^[a-z0-9_-]*$/gi)
            && underDashMatch.length <= 2
            && username.length >= 4
            && username.length <= 20) {
            if(password === passwordConf) {
              User.findOne({ "$or" : [{ "username" : username }, { "email" : email }] }, function(userQErr, userQDoc) {
                if(userQErr) throw userQErr;

                //if there is no doc returned then the username is not taken, the next actions proveed.
                //if there is a doc returned then there the username is taken
                //and the page is re-rendered with the message telling the user it's taken
                if(!userQDoc) {
                  //regCheck is a Regular Expression check for unwanted characters
                  //in the username. if they don't exist then the next operation
                  // continues. if they do exist then the user is notified
                  var regCheck = username.match(/^[a-z0-9_-]*$/gi);
                  if(regCheck) {
                    //generates a random salt number between 0 and 10
                    var salt = Math.round( (Math.random() + 4) + (Math.round(Math.random() * 6)) );
                    salt = (salt < 4) ? 4 : salt;
                    //console.log("salt: " + salt);
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
                      var msgToUser = "Your account has been created. You may now login";

                      if(Save === "admin") {
                        dbObj.accessLevel = "admin";
                        msgToUser = "Your admin account has been created. You account is now awaiting approval";
                        generateKey(function(key) {
                          if(key) {
                            dbObj.validationId = key;

                            Pending.insert(dbObj, function(insertErr, insertedDoc) {
                              if(insertErr) throw insertErr;

                              if(insertedDoc) {
                                //console.log("account created \n\r");
                                var host = req.headers.host;
                                console.log(host);
                                mailer("Confirm admin profile", email, usernameFull, "<img width=1 height=1 src='http://" + host + "/tracker'>A new user, " + usernameFull + ", has submitted the form for admin access.<br><br>If this is an approved user please click the link below to confirm this new account:<br><br>http://" + host + "/validate?key=" + key + "<br><br>If this is not an approved user submission, use this link to cancel the request: http://" + host + "/cancel?key=" + key).mailPost();

                                res.render("signupin", { "title" : "Sign Up/Login", "msg" : msgToUser, "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                              }
                            });
                          } else {
                            res.render("admin-signup", { "title" : "Admin Sign Up", "msg" : "There was a problem creating your account", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                            console.log("key was not created");
                          }
                        });
                      } else
                      if(Save === "regular") {
                        User.insert(dbObj, function(insertErr, insertedDoc) {
                          if(insertErr) throw insertErr;

                          if(insertedDoc) {
                            //console.log("account created \n\r");

                            res.render("signupin", { "title" : "Sign Up/Login", "msg" : msgToUser, "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                          }
                        });
                      } else {
                        res.render("signupin", { "title" : "Sign Up/Login", "msg" : "Internal server error", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                        console.log("Error creating new user. form has been tampered with")
                      }
                    }
                  } else {
                    //error message to the user if there are illegal characters in
                    //their desired username
                    res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Illegal characters in your username: " + regCheck.join(" "), "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
                  }
                } else {
                  //error message to the user if their desired username is taken
                  res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Username or email is already in use", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
                }
              });
            } else {
              res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Passwords do not match", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
            }
          } else {
            var charMatchMsg = (!username.match(/^[a-z0-9_-]*$/gi)) ? "username contains illegal characters" : (underDashMatch.length > 2) ? "username contains too many underscores" : null;
            var lengthMsg = (username.length < 4) ? "username is too short" : (username.length > 20) ? "username is too long" : null;
            var errsMsg = [charMatchMsg, lengthMsg].filter(function(elem, ind) {
              if(elem) {
                return elem;
              }
            });
            if(errsMsg.length > 1) {
              errsMsg[errsMsg.length-1] = "and " + errsMsg[errsMsg.length-1];
            }
            errsMsg.join(", ");
            //error message to the user if their username contains illegal characters
            res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Username Errors: " + errsMsg + ". Username must be between 4-20 characters, and contain only letters and underscores (max 2)", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
          }
        } else {
          //error message to the user if the email isn't valid
          res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Email is invalid", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
        }
      } else {
        //error message to the user if they don't submit the data in full
        res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Please fill out the form", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
      }
    },
    login: function(req, res, next) {
      //sets up variables that's be used
      var username = req.body.username.toLowerCase() || "",
          password = req.body.password || "",
          session = req.cookies["sessId"] || "";
          //console.log(req.body);
      //check whether the user submitted the form with all parameters. if not
      //then the alternative is to re-render the page with the appropriate message
      //explaining why
      if(username && password) {
        //console.log("username and password present");
        if(!session) {
          //console.log("no session key found, proceeding login");

          User.findOne({ "username" : username }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;
            //checks whether a user with the given username was found
            //if it was then proceed. if not then it notifies the user that their
            //account could not be found
            //console.log("searching for user");
            if(userQDoc) {
              if(!userQDoc.banned) {
                //console.log("username found");
                //bcrypt checks the given password against the username in the
                //database. if it's true then it proceeds to log them in.
                //if not the the user is notified that the provided password is
                //invalid
                ////console.log(userQDoc);
                var usernameFull = userQDoc.usernameFull;
                bcrypt.compare(password, userQDoc.password, function(bcErr, bcSuccess) {
                  if(bcErr) throw bcErr;

                  if(bcSuccess) {
                    //console.log("password matches");
                    Sess.insert({ "user" : username, "creationTime" : new Date().getTime() }, function(sessQErr, sessQDoc) {
                      if(sessQErr) throw sessQErr;
                      
                      //sets the coookie sessId
                      if(sessQDoc) {
                        var newSession = sessQDoc.ops[0]._id;
                        //console.log("session created. id: ", newSession);
                        res.cookie("sessId", newSession, { maxAge: (Date.now() + 900000), httpOnly: true });

                        var dest = (userQDoc.accessLevel === "admin") ? "/admin-chat" : "/chat";

                        res.redirect(dest);
                      } else {
                        res.status(500).send("session write error");
                      }
                    });
                  } else {
                    //console.log("password doesn't match");
                    res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Password does not match", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                  }
                });
              } else {
                res.redirect("/banned/account/" + userQDoc.usernameFull);
              }
            } else {
              //console.log("user not found");
              res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "User not found", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
            }
          });
        } else {
          //console.log("session id present, proceed with session confirmation");
          Sess.findOne({ "_id" : new ObjectId(session) }, function(err, doc) {
            if(err) throw err;

            if(doc) {
              //console.log("session found");
              User.findOne({ "username" : doc.user }, function(err2, doc2) {
                if(err2) throw err2;

                if(doc2) {
                  //console.log("user matches session, redirecting to profile");
                  res.redirect("/profile");
                } else {
                  //console.log("user doesn't match session. clearing sessId and redirection to login");
                  res.clearCookie("sessId");
                  res.redirect("/login");
                }
              });
            } else {
              //console.log("no session. clearing sessId and redirecting to login");
              res.clearCookie("sessId");
              res.redirect("/login");
            }
          });
        }
      } else {
        //console.log("username and password not present");
        res.render("signupin", { "page" : "signupin", "title" : "Sign Up/Login", "msg" : "Please fill out the form", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
      }
    },
    updateUser: function(req, res, next) {
      //console.log("update user function");
      //console.log(req.body);
      var newUsername = req.body.newUsername || "",
          usernameFull = req.body.originalName || "",
          accessLevel = req.body.accessLevel || "",
          ban = req.body.ban || "",
          reason = req.body.reason || "Your behavior did not align with the rules of the chat room.",
          reasonIp = req.body.reasonIp || "The activty from this connection exhibited an inordinate degree of offenses.";
      if(!ban) {
        User.update({ "usernameFull" : usernameFull }, { "$set" : { "username" : (newUsername.toLowerCase()), "usernameFull" : newUsername, "accessLevel" : accessLevel, "banned" : "" } }, function(userQErr, userQDoc) {
          if(userQErr) throw userQErr;

          if(userQDoc && userQDoc.result.ok) {
            res.status(200).send({
              "msg": "success",
              "action": "callback",
              "callback": "updateUsers",
              "data": {
                "usernameFull": usernameFull,
                "newName": newUsername
              },
              "op": ban
            });
          }
        });
      } else {
        if(ban === "ACC") {
          User.update({ "usernameFull" : usernameFull }, { "$set" : { "banned" : reason } }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;

            if(userQDoc && userQDoc.result.ok) { 
              res.status(200).send({
                "msg": "success",
                "action": "callback",
                "callback": "updateUsers",
                "data": {
                  "usernameFull": usernameFull,
                  "newName": newUsername
                },
                "op": ban
              });
            }
          });
        } else
        if(ban === "IP") {
          User.findOne({ "usernameFull" : usernameFull }, function(userQErr, userQDoc) {
            if(userQErr) throw userQErr;

            if(userQDoc) {
              User.update({ "username" : usernameFull }, { "$set" : { "banned" : reason } });
              Sess.remove({ "user" : usernameFull });
              Chat.update({ "optionName" : "bannedAddrs" }, { "$push" : { "list" : { 'ip' : userQDoc.currentIp || "0.0.0.0", 'reason' : reasonIp } } }, { "upsert" : true }, function(chatQErr, chatQDoc) {
                if(chatQErr) throw chatQErr;

                if(chatQDoc && chatQDoc.result.ok) {
                  res.status(200).send({
                    "msg": "success",
                    "action": "callback",
                    "callback": ["updateUsers", "updateBannedAddrs"],
                    "data": [{
                      "usernameFull": usernameFull,
                      "newName": newUsername
                    },
                    userQDoc.currentIp || "0.0.0.0"],
                    "op": [ban, "$push"]
                  });
                } else {
                  res.status(417).send("DB write error");
                }
              });
            } else {
              res.status(417).send("User not found");
            }
          });
        } else {
          res.status(500).send("tampered form");
          console.log("variable error. data has been tampered with")
        }
      }
    },
    requestPass: function(req, res, next) {
      var email = req.body.email.toLowerCase() || "";

      if(email && email.match(/([a-z0-9])*([.][a-z0-9]*)?([@][a-z0-9]*[.][a-z]{1,3})([.][a-z]{1,2})?/i)) {
        User.findOne({ "email" : email }, function(userQErr, userQDoc) {
          if(userQErr) throw userQErr;

          if(userQDoc) {
            generateKey(function(key) {
              if(key) {
                var dbObj = {
                  "validationId" : key,
                  "email": email
                }

                Pending.insert(dbObj, function(insertErr, insertedDoc) {
                  if(insertErr) throw insertErr;

                  if(insertedDoc) {
                    //console.log("account created \n\r");
                    var host = req.headers.host;
                    console.log(host);
                    mailer("Confirm password change", email, null, "Click the link below to change your password:<br><br>http://" + host + "/change-pass?key=" + key).mailPost();

                    res.render("signupin", { "title" : "Sign Up/Login", "msg" : "Your password change request was successful. An email has been sent to you to proceed with the change.", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                  } else {
                    res.render("signupin", { "title" : "Sign Up/Login", "msg" : "There was a problem creating your account", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                    console.log("pending insertion failure");
                  }
                });
              } else {
                res.render("signupin", { "title" : "Sign Up/Login", "msg" : "There was a problem creating your account", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                console.log("key was not created");
              }
            }); 
          } else {
            res.render("request-pass", { "title" : "Request password change", "msg" : "Email does not match an account on our records.", csrfToken : req.csrfToken() });
          }
        });
      } else {
        res.render("request-pass", { "title" : "Request password change", "msg" : "Please enter a valid email", csrfToken : req.csrfToken() });
      }
    },
    updatePass: function(req, res, next) {
      var
        key = req.body.key || "",
        password = req.body.password || "",
        passwordConf = req.body.passwordconfirm || "";

      if(key) {
        if(password && passwordConf && password === passwordConf) {
          Pending.findOne({ "validationId" : key }, function(pendQErr, pendQDoc) {
            if(pendQErr) throw pendQErr;

            if(pendQDoc) {
              var salt = Math.round( (Math.random() + 4) + (Math.round(Math.random() * 6)) );
                  salt = (salt < 4) ? 4 : salt;

              bcrypt.hash(password, salt, function(hashErr, hash) {
                if(hashErr) throw hashErr;

                User.update({ "email" : pendQDoc.email }, { "$set" : { "password" : hash } }, function(userQErr, userQDoc) {
                  if(userQErr) throw userQErr;

                  if(userQDoc) {
                    Pending.remove({ "validationId" : key }, function(remQErr, remQDoc) {
                      if(remQErr) throw remQErr;

                      res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Your password has been changed successfully", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                    });
                  } else {
                    res.render("signupin", { "title" : "Sign Up/Login", "msg" :"There was an internal server error. Password could not be reset", "sign-checked" : "", "log-checked" : "checked", csrfToken : req.csrfToken() });
                    console.log("user not found and written to");
                  }
                });
              });
            } else {
              res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Pending account could not be located.", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
            }
          });
        } else {
          res.render("signupin", { "title" : "Sign Up/Login", "msg" :"Invalid password. Password has not been reset", "sign-checked" : "checked", "log-checked" : "", csrfToken : req.csrfToken() });
        }
      } else {
        res.redirect("/login");
      }
    },
    queryUser: function(req, res, next) {
      var session = req.cookies["sessId"] || "";
        
      if(session) {
        Sess.findOne({  "_id" : new ObjectId(session) }, function(sessQErr, sessQDoc) {
          if(sessQErr) throw sessQErr;

          if(sessQDoc) {
            User.findOne({ "username" : sessQDoc.user }, function(err2, userQDoc) {
              if(err2) throw err2;

              if(userQDoc) {
                res.status(200).send({
                  "usernameFull": userQDoc.usernameFull,
                  "accessLevel": userQDoc.accessLevel
                })

              } else {
                res.status(404).send("user not found");
              }
            });
          } else {
            res.status(404).send("session not found");
          }
        });
      } else {
        res.status(404).send("no session cookie");
      }
    }
  }
}
//console.log(this)