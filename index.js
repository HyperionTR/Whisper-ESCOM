// Crear una simple API REST con Node y Express
// Importamos express y body-parser

const express = require('express');
const bodyParser = require('body-parser');
const {readFile} = require('fs').promises;
const fs = require('fs');

// Conexión a la BD
const mysql = require('mysql2');
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
            // readData();
        }
    });

// Function to retrieve all rows from users table
function readData(){
    conn.query("SELECT * FROM users",function(err,results,fields){
        if(err) throw err;
        else console.log("Selected "+results.length+" rows.");
        for(i=0;i<results.length;i++){
            console.log("Row: "+JSON.stringify(results[i]));
        }
        console.log("Done.");
    });
}

// Creamos la aplicación express
const app = express();

// Configuramos bodyParser para que convierta el body de nuestras peticiones a JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("page"));

// Definimos el puerto por defecto
const port = process.env.PORT || 8080;

// Definimos las rutas de nuestro servidor web
app.get('/', async (req, res) => {
    try {
		res.send( await readFile('./page/index.html', 'utf8') );
	} catch (error) {
		res.status(404).send('404 Not Found');
	}
});

app.post('/', (req, res) => {
    try {
        let user = req.body.user;
        let pass = req.body.password;
        conn.query(`INSERT INTO users(username, password) VALUES('${user}','${pass}')`);
    } catch (error) {
        (console.error || console.log).call(console, error.stack || error);
    }
});


app.get('/register', async (req, res) => {
    // 1. Enviar los datos del usuario a la BD
    // 2. Enviar un correo de verificación al usuario (con el codigo aleatorio)
    // 3. Mostrar formulario para ingresar el codigo
});

app.get('/restablecer', async (req, res) => {
    // 1. Envia correo de restablecimiento de contraseña (con el codigo aleatorio)
    // 2. Mostrar formulario para ingresar el codigo
});

app.get('/verify', async (req, res) => {
    // Recibir el codigo de verificación
    // Verificar que el codigo sea correcto
    // Mandar el usuario a la pagina principal
});

app.get('/usuarios', (req, res) => {
    readData();
});

app.post('/usuarios', (req, res) => {
    // Creating a simple user table with username and password
    conn.query("CREATE TABLE IF NOT EXISTS users("+
    "id INT NOT NULL AUTO_INCREMENT,"+
    "PRIMARY KEY(id),"+
    "username VARCHAR(30),"+
    "password VARCHAR(30)"+
    ")"
    );
    console.log("Users table created.");

});

app.put('/usuarios', (req, res) => {
    
    // Adding 2 records
    conn.query("INSERT INTO users(username, password) VALUES('user1','pass1')");
    conn.query("INSERT INTO users(username, password) VALUES('user2','pass2')");

});

app.delete('/usuarios', (req, res) => {
    // Borrar la base de datos de usuarios
    conn.query("DROP TABLE users");
    console.log("Users table deleted.");
});

// Iniciamos nuestro servidor web
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});