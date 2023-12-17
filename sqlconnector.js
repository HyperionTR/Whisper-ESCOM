// Conexión a la BD
const mysql = require('mysql2/promise');
const fs = require('fs');

var poolConnConfig = {
    // Azure MySQL Database authentication
    host: process.env.AZURE_MYSQL_HOST,
    user: process.env.AZURE_MYSQL_USER,
    password: process.env.AZURE_MYSQL_PASSWORD,
    database: process.env.AZURE_MYSQL_DATABASE,
    port: process.env.AZURE_MYSQL_PORT,
    // Azure MySQL Database SSL configuration
    ssl: {
        ca: fs.readFileSync("DigiCertGlobalRootCA.crt.pem")
    },
    // Connection Pool configuration
    connectionLimit: 30,
    queueLimit: 0
};

// Creamos un connection pool para manejar las peticiones entrantes a la BD
const pool = mysql.createPool(poolConnConfig);

// Probamos la conexión a la base de datos
pool.getConnection(function(err, connection) {
    if (err) {
        console.error('!!! Cannot connect to database !!!\n' + err.stack);
        return;
    }
    console.log(`Connection with ${poolConnConfig.database} established!.`);
});

// Function to retrieve all rows from users table
async function getUserData() {
    // const conn = await pool.getConnection();
    try {
        const [rows, fields] = await pool.query("SELECT * FROM users");
        console.log(`Done retrieving ${rows.length} rows.`);
        return {
            length: rows.length,
            results: rows
        };
    } catch (error) {
        console.error(error);
    }
    // finally {
    //     // ensure the connection is released
    //     conn.release();
    // }
}

module.exports = {
	database: pool,
	getUserData: getUserData,
}