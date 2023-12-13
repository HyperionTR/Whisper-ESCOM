// Crear una simple API REST con Node y Express
// Importamos express y body-parser

const express = require('express');
const bodyParser = require('body-parser');
const {readFile} = require('fs').promises;
const {conn, getUserData} = require('./sqlconnector.js');
const {sendMail} = require('./mailer.js');

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

app.post('/', async (req, res) => {
    try {
        let user = req.body.user;
        let pass = req.body.password;
        conn.query(`INSERT INTO users(username, password) VALUES('${user}','${pass}')`);
        res.send( await readFile('./page/index.html', 'utf8') );
    } catch (error) {
        (console.error || console.log).call(console, error.stack || error);
        res.status(404).send('404 Not Found');
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
    let user = req.body.user;
    let email = req.body.email;
    sendMail(user, email);
    res.send(`Correo para ${user} en ${email} enviado.`);
});

app.get('/usuarios', (req, res) => {
    // Obtener los datos de todos los usuarios de la BD
    getUserData((data) => {
        res.send(JSON.stringify(data));
    });
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
    res.send("Users table created.");
});

app.put('/usuarios', (req, res) => {
    
    // Adding 2 records
    conn.query("INSERT INTO users(username, password) VALUES('user1','pass1')");
    conn.query("INSERT INTO users(username, password) VALUES('user2','pass2')");
    res.send("Records inserted.");
});

app.delete('/usuarios', (req, res) => {
    // Borrar la base de datos de usuarios
    conn.query("DROP TABLE users");
    res.send("Users table deleted.");
});

// Iniciamos nuestro servidor web
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});