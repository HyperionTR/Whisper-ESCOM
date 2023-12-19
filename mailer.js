const { EmailClient } = require("@azure/communication-email");
const { readFile } = require('fs').promises;
const { JSDOM } = require('jsdom');

// Este código recupera la cadena de conexión de una variable de entorno.
const connectionString = process.env.CUSTOMCONNSTR_COMMUNICATION_SERVICES_CONNECTION_STRING;
const emailClient = new EmailClient(connectionString);

async function sendMail(username, email, verification_code) {
	try {

        // Leemos el archivo html del correo electrónico
        let html_mail = await readFile('verification-mail.html', 'utf8').then((data) => {
            // Modificamos el correo mediante JSDOM
            const dom = new JSDOM(data);
            const document = dom.window.document;

            // Cambiando el saludo al usuario
            let saludo = document.getElementById("user-greeting");
            saludo.innerHTML = `¡Ya casi estás dentro, ${username}!`;

            // Insertando el código de verificación
            let codigo = document.getElementById("verification-code");
            codigo.innerHTML = verification_code;

            return dom.serialize();

        }).catch((err) => { console.error(err); });
        
        const emailMessage = {
        senderAddress: "whisper-verifier@ff71f960-d15d-43b7-ae06-ccac18ebc514.azurecomm.net",
        content: {
            subject: `« Código de verificación - Whisper-ESCOM »`,
            plainText: "Cödigo de verificación: " + verification_code + "\n\n¡Gracias por registrarte en Whisper-ESCOM!",
            html: html_mail,
            },
            recipients: {
                to: [{ address: email }],
            },
        };

        const poller = await emailClient.beginSend(emailMessage);
        const result = await poller.pollUntilDone();
        console.log(result);
    } catch (error) {
        console.error(error);
    }   
}

module.exports = {
	sendMail: sendMail
}
