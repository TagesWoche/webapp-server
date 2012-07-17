// VARIABLES
var app = require("../../config/server"),
    _ = require('underscore')._,
    redis = require("redis"),
    client = redis.createClient(9111, "barb.redistogo.com"),
    GameSituation = require("../models/gameSituation.js"),
    Player = require("../models/player.js"),
    Game = require("../models/game.js");

// authenticate redis db
client.auth("93fbe3baf4c48b4ec1b3a4f5522937c8");

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

app.get('/', function(req, res, next) {
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running.");
});

// updates the games
app.post('/fcb/games', logIncoming, function(req, res, next) {
  // load the players (only nicknames)
  var players = [];
  client.hkeys("FCB", function (err, replies) {
    _.each(replies, function(nickname) {
      console.log("loading player: " + nickname);
      players.push(nickname);
    });
    // group by date
    var groupedList = _.groupBy(req.body.list, function(entry) {
      return entry.date;
    });
  
    var games = [];
    var errors = [];
    for ( var date in groupedList ) {
      var game = new Game(groupedList[date]);
      game.parse();
      game.validate(players);
      errors = _.union(errors, game.validationErrors);
      games.push(game);
    }
    
    if ( errors.length !== 0 ) {
      var errorString = "";
      for ( i = 0; i < errors.length; i++ ) {
        errorString = errorString + "validation error:\n" + errors[i] + "\n";
      }
      return res.send(errorString, 500);
    } else {
      // redis operations
      client.del("Games"); // delete the players hash
      for ( i = 0; i < games.length; i++ ) {
        client.hset("Games", games[i].date.toString(), JSON.stringify(games[i]));
      }
      return res.send("OK", 200);
    }
    
  });
});

// updates the FCB Kader
app.post('/fcb/players', logIncoming, function(req, res, next) {

  var players = [];
  var errors = [];
  for ( var i = 0; i < req.body.list.length; i++ ) {
    var player = new Player("FCB", req.body.list[i]);
    player.parse();
    player.validate();
    errors = _.union(errors, player.validationErrors);
    players.push(player);
  }
  
  if ( errors.length > 0 ) {
    var errorString = "";
    for ( i = 0; i < errors.length; i++ ) {
      errorString = errorString + "validation error:\n" + errors[i] + "\n";
    }
    
    return res.send(errorString, 500);
  } else {
    // redis operations
    client.del("FCB"); // delete the players hash
    for ( i = 0; i < players.length; i++ ) {
      client.hset("FCB", players[i].nickname, JSON.stringify(players[i]));
    }
  
    return res.send("OK", 200);
  }
});

app.post('/fcb/situations', logIncoming, function(req, res, next) {
  
  // load the players (only nicknames)
  var players = [];
  client.hkeys("FCB", function (err, replies) {
    _.each(replies, function(nickname) {
      console.log("loading player: " + nickname);
      players.push(nickname);
    });
    
    var errors = [];
    var gameSituations = [];
    for ( var i = 0; i < req.body.list.length; i++ ) {
      var gameSituation = new GameSituation(req.body.list[i]);
      gameSituation.parse();
      gameSituation.validate(players);
      errors = _.union(errors, gameSituation.validationErrors);
      errors = _.union(errors, gameSituation.parseErrors);
      gameSituations.push(gameSituation);
    }

    if ( errors.length > 0 ) {
      var errorString = "";
      for ( i = 0; i < errors.length; i++ ) {
        errorString = errorString + "validation error:\n" + errors[i] + "\n";
      }
      return res.send(errorString, 500);
    } else {
      // redis operations
      client.del("Situations"); // delete the situations hash
      for ( i = 0; i < gameSituations.length; i++ ) {
        client.hset("Situations", gameSituations[i].line, JSON.stringify(gameSituations[i]));
      }
      
      return res.send("OK", 200);
    }
  });
  
  
});