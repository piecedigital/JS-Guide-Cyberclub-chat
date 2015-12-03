var workers = process.env.WEB_CONCURRENCY || 1;
var throng = require("throng");

throng(start, {
  workers: workers,
  lifetime: Infinity
});

function start (worker) {
  console.log("Worker started", worker);

  var express 		 = require("express"),
      app          = express(),
      server       = require("http").Server(app),
      io           = require("socket.io")(server),
      favicon      = require('serve-favicon'),
  		path 				 = require("path"),
  		logger 			 = require('morgan'),
  		cookieParser = require('cookie-parser'),
  		bodyParser 	 = require('body-parser'),
  		helmet       = require("helmet"),
  		port 				 = process.env["PORT"] || 8080,
      MongoClient  = require("mongodb");

  var priVar = require("./modules/private-variables");

  // config
  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'hbs');
  app.set("view options", { layout: "layout" });

  // uncomment after placing your favicon in /public
  app.use(favicon(__dirname + '/public/favicon.ico'));
  app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', false);

    next();
  });
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(helmet());
  app.use(helmet.hidePoweredBy());
  //app.use(helmet.frameguard("allow-from", "http://localhost:8080"));
  //app.use(helmet.frameguard("allow-from", "http://guidemagazine.org"));
  app.use(helmet.frameguard("allow-from", "http://gcc-chat-app.herokuapp.com"));
  app.use(helmet.contentSecurityPolicy({
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "*.jsdelivr.net", "jsconsole.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "*.jsdelivr.net"],
    imgSrc: ["'self'", "*.jsdelivr.net"],
    connectSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "ws://*"],
    fontSrc: ["fonts.google.com"],
    objectSrc: ["'self'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'self'"],
    //sandbox: ["allow-forms", "allow-scripts", "allow-same-origin"],
    reportUri: '/report-violation',
    //reportOnly: true, // set to true if you only want to report errors 
    //setAllHeaders: false, // set to true if you want to set all headers 
    //disableAndroid: false, // set to true if you want to disable Android (browsers can vary and be buggy) 
    //safari5: false // set to true if you want to force buggy CSP in Safari 5 
  }));

  // setup DB variable for socket connection
  var serverOptions = {
    "auto_reconnect": true,
    "poolSize": 5
  }

  // require custom modules
  // routes module
  var routes = require("./modules/routes");
  app.use(routes);
  // sockets module
  var sockets = require("./modules/sockets");
  //app.use(sockets);

  var Server = MongoClient.Server,
  Db = MongoClient.Db,
  db = MongoClient.connect(process.env["mongolabURL"] || priVar.mongolabURL
    , function(err, db) {
      if(err) throw err;
      //console.log(db)
      var admin = db.admin();

      io.on("connection", sockets(io, db).socketHandler);

      // initiation stuff
      if(true) {
        sockets(io, db).populateBans("null");
      }

  });
      server.listen(port)
      console.log("listening on port " + port);


  process.on('uncaughtException', function (err) {
    console.log("\n\r **Uncaught Exception event** \n\r")
    console.log(err);
  });
}