module.exports = function(app, io) {
  var express = require('express');
  var router = express.Router();

  io.on('connection', function(socket) {
    // Join room
    socket.on('join room', function(id) {
      socket.join(id);
      var room = app.get('rooms')[id];
      room.users.push(socket.handshake.session.nickname);

      // Fill client's room userlist
      socket.emit('get room userlist', room)

      // Update all other clients's room userlist
      socket.broadcast.to(id).emit('update room userlist', socket.handshake.session.nickname);

      console.log(socket.handshake.session.nickname + " has joined the room: " + id);
    })

    // Leave room
    // TODO Check if all users leave room delete room
  });

  /* GET room */
  router.get('/:id', function(req, res) {
    // Access rooms object and get name at rooms[req.params.id].name
    var name = app.get('rooms')[req.params.id].name;
    res.render('room', { title: 'Title', id: req.params.id , name: name});
  });

  return router;
}