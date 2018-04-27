module.exports = function(app, io) {
  var express = require('express');
  var uuidv1 = require('uuid/v1');
  var router = express.Router();

  var users = {};
  var rooms = {};

  app.set('rooms', rooms);

  io.on('connection', function(socket) { 
      console.log(socket.id, 'has connected');

      // Remember user's nickname and tell clients to update userlist
      socket.on('join', function(name) {
        console.log(`${socket.id} has chosen the nickname ${name}`);

        users[socket.id] = name;

        // Store nickname in session
        socket.handshake.session.nickname = name;
        socket.handshake.session.save();
        
        // Fill client's userlist and roomlist
        socket.emit('get userlist', users)
        socket.emit('get roomlist', rooms);

        // Update all other clients's userlist
        socket.broadcast.emit('update userlist', name);
      });

      // Delete user's nickname upon disconnect and tell clients to update userlist
      socket.on('disconnect', function() {
        delete users[socket.id];
        socket.broadcast.emit('get userlist', users);
      });

      // Join room
      socket.on('join room', function(id) {
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
    // Create new room id and store room name
    var id = uuidv1();
    var name = req.body.room_name;
    rooms[id] = name;

    // Update all client's roomlist with new room
    io.emit('update roomlist', id, name);

    res.redirect(`/room/${id}`);
  });

  return router;
}
