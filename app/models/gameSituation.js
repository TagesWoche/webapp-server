//-----------------------------------------------------------------------------
/*!
    \file     gameSituation.js
    \author   Gabriel Hase (gabriel.hase(at)upfront(dot)io)

            purpose:    Defines a game situation.
                        - parse all fields
                        - validate:
                          - date
                          - minute
                          - team and opponent
                          - score Position
                          - situation notation
                        
*/                  
//-----------------------------------------------------------------------------

var _ = require('underscore')._;


//-----------------------------------------------------------------------------
// C L A S S   G A M E   S I T U A T I O N
//-----------------------------------------------------------------------------
var GameSituation = function(spreadsheetNotation) {
  // instance variables
  this.spreadsheetNotation = spreadsheetNotation;
  this.parseErrors = [];
  this.validationErrors = [];
  this.playerPositions = [];  // TODO: maybe put this into its own object
  this.playerPositionPartsPattern = new RegExp(/(\w{1}.\s*\w+)\s*([A-Z]\d{1,2})\s*(\(.*\))?/);
  this.positionPattern = new RegExp(/[A-R]\d{1,2}/);
  this.specialConditionsPattern = new RegExp(/\((FD|FI|E|P|PS|EW|F:\s*.*)\)/);
  
  // class variables
  var maxTime = 125; // 120 min + 5 min overtime
  var allowedScorePositions = ["OR", "OM", "OL", "UR", "UM", "UL", "LD", "RD", "OD", "G:"];

  
  // ==========================
  // parsing helper methods
  // ==========================
  // parse the special condition
  var parseSpecialCondition = function(specialCondition, playerPosition) {
    var specialConditionPattern = new RegExp(/\((.*)\)/);
    var specialConditionMatches = specialConditionPattern.exec(specialCondition);
    if ( specialConditionMatches[1] ) {
      if ( specialConditionMatches[1].length > 1 && specialConditionMatches[1].slice(0, 2) === "F:" ) {
        playerPosition.specialCondition = "F";
        playerPosition.fouledBy = specialConditionMatches[1].slice(2);
      } else {
        playerPosition.specialCondition = specialConditionMatches[1];
      }
    } else {
      this.parseErrors.push("The situation on line " + ( this.line ) + " has an empty expression in (). Use any of FD, FI, E, P, PS, EW, F:<player>.");
    }
  };
  
  // parse the player name position and special condition
  var parsePlayerPositions = function(playerPositions) {
    for ( var i = 0; i < playerPositions.length; i++ ) {
      var lastPlayerName,
          lastPlayerPosition,
          walkingMan = false,
          playerPosition = {}; 
          
      // split into name, position and special condition, e.g. penalty or foul
      var playerPositionParts = this.playerPositionPartsPattern.exec(playerPositions[i]);
      var playerName = playerPositionParts[1].trim();
      
      if ( lastPlayerName === playerName ) {
        playerPosition = lastPlayerPosition;
        walkingMan = true;
      }
      
      // the name
      if ( playerPositionParts[1] ) {
        playerPosition.name = playerName;
        lastPlayerName = playerPosition.name;
      } else {
        this.parseErrors.push("The situation on line " + ( this.line ) + " has a part without a player name.");
      }
      
      // the position
      if ( playerPositionParts[2] ) {
        if ( !playerPosition.positions ){
          playerPosition.positions = [];
        }
        playerPosition.positions.push(playerPositionParts[2]);
      } else {
        this.parseErrors.push("The situation on line " + ( this.line ) + " has a part without a player position.");
      }

      // the special condition: optional
      if ( playerPositionParts[3] ) {
        parseSpecialCondition(playerPositionParts[3], playerPosition);
      }
      
      lastPlayerPosition = playerPosition;
      if ( walkingMan === false )
        this.playerPositions.push(playerPosition);
    }
  };
  
  // ==========================
  // validation methods
  // ==========================
  // validates a date
  var validateDate = function() {
    if ( Object.prototype.toString.call(this.date) !== '[object Date]' )
      this.validationErrors.push("The situation on line " + ( this.line ) + " has an invalid date field. Write as dd.mm.yyyy, e.g. 02.01.2012");  
  };
  
  // validates the minute
  var validateMinute = function() {
    if ( isNaN(this.minute - 0) ) {
      this.validationErrors.push("The minute on line " + ( this.line ) + " is not a number.");
    } else {
      if ( this.minute > maxTime || this.minute < 0 )
        this.validationErrors.push("The maximum allowed time is " + maxTime + " minutes. The minute on line " + ( this.line ) + " is bigger or smaller than 0.");
    }
  };
  
  // validates the team and opponent fields
  var validateTeamAndOpponent = function() {
    if ( this.opponent.toLowerCase() == 'fcb' ) {
      this.validationErrors.push("On line " + ( this.line ) + " the opponent cannot be the FCB itself.");
    }
    if ( this.team.toLowerCase() != 'fcb' && this.opponent.toLowerCase() != this.team.toLowerCase() ) {
      this.validationErrors.push("On line " + ( this.line ) + " the team leading the situation has to be the FCB or the opponent.");
    }
  };
  
  // validates the score position field
  var validateScorePosition = function() {
    if ( _.indexOf(allowedScorePositions, this.scorePosition) == -1 ) {
      this.validationErrors.push("On line " + ( this.line ) + " usage of unknown score Position. Legal values are: " + allowedScorePositions.toString());
    }
    // TODO: validate Gehalten special case
  };
  
  var validatePlayerPositions = function(players) {
    if ( this.team.toLowerCase() == "fcb" ) {
      for ( var i = 0; i < this.playerPositions.length; i++ ) {
        // the name
        if ( _.indexOf(players, this.playerPositions[i].name) == -1 ) {
          this.validationErrors.push("The name " + this.playerPositions[i].name + " on line " + ( this.line ) + " is not a valid player name. Check the correct nicknames.");
        }
        // the position
        for ( var n = 0; n < this.playerPositions[i].positions.length; n++ ) {
          var position = this.playerPositions[i].positions[n];
          if (! this.positionPattern.test( position )) {
            this.validationErrors.push("The position " + position + " on line " + ( this.line ) + " is not well-formed, see the grid for valid values.");
          }
        }
        // TODO: the special condition
      }
    }
  };
  
  
  // ==========================
  // instance methods
  // ==========================
  // parses the spreadsheet notation into object notation
  this.parse = function() {
    // easy fields
    this.date = new Date( Date.parse(this.spreadsheetNotation.date) );
    this.opponent = this.spreadsheetNotation.opponent;
    this.team = this.spreadsheetNotation.team;
    this.scorePosition = this.spreadsheetNotation.scorePosition;
    this.minute = this.spreadsheetNotation.minute;
    
    // helper field
    this.line = this.spreadsheetNotation.line + 1;
    
    // boolean flags
    if ( this.spreadsheetNotation.scoredByHead === 'x' )
      this.scoredByHead = true;
    if ( this.spreadsheetNotation.scoredByRightFoot === 'x' )
      this.scoredByRightFoot = true;
    if ( this.spreadsheetNotation.scoredByLeftFoot === 'x' )
      this.scoredByLeftFoot = true;
    if ( this.spreadsheetNotation.scoredByWhatever === 'x' )
      this.scoredByWhatever = true;
    if ( this.spreadsheetNotation.ownGoal === 'x' )
      this.ownGoal = true;
      
    // situation Notation
    var playerPositions = this.spreadsheetNotation.gameSituation.split("->");
    //console.log(playerPositions);
    parsePlayerPositions.call(this, playerPositions);
  };
  
  // validates the parsed fields
  this.validate = function(players) {
    
    validateDate.call(this);
    validateMinute.call(this);
    validateTeamAndOpponent.call(this);
    validateScorePosition.call(this);
    
    validatePlayerPositions.call(this, players);
  };
  
  this.addGameData = function(games) {
    var gameExists = false;
    for (var key in games) {
      if ( new Date(key).toUTCString() == this.date.toUTCString() ) {
        gameExists = true;
        var game = JSON.parse(games[key]);
        this.score = game.finalScore;
        this.competition = game.competition;
        this.homematch = game.homematch;
      }
    }
    return gameExists;
  };
};

