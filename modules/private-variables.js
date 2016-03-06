console.log("required private-variables module \n\r");

module.exports = {
	"mailerVariables": {
		"port": 587,
		"pass": "Mm-qP4gRtGxbda4aBYLDVg"
	},
	"mongolabURL": process.env["DEV_MODE"] === "prod" ? "mongodb://PieceDigital:1mth3adm1n@ds027809.mongolab.com:27809/gcc-db" : "mongodb://localhost:27017/guidechat" 
}
///