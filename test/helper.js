var request = require("request"),
    fs = require("fs"),
    assert = require("assert"),
    server = require("../config/server"),
    apiUrl = "http://localhost:"+server.address().port;

var api = {
  
  requestParams: function( url, data ) {
    return {
      url: apiUrl+(url||''),
      json: data || {}
    }
  },
  
  // HTTP HELPERS
  get: function( url, callback ) {
    return function(){
      request.get( api.requestParams(url), callback ? callback : this.callback);
    }
  },
  post: function( url, data, callback ) {
    return function(){
      request.post( api.requestParams(url, data), callback ? callback : this.callback);  
    }
  },
  put: function( url, data ) {
    return function(){
      request.put( api.requestParams(url, data), this.callback);
    }
  },
  del: function( url, data ) {
    return function(){
      request.del( api.requestParams(url, data), this.callback);
    }
  },
  
  // POST TEST-DATA JSON
  postData: function(url, data_identifier, callback) {
    return function() {
      var _this = this;
      fs.readFile("test_data/"+ data_identifier +".json", function(err, data) {
        if(err) console.log(err);
        var json_data = JSON.parse(data);
        request.post( api.requestParams(url, json_data), callback ? callback : _this.callback);
      });
    }
  },
  
  // HELPERS
  readJsonSync: function(data_identifier) {
    var data = fs.readFileSync("test_data/"+ data_identifier +".json");
    return JSON.parse(data);
  },
  curry: function(callback){
    var curriedArguments = Array.prototype.slice.call(arguments, 1);
    return function(){
      var args = Array.prototype.slice.call(arguments);
      var allArguments = args.concat(curriedArguments);
      callback.apply(this, allArguments);
    }
  },
  
  // ASSERT HELPERS
  assertStatus: function(code) {
    return function(error, response, body) {
      assert.equal (response.statusCode, code);
    }
  },
  assertBody: function(bodyExpected){
    return function(error, response, body) {
      assert.equal (body, bodyExpected);
    }
  }
  
}

module.exports = api;