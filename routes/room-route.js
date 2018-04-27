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
    // socket.on('disconnecting', function() {
    //   if (!room) return;

    //   // Remove from room list
    //   let index = room.indexOf(socket.handshake.session.nickname);
    //   if (index >= 0) {
    //     room.users.splice(index, 1);
    //   }

    //   // Delete room if all users left room
    //   if (room.users.length < 1) {
    //     delete app.get('rooms')[roomId];
    //     io.emit
    //   } else {
    //     // Update room userlist that client is disconnecting
    //   } 
    // });
  });

  /* GET room */
  router.get('/:id', function(req, res) {
    // Access rooms object and get name at rooms[req.params.id].name
    let name = app.get('rooms')[req.params.id].name;
    res.render('room', { title: 'Title', id: req.params.id , name: name});
  });

  return router;
}