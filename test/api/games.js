var test = require("../setup"), 
    Game = require("../../app/models/game"),
    vows = test.vows, assert = test.assert, api = test.api, 
    redis = require("redis"),
    _ = require('underscore')._,
    redisClient = redis.createClient(),
    controller = require("../../app/controllers/server"),
    spawn = require('child_process').spawn;        


vows.describe("fcb api").addBatch( {
  // players
  "post the players": {
    topic: function() {
      api.postData("/fcb/players", "players", this.callback)();
    },
    "should return status code 200": api.assertStatus(200),
    
    "-> get the players from the redis database": {
      topic: function() {
        var cb = this.callback;
        redisClient.hkeys("FCB", function (err, replies) {
          cb(err, replies);
        });
      },
      "should have received the players from the redis database": function(err, replies) {
        assert.isNull(err);
        assert.equal(27, replies.length);
      }
    }
  }
  
}).addBatch( { 
   // games (players are needed for setup)
    
  "post the players": {
    topic: function() {
      api.postData("/fcb/players", "players", this.callback)();
    },
    
    "should return status code 200": api.assertStatus(200),
    
    "-> post a game description": {
      topic: function() {
        api.postData("/fcb/games", "games", this.callback)();
      },
      "should return status code 200": api.assertStatus(200),
      
      "--> get the game description from redis": {
        topic: function() {
          var cb = this.callback;
          redisClient.hkeys("Games", function(err, replies) {
            cb(err, replies);
          });
        },
        "should get the games from redis": function(err, replies) {
          assert.isNull(err);
          assert.equal(1, replies.length);
        }
      }
    }  
  }
    
}).addBatch( {
  // scenes
  "post the players": {
    topic: function() {
      api.postData("/fcb/players", "players", this.callback)();
    },
    
    "should return status code 200": api.assertStatus(200),
    
    "-> post the scenes description": {
      topic: function() {
        api.postData("/fcb/situations", "gameSituations", this.callback)();
      },
      "should return status code 200": api.assertStatus(200),
      
      "--> get the game description from redis": {
        topic: function() {
          var cb = this.callback;
          redisClient.hgetall("Situations", function(err, replies) {
            cb(err, replies);
          });
        },
        "should get the games from redis": function(err, replies) {
          assert.isNull(err);
          
          var key, value;
          for (key in replies) {
            var gameSituation = JSON.parse(replies[key]);
            // situation 3 has a walking man
            if ( key == 3 ) {
              assert.equal(4, gameSituation.playerPositions.length);
              assert.equal(2, gameSituation.playerPositions[1].positions.length);
            }
            //console.log(_.keys(gameSituation));
            //console.log(gameSituation.playerPositions);
          }
    //      console.log(replies);
        }
      }
    }  
  }
  
  
  
}).export(module);