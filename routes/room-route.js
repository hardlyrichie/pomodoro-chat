var express = require('express');
var router = express.Router();

/* GET room */
router.get('/:id', function(req, res) {
  res.render('room', { title: "Test", name: req.params.id });
});

module.exports = router;