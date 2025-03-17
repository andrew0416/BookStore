var express = require('express');
var router = express.Router();
var {category} = require('../controller/CategoryController')

/* GET users listing. */
router.get('/', category);

module.exports = router;
