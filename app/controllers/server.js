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
// H E L P E R S
//-----------------------------------------------------------------------------
var saisons = {
  'all': [new Date(2011, 06, 01), new Date(2099, 05, 30)], // 1. Jul 2011 - 30. Jun 2099
  '12/13': [new Date(2012, 06, 01), new Date(2013, 05, 30)], // 1. Jul 2012 - 30. Jun 2013
  '13/14': [new Date(2013, 06, 01), new Date(2014, 05, 30)]  // 1. Jul 2013 - 20. Jun 2014
};

var initStatistics = function(player) {
  return { "played":            0,
           "goals":             0,
           "assists":           0,
           "minutes":           0,
           "yellowCards":       0,
           "yellowRedCards":    0,
           "redCards":          0,
           "order":             player.line,
           "name":              player.name,
           "nickname":          player.nickname,
           "number":            player.number,
           "imageUrl":          player.imageUrl,
           "position":          player.position,
           "grades":            [],
           "scores":            [],
           "minutesList":       [] };
};

var addGameToPlayersStatistic = function(player, playerStatistics, opponent, date) {
  playerStatistics[player.name].minutesList.push(+player.minutesPlayed);
  playerStatistics[player.name].minutes += +player.minutesPlayed;
  if ( +player.minutesPlayed > 0 ) {
    playerStatistics[player.name].played += 1;
  }
  playerStatistics[player.name].goals += +player.goals;
  playerStatistics[player.name].assists += +player.assists;
  playerStatistics[player.name].grades.push({ grade: +player.grade, gameAverageGrade: 0, opponent: opponent, date: date });
  playerStatistics[player.name].scores.push({ scores: new Array( +player.assists, +player.goals ), opponent: opponent });


  if ( player.yellowCard )
    playerStatistics[player.name].yellowCards += 1;
  if ( player.yellowRedCard )
    playerStatistics[player.name].yellowRedCards += 1;
  if ( player.redCard )
    playerStatistics[player.name].redCards += 1;
};

var addGameAverageGradeToPlayersStatistics = function(gameGrades, gameEntry, playerStatistics) {
  var sum = _.reduce(gameGrades, function(sum, grade) {
    return sum + grade;
  }, 0);
  var gameAverageGrade = sum / gameGrades.length;
  if ( _.isNaN(gameAverageGrade) )
    gameAverageGrade = 0;

  // push to player statistics
  for ( var i = 0; i < gameEntry.players.length; i++ ) {
    var player = gameEntry.players[i];
    if ( playerStatistics[player.name] ) {
      //console.log("setting gmae average grade: " + gameAverageGrade);
      playerStatistics[player.name].grades[playerStatistics[player.name].grades.length - 1].gameAverageGrade = gameAverageGrade;
    }
  }
};

var matchesSaison = function(saison, game) {
  gameDate = new Date(game.date);
  if ( gameDate > saison[0] &&
       gameDate < saison[1] ) {
    return true;
  } else {
    return false;
  }
};

var matchesGameFilter = function(game, filters) {
  var matchesFilter = true; // true by default

  // look always for first filter
  if ( filters.location ) {
    if ( (filters.location === "home" && game.homematch === true) ||
         (filters.location === "out" && game.homematch === false) ) {
      matchesFilter = true;
    } else {
      matchesFilter = false;
    }
  }

  // look only for second filter if first filter does not rule out yet
  if ( filters.competition && matchesFilter == true ) {
    if ( (filters.competition === "m" && game.competition === "m" ) ||
         (filters.competition === "c" && game.competition === "c") ||
         (filters.competition === "euro" && (game.competition == "qcl" || game.competition == "el" || game.competition == "cl" || game.competition == "qel")) ){
      matchesFilter = true;
    } else {
      matchesFilter = false;
    }
  }

  return matchesFilter;
};

var calcAverageGrade = function(grades) {
  var gradedCount = 0;
  var sum = _.reduce(grades, function(memo, gradeEntry) {
    if ( gradeEntry && gradeEntry.grade && gradeEntry.grade > 0 ) {
      gradedCount += 1;
      return memo + gradeEntry.grade;
    } else {
      return memo;
    }
  }, 0);
  return sum / gradedCount;
};

//-----------------------------------------------------------------------------
// R O U T E S
//-----------------------------------------------------------------------------

app.post("/", logIncoming, function(req, res, next) {
  return res.json({message: "OK"}, 200);
});

app.get("/", function(req, res, next) {
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running.");
});

app.get("/testdata/games", function(req, res, next) {
  app.redisClient.hgetall("Games", function(err, replies) {
    var rawData = {};
    rawData.list = [];
    for ( var key in replies ) {
      var game = JSON.parse(replies[key]);
      rawData.list.push(game.spreadsheetNotation);
    }

    return res.json( rawData, 200 );
  });
});

app.get("/testdata/situations", function(req, res, next) {
  app.redisClient.hgetall("Situations", function(err, replies) {
    var rawData = {};
    rawData.list = [];
    for ( var key in replies ) {
      var situation = JSON.parse(replies[key]);
      rawData.list.push(situation.spreadsheetNotation);
    }

    return res.json( rawData, 200 );
  });
});