// ==========================
// class methods
// ==========================
GameSituation.parseValidateAndSaveSpreadsheet = function(dbHandler, spreadsheetList, callback) {
  // load the players (only nicknames)
  var players = [];
  dbHandler.hkeys("FCB", function (err, replies) {
    _.each(replies, function(nickname) {
      //console.log("loading player: " + nickname);
      players.push(nickname);
    });
    
    dbHandler.hgetall("Games", function (err, games) {      
      var errors = [];
      var gameSituations = [];
      for ( var i = 0; i < spreadsheetList.length; i++ ) {
        var gameSituation = new GameSituation(spreadsheetList[i]);
        gameSituation.parse();
        gameSituation.validate(players);
        var gameExists = gameSituation.addGameData(games);
        if ( gameExists === true ) {  // only save situations for games that are there
          errors = _.union(errors, gameSituation.validationErrors);
          errors = _.union(errors, gameSituation.parseErrors);
          gameSituations.push(gameSituation);
        }
      }

      if ( errors.length > 0 ) {
        var errorString = "";
        for ( i = 0; i < errors.length; i++ ) {
          errorString = errorString + "validation error:\n" + errors[i] + "\n";
        }
      
        return callback(errorString, 500);
      } else {
        // redis operations
        dbHandler.del("Situations"); // delete the situations hash
        for ( i = 0; i < gameSituations.length; i++ ) {
          dbHandler.hset("Situations", gameSituations[i].line, JSON.stringify(gameSituations[i]));
        }

        return callback("OK", 200);
      }
    });  
  });
};



// export
module.exports = GameSituation;