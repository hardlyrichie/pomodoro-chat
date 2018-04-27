module.exports = function(io) {
  var express = require('express');
  var router = express.Router();

  var users = {};
  var rooms = {};

  app.set('rooms', rooms);

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
        socket.broadcast.emit('update roomlist', name);
      });

      // Join room
      socket.on('join room', function(id, name) {
        // If room not already stored, do so
        if (!rooms[id]) {
          rooms[id] = name;
          socket.broadcast.emit('update roomlist', id, name);
        }

        socket.join(id);
        console.log(socket.handshake.session.nickname + " has joined the room: " + id);
      })

      // Leave room

      // Delete room
  });

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Study Chat' });
  });

  /* POST create room */
  router.post('/', function(req, res) {
    //pass req.body.room_name as query string
    res.redirect(`/room/${uuidv1()}`);
  });

  /* GET room */
  router.get('/:id', function(req, res) {
    var id = req.params.id;
    console.log("ID:");
    res.render('room', { title: 'title', id: req.params.id , name: 'cheese'});
  });

  return router;
}