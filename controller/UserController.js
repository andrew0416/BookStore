var mariaDB = require('../databases/mariaDb.js')
const {StatusCodes} = require('http-status-codes')
const jwt = require('jsonwebtoken')
const cryto = require('crypto')
const dotenv = require('dotenv')
dotenv.config();

const join = async (req, res) => {
    const {email, password} = req.body;

    const salt = cryto.randomBytes(10).toString('base64');
    const hashPassword = cryto.pbkdf2Sync(password, salt, 10000, 10, 'sha512').toString('base64')


    let sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
    let values = [email, hashPassword, salt];

    mariaDB.getConnection(async (err, db) => {
        db.query(sql, values, (err, results) => {
            if (err) {
                console.log(err);
                return res.status(StatusCodes.BAD_REQUEST),end();
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
                return res.status(StatusCodes.BAD_REQUEST),end();
            }

            const loginUser = results[0];
            
            const hashPassword = cryto.pbkdf2Sync(password, loginUser.salt, 10000, 10, 'sha512').toString('base64')
            
            if (loginUser && loginUser.password == hashPassword) {
                const token = jwt.sign({
                    email : loginUser.email
                }, process.env.PRIVATE_KEY, {
                    expiresIn : '5m',
                    issuer : 'cw'
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


module.exports = {join, login}