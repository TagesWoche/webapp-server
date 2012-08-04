// VARIABLES
var application_root = __dirname + "/..",
    express = require("express")
    path = require("path"),
    redis = require("redis"),
    serverPort = 8080;
    
// EXPRESS
var app = express.createServer();
app.configure(function () {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(app.router);
});

// PROD
app.configure('production', function() {
  app.redisClient = redis.createClient(9111, "barb.redistogo.com");
  // authenticate redis db
  app.redisClient.auth("93fbe3baf4c48b4ec1b3a4f5522937c8");
  app.use(express.logger());
  
  app.enable("jsonp callback");
});

app.configure('development', function() {
  app.redisClient = redis.createClient();
  serverPort = 3000;
  
  app.enable("jsonp callback");
});

app.configure("test", function() {
  app.redisClient = redis.createClient();
  serverPort = 3010;
});

app.listen(serverPort);

console.log("started server on port " + serverPort);

// EXPORT
module.exports = app;