'use strict';

module.exports = function(app, io) {
  let express = require('express');
  let router = express.Router();
  let bcrypt = require('bcrypt');

  io.on('connection', function(socket) {
    let room, roomId;

    // Join room
    socket.on('join room', function(id) {
      roomId = id;
      room = app.get('rooms')[roomId];
      if (!room) return;

      socket.join(id);

      room.users.push(socket.handshake.session.nickname);

      // Fill client's room userlist
      socket.emit('get room userlist', room)

      // Update all other clients's room userlist
      socket.to(roomId).emit('update room userlist', socket.handshake.session.nickname);
      
      console.log(socket.handshake.session.nickname + " has joined the room: " + roomId);

      // Inform client that room is already in video call
      if (room.inCall) {
        socket.emit('call started');
        io.in(roomId).emit('update inCall count', room.inCall);
      }

      io.in('lobby').emit('update users in room', roomId, room.users.length);                  
      // console.log("io.sockets.adapter.rooms object", JSON.stringify(io.sockets.adapter.rooms));
    })

    // Leave room
    socket.on('disconnecting', function() {
      if (!room) return;

      console.log(socket.handshake.session.nickname + " has left room " + room.name);

      // End video stream if in video call
      if (socket.rooms[room.SIGNAL_ROOM]) {
        leaveCall(); 
      }

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
        // Update all client's roomlist in lobby
        io.emit('delete room', roomId);
        delete app.get('rooms')[roomId];
      } else {
        // Update room userlist that client is disconnecting
        io.to(roomId).emit('delete room user', socket.handshake.session.nickname);
      }
    });

    socket.on('check room', function() {
      socket.emit('room status', room ? true : false);
    });

    // Message
    socket.on('message', function(message) {
      let user = socket.handshake.session.nickname;
      io.in(roomId).emit('message', user, message, socket.id);
    });

    socket.on('typing', function(end) {
      socket.in(roomId).emit('currently typing', socket.handshake.session.nickname, end);
    });

    //--------------Signaling----------------
    // Initiator joins WebRTC signaling room and informs everyone in chatroom of video call
    socket.on('start call', function(signal_room) {
      // Check if call has not already been started
      if (!room || room.inCall) return;

      room.inCall = 1;

      console.log('Starting Call');

      room.SIGNAL_ROOM = signal_room;

      socket.join(signal_room);
      
      // Setup pomodoro system now that in videochat
      room.pomodoro = require('../helpers/countdown')(io, signal_room, 25); 

      // TODO upon leaving chatroom, leave ALL rooms!!
      socket.in(roomId).emit('call started');
      io.in(roomId).emit('update inCall count', room.inCall);            
    });

    socket.on('join call', function() {
      socket.join(room.SIGNAL_ROOM);

      if (room.pomodoro.isCounting) {
        socket.emit('setTime', room.pomodoro.timeLeft);
      }

      // Inform all other clients in signal_room to start a peer connection with this client(socket.id)
      socket.in(room.SIGNAL_ROOM).emit('start signaling', socket.id);
      io.in(roomId).emit('update inCall count', ++room.inCall);            
    });

    socket.on('signal', function(data) {
      socket.to(data.id).emit('signaling_message', {
        type: data.type,
        message: data.message,
        id: socket.id
      });
    });

    socket.on('end stream', function() {
      leaveCall();
    });

    function leaveCall() {
      if (room.inCall <= 1)
        io.in(roomId).emit('can start call');
      else
        socket.emit('call started');

      socket.in(room.SIGNAL_ROOM).emit('end stream', socket.id);
      socket.leave(room.SIGNAL_ROOM);
      io.in(roomId).emit('update inCall count', --room.inCall);            
    }

    socket.on('pomodoro', function(action, ...args) {
      if (args) {
        room.pomodoro[action](args);                
      } else {
        room.pomodoro[action]();        
      }
    });

  });

  // Check nickname entered middleware
  router.use(function(req, res, next) {
    if (!req.session.nickname) res.redirect('/');
    else next();    
  });

  router.get('/error', function(req, res) {
    let reason = req.query.reason;
    let message;

    switch (reason) {
      case 'room_deleted':
        message = 'Room declared empty and was deleted';
        break;
      case 'track_missing':
        message = 'Required track is missing';
        break; 
      case 'in_use':
        message = 'Webcam or mic are already in use';
        break;
      case 'fail_constrains':
        message = 'Constraints can not be satisfied by available devices';
        break;
      case 'empty_constraints':
        message = 'Empty constraints object';
        break;
      case 'not_supported':
        message = 'getUserMedia() is not supported by your browser';
        break;
      default:
        message = 'Something went wrong';
    }

    res.render('fail', { message: message });
  });

  /* GET room */
  router.get('/:id', 
    // Check password middleware
    function(req, res, next) {
      req.room = app.get('rooms')[req.params.id];    
      // could use io.sockets.clients(room).length
      if (!req.room) {
        res.redirect('/');
      } else if (req.room.users.length === 0 || !req.room.password || req.session.password) {
        next();
      } else {
        res.render('password');
      }
    },
    function(req, res) {
      console.log("App Rooms: " + JSON.stringify(app.get('rooms')));
    
      res.render('room', { id: req.params.id , name: req.room.name });
  });

  /* POST password room */
  router.post('/:id', function(req, res) {
    let password = req.body.password;
    let room = app.get('rooms')[req.params.id];

    if (!room) {
      res.redirect('/room/error');
    }

    bcrypt.compare(password, room.password)
      .then(function(result) {
        if (result) {
          req.session.password = true;
          res.redirect(`/room/${req.params.id}`);
        } else {
          res.render('fail', { message: 'Wrong password' });
        }
      });
  });

  return router;
}