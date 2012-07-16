//-----------------------------------------------------------------------------
/*!
    \file     player.js
    \author   Gabriel Hase (gabriel.hase(at)upfront(dot)io)

            purpose:    Defines a player.
                        - parse
                        - validate
                        
*/                  
//-----------------------------------------------------------------------------

var _ = require('underscore')._;


//-----------------------------------------------------------------------------
// C L A S S   P L A Y E R
//-----------------------------------------------------------------------------
var Player = function(team, spreadsheetNotation) {
  this.team = team;
  this.spreadsheetNotation = spreadsheetNotation;
  
  // instance methods
  //-----------------------------------------------------------------------------
  // parses the spreadsheet notation into object notation
  //-----------------------------------------------------------------------------
  this.parse = function() {
    // easy fields
    this.number = spreadsheetNotation.number;
    this.nickname = spreadsheetNotation.nickname;
    this.name = spreadsheetNotation.name;
    this.position = spreadsheetNotation.position;
    this.birthday = spreadsheetNotation.birthday;
    this.nationality = spreadsheetNotation.nationality;
    // this.size = spreadsheetNotation.size;
    // this.weight = spreadsheetNotation.weight;
    // this.strongFoot = spreadsheetNotation.strongFoot;
    // this.FCBSince = spreadsheetNotation.FCBSince;
    // this.lastTeam = spreadsheetNotation.lastTeam;
    // this.contractUntil = spreadsheetNotation.contractUntil;
    
    this.line = spreadsheetNotation.line;
  }
  
}

module.exports = Player;