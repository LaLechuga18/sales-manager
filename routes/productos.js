const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    const productos = db.prepare('SELECT * FROM productos').all();
    res.json(productos);
});

router.post('/', (req, res) => {
    const { nombre, tipo, precio } = req.body;
    if (!nombre || !tipo || !precio) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    const dup = db.prepare('SELECT id FROM productos WHERE LOWER(nombre) = LOWER(?)').get(nombre);
    if (dup) return res.status(400).json({ error: `Ya existe un producto llamado "${nombre}".` });

    const resultado = db.prepare(
        'INSERT INTO productos (nombre, tipo, precio) VALUES (?, ?, ?)'
    ).run(nombre, tipo, precio);
    res.json({ id: resultado.lastInsertRowid, nombre, tipo, precio });
});

router.put('/:id', (req, res) => {
    const { nombre, tipo, precio } = req.body;
    db.prepare(
        'UPDATE productos SET nombre = ?, tipo = ?, precio = ? WHERE id = ?'
    ).run(nombre, tipo, precio, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;