var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();

const category = async (req, res) => {
    let sql = "SELECT name, BIN(id) AS code FROM category"

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.OK).json(results)

        });
    });
}

module.exports = { category }