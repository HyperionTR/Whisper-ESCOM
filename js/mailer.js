const { EmailClient } = require("@azure/communication-email");
const { readFile } = require('fs').promises;
const { JSDOM } = require('jsdom');
const path = require('path');

// Este código recupera la cadena de conexión de una variable de entorno.
const connectionString = process.env.CUSTOMCONNSTR_COMMUNICATION_SERVICES_CONNECTION_STRING || "endpoint=https://whisper-escom-comms.unitedstates.communication.azure.com/;accesskey=oYa+3XY3xv3F8fLgCfZDIcQld69zcstQwGiHb5h8wztLvdnU+WuRWKv7aRtq1yxQhRg1Bl90WbS0OJShopQRdA==";
const emailClient = new EmailClient(connectionString);

// Paths
let verification_mail_path = path.resolve(__dirname, './html/verification-mail.html');
let recovery_mail_path = path.resolve(__dirname, './html/recovery-mail.html');

async function sendVerifyMail(username, email, verification_code) {
	try {

        // Leemos el archivo html del correo electrónico
        const html_mail = await readFile(verification_mail_path, 'utf8').then((data) => {
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
            plainText: "Código de verificación: " + verification_code + "\n\n¡Gracias por registrarte en Whisper-ESCOM!",
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


// https://www.lennyfacecopypaste.com/text-symbols/line.html

async function sendRecoveryMail(username, email, recovery_code) {
    try {

        // Leemos el archivo html del correo electrónico
        const html_mail = await readFile(recovery_mail_path, 'utf8').then((data) => {
            // Modificamos el correo mediante JSDOM
            const dom = new JSDOM(data);
            const document = dom.window.document;

            // Cambiando el nombre del usuario mostrado
            let usuario = document.getElementById("user");
            usuario.innerHTML = username;

            // Insertando el código de verificación
            let codigo = document.getElementById("recovery-code");
            codigo.innerHTML = recovery_code;

            return dom.serialize();

        }).catch((err) => { console.error(err); });
        
        // Después enviamos el correo mediante los servicios de comunicación de Azure
        const emailMessage = {
        senderAddress: "whisper-recovery@ff71f960-d15d-43b7-ae06-ccac18ebc514.azurecomm.net",
        content: {
            subject: `〘 Código de recuperación - Whisper-ESCOM 〙`,
            plainText: "Código de recuperación: " + recovery_code + "\n\n¡Gracias por usar Whisper-ESCOM!",
            html: html_mail,
            },
            recipients: {
                to: [{ address: email }],
            },
        };
    }  catch (error) {
        console.error(error);
    }    
}

module.exports = {
	sendVerifyMail: sendVerifyMail,
    sendRecoveryMail: sendRecoveryMail
}
