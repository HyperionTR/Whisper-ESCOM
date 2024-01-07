// Crear una simple API REST con Node y Express
// Importamos express y body-parser

const express = require('express');
const bodyParser = require('body-parser');
const {readFile} = require('fs').promises;
const {
    database,
    getUserData,
    getPendingVerification,
    getPendingPasswordReset,
    getPublications
    } = require('./js/sqlconnector.js');
const {sendVerifyMail, sendRecoveryMail} = require('./js/mailer.js');
const bcrypt = require('bcrypt');

// Creamos la aplicación express
const app = express();

// Configuramos bodyParser para que convierta el body de nuestras peticiones a JSON
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("webpage"));

// Definimos el puerto por defecto
const port = process.env.PORT || 8080;

// Definimos las rutas de nuestro servidor web
app.get('/', async (req, res) => {
    try {
		res.send( await readFile('./webpage/index.html', 'utf8') );
	} catch (error) {
		res.status(404).send('404 Not Found');
	}
});

app.post('/register', async (req, res) => {
    try {
        // Obtención de los datos de la petición JSON
        let user = req.body.usuario;
        let email = req.body.correo;
        let pass = req.body.password;
        let code = req.body.codigo;

        // Eliminar los espacios en blanco al inicio y al final de los datos
        user = user.trim();
        email = email.trim();
        pass = pass.trim();
        code = code.trim();

        // Primero, para evitar que se quieran registrar accediendo a esta ruta directamente, vamos a verificar  que no halla duplicidad de datos en la BD

        try {
            // Antes de iniciar, verificamos si el usuario ya está registrado
            let [rows, ] = await database.query("SELECT * FROM usuarios WHERE correo = ? OR usuario = ?", [email, user]);
    
            // Debemos hacer una comparación que no sea sensible a acentos y mayúsculas, para esto usamos localeCompare con sensitivity = base
    
            let email_compare = rows[0].correo.localeCompare(email, 'es', {sensitivity: 'base'});
            let user_compare = rows[0].usuario.localeCompare(user, 'es', {sensitivity: 'base'});
    
            // Estas comparaciones son importantes ya que MySQL al hacer la petición SELECT, considera que "a" y "ä" son iguales, es decir, ignora los acentos
    
            if (rows.length > 0) {
                // Si el usuario o correo ya están registrados, se envia el codigo y el mensaje adecuado
                if (user_compare === 0) {
                    res.status(409).send("El nombre de usuario ya ha sido registrado.");
                } else if (email_compare === 0) {
                    res.status(409).send("Este correo ya está registrado.");
                }
                return;
            }
    
        } catch (db_error) {
            (console.error || console.log).call(console, "Error al registrar usuario ---\n" + db_error.stack || "Error al registrar usuario" + db_error);
        }

        // Verificar que el codigo de verificación sea correcto, obteniendolo de la BD
        let [rows, ] = await database.query("SELECT codigo_verificacion FROM verificacion_email WHERE correo = ?", [email]);

        if (rows.length === 0) {
            res.status(409).send("Todavía no se ha generado un código de verificación para este correo.");
        } else if (rows[0].codigo_verificacion === code) {
            // Hashing de la contraseña con bcrypt
            let hash = await bcrypt.hash(pass, 10);
            
            // Si el codigo de verificación es correcto, se registra al usuario en la BD
            await database.query("INSERT INTO usuarios(usuario, correo, password) VALUES(?, ?, ?)", [user, email, hash]);
            res.sendStatus(200);

            // Y se elimina el codigo de verificación de la BD
            database.query("DELETE FROM verificacion_email WHERE correo = ?", [email]);
        } else {
            // Si el codigo de verificación es incorrecto, se envia el codigo 409 que significa "conflicto con el estado actual del servidor"
            res.status(409).send("El código de verificación es incorrecto.");
        }
    } catch (error) {
        (console.error || console.log).call(console, error.stack || error);
        res.status(500).send('Hubo un error durante el registro.' + error);
    }
});

