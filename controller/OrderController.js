var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();

const order = async (req, res) => {
    const { uid, address, receiver, contact } = req.body;

    // 입력값 체크
    if (!uid || !address || !receiver || !contact) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    // 1. 배송 정보 등록
    let deliverySql = "INSERT INTO delivery (address, receiver, contact) VALUES (?, ?, ?)";
    let deliveryValues = [address, receiver, contact];

    mariaDB.getConnection((err, db) => {
        if (err) {
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
        }

        db.query(deliverySql, deliveryValues, (err, deliveryResults) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            // 배송 정보가 정상적으로 등록되면, delivery 테이블의 id를 변수에 저장
            let did = deliveryResults.insertId;

            // 2. 빈 주문 정보를 orders 테이블에 등록
            let orderSql = "INSERT INTO orders (created_at, uid, did) VALUES (?, ?, ?)";
            let orderValues = [new Date(), uid, did];

            db.query(orderSql, orderValues, (err, orderResults) => {
                if (err) {
                    console.log(err);
                    return res.status(StatusCodes.BAD_REQUEST).end();
                }

                // 생성된 주문의 id를 얻음
                let oid = orderResults.insertId;
                let title = ''; // 대표 책 제목을 저장할 변수
                let totalQuantity = 0;
                let totalPrice = 0;
                let orderedBooks = [];

                // 3. 장바구니에서 해당 사용자 uid에 대한 모든 항목 조회
                let cartSql = "SELECT bid, counts FROM carts WHERE uid = ?";
                let cartValues = [uid];

                db.query(cartSql, cartValues, (err, cartResults) => {
                    if (err) {
                        console.log(err);
                        return res.status(StatusCodes.BAD_REQUEST).end();
                    }

                    // 4. orderList 테이블에 각 세부 도서 정보 추가
                    cartResults.forEach((cart, index) => {
                        let bid = cart.bid;
                        let counts = cart.counts;

                        // books 테이블에서 가격 정보 가져오기
                        let bookSql = "SELECT price, title FROM books WHERE id = ?";
                        db.query(bookSql, [bid], (err, bookResults) => {
                            if (err) {
                                console.log(err);
                                return res.status(StatusCodes.BAD_REQUEST).end();
                            }

                            let price = bookResults[0].price;
                            let bookTitle = bookResults[0].title;
                            let totalBookPrice = price * counts;

                            // 첫 번째 책의 제목을 대표 책 제목으로 설정
                            if (index === 0) {
                                title = bookTitle;
                            }

                            // 주문의 총 가격과 총 수량 계산
                            totalQuantity += counts;
                            totalPrice += totalBookPrice;

                            // orderedBook 테이블에 세부 도서 정보 저장
                            let orderedBookSql = "INSERT INTO orderList (oid, bid, counts) VALUES (?, ?, ?)";
                            let orderedBookValues = [oid, bid, counts];

                            db.query(orderedBookSql, orderedBookValues, (err) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(StatusCodes.BAD_REQUEST).end();
                                }
                            });

                            // 모든 세부 도서 정보를 처리한 후, orders 테이블을 업데이트
                            if (cartResults.indexOf(cart) === cartResults.length - 1) {
                                let updateOrderSql = "UPDATE orders SET total_counts = ?, total_price = ?, title = ? WHERE id = ?";
                                let updateOrderValues = [totalQuantity, totalPrice, title, oid];

                                db.query(updateOrderSql, updateOrderValues, (err) => {
                                    if (err) {
                                        console.log(err);
                                        return res.status(StatusCodes.BAD_REQUEST).end();
                                    }

                                    // 5. 장바구니 항목 삭제
                                    let deleteCartSql = "DELETE FROM carts WHERE uid = ?";
                                    db.query(deleteCartSql, [uid], (err) => {
                                        if (err) {
                                            console.log(err);
                                            return res.status(StatusCodes.BAD_REQUEST).end();
                                        }

                                        // 장바구니 항목을 모두 처리한 후 성공 응답
                                        res.status(StatusCodes.CREATED).end();
                                    });
                                });
                            }
                        });
                    });
                });
            });
        });
    });
};

const getOrderList = async (req, res) => {
    let { uid } = req.body;

    if (!uid) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    let sql = `
        SELECT 
            o.id AS oid, 
            o.created_at, 
            o.title, 
            o.total_price AS totalPrice, 
            o.total_counts AS totalCounts, 
            d.address, 
            d.receiver, 
            d.contact
        FROM orders o
        JOIN delivery d ON o.did = d.id
        WHERE o.uid = ?;
    `;
    
    let values = [uid];

    mariaDB.getConnection((err, db) => {
        if (err) {
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            let formattedResults = results.map(row => ({
                oid: row.oid,
                created_at: row.created_at,
                title: row.title,
                totalPrice: row.totalPrice,
                totalCounts: row.totalCounts,
                delivery: {
                    address: row.address,
                    receiver: row.receiver,
                    contact: row.contact
                }
            }));

            res.status(StatusCodes.OK).json(formattedResults);
        });
    });
};

const getOrderDetail = async (req, res) => {
    let { id } = req.params;

    if (!id) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    let sql = `
        SELECT 
            ol.bid, 
            b.title, 
            b.author, 
            b.price, 
            ol.counts AS count
        FROM orderList ol
        JOIN books b ON ol.bid = b.id
        WHERE ol.oid = ?;
    `;
    
    let values = [id];

    mariaDB.getConnection((err, db) => {
        if (err) {
            console.log(err);
            return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
        }

        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            let formattedResults = results.map(row => ({
                bid: row.bid,
                title: row.title,
                author: row.author,
                price: row.price,
                count: row.count
            }));

            res.status(StatusCodes.OK).json(formattedResults);
        });
    });
};

module.exports = { order, getOrderList, getOrderDetail };