//-----------------------------------------------------------------------------
/*!
    \file     game.js
    \author   Gabriel Hase (gabriel.hase(at)upfront(dot)io)

            purpose:    Defines a game.
                        - parse
                        - validate:
                          - competition
                          - total time played
                        
*/                  
//-----------------------------------------------------------------------------

var _ = require('underscore')._;


//-----------------------------------------------------------------------------
// C L A S S   G A M E
//-----------------------------------------------------------------------------
var Game = function(spreadsheetNotation) {
  // instance variables
  this.spreadsheetNotation = spreadsheetNotation;
  this.players = [];
  this.validationErrors = [];
  
  // class variables
  var allowedCompetitions = ["m", "c", "cl", "qcl", "el", "qel"];
    
  // ==========================  
  // validation methods
  // ==========================
  // validates if the total time played by all players is equal to 11 times the time of the game
  var validateTimePlayed = function() {
    var maxTime = 0;
    var playedTime = 0;
    for ( var i = 0; i < this.players.length; i++ ) {
      if ( maxTime < this.players[i].minutesPlayed )
        maxTime = this.players[i].minutesPlayed;
      if ( this.players[i].minutesPlayed !== '' ) 
        playedTime += this.players[i].minutesPlayed;
    }
    
    var timeForAllPlayers = maxTime * 11;
    if ( timeForAllPlayers !== playedTime )
      this.validationErrors.push("The game played by all players does not add up to the total time. Check minutes played. The total amount of minutes played by all players (11 times time of the game) is " + timeForAllPlayers + " but the time recorded is " + playedTime);    
  };

  var validateCompetition = function() {
    if ( _.indexOf(allowedCompetitions, this.competition) == -1 ) {
      this.validationErrors.push("For the game of " + this.date.toString()  + " there is an illegal value for competition. Legal values are: " + allowedCompetitions.toString());
    }
  };  
  
  var validateCompleteTeam = function(players) {
    console.log(this.spreadsheetNotation.length);
    console.log(players.length);
    if ( this.spreadsheetNotation.length !== players.length ) {
      this.validationErrors.push("For the game of the " + this.date + " the team is not complete. There are " + this.spreadsheetNotation.length + " players in the notation, but there should be " + players.length);
    }
  };
    
  // ==========================
  // instance methods
  // ==========================
  // parses the spreadsheet notation into object notation (notation is an array)
  this.parse = function() {
    for ( var i = 0; i < this.spreadsheetNotation.length; i++ ) {
      // just overwrite on each loop, should be everywhere the same
      this.date = new Date( Date.parse(this.spreadsheetNotation[i].date) );
      this.opponent = this.spreadsheetNotation[i].opponent;
      this.competition = this.spreadsheetNotation[i].competition;
      if ( this.spreadsheetNotation[i].homematch === 'h' ) {
        this.homematch = true;
      } else {
        this.homematch = false;
      }
      this.finalScore = this.spreadsheetNotation[i].finalScore;
      
      // player stuff
      var player = {};
      player.name = this.spreadsheetNotation[i].player;
      player.minutesPlayed = this.spreadsheetNotation[i].minutesPlayed;
      player.grade = this.spreadsheetNotation[i].grade;
      player.goals = this.spreadsheetNotation[i].goals;
      player.assits = this.spreadsheetNotation[i].assists;
      if ( this.spreadsheetNotation[i].yellowCard === 'x' ) {
        player.yellowCard = true;
      } else {
        player.yellowCard = false;
      }
      if ( this.spreadsheetNotation[i].yellowRedCard === 'x' ) {
        player.yellowRedCard = true;
      } else {
        player.yellowRedCard = false;
      }
      if ( this.spreadsheetNotation[i].redCard === 'x' ) {
        player.redCard = true;
      } else {
        player.redCard = false;
      }
      if ( this.spreadsheetNotation[i].replacementFor !== '' ) {
        player.replacementFor = this.spreadsheetNotation[i].replacementFor;
      }
      
      this.players.push(player);
      
      // extra stuff
      this.line = this.spreadsheetNotation[i].line;
    }
  };
  
  // validates the fields
  this.validate = function(players) {
    // NOTE: -> the team can change. unless we only validate the last game this is not working
    // validateCompleteTeam.call(this, players); 
    validateTimePlayed.call(this);
    validateCompetition.call(this);
  };
};

// export
module.exports = Game;