// Después de recibir la respuesta del servidor 
htmx.on("hmtl:afterOnLoad", (event) => {
	let element = event.detail.elt;

	if (element.id == "lnk-forgot"){
		
	}
});

// Verificamos las contraseñas antes de enviar la solicitud XML
htmx.on("htmx:beforeRequest", (event) => {
	let element = event.detail.elt;

	if (element.id == "lnk-forgot"){
		cssOcultarEnlace();
		cssMostrarInput();
	}

});

