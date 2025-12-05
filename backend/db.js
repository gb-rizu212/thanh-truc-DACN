const mysql = require("mysql2");

// Tạo connection pool để quản lý kết nối tốt hơn
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "PI3.141592654",
    database: "petgame",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Tạo promise wrapper để dùng async/await
const promisePool = pool.promise();

// Test kết nối
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ Database connection failed:", err);
        return;
    }
    console.log("✅ Connected to MySQL database");
    connection.release();
});

// Export cả pool và promisePool
module.exports = {
    pool,
    promisePool
};