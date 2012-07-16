// VARIABLES
var app = require("../../config/server"),
    redis = require("redis"),
    client = redis.createClient(9111, "barb.redistogo.com"),
    GameSituation = require("../models/gameSituation.js");

// authenticate redis db
client.auth("93fbe3baf4c48b4ec1b3a4f5522937c8");

//-----------------------------------------------------------------------------
// R O U T E S
//-----------------------------------------------------------------------------

app.get('/', function(req, res, next) {
  var situation = new GameSituation({"test":"hello"});
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running." + situation);
});

app.post('/fcb/players', function(req, res, next) {
  console.log("received players:");
  console.log(req.body);
  
  for ( var i = 0; i < req.body.list.length; i++ ) {
    var player = new Player("FCB", req.body.list[i]);
    player.parse();
    console.log(player);
  }
});

app.post('/fcb/situations', function(req, res, next) {
  console.log("received game situations:");
  console.log(req.body);
  
  for ( var i = 0; i < req.body.list.length; i++ ) {
    var gameSituation = new GameSituation(req.body.list[i]);
    gameSituation.parse();
    console.log(gameSituation);
  }
  
  return res.send("OK", 200);
});