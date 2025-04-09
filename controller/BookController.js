var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();
const jwt = require('jsonwebtoken');

const getBooks = async (req, res) => {
    let { category, recent, limit, currentPage } = req.query;

    let l = limit ?? 8;
    let c = currentPage ?? 0;
    let offset = l * c;

    let sql = `
        SELECT b.*, 
               GROUP_CONCAT(c.name ORDER BY c.id ASC SEPARATOR ', ') AS categories,
               (SELECT COUNT(*) AS likes FROM likes WHERE bid = b.id) AS likes
        FROM books b 
        LEFT JOIN category c ON (b.category_id & c.id) = c.id`;

    let values = [];

    if ((category !== undefined) || (recent !== undefined)) {
        sql += " WHERE";
        let cnt = 0;

        if (category) {
            cnt++;
            sql += " (category_id & ?) = ?";
            let id = parseInt(category);
            values.push(id, id);
        }

        if (recent === 'true') {
            if (cnt !== 0) sql += " AND";
            sql += " pub_date BETWEEN DATE_SUB(NOW(), INTERVAL 1 MONTH) AND NOW()";
        }
    }

    sql += " GROUP BY b.id LIMIT ? OFFSET ?";
    values.push(parseInt(l), parseInt(offset));

    mariaDB.getConnection(async (err, db) => {
        if (err) return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();

        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            res.status(StatusCodes.OK).json(results);
        });
    });
};

const getBookDetail = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(StatusCodes.BAD_REQUEST).end();

    let { id } = req.params;

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
                    SELECT b.*, 
                           GROUP_CONCAT(c.name ORDER BY c.id ASC SEPARATOR ', ') AS categories,
                           (SELECT COUNT(*) AS likes FROM likes WHERE bid = b.id) AS likes,
                           (SELECT EXISTS (SELECT * FROM likes WHERE uid = ? AND bid = b.id)) AS user_like
                    FROM books b 
                    LEFT JOIN category c ON (b.category_id & c.id) = c.id
                    WHERE b.id = ?
                    GROUP BY b.id`;

                const values = [uid, id];

                db.query(sql, values, (err, results) => {
                    if (err) {
                        console.log(err);
                        return res.status(StatusCodes.BAD_REQUEST).end();
                    }

                    res.status(StatusCodes.OK).json(results);
                });
            });
        });
    } catch (err) {
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
};

module.exports = { getBooks, getBookDetail };