app.post('/verify', async (req, res) => {
    
    // Recibir los datos para la verificación del correo
    let email = req.body.correo;
    let user = req.body.usuario;
    
    try {
        // Antes de iniciar, verificamos si el usuario ya está registrado
        let [rows, ] = await database.query("SELECT * FROM usuarios WHERE correo = ? OR usuario = ?", [email, user]);

        // Debemos hacer una comparación que no sea sensible a acentos y mayúsculas, para esto usamos localeCompare con sensitivity = base

        let email_compare = rows[0].correo.localeCompare(email, 'es', {sensitivity: 'base'});
        let user_compare = rows[0].usuario.localeCompare(user, 'es', {sensitivity: 'base'});

        // Estas comparaciones son importantes ya que MySQL al hacer la petición SELECT, considera que "a" y "ä" son iguales, es decir, ignora los acentos

        if (rows.length > 0) {
            // Si el usuario o correo ya están registrados, se envia el codigo y el mensaje adecuado
            if (user_compare === 0) {
                res.status(409).send("El nombre de usuario ya ha sido registrado.");
            } else if (email_compare === 0) {
                res.status(409).send("Este correo ya está registrado.");
            }
            return;
        }

    } catch (db_error) {
        (console.error || console.log).call(console, "Error al verificar el correo ---\n" + db_error.stack || "Error al verificar el correo" + db_error);
    }
    
    // Generar un codigo aleatorio de 8 caracteres para la verificacion
    let verification_code = Math.random().toString(36).substring(2, 10);
    let verification_message = "Correo de verificación enviado.";

    // Hacemos una verificación de que el correo ingresado sea válido

    try {
        
        // Guardar el codigo de verificación en la BD con un statement preparado
        // Nota: La sintaxis [rows, ] ignora el segundo parametro de la respuesta de la BD
        let [rows, ] = await database.query("INSERT INTO verificacion_email(correo, codigo_verificacion) VALUES(?, ?)", [email, verification_code]);
        
    } catch (verify_error) {
        // verificamos que si el codigo de error es de duplicidad, se envie el codigo 409
        if (verify_error.code === "ER_DUP_ENTRY") {
            // Actualizamos el mensaje de verificación
            verification_message = "Ya existe un código de verificación para este correo.";

            // Obtenemos dicho codigo duplicado
            let [rows, ] = await database.query("SELECT codigo_verificacion FROM verificacion_email WHERE correo = ?", [email]);
            verification_code = rows[0].codigo_verificacion;
        } else {
            (console.error || console.log).call(console, "Error al verificar el correo ---\n" + verify_error.stack || "Error al verificar el correo" + verify_error);
            res.status(500).send("Error al verificar el correo: " + verify_error);
        }
    } finally {
        // Enviar un correo de verificación al usuario con el código de verificación
        sendVerifyMail(user, email, verification_code);
        res.status(200).send(verification_message);
    }
});

/**
 * Reenvia el correo de verificación o reestablecimiento al correo especificado
 */
app.post('/resend/verify', async (req, res) => {
    // Obtenemos el correo al que se reenviara el correo
    let email = req.body.correo;
    let username = req.body.usuario;

    try {
        // Obtenemos el codigo de verificación de la BD
        let [rows, ] = await database.query("SELECT codigo_verificacion FROM verificacion_email WHERE correo = ?", [email]);
        
        if (rows.length === 0) {
            res.status(500).send("No existe el codigo de verificación en la BD");
            return;
        }

        let verification_code = rows[0].codigo_verificacion;

        // Enviamos el correo de verificación
        sendVerifyMail(username, email, verification_code);
        res.sendStatus(200);
    } catch (db_error) {
        res.status(500).send("Hubo un error al enviar el correo de verificación:" + db_error);
    }
});

