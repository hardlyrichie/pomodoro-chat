var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Study Chat' });
});

/* POST create room */
router.post('/', function(req, res) {
  // Maybe hash room_name + userid

  // TODO instead of just room name some other id 
  res.redirect(`/room/${req.body.room_name}`)
});

module.exports = router;
