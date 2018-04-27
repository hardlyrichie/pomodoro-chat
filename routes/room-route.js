// var express = require('express');
// var router = express.Router();

// /* GET room */
// router.get('/:id', function(req, res) {
//   res.render('room', { title: 'Title', id: req.params.id , name: req.query.name});
// });

// module.exports = router;

module.exports = function(app, io) {
  var express = require('express');
  var router = express.Router();

  /* GET room */
  router.get('/:id', function(req, res) {
    // Access rooms object and get name at rooms[req.params.id]
    var name = app.get('rooms')[req.params.id];
    res.render('room', { title: 'Title', id: req.params.id , name: name});
  });

  return router;
}