app.post('/resend/reset', async (req, res) => {
    // Obtenemos el dato que el usuario introdujo
    let email_or_username = req.body.email;

    // Obtenemos el usuario y correo de la BD
    let [rows, ] = await database.query("SELECT id_usuario, usuario, correo FROM usuarios WHERE correo = ? OR usuario = ?", [email_or_username, email_or_username]);

    if (rows.length === 0) {
        res.status(404).send("Esta cuenta no existe.");
        return;
    }

    // Me pregunto si podría haber un fallo en este punto...

    let correo = rows[0].correo;
    let username = rows[0].usuario;
    let id_usuario = rows[0].id_usuario;

    try {
        // Obtenemos el codigo de restablecimiento de la BD
        let [rows, ] = await database.query("SELECT codigo_restablecimiento FROM restablecimiento_password WHERE id_usuario = ?", [id_usuario]);
        
        if (rows.length === 0) {
            res.status(500).send("No existe el codigo de restablecimiento en la BD");
            return;
        }

        let recovery_code = rows[0].codigo_restablecimiento;

        // Enviamos el correo de verificación
        sendRecoveryMail(username, correo, recovery_code);
        res.sendStatus(200);
    } catch (db_error) {
        console.error(db_error);
    }
});

app.post('/login', async (req, res) => {
    // Obtenemos los datos de la petición JSON
    let user_or_email = req.body.email;
    let pass = req.body.password;

    try {
        // Obtenemos los datos del usuario de la BD
        let [rows, ] = await database.query("SELECT * FROM usuarios WHERE usuario = ? OR correo = ?", [user_or_email, user_or_email]);
        if (rows.length === 0) {
            res.status(404).send("Esta cuenta no existe.");
            return;
        }

        // Verificamos que la contraseña sea correcta
        let match = await bcrypt.compare(pass, rows[0].password);
        if (match) {
            res.send("Inicio correcto.");
        } else {
            res.status(401).send("Contraseña incorrecta.");
        }
    } catch (db_error) {
        (console.error || console.log).call(console, "Error al verificar el correo ---\n" + db_error.stack || "Error al verificar el correo" + db_error);
        res.status(500).send("Error al verificar el correo: " + db_error);
    }
});

/**
 * Añade una nueva entrada en la tabla de restablecimiento de contraseña con un código de reestablecimiento
 * y envía un correo al usuario con el código
 */ 
app.post('/forgot', async (req, res) => {
    // Este será un proceso similar al de registro, con su codigo de verificación y reestablecimiento de contraseña

    // Obenemos el correo o usiario de la petición
    let user_or_email = req.body.email;

    // Primero verificamos que el usuario exista en la BD
    let [rows, ] = await database.query("SELECT id_usuario, usuario, correo FROM usuarios WHERE correo = ? or usuario = ?", [user_or_email, user_or_email]);

    if (rows.length === 0) {
        res.status(404).send("Esta cuenta no existe.");
        return;
    }

    let correo = rows[0].correo;
    let usuario = rows[0].usuario;
    let id_usuario = rows[0].id_usuario;
    let recovery_message = "OK";

    // Si existe, generamos un codigo de reestablecimiento de contraseña
    let recovery_code = Math.random().toString(36).substring(2, 10);

    try {
        // Guardamos el codigo de reestablecimiento en la BD
        await database.query("INSERT INTO restablecimiento_password(id_usuario, codigo_restablecimiento) VALUES(?, ?)", [id_usuario, recovery_code]);
    } catch (db_error) {

        // verificamos que si el codigo de error es de duplicidad, se envie el codigo 409
        if (db_error.code === "ER_DUP_ENTRY") {
            recovery_message = "Ya existe un código de reestablecimiento para este usuario."

            // Obtenemos dicho codigo duplicado
            let [rows, ] = await database.query("SELECT codigo_restablecimiento FROM restablecimiento_password WHERE id_usuario = ?", [id_usuario]);
            recovery_code = rows[0].codigo_restablecimiento;
        }

    } finally {
        // Enviamos el correo de reestablecimiento de contraseña
        sendRecoveryMail(usuario, correo, recovery_code);
        res.send(recovery_message);
    }
});

/**
 * Modifica la contraseña del usuario con la nueva contraseña especificada
 * verificando que el código de reestablecimiento sea correcto
 */
