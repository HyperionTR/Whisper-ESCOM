// Conexión a la BD
const mysql = require('mysql2');
const fs = require('fs');
var config = {
    host:process.env.AZURE_MYSQL_HOST,
    user:process.env.AZURE_MYSQL_USER,
    password:process.env.AZURE_MYSQL_PASSWORD,
    database:process.env.AZURE_MYSQL_DATABASE,
    port:process.env.AZURE_MYSQL_PORT,
    ssl:{ca:fs.readFileSync("DigiCertGlobalRootCA.crt.pem")}
}

const conn = new mysql.createConnection(config);
conn.connect(
    function(err){
        if(err){
            console.log("!!! Cannot connect !!! Error:");
            // Mostrando el mensaje de erorr en casod e queno hala e.stack
            (console.error || console.log).call(console, err.stack || err);
        }
        else{
            console.log(`Connection with ${config.database} established!.`);
        }
    });

// Function to retrieve all rows from users table
function getUserData(callback){
	return conn.query("SELECT * FROM users", function(err,qresults) {
		if(err) throw err;
		else {
			console.log(`Done retrieving ${qresults.length} rows.`);
			callback({
				length: qresults.length,
				results: qresults
			});
		}
	});
}

module.exports = {
	conn: conn,
	getUserData: getUserData
}