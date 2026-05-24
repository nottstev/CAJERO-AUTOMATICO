/* let user_input = document.querySelector("#user_input")
let boton_login = document.querySelector("#boton_login")


function enviarForm(){
    let dato = user_input.value
    alert(dato)
    console.log(dato)
}

boton_login.addEventListener('click', enviarForm)
 */


const nombre_input = document.getElementById('nombre_input'); 
const user_input = document.getElementById('user_input');
const pass_input = document.getElementById('pass_input');
const boton_registrar = document.getElementById('boton_registrar');

boton_registrar.addEventListener('click', function(e) {
    e.preventDefault(); 

    
    const nombre = nombre_input.value.trim();
    const usuario = user_input.value.trim();
    const contrasenia = pass_input.value.trim();

    
    if (nombre === "" || usuario === "" || contrasenia === "") {
        alert("Todos los campos son obligatorios para registrarte.");
        return; 
    }

    
    const datosUsuario = { nombre, usuario, contrasenia };

    
    fetch('https://quartered-croak-residual.ngrok-free.dev/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosUsuario)
    })
    .then(res => res.json())
    .then(data => {
        if (data.id_asignado) {
            window.location.href = "index.html"; 
            alert(`${data.mensaje}\nTu ID de usuario es: ${data.id_asignado}`);
            
        } else {
            alert(data.mensaje);
        }
    })
    .catch(err => console.error("Error:", err));
});