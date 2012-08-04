// VARIABLES
var app = require("../../config/server"),
    _ = require('underscore')._,
    GameSituation = require("../models/gameSituation.js"),
    Player = require("../models/player.js"),
    Game = require("../models/game.js");

//-----------------------------------------------------------------------------
// M I D D L E W A R E
//-----------------------------------------------------------------------------
// logs the body of an incoming request
var logIncoming = function(req, res, next) {
  console.log("got incoming traffic on: " + req.url);
  console.log(req.body);
  next();
};

//-----------------------------------------------------------------------------
// R O U T E S
//-----------------------------------------------------------------------------

app.get("/", function(req, res, next) {
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running.");
});

// get all saved situations
app.get("/fcb/situations", function(req, res, next) {
  app.redisClient.hgetall("Situations", function(err, replies) {
    return res.json(replies, 200);
  });
});

// updates the games
app.post('/fcb/games', logIncoming, function(req, res, next) {
  Game.parseValidateAndSaveSpreadsheet(app.redisClient, req.body.list, function(message, status) {
    console.log(message);
    return res.send(message, status);
  });
});

// updates the FCB Kader
app.post('/fcb/players', logIncoming, function(req, res, next) {  
  Player.parseValidateAndSaveSpreadsheet(app.redisClient, req.body.list, function(message, status) {
    console.log(message);
    return res.send(message, status);
  });
});

// updates the game situations
app.post('/fcb/situations', logIncoming, function(req, res, next) {
  GameSituation.parseValidateAndSaveSpreadsheet(app.redisClient, req.body.list, function(message, status) {
    console.log(message);
    return res.send(message, status);
  });
});