'use strict';

module.exports = function(app, io) {
  let express = require('express');
  let router = express.Router();
  let bcrypt = require('bcrypt');  

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

      // Delete password session data
      delete socket.handshake.session.password;
      socket.handshake.session.save();

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

  // Check nickname entered middleware
  router.use(function(req, res, next) {
    if (!req.session.nickname) res.redirect('/');
    else next();    
  });

  /* GET room */
  router.get('/:id', 
    // Check password middleware
    function(req, res, next) {
      req.room = app.get('rooms')[req.params.id];    
      console.log(app.get('rooms')); 
      if (req.room.users.length === 0 || !req.room.password || req.session.password) {
        next();
      } else {
        res.render('password');
      }
    },
    function(req, res) {
      console.log("App Rooms: " + JSON.stringify(app.get('rooms')));

      // Redirect to lobby if room cannot be found
      if (!req.room) {
        res.redirect('/');
      }

      res.render('room', { id: req.params.id , name: req.room.name });
  });

  /* POST password room */
  router.post('/:id', function(req, res) {
    let password = req.body.password;
    bcrypt.compare(password, app.get('rooms')[req.params.id].password)
      .then(function(result) {
        if (result) {
          req.session.password = true;
          res.redirect(`/room/${req.params.id}`);
        } else {
          res.render('password-failed');
        }
      });
  });

  return router;
}