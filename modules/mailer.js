console.log("required mailer module\r\n");

var app = require('express')(),
		nodemailer  = require("nodemailer"),
		smtpTransport  = require("nodemailer-smtp-transport"),
		fs  = require("fs"),
		config = require("./config");
var sender = "piecedigitalstudios@gmail.com",
	recipient = process.env.emailRecipient || sender;

var transporter = nodemailer.createTransport(smtpTransport({
	host: "smtp.mandrillapp.com",
	port: config.mailPort,
	auth: {
		user: sender,
		pass: config.mailPass
	}
}));

module.exports = function(type, email, toEmail, name, message) {
	return {
		mailPost: function() {
			var messageDetails = {
				title: type,
				name: name,
				subject: type,
				body: message,
				email: email,
				toEmail: toEmail
			}
			fs.readFile("./modules/mail-templates/template1.html", {
				encoding: "UTF-8"
			}, function(err, data) {
				if(err) throw err;

				//console.log(data);
				sendMail(data, messageDetails);
			});

			//console.log("gotten");
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
			name: "Piece Digital Studios",
			address: sender
		},
		to: details.toEmail || recipient,
		replyTo: details.email,
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
