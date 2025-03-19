var express = require('express');
var router = express.Router();
var { addCartitems, removeCartitems, getCartitems } = require('../controller/CartController')

//join
router.get('/', getCartitems);

//login
router.post('/', addCartitems);

// request reset
router.delete('/', removeCartitems);


module.exports = router;
