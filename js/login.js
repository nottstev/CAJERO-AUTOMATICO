// Capturamos los inputs de login actualizados
const login_user_input = document.getElementById('login_user_input'); // <-- Cambiado
const login_pass_input = document.getElementById('login_pass_input');
const boton_login = document.getElementById('boton_login');

boton_login.addEventListener('click', function(e){
    e.preventDefault();

    
    const usuarioLogin = login_user_input.value.trim();
    const contraLogin = login_pass_input.value.trim();

    
    if (usuarioLogin === "" || contraLogin === "") {
        alert("Por favor, ingresa tu usuario y contraseña.");
        return;
    }

    const datosLogin = {
        usuario: usuarioLogin,
        contrasenia: contraLogin
    };

    
    fetch('https://quartered-croak-residual.ngrok-free.dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosLogin)
    })
    
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            localStorage.setItem('idUsuario', data.id);
            localStorage.setItem('nombreUsuario', data.nombre);
            localStorage.setItem('user', data.usuario)
            localStorage.setItem("monto", data.monto)
            
            window.location.href = "cajero.html"; 
            
        } else {
            alert(data.mensaje); 
        }
    })
    .catch(err => console.error("Error:", err));
});