app.get("/testdata/players", function(req, res, next) {
  app.redisClient.hgetall("FCB", function(err, replies) {
    var rawData = {};
    rawData.list = [];
    for ( var key in replies ) {
      var player = JSON.parse(replies[key]);
      rawData.list.push(player.spreadsheetNotation);
    }

    return res.json( rawData, 200 );
  });
});

// get all saved situations
app.get("/fcb/situations", function(req, res, next) {
    app.redisClient.hgetall("Situations", function(err, replies) {
      var gameSituationsExternal = {};
      gameSituationsExternal.list = [];
      for ( var key in replies) {
        var gameSituation = JSON.parse(replies[key]);
        var gameSituationExternal = {};
        // The interface
        gameSituationExternal.date =                gameSituation.date;
        gameSituationExternal.score =               gameSituation.score;
        gameSituationExternal.team =                gameSituation.team;
        gameSituationExternal.minute =              gameSituation.minute;
        gameSituationExternal.opponent =            gameSituation.opponent;
        gameSituationExternal.homematch =           gameSituation.homematch;
        gameSituationExternal.competition =         gameSituation.competition;
        gameSituationExternal.playerPositions =     gameSituation.playerPositions;
        gameSituationExternal.scorePosition =       gameSituation.scorePosition;
        gameSituationExternal.scoredByHead =        gameSituation.scoredByHead;
        gameSituationExternal.scoredByRightFoot =   gameSituation.scoredByRightFoot;
        gameSituationExternal.scoredByLeftFoot =    gameSituation.scoredByLeftFoot;
        gameSituationExternal.scoredByWhatever =    gameSituation.scoredByWhatever;
        gameSituationExternal.ownGoal =             gameSituation.ownGoal;

        gameSituationsExternal.list.push(gameSituationExternal);
      }

      return res.json( gameSituationsExternal, 200 );
    });
});



app.get("/fcb/statistics", function(req, res, next) {
  // saison filter
  var currentSaisonKey = req.query.saison || global.conf.saison;
  var currentSaison = saisons[currentSaisonKey];

  app.redisClient.get('lastStatisticsUpdate', function(err, lastUpdate) {
    app.redisClient.hgetall("FCB", function(err, players) {
      // construct player data
      var playerStatistics = {};
      for ( var rawPlayer in players ) {
        var player = JSON.parse(players[rawPlayer]);
        playerStatistics[player.name] = initStatistics(player);
      }

      app.redisClient.hgetall("Games", function(err, games) {
        games = _.sortBy(games, function(game){
          return game;
        });
        var gamesCount = 0;
        for ( var rawGame in games ) {
          //var playersNotListed = _.keys(playerStatistics.name); // holds all players that are in the Kader but didn't play in the filter selection
          var gameEntry = JSON.parse(games[rawGame]);   // a game with all players in a collection
          if ( matchesSaison(currentSaison, gameEntry) && matchesGameFilter(gameEntry, req.query) ) {
            gamesCount += 1;
            var gameGrades = [];
            for ( var i = 0; i < gameEntry.players.length; i++ ) {
              var player = gameEntry.players[i];        // an entry from the player collection in a game -> one player in one game
              if ( playerStatistics[player.name] ) {    // only do statistics for the current Kader
                // add the game to the statistics of this player
                addGameToPlayersStatistic(player, playerStatistics, gameEntry.opponent, gameEntry.date);

                // add to grades
                if ( +player.grade > 0 ) {
                  gameGrades.push(+player.grade);
                }

                // remove the player from the list of players that get an empty entry for this game
                //var idx = playersNotListed.find(player.name);
                //if ( idx != -1 ) visibleIds.splice(idx, 1);

              } // TODO if player is not listed it should add an empty entry
            }

            // TODO fill in empty records for player in the kader that didn't play
            /*
            for ( var i = 0; i < playersNotListed; i++ ) {

            }
            */

            // average calculation
            addGameAverageGradeToPlayersStatistics(gameGrades, gameEntry, playerStatistics);
          }
        }

        // calc the average grade and package into array
        for ( var key in playerStatistics ) {
          // fill up with 0's for players that were not in the Kader yet
          while ( gamesCount > playerStatistics[key].grades.length ) {
            playerStatistics[key].grades.unshift( { grade: 0, averageGameGrade: 0, opponent: "Noch nicht im Kader" });

          }

          // same for scores
          while ( gamesCount > playerStatistics[key].scores.length ) {
            playerStatistics[key].scores.unshift( { scores: [ 0, 0 ], opponent: "Noch nicht im Kader" });
          }

          playerStatistics[key].averageGrade = calcAverageGrade(playerStatistics[key].grades);
        }

        // sort by the order
        var playerStatisticsList = _.sortBy(playerStatistics, function(player) {
          return player.order;
        });

        return res.json( { season: currentSaisonKey, list: playerStatisticsList, lastUpdate: lastUpdate }, 200 );
      });
    });
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
