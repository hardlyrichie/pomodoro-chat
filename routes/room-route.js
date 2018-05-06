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
      room = app.get('rooms')[roomId];
      if (!room) return;
      room.users.push(socket.handshake.session.nickname);

      // Fill client's room userlist
      socket.emit('get room userlist', room)

      // Update all other clients's room userlist
      socket.to(roomId).emit('update room userlist', socket.handshake.session.nickname);
      
      console.log(socket.handshake.session.nickname + " has joined the room: " + roomId);

      if (room.inCall) 
        socket.emit('call started');    

      // console.log("io.sockets.adapter.rooms object", JSON.stringify(io.sockets.adapter.rooms));
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
      socket.in(roomId).emit('message', `[${user}]:`, `${message}`);
      socket.emit('message', `[${user}]:`, `${message}`, true);
    });

    socket.on('typing', function() {
      socket.in(roomId).emit('currently typing', socket.handshake.session.nickname);
    });

    //--------------Signaling----------------
    // Initiator joins WebRTC signaling room and informs everyone in chatroom of video call
    socket.on('start call', function(signal_room) {
      // Check if call has not already been started
      if (room.inCall) return;

      console.log('Starting Call');

      room.inCall = true;

      socket.join(signal_room);

      // TODO upon leaving chatroom, leave ALL rooms!!
      socket.in(roomId).emit('call started');
    });

    socket.on('join call', function(signal_room) {
      socket.join(signal_room);

      // Inform all other clients in signal_room to start a peer connection with this client
      socket.in(signal_room).emit('start signaling', socket.id);
    });

    socket.on('signal', function(data) {
      socket.to(data.id).emit('signaling_message', {
        type: data.type,
        message: data.message,
        id: socket.id
      });
    });

    socket.on('end call', function(signal_room) {
      socket.in(signal_room).emit('end call');
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
      // could use io.sockets.clients(room).length
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