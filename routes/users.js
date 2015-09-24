var express = require('express');
var router = express.Router();

/* GET users listing. */
router.route('/')
  .get(function (req, res, next) {
    res.send('respond with a resource');
  })
  .post();


module.exports = router;
