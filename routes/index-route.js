'use strict';

module.exports = function(app, io) {
  let express = require('express');
  let uuidv1 = require('uuid/v1');
  let bcrypt = require('bcrypt');
  let router = express.Router();
  const { body, validationResult } = require('express-validator/check');
  const { sanitizeBody } = require('express-validator/filter');

  let users = {};
  // room { name: name, users: [], inCall: boolean }
  let rooms = {};

  app.set('rooms', rooms);

  io.on('connection', function(socket) { 
      // Remember user's nickname and tell clients to update userlist
      socket.on('join', function(name) {
        console.log(`${socket.id} has chosen the nickname ${name}`);

        // Join lobby room
        socket.join('lobby');

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
        if (!users[socket.id]) return;

        socket.broadcast.emit('delete user', users[socket.id]);
        delete users[socket.id];

        console.log(socket.handshake.session.nickname + " has left the lobby");
      });

      // Refresh userlist and roomlist
      socket.on('refresh', function() {
        socket.emit('get userlist', users);
        socket.emit('get roomlist', rooms);
      });

      socket.on('get nickname', function(callback) {
        callback(socket.handshake.session.nickname);
      });
  });

  /* GET home page. */
  router.get('/', function(req, res, next) {
    res.render('index', { nickname: req.session.nickname });
  });

  /* POST create room */
  router.post('/', 
    // Validate Fields
    body('room_name').trim().isLength({ min: 1 }).withMessage('Room name must be specified'),
    body('session').isFloat({ min: 0, max: 999}).withMessage('Session length must be between 0 and 999 minutes'),
    body('short').isFloat({ min: 0, max: 999}).withMessage('Break length must be between 0 and 999 minutes'),
    body('long').isFloat({ min: 0, max: 999}).withMessage('Break length must be between 0 and 999 minutes'),
    
    // Sanitize Fields
    sanitizeBody('password').trim().escape(),

    function(req, res) {
    // Create new room id and store room name
    let id = uuidv1();
    let name = req.body.room_name;
    
    let password = req.body.password;

    rooms[id] = { 
      name, // room name
      users: [], // list of users
      settings: {
        session: req.body.session,
        short: req.body.short,
        long: req.body.long
      },
      inCall: null, // count of number of users in video call
      SIGNAL_ROOM: null, // name of signaling room `${roomId}_signal`
      pomodoro: null // pomodoro object that contains countdown functionality
    };

    storePassword(password, id).then(() => {
      console.log("Done storing password");

      // Update all client's roomlist with new room
      io.in('lobby').emit('update roomlist', id, name);

      res.redirect(`/room/${id}`);
    });
  });

  async function storePassword (password, id) {
    if (!password) return;

    password = await bcrypt.hash(password, 10);
  
    rooms[id].password = password;
  }
  
  return router;
}