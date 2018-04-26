module.exports = function(io) {
  var express = require('express');
  var router = express.Router();

  var users = {};
  var rooms = [];

  io.on('connection', function(socket) { 
      console.log(socket.id, 'has connected');

      // Remember user's nickname and tell clients to update userlist
      socket.on('join', function(name) {
        console.log(name);
        users[socket.id] = { name };

        // Store nickname in session
        socket.handshake.session.nickname = name;
        socket.handshake.session.save();
  
        socket.emit('get userlist', users)
        socket.emit('get roomlist', rooms);

        socket.broadcast.emit('update userlist', name);
      });

      // Delete user's nickname upon disconnect and tell clients to update userlist
      socket.on('disconnect', function() {
        delete users[socket.id];
        socket.broadcast.emit('get userlist', users);
      });

      // Create room
      socket.on('create room', function(name) {
        rooms.push(name);
        socket.broadcast.emit('update roomlist', name);
      });

      // Join room
      socket.on('join room', function(name) {
        socket.join(name);
        console.log(socket.handshake.session.nickname + " has joined the room: " + name);
      })
  });

  return router;
}