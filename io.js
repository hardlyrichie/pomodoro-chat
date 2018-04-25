module.exports = function(io) {
  var express = require('express');
  var router = express.Router();

  var users = {};

  io.on('connection', function(socket) { 
      console.log('A user connected');

      socket.on('join', function(name) {
        console.log(name);
        users[socket.id] = name;
        io.emit('update-userlist', users);
      });

      socket.on('disconnect', function() {
        delete users[socket.id];
        socket.broadcast.emit('update-userlist', users);
      });
  });

  return router;
}