var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();

const jwt = require('jsonwebtoken');

const addCartitems = async (req, res) => {
    let { bid, counts } = req.body;
    const token = req.cookies.token;

    if (!token || !bid || !counts) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();

        const email = payload.email;
        const getUidSql = "SELECT id FROM users WHERE email = ?";
        
        mariaDB.getConnection((err, db) => {
            if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

            db.query(getUidSql, [email], (err, userResults) => {
                if (err || userResults.length === 0) return res.status(StatusCodes.UNAUTHORIZED).end();

                const uid = userResults[0].id;
                const sql = "INSERT INTO carts (bid, uid, counts) VALUES (?, ?, ?)";
                const values = [bid, uid, counts];

                db.query(sql, values, (err, results) => {
                    if (err) return res.status(StatusCodes.BAD_REQUEST).end();
                    res.status(StatusCodes.CREATED).json(results);
                });
            });
        });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
};

const removeCartitems = async (req, res) => {
    let { id } = req.body;
    const token = req.cookies.token;

    if (!token || !id) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();

        const email = payload.email;
        const getUidSql = "SELECT id FROM users WHERE email = ?";
        
        mariaDB.getConnection((err, db) => {
            if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

            db.query(getUidSql, [email], (err, userResults) => {
                if (err || userResults.length === 0) return res.status(StatusCodes.UNAUTHORIZED).end();

                const uid = userResults[0].id;
                const sql = "DELETE FROM carts WHERE id = ? AND uid = ?";
                const values = [id, uid];

                db.query(sql, values, (err, results) => {
                    if (err) return res.status(StatusCodes.BAD_REQUEST).end();
                    res.status(StatusCodes.OK).json(results);
                });
            });
        });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
};

const getCartitems = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();

        const email = payload.email;
        const getUidSql = "SELECT id FROM users WHERE email = ?";
        
        mariaDB.getConnection((err, db) => {
            if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

            db.query(getUidSql, [email], (err, userResults) => {
                if (err || userResults.length === 0) return res.status(StatusCodes.UNAUTHORIZED).end();

                const uid = userResults[0].id;
                const sql = `
                    SELECT c.id, c.bid, b.title, b.summary, c.counts, b.price, 
                    (c.counts * b.price) AS total_price 
                    FROM carts c 
                    JOIN books b ON c.bid = b.id 
                    WHERE c.uid = ?`;
                const values = [uid];

                db.query(sql, values, (err, results) => {
                    if (err) return res.status(StatusCodes.BAD_REQUEST).end();
                    res.status(StatusCodes.OK).json(results);
                });
            });
        });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
};

module.exports = { addCartitems, removeCartitems, getCartitems };
