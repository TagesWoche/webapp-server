// VARIABLES
var application_root = __dirname + "/..",
    express = require("express"),
    path = require("path"),
    redis = require("redis"),
    redisUrl = require('redis-url'),
    extend = require("xtend"),
    serverPort = process.env.PORT;

// CONFIGURATION
global.conf = require('./environments/all');

// EXPRESS
var app = express.createServer();
app.configure(function () {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
});

// PROD
app.configure('production', function() {
  console.log("setting prod configuration...");
  global.conf = extend(global.conf, require('./environments/production'));

  //app.redisClient = redis.createClient(9111, "barb.redistogo.com");
  // authenticate redis db
  //app.redisClient.auth("93fbe3baf4c48b4ec1b3a4f5522937c8");
  app.redisClient = redisUrl.connect(process.env.REDISTOGO_URL);
  app.use(express.logger());
  app.enable("jsonp callback");
});

app.configure('development', function() {
  console.log("setting development configuration...");
  global.conf = extend(global.conf, require('./environments/development'));
  app.redisClient = redis.createClient();
  serverPort = 3000;
  app.enable("jsonp callback");
});

app.configure("test", function() {
  console.log("setting test configuration...");
  global.conf = extend(global.conf, require('./environments/test'));
  app.redisClient = redis.createClient();
  serverPort = 3010;
});

app.listen(serverPort);

console.log("started server on port " + serverPort);

// EXPORT
module.exports = app;
