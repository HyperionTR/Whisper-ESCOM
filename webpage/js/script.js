const cards = document.querySelectorAll('.card');

/* View Controller
-----------------------------------------*/
const btns = document.querySelectorAll('.js-btn');
btns.forEach(btn => {
  btn.addEventListener('click', on_btn_click, true);
  btn.addEventListener('touch', on_btn_click, true);
});

function on_btn_click(e) {
  const nextID = e.currentTarget.getAttribute('data-target');
  const next = document.getElementById(nextID);
  if (!next) return;
  bg_change(nextID);
  view_change(next);
  return false;
}

/* Add class to the body */
function bg_change(next) {
  document.body.className = '';
  document.body.classList.add('is-' + next);
}

/* Add class to a card */
function view_change(next) {
  cards.forEach(card => {card.classList.remove('is-show');});
  next.classList.add('is-show');
}

function cssMostrarInput(){
	let codigo = document.querySelectorAll(".hidden-input");
	codigo.forEach(function(element){ 
		element.style.transform = "scaleY(1)";
		element.style.opacity = "1";
		element.style.position = "relative";
		element.style.display = "inline-block";
	});
}

function cssOcultarInput(){
	let codigo = document.querySelectorAll(".hidden-input");
	codigo.forEach(function(element){ 
		element.style.transform = "scaleY(0)";
		element.style.opacity = "0";
		element.style.position = "absolute";
		element.style.display = "inline-block";
	});
}

function cssOcultarEnlace(){
	let enlace = document.querySelectorAll(".lnk-forgot");
	enlace.forEach(function(element){ 
		element.style.transform = "scaleY(0)";
		element.style.opacity = "0";
		element.style.position = "absolute";
		element.style.display = "inline-block";
	});
}

function cssMostrarEnlace(){
	let enlace = document.querySelectorAll(".lnk-forgot");
	enlace.forEach(function(element){ 
		element.style.transform = "scaleY(1)";
		element.style.opacity = "1";
		element.style.position = "relative";
		element.style.display = "inline-block";
	});
}