'use strict';

module.exports = function(app, io) {
  let express = require('express');
  let router = express.Router();

  io.on('connection', function(socket) {
    let room, roomId;

    // Join room
    socket.on('join room', function(id) {
      socket.join(id);
      
      roomId = id;
      room = app.get('rooms')[id];
      if (!room) return;
      room.users.push(socket.handshake.session.nickname);

      // Fill client's room userlist
      socket.emit('get room userlist', room)

      // Update all other clients's room userlist
      socket.broadcast.to(id).emit('update room userlist', socket.handshake.session.nickname);
      
      console.log(socket.handshake.session.nickname + " has joined the room: " + id);
    })

    // Leave room
    socket.on('disconnecting', function() {
      if (!room) return;

      console.log(socket.handshake.session.nickname + " has left room " + room.name);

      // Remove client from room list
      let index = room.users.indexOf(socket.handshake.session.nickname);
      if (index >= 0) {
        room.users.splice(index, 1);
      }

      // Delete room if all users left room
      if (room.users.length < 1) {

        let refresh = new Promise(resolve => {
          // Wait one second to decide if user left the room or refreshed the page
          setTimeout(() => room.users.length < 1 ? resolve(true) : resolve(false), 1000);
        });

        refresh.then(shouldDelete => {
          if (!shouldDelete) return;

          console.log("deleting room ...");
          delete app.get('rooms')[roomId];

          // Update all client's roomlist in lobby
          io.emit('delete room', roomId)
        });
      } else {
        // Update room userlist that client is disconnecting
        io.to(roomId).emit('delete room user', socket.handshake.session.nickname);
      }
    });

    // Message
    socket.on('message', function(message) {
      let user = socket.handshake.session.nickname;
      socket.broadcast.emit('message', `[${user}]:`, `${message}`);
      socket.emit('message', `[${user}]:`, `${message}`, true);
    });

    socket.on('typing', function() {
      socket.broadcast.emit('currently typing', socket.handshake.session.nickname);
    });
  });

  /* GET room */
  router.get('/:id', function(req, res) {
    console.log("App Rooms: " + JSON.stringify(app.get('rooms')));

    let room = app.get('rooms')[req.params.id];

    // Redirect to lobby if room cannot be found
    if (!room) {
      res.redirect('/');
    }

    res.render('room', { title: 'Title', id: req.params.id , name: room.name});
  });

  return router;
}