// Crear una simple API REST con Node y Express
// Importamos express y body-parser

const express = require('express');
const bodyParser = require('body-parser');
const {readFile} = require('fs').promises;
const {database, getUserData, getPendingVerification, getPendingPasswordReset, getPublications} = require('./sqlconnector.js');
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
        database.query(`INSERT INTO users(username, password) VALUES('${user}','${pass}')`);
        res.send( await readFile('./page/index.html', 'utf8') );
    } catch (error) {
        (console.error || console.log).call(console, error.stack || error);
        res.status(404).send('404 Not Found');
    }
});


app.post('/register', async (req, res) => {
    try {
        // Obtención de los datos de la petición JSON
        let user = req.body.usuario;
        let email = req.body.correo;
        let pass = req.body.password;

        // Hashing de la contraseña con bcrypt
        // WIP
        
        // Generar un codigo aleatorio de 8 caracteres para la verificacion
        let verification_code = Math.random().toString(36).substring(2, 10);
        
        // Enviar un correo de verificación al usuario (con el codigo aleatorio)
        sendMail(user, email, verification_code);

        // Mostrar formulario para ingresar el codigo
    } catch (error) {
        (console.error || console.log).call(console, error.stack || error);
        res.status(500).send('No se ingresaron los datos correctamente.');
    }
});

app.post('/restablecer', async (req, res) => {
    // 1. Envia correo de restablecimiento de contraseña (con el codigo aleatorio)
    // 2. Mostrar formulario para ingresar el codigo
});

app.post('/verify', async (req, res) => {
    // Recibir el codigo de verificación
    // Verificar que el codigo sea correcto
    // Mandar el usuario a la pagina principal
    let user = req.body.user;
    let email = req.body.email;
    let code = req.body.code;
    sendMail(user, email, code);
    res.send(`Correo para ${user} en ${email} enviado con código ${code}.`);
});

// RUTAS PARA DESARROLLO Y VERTIFICACION DE LA BD, BORRAR EN PRODUCCION
app.get('/db', async (req, res) => {
    try {
        // Obtener los datos de todos los usuarios de la BD
        let message = "Datos de los usuarios registrados:\n" + JSON.stringify(await getUserData(), null, 4);
        res.write( message );
        
        // Obtener los datos de los correos pendientes de verificación
        message = "\nDatos de los correos pendientes de verificación:\n" + JSON.stringify(await getPendingVerification(), null, 4);
        res.write( message );
        
        // Obtener los datos de los correos pendientes de restablecimiento de contraseña
        message = "\nDatos de los correos pendientes de restablecimiento de contraseña:\n" + JSON.stringify(await getPendingPasswordReset(), null, 4);
        res.write( message );
        
        // Obtener los datos de las publicaciones
        message = "\nDatos de las publicaciones:\n" + JSON.stringify(await getPublications(), null, 4);
        res.end( message );
    } catch (error) {
        res.send("Error al obtener los datos de la base de datos: " + error);
    }   
});

app.put("/db", async (req, res) => {
    let user_table_query = "CREATE TABLE IF NOT EXISTS usuarios("+
    // Campos de la tabla
    "id_usuario INT NOT NULL AUTO_INCREMENT,"+
    "usuario VARCHAR(255) NOT NULL,"+
    "correo VARCHAR(255) NOT NULL,"+
    "password VARCHAR(72) NOT NULL,"+
    // Especificación de las llaves
    "PRIMARY KEY(id_usuario)"+
    ")";

    let verification_email_table_query = "CREATE TABLE IF NOT EXISTS verificacion_email("+
    // Campos de la tabla
    "id_verificacion INT NOT NULL AUTO_INCREMENT,"+
    "correo VARCHAR(255) NOT NULL,"+
    "codigo_verificacion VARCHAR(8) NOT NULL,"+
    // Especificación de las llaves
    "PRIMARY KEY(id_verificacion),"+
    ")";

    let password_reset_table_query = "CREATE TABLE IF NOT EXISTS restablecimiento_password("+
    // Campos de la tabla
    "id_restablecimiento INT NOT NULL AUTO_INCREMENT,"+
    "id_usuario INT NOT NULL,"+
    "codigo_restablecimiento VARCHAR(8),"+
    // Especificación de las llaves
    "PRIMARY KEY(id_restablecimiento),"+
    "FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)"+
    ")";

    let publicaciones_table_query = "CREATE TABLE IF NOT EXISTS publicaciones("+
    // Campos de la tabla
    "id_publicacion INT NOT NULL AUTO_INCREMENT,"+
    "id_usuario INT NOT NULL,"+
    "texto_publicacion VARCHAR(255),"+
    "tiempo_creacion TIMESTAMP,"+
    "efirma VARCHAR(255),"+
    // Especificación de las llaves
    "PRIMARY KEY(id_publicacion),"+
    "FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)"+
    ")";

    // Creamos las tablas

    try {
        database.query(user_table_query);
        res.write("Tabla de usuarios creada.\n");

        database.query(verification_email_table_query);
        res.write("Tabla de verificación de correo creada.\n");

        database.query(password_reset_table_query);
        res.write("Tabla de restablecimiento de contraseña creada.\n");

        database.query(publicaciones_table_query);
        res.end("Tabla de publicaciones creada.\n");
    } catch (db_error) {
        res.send("Error al crear la base de datos: " + db_error);
    }
        
});

app.delete('/db', async (req, res) => {
    // Borrar cada una de las tablas de la BD
    try {

        database.query("DROP TABLE usuarios");
        res.write("Tabla de usuarios eliminada.\n");
        
        database.query("DROP TABLE verificacion_email");
        res.write("Tabla de verificación de correo eliminada.\n");
        
        database.query("DROP TABLE restablecimiento_password");
        res.write("Tabla de restablecimiento de contraseña eliminada.\n");
        
        database.query("DROP TABLE publicaciones");
        res.end("Tabla de publicaciones eliminada.");
    } catch (db_error) {
        res.send("Error al borrar la base de datos: " + db_error);
    }
});

// Iniciamos nuestro servidor web
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});