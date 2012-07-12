// VARIABLES
var app = require("../../config/server"),
    redis = require("redis"),
    client = redis.createClient(9111, "redis://barb.redistogo.com/"),
    client.auth("93fbe3baf4c48b4ec1b3a4f5522937c8");

//-----------------------------------------------------------------------------
// R O U T E S
//-----------------------------------------------------------------------------

app.get('/', function(req, res, next) {
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running.");
});

app.post('/fcb/situations', function(req, res, next) {
  console.log("received game situations " + req.body);
  return res.send("OK", 200);
});