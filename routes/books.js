var express = require('express');
var router = express.Router();
var { getBooks, getBookDetail} = require('../controller/BookController')

// 조회
router.get('/', getBooks);

// 개별 조회
router.get('/:id', getBookDetail);

module.exports = router;
