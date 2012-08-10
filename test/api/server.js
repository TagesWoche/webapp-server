var test = require("../setup"), 
    Game = require("../../app/models/game"),
    vows = test.vows, assert = test.assert, api = test.api, 
    redis = require("redis"),
    _ = require('underscore')._,
    fs = require("fs"),
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
        //console.log(replies);
        assert.isNull(err);
        assert.equal(27, replies.length);
      }
    }
  },
  
  teardown: function() {
    redisClient.del("FCB");
    redisClient.del("Games");
    redisClient.del("Situations");
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
          assert.equal(replies.length, 8);
        },
        
        "---> get the player statistics from GET route": {
          topic: api.get("/fcb/statistics"),
          "should get players with statistics": function(err, req, body) {
            assert.isNull(err);
            console.log(req.body);
            assert.equal(req.body.list[0].name, "Yann Sommer");
            assert.equal(req.body.list[23].name, "Alexander Frei");
            assert.equal(req.body.list[10].name, "Markus Steinhöfer");
            assert.equal(req.body.list[25].name, "Jacques Zoua Daogari");
            assert.equal(req.body.list[4].name, "Philipp Degen");
            
            assert.equal(req.body.list[0].minutes, 655);     
            assert.equal(req.body.list[23].goals, 4);
            assert.equal(req.body.list[10].assists, 2);    
            assert.equal(req.body.list[25].averageGrade, (3.5+5+3+5)/4);   
            assert.equal(req.body.list[4].yellowCards, 1);
          },
          
          "----> get the player statistics only for home plays": {
            topic: api.get("/fcb/statistics?location=home"),
            "should get the player statistics for home plays": function(err, req, body) {
              assert.isNull(err);
              assert.equal(req.body.list[12].minutes, 249); // David Degen
            }
          }
        }
      }
    }  
  },
  
  teardown: function() {
    redisClient.del("FCB");
    redisClient.del("Games");
    redisClient.del("Situations");
  }
    
}).addBatch( {
  // scenes
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
    
      "--> post the scenes description": {
        topic: function() {
          api.postData("/fcb/situations", "gameSituations", this.callback)();
        },
        "should return status code 200": api.assertStatus(200),
      
        "---> get the scene description from redis": {
          topic: function() {
            var cb = this.callback;
            redisClient.hgetall("Situations", function(err, replies) {
              cb(err, replies);
            });
          },
          "should get the games from redis": function(err, replies) {
            assert.isNull(err);
            //console.log(_.keys(replies).length);
            assert.equal(1, _.keys(replies).length);
            
            var key, value;
            for (key in replies) {
              var gameSituation = JSON.parse(replies[key]);
              // situation 3 has a walking man
              if ( key == 3 ) {
                assert.equal(4, gameSituation.playerPositions.length);
                assert.equal(2, gameSituation.playerPositions[1].positions.length);
                assert.equal(3, gameSituation.playerPositions[1].number); // Park
              }
            }
          },
          
          "---> get the scene descriptions from GET route": {
            topic: api.get("/fcb/situations"),
            "should return with the situation data": function(err, req, body) {
              assert.isNull(err);
              for ( var i = 0; i < req.body.list.length; i++ ) {
                var situation = req.body.list[i];
                assert.equal("1-0", situation.score);
                assert.equal("Servette", situation.opponent);
                assert.equal(false, situation.homematch);
                assert.equal("m", situation.competition);
              }
            }
          }
        }
      }  
    }
  },
  
  teardown: function() {
    redisClient.del("FCB");
    redisClient.del("Games");
    redisClient.del("Situations");
  }
  
}).export(module);