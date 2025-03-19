var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();

const addCartitems = async (req, res) => {
    let { bid, uid, counts } = req.body;
    
    if (!bid || !uid || !counts) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    let sql = "INSERT INTO carts (bid, uid, counts) VALUES (?, ?, ?)";
    let values = [bid, uid, counts];

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
            res.status(StatusCodes.CREATED).json(results);
        });
    });
};

const removeCartitems = async (req, res) => {
    let { id, uid } = req.body;
    
    if (!id || !uid) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    let sql = "DELETE FROM carts WHERE id = ? AND uid = ?";
    let values = [id, uid];

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
            res.status(StatusCodes.OK).json(results)
        });
    });
};

const getCartitems = async (req, res) => {
    let { uid } = req.body;
    
    if (!uid) {
        return res.status(StatusCodes.BAD_REQUEST).end();
    }

    let sql = "SELECT c.id, c.bid, b.title, b.summary, c.counts, b.price, (c.counts * b.price) AS total_price FROM carts c JOIN books b ON c.bid = b.id WHERE c.uid = ?";
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
            res.status(StatusCodes.OK).json(results);
        });
    });
};

module.exports = { addCartitems, removeCartitems, getCartitems };