/**
 * Author: VincentBel
 * Date: 15/11/6
 */

var express = require('express');
var router = express.Router();

var materialController = require('../app/controllers/materials');

router.get('/:materialName', materialController.getByName);

module.exports = router;