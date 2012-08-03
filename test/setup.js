process.env.NODE_ENV = "test";

var vows = require("vows"),
    assert = require("assert")
    api = require("./helper"),
    status = require("./status-codes");
    
exports.vows = vows;
exports.assert = assert;
exports.api = api;
exports.status = status;
