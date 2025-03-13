var express = require('express');
var router = express.Router();
var join = require('../controller/UserController')

/* GET users listing. */
router.get('/join', join);

//join
//login
//reset

module.exports = router;
