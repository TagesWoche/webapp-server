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
  //console.log("got incoming traffic on: " + req.url);
  //console.log(req.body);
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
  app.redisClient.hkeys("FCB", function (err, replies) {
    _.each(replies, function(nickname) {
      //console.log("loading player: " + nickname);
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
      console.log(errorString);
      return res.send(errorString, 500);
    } else {
      // redis operations
      app.redisClient.del("Games"); // delete the players hash
      for ( i = 0; i < games.length; i++ ) {
        app.redisClient.hset("Games", games[i].date.toString(), JSON.stringify(games[i]));
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
    
    console.log(errorString);
    return res.send(errorString, 500);
  } else {
    // redis operations
    app.redisClient.del("FCB"); // delete the players hash
    for ( i = 0; i < players.length; i++ ) {
      app.redisClient.hset("FCB", players[i].nickname, JSON.stringify(players[i]));
    }
  
    return res.send("OK", 200);
  }
});

app.post('/fcb/situations', logIncoming, function(req, res, next) {
  
  // load the players (only nicknames)
  var players = [];
  app.redisClient.hkeys("FCB", function (err, replies) {
    _.each(replies, function(nickname) {
      //console.log("loading player: " + nickname);
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
      app.redisClient.del("Situations"); // delete the situations hash
      for ( i = 0; i < gameSituations.length; i++ ) {
        app.redisClient.hset("Situations", gameSituations[i].line, JSON.stringify(gameSituations[i]));
      }
      
      return res.send("OK", 200);
    }
  });
  
  
});