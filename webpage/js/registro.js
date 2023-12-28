// no se pueden importar archivos js, pero todos estarán disponibles desde html
// según el orden en el que se importen en el html
// import {htmx} from './htmx.min.js';

let form = document.querySelector("[name='form-registro']");

// Manejamos los errores de la petición HTMX
htmx.on("htmx:responseError", (event) => {
	let xhr = event.detail.xhr;
	let status = xhr.status;
	let element = event.detail.elt;
	let error_message = xhr.statusText;

	// Manejador para el botón de reenviar código
	if(element.id == "btn-reenviar"){
		alert(error_message);
		return;
	}

	// Manejador para el botón de login
	if(element.id == "btn-login"){
		if(status == 401){
			alert("Usuario o contraseña incorrectos.");
		} else {
			alert("No se pudo conectar con el servidor, " + xhr.statusText);
		}
		return;
	}
});

// Mostramos los mensajes de éxito para las peticiones HTMX
htmx.on("htmx:afterOnLoad", (event) => {
	let element = event.detail.elt;

	if(element.id == "btn-reenviar") {
		alert("Se ha reenviado el código de verificación.");
	}
});

form.addEventListener("submit", function(event){

	event.preventDefault();
	let el_username = event.currentTarget.usuario;
	let el_email = event.currentTarget.correo;
	let el_password = event.currentTarget.password;
	let el_confpass = event.currentTarget.conf_pass;
	let el_code = event.currentTarget.code;

	let codeIsShown = document.querySelector(".code").style.opacity == "1";

	if (codeIsShown){
		validarRegistro(el_username, el_email, el_password, el_confpass, el_code);
		return;
	} else {
		// Enviamos los primeros datos de registro al servidor
		fetch('/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({usuario: el_username.value, correo: el_email.value})
		}).then(async function(response){
			if(response.status == 409) {
				alert(await response.text());
			} else if(response.status == 200) {
				cssMostrarCodigo();
			}
		}).catch( (error) => {
			alert(error);
		});
	}

});

function cssMostrarCodigo(){
	let codigo = document.querySelectorAll(".code");
	codigo.forEach(function(element){ 
		element.style.transform = "scaleY(1)";
		element.style.opacity = "1";
		element.style.position = "relative";
		element.style.display = "inline-block";
	});
}

function validarRegistro(username, email, password, confpass, code){

	if(password.validity.patternMismatch){
		password.setCustomValidity("La contraseña debe tener al menos un número, un carácter especial y ser de al menos 6 caracteres.");
		return;
	}

	if(password.value !== confpass.value){
		confpass.setCustomValidity("Las contraseñas no coinciden.");
		return;
	}

	// Enviamos el codigo de verificación al servidor y esperamos la respuesta
	let user_data = {
		usuario: username.value,
		correo: email.value,
		password: password.value,
		codigo: code.value
	};

	fetch('/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(user_data)
	}).then(async (response) => {
		let stat = await response.status;
		if(stat == 200){
			window.location.href = "/index.html";
		} else if (stat == 409){
			alert(await response.text());
		} else {
			alert(await response.text());
		}
	}).catch( (error) => {
		alert("No se pudo conectar con el servidor, " + error);
	});

}

