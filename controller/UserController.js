var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const dotenv = require('dotenv')
dotenv.config();

const join = async (req, res) => {
    const {email, password} = req.body;

    const salt = crypto.randomBytes(16).toString('base64');
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512').toString('base64')


    let sql = 'INSERT INTO users (email, password, salt) VALUES (?, ?, ?)';
    let values = [email, hashPassword, salt];

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            res.status(StatusCodes.CREATED).json(results)

        });
    });
}

const login = async (req, res) => {
    const {email, password} = req.body;
    let sql = 'SELECT * FROM users WHERE email = ?';

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, email, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            const loginUser = results[0];

            const hashPassword = crypto.pbkdf2Sync(password, loginUser.salt, 10000, 32, 'sha512').toString('base64')
            
            if (loginUser && loginUser.password == hashPassword) {
                const token = jwt.sign({
                    email : loginUser.email
                }, process.env.PRIVATE_KEY, {
                    expiresIn : '5m',
                    issuer : 'login'
                });

                res.cookie("token", token, {
                    httpOnly : true
                });
                console.log(token);

                res.status(StatusCodes.OK).json(results)
            } else {
                return res.status(StatusCodes.UNAUTHORIZED).end();
            }

        });
    });
}

const requestReset = async (req, res) => {
    const {email} = req.body;
    let sql = 'SELECT * FROM users WHERE email = ?';

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, email, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            const user = results[0];
            
           
            if (user) {
                const token = jwt.sign({
                    email : user.email
                }, process.env.PRIVATE_KEY, {
                    expiresIn : '5m',
                    issuer : 'resetPW'
                });

                res.cookie("token", token, {
                    httpOnly : true
                });

                console.log(token);

                res.status(StatusCodes.OK).json(results)
            } else {
                return res.status(StatusCodes.UNAUTHORIZED).end();
            }

        });
    });
}

const resetPassword = async (req, res) => {
    const {password} = req.body;
    let email;

    const token = req.cookies.token;
    try {
        const payload = jwt.verify(token, process.env.PRIVATE_KEY);
        if (payload.issuer !== 'resetPW') throw new Error();
        email = payload.email;
    } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).end();
    }


    let sql = 'UPDATE users SET password = ?, salt = ? WHERE email = ?;';

    const salt = crypto.randomBytes(16).toString('base64');
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512').toString('base64')

    let values = [hashPassword, salt, email]

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST).end();
            }

            if(results.affectedRows == 0) {
                return res.status(StatusCodes.BAD_REQUEST).end();
            }
            else {
                return res.status(StatusCodes.OK).json(results);
            }
        });
    });
}

module.exports = {join, login, requestReset, resetPassword}