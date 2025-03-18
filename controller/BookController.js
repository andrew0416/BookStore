var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();


const getBooks = async (req, res) => {


    let {category, recent, limit, currentPage } = req.query

    let l = limit
    let c = currentPage
    if(l == undefined) {
        l = 8
    }
    if(c == undefined) {
        c = 0
    }

    let offset = l * (c);

    let sql = "SELECT b.*, GROUP_CONCAT(c.name ORDER BY c.id ASC SEPARATOR ', ') AS categories, (SELECT COUNT(*) AS likes FROM likes WHERE bid=b.id) AS likes FROM books b LEFT JOIN category c ON (b.category_id & c.id) = c.id";

    let values = []

    if ((category == undefined) && (recent == undefined)){
        values = []
    } else {
        let cnt = 0
        sql += " WHERE"

        if(category){
            cnt++
            sql += " (category_id & ?) = ?";
            let id = parseInt(category)
            values.push(id, id)
        }

        if(recent === 'true'){
            if(cnt != 0) {
                sql += " AND"
            }
            cnt++
            sql += " pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
        }
    }
    sql += " GROUP BY b.id LIMIT ? OFFSET ?";
    values.push(l, offset)

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

    let sql = "SELECT b.*, GROUP_CONCAT(c.name ORDER BY c.id ASC SEPARATOR ', ') AS categories, (SELECT COUNT(*) AS likes FROM likes WHERE bid = b.id) AS likes ,(SELECT EXISTS (SELECT * FROM likes WHERE uid = ? AND bid = b.id)) AS user_like FROM books b LEFT JOIN category c ON (b.category_id & c.id) = c.id WHERE b.id=? GROUP BY b.id";

    let {id} = req.params;
    let {uid} = req.body;
    
    let values = [uid, id]

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

module.exports = { getBooks,  getBookDetail}