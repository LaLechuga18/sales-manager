const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos.' });

    const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);
    if (!usuario) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    if (usuario.estado === 'pendiente') {
        return res.status(403).json({ error: 'Tu cuenta está pendiente de aprobación por el administrador.' });
    }

    const valido = bcrypt.compareSync(password, usuario.password);
    if (!valido) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    req.session.usuario = { id: usuario.id, username: usuario.username, rol: usuario.rol, cliente_id: usuario.cliente_id };
    res.json({ ok: true, rol: usuario.rol });
});

// Logout
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true });
});

// Quién soy
router.get('/me', (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado.' });
    res.json(req.session.usuario);
});

// Registro abierto — queda pendiente
router.post('/registro', (req, res) => {
    const { username, password, nombre, telefono } = req.body;
    if (!username || !password || !nombre) return res.status(400).json({ error: 'Faltan datos.' });

    const dup = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
    if (dup) return res.status(400).json({ error: `El usuario "${username}" ya existe.` });

    const cliente = db.prepare('INSERT INTO clientes (nombre, telefono) VALUES (?, ?)').run(nombre, telefono || '');
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
        'INSERT INTO usuarios (username, password, rol, estado, cliente_id) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hash, 'cliente', 'pendiente', cliente.lastInsertRowid);

    res.json({ ok: true });
});

// Admin — crear usuario para un cliente ya existente
router.post('/usuarios/crear', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }

    const { cliente_id, username, password } = req.body;
    if (!cliente_id || !username || !password) {
        return res.status(400).json({ error: 'Faltan datos.' });
    }

    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(cliente_id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    const yaExiste = db.prepare('SELECT id FROM usuarios WHERE cliente_id = ?').get(cliente_id);
    if (yaExiste) return res.status(400).json({ error: 'Este cliente ya tiene un usuario asignado.' });

    const dupUser = db.prepare('SELECT id FROM usuarios WHERE username = ?').get(username);
    if (dupUser) return res.status(400).json({ error: `El usuario "${username}" ya existe.` });

    const hash = bcrypt.hashSync(password, 10);
    db.prepare(
        'INSERT INTO usuarios (username, password, rol, estado, cliente_id) VALUES (?, ?, ?, ?, ?)'
    ).run(username, hash, 'cliente', 'activo', cliente_id);

    res.json({ ok: true });
});

// Admin — consultar si un cliente ya tiene usuario asignado
router.get('/cliente-usuario/:clienteId', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    const usuario = db.prepare('SELECT id, username FROM usuarios WHERE cliente_id = ?').get(req.params.clienteId);
    if (usuario) {
        res.json({ tiene_usuario: true, username: usuario.username });
    } else {
        res.json({ tiene_usuario: false });
    }
});

// Admin — obtener usuarios pendientes
router.get('/pendientes', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    const pendientes = db.prepare('SELECT id, username, estado FROM usuarios WHERE estado = ?').all('pendiente');
    res.json(pendientes);
});

// Admin — aprobar usuario
router.put('/usuarios/:id/aprobar', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    db.prepare("UPDATE usuarios SET estado = 'activo' WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});

// Admin — rechazar/eliminar usuario
router.delete('/usuarios/:id', (req, res) => {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.params.id);
    if (usuario && usuario.cliente_id) {
        db.prepare('DELETE FROM cargos WHERE cliente_id = ?').run(usuario.cliente_id);
        db.prepare('DELETE FROM clientes WHERE id = ?').run(usuario.cliente_id);
    }
    db.prepare('DELETE FROM usuarios WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;