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

// Obtenemos toda la información de los usuarios registrados
async function getUserData() {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM usuarios");
        console.log(`Done retrieving ${rows.length} rows from usuarios.`);
        return {
            length: rows.length,
            results: rows
        };
    } catch (error) {
        console.error(error);
    }
}

// Obtenemos toda la información de los usuarios por regristrarse
async function getPendingVerification() {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM verificacion_email");
        console.log(`Done retrieving ${rows.length} rows from verificacion_email.`);
        return {
            length: rows.length,
            results: rows
        };
    } catch (error) {
        console.error(error);
    }
}

// Obtenemos toda la información de los usuarios que desean cambiar su contraseña
async function getPendingPasswordReset() {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM restablecimiento_password");
        console.log(`Done retrieving ${rows.length} rows from restablecimiento_password.`);
        return {
            length: rows.length,
            results: rows
        };
    } catch (error) {
        console.error(error);
    }
}

// Obtenemos toda la información de las publicaciones
async function getPublications() {
    try {
        const [rows, fields] = await pool.query("SELECT * FROM publicaciones");
        console.log(`Done retrieving ${rows.length} rows from publicaciones.`);
        return {
            length: rows.length,
            results: rows
        };
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
	database: pool,
	getUserData: getUserData,
    getPendingVerification: getPendingVerification,
	getPendingPasswordReset: getPendingPasswordReset,
	getPublications: getPublications
}