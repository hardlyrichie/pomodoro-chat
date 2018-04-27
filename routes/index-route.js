module.exports = function(app, io) {
  var express = require('express');
  var uuidv1 = require('uuid/v1');
  var router = express.Router();

  var users = {};
  // room { name: name, { users: [] } }
  var rooms = {};

  app.set('rooms', rooms);

  io.on('connection', function(socket) { 
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
        socket.broadcast.emit('delete user', users[socket.id]);
        delete users[socket.id];
      });

      // Refresh userlist and roomlist
      socket.on('refresh', function() {
        socket.emit('get userlist', users);
        socket.emit('get roomlist', rooms);
      });
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
    rooms[id] = { 
      name,
      users: []
    };

    // Update all client's roomlist with new room
    io.emit('update roomlist', id, name);

    res.redirect(`/room/${id}`);
  });

  return router;
}
