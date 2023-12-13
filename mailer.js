const { EmailClient } = require("@azure/communication-email");

// Este código recupera la cadena de conexión de una variable de entorno.
const connectionString = process.env.CUSTOMCONNSTR_COMMUNICATION_SERVICES_CONNECTION_STRING;
const emailClient = new EmailClient(connectionString);

async function sendMail(username, email) {
	const emailMessage = {
        senderAddress: "whisper-verifier@ff71f960-d15d-43b7-ae06-ccac18ebc514.azurecomm.net",
        content: {
            subject: `Hola!,  ${username}, este es el primer correo de whisper-verifier!!!`,
            plainText: "Hola mundo por correo electrónico.",
        },
        recipients: {
            to: [{ address: email }],
        },
    };

    const poller = await emailClient.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
	console.log(result);
}

module.exports = {
	sendMail: sendMail
}
