var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();


const addLike = async (req, res) => {

    let sql = "INSERT INTO likes ( uid, bid ) VALUES (?, ?)";
    let {bid} = req.params;
    let {uid} = req.body;

    let values = [uid, bid]

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values ,(err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.CREATED).json(results)

        });
    });
}

const removeLike = async (req, res) => {
    let sql = "DELETE FROM likes WHERE uid = ? AND bid = ?";
    let {bid} = req.params;
    let {uid} = req.body;

    let values = [uid, bid]

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values ,(err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            if (results.affectedRows === 0) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.OK).json(results)

        });
    });
}

module.exports = { addLike,  removeLike }