module.exports = function(io) {
  var express = require('express');
  var router = express.Router();

  io.on('connection', function(socket) { 
      console.log('A user connected');
  });

  return router;
}