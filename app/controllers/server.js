// VARIABLES
var app = require("../../config/server"),
    redis = require("redis"),
    client = redis.createClient(null, null);

//-----------------------------------------------------------------------------
// R O U T E S
//-----------------------------------------------------------------------------

app.get('/', function(req, res, next) {
  return res.send("Welcome to tageswoche nodejitsu setup. Up and running.");
});