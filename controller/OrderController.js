var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();

const getUidFromToken = (token, callback) => {
    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();
        const email = payload.email;

        const sql = 'SELECT id FROM users WHERE email = ?';

        mariaDB.getConnection((err, db) => {
            if (err) return callback(err, null);
            db.query(sql, [email], (err, results) => {
                db.release();
                if (err || results.length === 0) return callback(err || new Error("User not found"), null);
                return callback(null, results[0].id);
            });
        });
    } catch (err) {
        return callback(err, null);
    }
};

const order = async (req, res) => {
    const { address, receiver, contact } = req.body;
    const token = req.cookies.token;

    if (!address || !receiver || !contact) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    getUidFromToken(token, (err, uid) => {
        if (err) {
            console.log(err);
            return res.status(StatusCodes.UNAUTHORIZED).end();
        }

        let deliverySql = "INSERT INTO delivery (address, receiver, contact) VALUES (?, ?, ?)";
        let deliveryValues = [address, receiver, contact];

        mariaDB.getConnection((err, db) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            db.query(deliverySql, deliveryValues, (err, deliveryResults) => {
                if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                let did = deliveryResults.insertId;
                let orderSql = "INSERT INTO orders (created_at, uid, did) VALUES (?, ?, ?)";
                let orderValues = [new Date(), uid, did];

                db.query(orderSql, orderValues, (err, orderResults) => {
                    if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                    let oid = orderResults.insertId;
                    let title = '';
                    let totalQuantity = 0;
                    let totalPrice = 0;

                    let cartSql = "SELECT bid, counts FROM carts WHERE uid = ?";
                    db.query(cartSql, [uid], (err, cartResults) => {
                        if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                        if (cartResults.length === 0) {
                            return res.status(StatusCodes.BAD_REQUEST).send("장바구니가 비어있습니다.");
                        }

                        let doneCount = 0;

                        cartResults.forEach((cart, index) => {
                            let { bid, counts } = cart;

                            let bookSql = "SELECT price, title FROM books WHERE id = ?";
                            db.query(bookSql, [bid], (err, bookResults) => {
                                if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                                let price = bookResults[0].price;
                                let bookTitle = bookResults[0].title;

                                if (index === 0) title = bookTitle;
                                totalQuantity += counts;
                                totalPrice += price * counts;

                                let orderedBookSql = "INSERT INTO orderList (oid, bid, counts) VALUES (?, ?, ?)";
                                db.query(orderedBookSql, [oid, bid, counts], (err) => {
                                    if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                                    doneCount++;
                                    if (doneCount === cartResults.length) {
                                        let updateOrderSql = "UPDATE orders SET total_counts = ?, total_price = ?, title = ? WHERE id = ?";
                                        db.query(updateOrderSql, [totalQuantity, totalPrice, title, oid], (err) => {
                                            if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                                            let deleteCartSql = "DELETE FROM carts WHERE uid = ?";
                                            db.query(deleteCartSql, [uid], (err) => {
                                                if (err) return res.status(StatusCodes.BAD_REQUEST).end();
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
        });
    });
};

const getOrderList = async (req, res) => {
    const token = req.cookies.token;

    getUidFromToken(token, (err, uid) => {
        if (err) return res.status(StatusCodes.UNAUTHORIZED).end();

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

        mariaDB.getConnection((err, db) => {
            if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

            db.query(sql, [uid], (err, results) => {
                if (err) return res.status(StatusCodes.BAD_REQUEST).end();

                const formatted = results.map(row => ({
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

                res.status(StatusCodes.OK).json(formatted);
            });
        });
    });
};

const getOrderDetail = async (req, res) => {
    let { id } = req.params;

    if (!id) return res.status(StatusCodes.BAD_REQUEST).end();

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

    mariaDB.getConnection((err, db) => {
        if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

        db.query(sql, [id], (err, results) => {
            if (err) return res.status(StatusCodes.BAD_REQUEST).end();

            const formatted = results.map(row => ({
                bid: row.bid,
                title: row.title,
                author: row.author,
                price: row.price,
                count: row.count
            }));

            res.status(StatusCodes.OK).json(formatted);
        });
    });
};

module.exports = { order, getOrderList, getOrderDetail };
