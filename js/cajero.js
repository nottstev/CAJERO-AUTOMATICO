document.addEventListener('DOMContentLoaded', function() {
    const nombreGuardado = localStorage.getItem('nombreUsuario');
    const contenedorNombre = document.getElementById('nombreUsuarioCaja');

    const idGuardado = localStorage.getItem("idUsuario")
    const contenedorId = document.getElementById("idUsuarioCaja")

    const usuarioGuardado = localStorage.getItem('user')
    const contenedorUsario = document.getElementById("UsuarioCaja")

    const montoGuardado = localStorage.getItem("monto")
    const contenedorMonto = document.getElementById("montoUsuarioCaja")

    if (nombreGuardado) {
        
        contenedorUsario.innerHTML = `¡HOLA, ${usuarioGuardado.toUpperCase()}!`;
        contenedorId.innerHTML = `ID: ${idGuardado}`;
        contenedorMonto.innerHTML = `Q${montoGuardado}` + '<p class="txtSaldo">' + 'Saldo disponible' + '</p>';
        
    } else {
        window.location.href = "index.html";
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const nombreGuardado = localStorage.getItem('nombreUsuario');
    const idGuardado = localStorage.getItem('idUsuario'); 

    
    console.log(nombreGuardado)
    document.getElementById('nombreUsuarioCaja').innerHTML = `<strong>${nombreGuardado.toUpperCase()}</strong>`;
    document.getElementById('idUsuarioCaja').innerText = `ID: ${idGuardado}`;

    const idDestinoInput = document.getElementById('id_destino_input');
    const montoInput = document.getElementById('monto_input');
    const botonTransferir = document.getElementById('boton_transferir');

    
    function cargarHistorial() {
    
    fetch(`https://quartered-croak-residual.ngrok-free.dev/historial/${idGuardado}`, {
        method: 'GET',
        headers: {
            
            'ngrok-skip-browser-warning': 'true'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.exito) {
            const tbody = document.getElementById('tabla_historial_body');
            tbody.innerHTML = ""; 

            if (data.transacciones.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4">No has realizado ninguna transacción aún.</td></tr>`;
                return;
            }

            data.transacciones.forEach(tx => {
                let tipo = "";
                let usuarioRelacionado = "";
                let claseColor = "";

                if (parseInt(tx.id_origen) === parseInt(idGuardado)) {
                    tipo = "Envío";
                    usuarioRelacionado = `Al ID: ${tx.id_destino}`;
                    claseColor = "color: #EF4444;";
                } else { 
                    tipo = "Recibo";
                    usuarioRelacionado = `Del ID: ${tx.id_origen}`;
                    claseColor = "color: #22C55E;";
                }

                tbody.innerHTML += `
                    <tr>
                        <td>${tipo}</td>
                        <td>${usuarioRelacionado}</td>
                        <td style="${claseColor}"><strong>Q${tx.monto}</strong></td>
                        <td>${tx.fecha}</td>
                    </tr>
                `;
            });
        }
    })
    .catch(err => console.error("Error al cargar historial:", err));
}

    
    cargarHistorial();

    
    botonTransferir.addEventListener('click', function() {
        const idDestino = idDestinoInput.value.trim();
        const monto = montoInput.value.trim();

        if (idDestino === "" || monto === "") {
            alert("Por favor llena ambos campos.");
            return;
        }

        const datosTransferencia = {
            id_origen: idGuardado,
            id_destino: idDestino,
            monto: monto
        };

        fetch('https://quartered-croak-residual.ngrok-free.dev/transferir', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosTransferencia)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensaje);
            if (data.exito) {
                
                idDestinoInput.value = "";
                montoInput.value = "";
            
                cargarHistorial();
            }
        })
        .catch(err => console.error("Error en la transferencia:", err));
    });
});
const montoDepositoInput = document.getElementById('monto_deposito_input');
const botonDepositar = document.getElementById('boton_depositar');

const montoRetiroInput = document.getElementById('monto_retiro_input');
const botonRetirar = document.getElementById('boton_retirar');


botonDepositar.addEventListener('click', function() {
    const monto = montoDepositoInput.value.trim();
    const idGuardado = localStorage.getItem("idUsuario")
    if (monto === "") {
        alert("Ingrese un monto para depositar.");
        return;
    }

    fetch('https://quartered-croak-residual.ngrok-free.dev/depositar', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ id_usuario: idGuardado, monto: monto })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje); 
        if (data.exito) {
            montoDepositoInput.value = ""; 
            cargarHistorial(); 
        }
    })
    .catch(err => console.error("Error al depositar:", err));
});

botonRetirar.addEventListener('click', function() {
    const monto = montoRetiroInput.value.trim();
    const idGuardado = localStorage.getItem("idUsuario")
    if (monto === "") {
        alert("Ingrese un monto para retirar.");
        return;
    }

    fetch('https://quartered-croak-residual.ngrok-free.dev/retirar', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ id_usuario: idGuardado, monto: monto })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.mensaje); 
        if (data.exito) {
            montoRetiroInput.value = ""; 
            cargarHistorial(); 
        }
    })
    .catch(err => console.error("Error al retirar:", err));
});


const botonTrx = document.getElementById("trx")
const transferenciaCaja = document.getElementById("transferenciaCaja")
botonTrx.addEventListener("click", () => {
    transferenciaCaja.classList.toggle("mostrar")
})

const botonHis = document.getElementById("his")
const historialCaja = document.getElementById("historialCaja")
botonHis.addEventListener("click", () => {
    historialCaja.classList.toggle("mostrar")
})