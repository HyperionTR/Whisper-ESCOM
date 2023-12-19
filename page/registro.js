let form = document.querySelector("[name='form-registro']");

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
		cssMostrarCodigo();
		// Enviamos los primeros datos de registro al servidor
		fetch('/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({usuario: el_username.value, correo: el_email.value})
		})
	}

});

function cssMostrarCodigo(){
	let codigo = document.querySelectorAll(".code");
	codigo.forEach(function(element){ 
		element.style.transform = "scaleY(1)";
		element.style.opacity = "1";
		element.style.position = "relative";
		element.style.display = "block";
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
	}).then(function(response){
		if(response.message == "ok"){
			window.location.href = "/index.html";
		} else if (response.message == "codigo"){
			alert("El código de verificación es incorrecto.");
		} else {
			alert("Ocurrió un error al registrar el usuario.");
		}
	}).catch( (error) => {
		alert("No se pudo conectar con el servidor, " + error);
	});

}

