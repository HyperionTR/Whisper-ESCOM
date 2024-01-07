
// En caso de que halla cualquier error con las solicitudes de AJAX, se mostrará un mensaje de error
htmx.on("htmx:responseError", (event) => {
	let element = event.detail.elt;
	let response = event.detail.xhr.response;
	let status = event.detail.xhr.status;

	if (element.id == "lnk-forgot"){
		alert(response);
	}

	if (element.id == "btn-reset"){
		alert(response);
	}

	if (element.id == "btn-reenviar-reset"){
		alert(response);
	}
});

// Después de recibir la respuesta del servidor 
// afterOnLoad se ejecuta cuando AJAX lanza el evento onload, que se ejecuta cuando la solicitud se completa correctamente independientemente del código de estado HTTP
htmx.on("htmx:afterOnLoad", (event) => {
	let element = event.detail.elt;
	let response = event.detail.xhr.response;
	let status = event.detail.xhr.status;

	if (element.id == "lnk-forgot" && status == 200){
		cssOcultarEnlace();
		cssMostrarInput();
	}

	if (element.id == "btn-reset" && status == 200){
		window.location.href = "/index.html";
	}
});

// Verificamos las contraseñas antes de enviar la solicitud XML
htmx.on("htmx:beforeRequest", (event) => {
	let element = event.detail.elt;

	if (element.id == "btn-reset"){

		let el_password = document.querySelector("[name='res-password']");
		let el_confirm = document.querySelector("[name='res-confirm']");
		
		// Si las contraseñas no coinciden, se cancela la solicitud
		
		if ( !el_password.checkValidity() || !el_confirm.checkValidity() ) { 
			el_password.setCustomValidity("La contraseña debe contener al menos 8 caracteres, una letra mayúscula, una minúscula y un número");
			el_password.reportValidity();
			event.preventDefault();
		}
		
		if (el_password.value !== el_confirm.value){
			el_confirm.setCustomValidity("Las contraseñas no coinciden");
			el_confirm.reportValidity();
			event.preventDefault();
		}
	}

});

