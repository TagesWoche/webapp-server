//-----------------------------------------------------------------------------
/*!
    \file     player.js
    \author   Gabriel Hase (gabriel.hase(at)upfront(dot)io)

            purpose:    Defines a player.
                        - parse all fields
                        - validate:
                          - position
                          - birthday
                          - number                        
*/                  
//-----------------------------------------------------------------------------

var _ = require('underscore')._;


//-----------------------------------------------------------------------------
// C L A S S   P L A Y E R
//-----------------------------------------------------------------------------
var Player = function(team, spreadsheetNotation) {
  // instance variables
  this.team = team;
  this.spreadsheetNotation = spreadsheetNotation;
  this.validationErrors = [];
  
  // class variables
  var allowedPositions = ["TW", "VE", "MF", "ST"];
  
  // ==========================
  // validation methods
  // ==========================
  var validateNumber = function() {
    if ( isNaN(this.number - 0) ) {
      this.validationErrors.push("The player number on line " + ( this.line ) + " is not a number.");
    } else {
      if ( this.number < 0 )
        this.validationErrors.push("The player number on line " + ( this.line ) + " is smaller than 0.");
    }
  };
  
  var validatePosition = function() {
    if ( _.indexOf(allowedPositions, this.position) == -1 ) {
      this.validationErrors.push("On line " + ( this.line ) + " usage of unknown Player Position. Legal values are: " + allowedPositions.toString());
    }
  };
  
  // validates a date
  var validateBirthday = function() {
    //console.log(Object.prototype.toString.call(this.birthday));
    if ( Object.prototype.toString.call(this.birthday) !== '[object Date]' )
      this.validationErrors.push("The birthday on line " + ( this.line ) + " is not a date. Write as dd.mm.yyyy, e.g. 02.01.2012");  
  };
  
  // ==========================
  // instance methods
  // ==========================
  // parses the spreadsheet notation into object notation
  this.parse = function() {
    this.number = this.spreadsheetNotation.number;
    this.nickname = this.spreadsheetNotation.nickname;
    this.name = this.spreadsheetNotation.name;
    this.position = this.spreadsheetNotation.position;
    this.birthday = new Date(Date.parse(this.spreadsheetNotation.birthday));
    this.nationality = this.spreadsheetNotation.nationality;
    // this.size = spreadsheetNotation.size;
    // this.weight = spreadsheetNotation.weight;
    // this.strongFoot = spreadsheetNotation.strongFoot;
    // this.FCBSince = spreadsheetNotation.FCBSince;
    // this.lastTeam = spreadsheetNotation.lastTeam;
    // this.contractUntil = spreadsheetNotation.contractUntil;
    
    this.line = this.spreadsheetNotation.line;
  };
  
  // validates fields
  this.validate = function() {
    validateNumber.call(this);
    validatePosition.call(this);
    validateBirthday.call(this);  
  };
};

// ==========================
// class methods
// ==========================
Player.parseValidateAndSaveSpreadsheet = function(dbHandler, spreadsheetList, callback) {
  var players = [];
  var errors = [];
  for ( var i = 0; i < spreadsheetList.length; i++ ) {
    var player = new Player("FCB", spreadsheetList[i]);
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

    return callback(errorString, 400);
  } else {
    // redis operations
    dbHandler.del("FCB"); // delete the players hash
    for ( i = 0; i < players.length; i++ ) {
      dbHandler.hset("FCB", players[i].nickname, JSON.stringify(players[i]));
    }
  
    return callback("OK", 200);
  }
};


// export
module.exports = Player;