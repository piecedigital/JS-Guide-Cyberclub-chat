console.log("required mailer module\r\n");

var app = require('express')(),
		nodemailer  = require("nodemailer"),
		smtpTransport  = require("nodemailer-smtp-transport"),
		fs  = require("fs"),
		priVar = require("./private-variables");
var sender = "piecedigitalstudios@gmail.com";

var transporter = nodemailer.createTransport(smtpTransport({
	host: "smtp.mandrillapp.com",
	port: priVar.mailerVariables.port,
	auth: {
		user: sender,
		pass: priVar.mailerVariables.pass
	}
}));

module.exports = function(type, email, name, message) {
	return {
		mailPost: function() {
			var messageDetails = {
				title: "Confirm your email",
				subject: type,
				body: message,
				email: email
			}
			fs.readFile("./modules/mail-templates/template1.html", {
				encoding: "UTF-8"
			}, function(err, data) {
				if(err) throw err;

				//console.log(data);
				sendMail(data, messageDetails);
			});

			console.log("gotten");
		}
	};
}

function sendMail(data, details) {
	data = data.replace(/[{]{2}title[}]{2}/gi, details.title)
			.replace(/[{]{2}body[}]{2}/gi, details.body);
	//console.log(data);

	transporter.sendMail({
		sender: sender,
		from: {
			name: "Darryl Dixon",
			address: sender
		},
		to: details.email,
		replyTo: sender,
		subject: details.subject,
		html: data
	}, function(err, info) {
		if(err) {
			console.log("Mailing error: " + err);
		}
		console.log("Message - messageId: " + info.messageId);
		console.log("Message - envelope: " + JSON.stringify(info.envelope));
		console.log("Message - accepted: " + info.accepted);
		console.log("Message - rejected: " + info.rejected);
		console.log("Message - pending: " + info.pending);
		console.log("Message - response: " + info.response);
	});
}
