var test = require("../setup"),
    Game = require("../../app/models/game"),
    vows = test.vows, assert = test.assert, api = test.api,
    redis = require("redis"),
    sinon = require("sinon"),
    _ = require('underscore')._,
    fs = require("fs"),
    redisClient = redis.createClient(),
    controller = require("../../app/controllers/server"),
    spawn = require('child_process').spawn,
    clock;


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
        assert.equal(28, replies.length);
      }
    }
  },

  teardown: function() {
    redisClient.del("FCB");
    redisClient.del("Games");
    redisClient.del("Situations");
    clock.restore();
  },

  setup: function() {
    clock = sinon.useFakeTimers();
  },

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
          assert.equal(replies.length, 9);
        },

        "---> get the player statistics from GET route": {
          topic: api.get("/fcb/statistics"),
          "should get players with statistics": function(err, req, body) {
            assert.isNull(err);
            //console.log(req.body);
            assert.equal(req.body.list[0].name, "Yann Sommer");
            assert.equal(req.body.list[0].position, "TW");
            assert.equal(req.body.list[23].name, "Alexander Frei");
            assert.equal(req.body.list[10].name, "Markus Steinhöfer");
            assert.equal(req.body.list[25].name, "Jacques Zoua Daogari");
            assert.equal(req.body.list[4].name, "Philipp Degen");

            assert.equal(req.body.list[0].minutes, 655);
            assert.equal(req.body.list[23].goals, 4);
            assert.equal(req.body.list[23].played, 5);
            assert.equal(req.body.list[10].assists, 2);
            assert.equal(req.body.list[25].averageGrade, (3.5+5+3+5)/4);
            assert.equal(req.body.list[25].played, 8);
            assert.equal(req.body.list[4].yellowCards, 1);
            assert.equal(req.body.list[17].grades.length, 8);
            assert.deepEqual(req.body.list[0].grades[0].grade, 4.5);
            assert.deepEqual(req.body.list[0].grades[1].grade, 0);
            assert.deepEqual(req.body.list[0].grades[2].grade, 6);
            assert.deepEqual(req.body.list[0].grades[2].gameAverageGrade, 3.9545454545454546);
            assert.deepEqual(req.body.list[0].grades[3].grade, 0);
            assert.deepEqual(req.body.list[0].grades[4].grade, 5.5);
            assert.deepEqual(req.body.list[0].grades[5].grade, 4.5);
            assert.deepEqual(req.body.list[0].grades[5].gameAverageGrade, 4.541666666666667);
            assert.deepEqual(req.body.list[0].grades[6].grade, 5);
            assert.deepEqual(req.body.list[0].grades[7].grade, 5);

            //assert.deepEqual(req.body.list[0].grades, [{ grade: 4.5 }, { grade: 0 }, { grade: 6, gameAverageGrade: 3.9545454545454546 }, { grade: 0 }, { grade: 5.5 }, { grade: 4.5, gameAverageGrade: 4.541666666666667 }, { grade: 5 }, { grade: 5 }]);
          },

          "----> get the player statistics only for home plays": {
            topic: api.get("/fcb/statistics?location=home"),
            "should get the player statistics for home plays": function(err, req, body) {
              assert.isNull(err);
              assert.equal(req.body.list[12].minutes, 249); // David Degen
            }
          },
          "----> get the player statistics only for saison 12/13": {
            topic: api.get("/fcb/statistics?saison=13/14"),
            "should get the player statistics for saison 12/13": function(err, req, body) {
              assert.isNull(err);
              assert.equal(req.body.list[12].minutes, 10); // David Degen
            }
          },
          "----> get the default saison": {
            topic: api.get("/fcb/statistics"),
            "should get the default saison": function(err, req, body) {
              assert.isNull(err);
              assert.equal("12/13", req.body.season);
            }
          },
          "----> get the requested saison": {
            topic: api.get("/fcb/statistics?saison=13/14"),
            "should get the requested saison": function(err, req, body) {
              assert.isNull(err);
              assert.equal("13/14", req.body.season);
            }
          },
          "----> get a last update timestamp": {
            topic: api.get("/fcb/statistics"),
            "should get the time of last update": function(err, req, body) {
              assert.isNull(err);
              assert.equal((new Date()).toString(), req.body.lastUpdate); // uses sinon faketimers
            }
          },
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
            assert.equal(_.keys(replies).length, 3);

            var key, value;
            for (key in replies) {
              var gameSituation = JSON.parse(replies[key]);
              // situation 3 has a walking man
              if ( key == 3 ) {
                assert.equal(4, gameSituation.playerPositions.length);
                assert.equal(2, gameSituation.playerPositions[1].positions.length);
                assert.equal(3, gameSituation.playerPositions[1].number); // Park
              }
              // situation 4 has a Lattenschuss
              if ( key == 4 ) {
                assert.equal(gameSituation.playerPositions.length, 3);
                assert.equal(gameSituation.playerPositions[1].specialCondition, "G");
                assert.equal(gameSituation.playerPositions[1].triedToScore, "OM");
                assert.equal(gameSituation.playerPositions[1].number, 13); // A. Frei
              }
              // situation .. has a Penalty
              if ( key == 5 ) {
                assert.equal(gameSituation.playerPositions.length, 3);
                assert.equal(gameSituation.playerPositions[2].specialCondition, "P");
                assert.equal(gameSituation.playerPositions[1].specialCondition, "F");
              }

            }
          },

          "---> get the scene descriptions from GET route": {
            topic: api.get("/fcb/situations"),
            "should return with the situation data": function(err, req, body) {
              assert.isNull(err);
              var situation = req.body.list[0];
              assert.equal(situation.score, "1-0");
              assert.equal("Servette", situation.opponent);
              assert.equal(false, situation.homematch);
              assert.equal("m", situation.competition);
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
