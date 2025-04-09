var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const dotenv = require('dotenv')
dotenv.config();


const addLike = async (req, res) => {

    const sql = "INSERT INTO likes ( uid, bid ) VALUES (?, ?)";
    const getUidSql = "SELECT id FROM users WHERE email = ?";
    let {bid} = req.params;
    let uid;

    const token = req.cookies.token;
    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();
        const email = payload.email;

        mariaDB.getConnection(async (err, db) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            db.query(getUidSql, [email], (err, results) => {
                if (err || results.length === 0) {
                    console.log(err || 'User not found');
                    db.release();
                    return res.status(StatusCodes.UNAUTHORIZED).end();
                }

                uid = results[0].id;
                let values = [uid, bid];

                // uid 확보 후 likes 삽입
                db.query(sql, values, (err, results) => {
                    db.release();

                    if (err) {
                        console.log(err);
                        return res.status(StatusCodes.BAD_REQUEST).end();
                    }

                    res.status(StatusCodes.CREATED).json(results);
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
}

const removeLike = async (req, res) => {
    let sql = "DELETE FROM likes WHERE uid = ? AND bid = ?";
    let { bid } = req.params;
    let uid;

    const token = req.cookies.token;

    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'login') throw new Error();
        const email = payload.email;

        const getUidSql = "SELECT id FROM users WHERE email = ?";
        mariaDB.getConnection(async (err, db) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
            }

            db.query(getUidSql, [email], (err, results) => {
                if (err || results.length === 0) {
                    console.log(err || 'User not found');
                    db.release();
                    return res.status(StatusCodes.UNAUTHORIZED).end();
                }

                uid = results[0].id;
                let values = [uid, bid];

                db.query(sql, values, (err, results) => {
                    db.release();

                    if (err) {
                        console.log(err);
                        return res.status(StatusCodes.BAD_REQUEST).end();
                    }

                    if (results.affectedRows === 0) {
                        return res.status(StatusCodes.BAD_REQUEST).end();
                    }

                    res.status(StatusCodes.OK).json(results);
                });
            });
        });
    } catch (err) {
        console.log(err);
        return res.status(StatusCodes.UNAUTHORIZED).end();
    }
}

module.exports = { addLike,  removeLike }