app.post('/reset', async (req, res) => {

    // Obtenemos los datos de la solicitud
    let user_or_email = req.body['email'];
    let new_password = req.body['res-password'];
    let reset_code = req.body['res-code'];

    // Eliminamos espacios en blanco al inicio y al final de los datos
    user_or_email = user_or_email.trim();
    new_password = new_password.trim();
    reset_code = reset_code.trim();

    // Obtenemos los datos del usuario de la BD
    let [rows, ] =  await database.query("SELECT id_usuario, usuario, correo FROM usuarios WHERE usuario = ? OR correo = ?", [user_or_email, user_or_email]);

    if (rows.length === 0) {
        res.status(404).send("Esta cuenta no existe.");
        return;
    }  

    let correo = rows[0].correo;
    let usuario = rows[0].usuario;
    let id_usuario = rows[0].id_usuario;

    // Obtenemos el codigo de reestablecimiento de la BD
    [rows, ] = await database.query("SELECT codigo_restablecimiento FROM restablecimiento_password WHERE id_usuario = ?", [id_usuario]);

    if (rows.length === 0) {
        res.status(500).send("No existe el codigo de restablecimiento en la BD");
        return;
    }

    // Comparamos el codigo de reestablecimiento
    if (rows[0].codigo_restablecimiento === reset_code) {
        // Si el codigo de reestablecimiento es correcto, se modifica la contraseña del usuario
        let hash = await bcrypt.hash(new_password, 10);
        await database.query("UPDATE usuarios SET password = ? WHERE id_usuario = ?", [hash, id_usuario]);
        res.send("Contraseña modificada.");

        // Y se elimina el codigo de reestablecimiento de la BD
        database.query("DELETE FROM restablecimiento_password WHERE id_usuario = ?", [id_usuario]);
    } else {
        res.status(409).send("El código de reestablecimiento es incorrecto.");
    }
});

app.post('/whisper', async (req, res) => {
    let text = req.body['whisper-text'];
    res.send(`<textarea name="whisper" cols="15" rows="5"readonly> ${text} </textarea>`);
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
    // Campos de la tabla REQUIERE UNIQUE
    "id_usuario INT NOT NULL AUTO_INCREMENT,"+
    "usuario VARCHAR(255) NOT NULL,"+
    "correo VARCHAR(255) NOT NULL,"+
    "password VARCHAR(72) NOT NULL,"+
    // Especificación de las llaves
    "PRIMARY KEY(id_usuario),"+
    "UNIQUE KEY(usuario),"+
    "UNIQUE KEY(correo)"+
    ")";

    let verification_email_table_query = "CREATE TABLE IF NOT EXISTS verificacion_email("+
    // Campos de la tabla
    "id_verificacion INT NOT NULL AUTO_INCREMENT,"+
    "correo VARCHAR(255) NOT NULL,"+
    "codigo_verificacion VARCHAR(8) NOT NULL,"+
    // Especificación de las llaves
    "PRIMARY KEY(id_verificacion),"+
    "UNIQUE KEY(correo)"+
    ")";

    let password_reset_table_query = "CREATE TABLE IF NOT EXISTS restablecimiento_password("+
    // Campos de la tabla
    "id_restablecimiento INT NOT NULL AUTO_INCREMENT,"+
    "id_usuario INT NOT NULL,"+
    "codigo_restablecimiento VARCHAR(8),"+
    // Especificación de las llaves
    "PRIMARY KEY(id_restablecimiento),"+
    "FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),"+
    "UNIQUE KEY(id_usuario)"+
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

        await database.query("DROP TABLE verificacion_email");
        res.write("Tabla de verificación de correo eliminada.\n");
        
        await database.query("DROP TABLE restablecimiento_password");
        res.write("Tabla de restablecimiento de contraseña eliminada.\n");
        
        await database.query("DROP TABLE publicaciones");
        res.write("Tabla de publicaciones eliminada.\n");

        await database.query("DROP TABLE usuarios");
        res.end("Tabla de usuarios eliminada.\n");

    } catch (db_error) {
        res.send("Error al borrar la base de datos: " + db_error);
    }
});

// Iniciamos nuestro servidor web
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});