const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Faltan datos.' });

    const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);
    if (!usuario) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    const valido = bcrypt.compareSync(password, usuario.password);
    if (!valido) return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    req.session.usuario = { id: usuario.id, username: usuario.username, rol: usuario.rol };
    res.json({ ok: true, rol: usuario.rol });
});

router.post('/logout', (req, res) => {
    req.session.destroy();
    res.json({ ok: true });
});

router.get('/me', (req, res) => {
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado.' });
    res.json(req.session.usuario);
});

module.exports = router;
