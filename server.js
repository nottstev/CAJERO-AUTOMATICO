const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();


app.use(cors());
app.use(express.json());


const db = new sqlite3.Database('base_de_datos.db', (err) => {
    if (err) console.error("Error al conectar con SQLite:", err.message);
    else console.log("¡Conectado con éxito a la base de datos SQLite!");
});


db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL,
            usuario TEXT UNIQUE NOT NULL,
            contrasenia TEXT NOT NULL,
            monto REAL NOT NULL
        )
    `, (err) => {
        if (err) console.error("Error al crear la tabla:", err.message);
        else console.log("¡Tabla de usuarios lista!");
    });
    
    db.run(`
        CREATE TABLE IF NOT EXISTS transacciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            id_origen INTEGER NOT NULL,
            id_destino INTEGER NOT NULL,
            monto REAL NOT NULL,
            fecha TEXT NOT NULL,
            FOREIGN KEY(id_origen) REFERENCES usuarios(id),
            FOREIGN KEY(id_destino) REFERENCES usuarios(id)
        )
    `, (err) => {
        if (err) console.error("Error al crear tabla transacciones:", err.message);
        else console.log("¡Tabla de transacciones lista!");
    });
});


app.post('/registrar', (req, res) => {
    const { nombre, usuario, contrasenia } = req.body;

   
    const generarIdUnico = () => Math.floor(100000 + Math.random() * 900000);
    let idAleatorio = generarIdUnico();

   
    const montoAleatorio = parseFloat((500 + Math.random() * 9500).toFixed(2));

    db.get("SELECT id FROM usuarios WHERE id = ?", [idAleatorio], (err, row) => {
        if (err) return res.status(500).json({ mensaje: "Error en el servidor" });

        if (row) { idAleatorio = generarIdUnico(); }

        
        const query = `INSERT INTO usuarios (id, nombre, usuario, contrasenia, monto) VALUES (?, ?, ?, ?, ?)`;
        
        
        db.run(query, [idAleatorio, nombre, usuario, contrasenia, montoAleatorio], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(400).json({ mensaje: "El nombre de usuario ya está en uso." });
                }
                return res.status(400).json({ mensaje: "Error al registrar: " + err.message });
            }
            
            
            res.json({ 
                mensaje: "¡Usuario registrado con éxito!", 
                id_asignado: idAleatorio,
                monto_inicial: montoAleatorio
            });
        });
    });
});


app.post('/login', (req, res) => {
    const { usuario, contrasenia } = req.body; 

    
    const query = `SELECT * FROM usuarios WHERE usuario = ?`;

    db.get(query, [usuario], (err, row) => {
        if (err) {
            return res.status(500).json({ exito: false, mensaje: "Error en la base de datos: " + err.message });
        }

        
        if (!row) {
            return res.status(404).json({ exito: false, mensaje: "El nombre de usuario no existe." });
        }

        
        if (row.contrasenia === contrasenia) {
            
            res.json({ 
                exito: true, 
                mensaje: "Inicio de sesión correcto.",
                nombre: row.nombre, 
                id: row.id,
                usuario: row.usuario,
                monto: row.monto
            });
        } else {
            res.status(401).json({ exito: false, mensaje: "Contraseña incorrecta. Inténtalo de nuevo." });
        }
    });
});

app.post('/transferir', (req, res) => {
    const { id_origen, id_destino, monto } = req.body;
    const montoNum = parseFloat(monto);

    
    if (!id_origen || !id_destino || isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ exito: false, mensaje: "Datos de transferencia inválidos." });
    }
    if (parseInt(id_origen) === parseInt(id_destino)) {
        return res.status(400).json({ exito: false, mensaje: "No puedes transferirte a ti mismo, Tilín." });
    }

    
    db.get("SELECT id FROM usuarios WHERE id = ?", [id_destino], (err, destinoRow) => {
        if (err) return res.status(500).json({ exito: false, mensaje: "Error en el servidor." });
        if (!destinoRow) {
            return res.status(444).json({ exito: false, mensaje: "El ID de destino no existe en el sistema." });
        }

        
        db.get("SELECT monto FROM usuarios WHERE id = ?", [id_origen], (err, origenRow) => {
            if (err) return res.status(500).json({ exito: false, mensaje: "Error en el servidor." });
            if (!origenRow || origenRow.monto < montoNum) {
                return res.status(400).json({ exito: false, mensaje: "Saldo insuficiente para completar la operación." });
            }

            
            db.serialize(() => {
                db.run("UPDATE usuarios SET monto = monto - ? WHERE id = ?", [montoNum, id_origen]);
                
                db.run("UPDATE usuarios SET monto = monto + ? WHERE id = ?", [montoNum, id_destino]);
                
                
                const fechaActual = new Date().toLocaleString(); 
                db.run(
                    "INSERT INTO transacciones (id_origen, id_destino, monto, fecha) VALUES (?, ?, ?, ?)",
                    [id_origen, id_destino, montoNum, fechaActual],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ exito: false, mensaje: "Error al guardar el historial." });
                        }
                        res.json({ exito: true, mensaje: `¡Transferencia de Q${montoNum} realizada con éxito!` });
                    }
                );
            });
        });
    });
});

app.get('/historial/:idUsuario', (req, res) => {
    const { idUsuario } = req.params;

   
    const query = `
        SELECT * FROM transacciones 
        WHERE id_origen = ? OR id_destino = ? 
        ORDER BY id DESC
    `;

    db.all(query, [idUsuario, idUsuario], (err, rows) => {
        if (err) {
            return res.status(500).json({ exito: false, mensaje: "Error al obtener el historial." });
        }
        res.json({ exito: true, transacciones: rows });
    });
});

app.post('/depositar', (req, res) => {
    const { id_usuario, monto } = req.body;
    const montoNum = parseFloat(monto);

    if (!id_usuario || isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ exito: false, mensaje: "Monto de depósito inválido." });
    }

    db.serialize(() => {
        
        db.run("UPDATE usuarios SET monto = monto + ? WHERE id = ?", [montoNum, id_usuario]);

        
        const fechaActual = new Date().toLocaleString();
        db.run(
            "INSERT INTO transacciones (id_origen, id_destino, monto, fecha) VALUES (?, ?, ?, ?)",
            [0, id_usuario, montoNum, fechaActual], 
            (err) => {
                if (err) return res.status(500).json({ exito: false, mensaje: "Error al registrar historial." });
                res.json({ exito: true, mensaje: `¡Depósito de Q${montoNum} realizado con éxito! 🎉` });
            }
        );
    });
});


app.post('/retirar', (req, res) => {
    const { id_usuario, monto } = req.body;
    const montoNum = parseFloat(monto);

    if (!id_usuario || isNaN(montoNum) || montoNum <= 0) {
        return res.status(400).json({ exito: false, mensaje: "Monto de retiro inválido." });
    }

    
    db.get("SELECT monto FROM usuarios WHERE id = ?", [id_usuario], (err, row) => {
        if (err) return res.status(500).json({ exito: false, mensaje: "Error en el servidor." });
        if (!row || row.monto < montoNum) {
            return res.status(400).json({ exito: false, mensaje: "Saldo insuficiente para retirar esa cantidad." });
        }

        db.serialize(() => {
            
            db.run("UPDATE usuarios SET monto = monto - ? WHERE id = ?", [montoNum, id_usuario]);

            
            const fechaActual = new Date().toLocaleString();
            db.run(
                "INSERT INTO transacciones (id_origen, id_destino, monto, fecha) VALUES (?, ?, ?, ?)",
                [id_usuario, 0, montoNum, fechaActual], 
                (err) => {
                    if (err) return res.status(500).json({ exito: false, mensaje: "Error al registrar historial." });
                    res.json({ exito: true, mensaje: `¡Retiro de Q${montoNum} completado! Retire su efectivo. 💵` });
                }
            );
        });
    });
});
app.listen(3000, () => console.log('Servidor corriendo en https://quartered-croak-residual.ngrok-free.dev'));