var express = require('express');
var router = express.Router();
var { addCartitems, removeCartitems, getCartitems } = require('../controller/CartController')

// 장바구니 보기
router.get('/', getCartitems);

// 장바구니 추가
router.post('/', addCartitems);

// 장바구니 삭제
router.delete('/', removeCartitems);


module.exports = router;
