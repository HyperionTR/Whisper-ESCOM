function validarRegistro(){
	var username = document.getElementById("user").value;
	var pass = document.getElementById("pass").value;
	var confpass = document.getElementById("confpass").value;
	var correo = document.getElementById("correo").value;

	if(pass != confpass){
		alert("Las contraseñas no coiciden");
		return;
	}

	//Si el correo y usuario ya estan registrados en bd (aun no lo he implementado)

	var passRegex = /(?=.*\d)(?=.*[!@#$%^&*])\S{6,}/;
	if(passRegex.test(pass)){
		alert("La contraseña debe tener al menos un número, un carácter especial y ser de al menos 6 caracteres.");
		return;
	}
	//Enviar correo de confirmación (aun no lo he implementado)

	
	//Registrar en base de datos (aun no lo he implementado)
}	