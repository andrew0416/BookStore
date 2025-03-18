var express = require('express');
var router = express.Router();
var { addLike , removeLike } = require('../controller/LikesController')

// 좋아요 
router.post('/:bid' , addLike);

// 좋아요 취소
router.delete('/:bid' , removeLike);

module.exports = router;
