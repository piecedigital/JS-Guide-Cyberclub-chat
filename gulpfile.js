var gulp = require("gulp");
var browserSync = require("browser-sync").create();
var nodemon = require("gulp-nodemon");
var reload = browserSync.reload;
var sass = require('node-sass');
var fs = require("fs");

function renderSass() {
	sass.render({
	  file: "./private/sass/style.scss",
	  outputStyle: "expanded",
	  outFile: "./public/css/styl.css"
	}, function(err, result) {
		if(err) throw err;

		//console.log(result.css.toString());
		fs.writeFile('./public/css/style.css', result.css.toString(), function (err) {
		  if (err) throw err;

		  console.log('CSS rendered and saved');
		});
	});
}

gulp.task("start", function() {
	nodemon({
		script: "app.js",
		ext: "",
		env: { "NODE_ENV" : "devemopment" }
	});
});

gulp.task("serve", function() {
	browserSync.init(null, {
		proxy: "http://localhost:8080",
		port: 8081
	});
 
	gulp.watch(["private/sass/*.scss"]).on("change", renderSass);
	gulp.watch(["views/*.hbs", "public/css/*.css"]).on("change", reload);
});

gulp.task("default", ["start", "serve"]);