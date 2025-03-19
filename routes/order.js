var express = require('express');
var router = express.Router();
var { order, getOrderList, getOrderDetail } = require('../controller/OrderController')


// 주문하기
router.post('/', order);

// 주문 목록 보기
router.get('/', getOrderList);

// 주문 상세 보기
router.get('/:id', getOrderDetail);


module.exports = router;
