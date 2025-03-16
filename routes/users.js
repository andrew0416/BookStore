var express = require('express');
var router = express.Router();
var { join, login, requestReset, resetPassword } = require('../controller/UserController')

//join
router.post('/join', join);

//login
router.post('/login', login);

// request reset
router.post('/reset', requestReset);

// reset password
router.put('/reset', resetPassword);

module.exports = router;
