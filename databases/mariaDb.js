const mariadb = require('mysql');

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'Movie',
    connectionLimit: 10  // 풀에서 사용할 최대 연결 수
});

module.exports = pool;