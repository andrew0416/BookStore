var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();


const getBooks = async (req, res) => {
    let sql = "SELECT * FROM books";
    let values = []

    let params = req.query
    if (params.category != undefined){
        sql += " WHERE (category_id & ?) = ?";
        let id = parseInt(params.category)
        values = [id, id]
    }

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values ,(err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.OK).json(results)

        });
    });
}

const getBookDetail = async (req, res) => {
    let sql = "SELECT * FROM books WHERE id=?";
    let {id} = req.params;
    id = parseInt(id);

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, id ,(err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.OK).json(results)

        });
    });
}

const category = async (req, res) => {
    let sql = "SELECT * FROM category"

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

module.exports = { getBooks,  getBookDetail}