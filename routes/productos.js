const express = require('express');
const router = express.Router();
const db = require('../db');

// GET - Obtener todos los productos
router.get('/', (req, res) => {
    const productos = db.prepare('SELECT * FROM productos').all();
    res.json(productos);
});

// POST - Agregar producto
router.post('/', (req, res) => {
    const { nombre, tipo, precio } = req.body;
    if (!nombre || !tipo || !precio) {
        return res.status(400).json({ error: 'Faltan datos' });
    }
    const resultado = db.prepare(
        'INSERT INTO productos (nombre, tipo, precio) VALUES (?, ?, ?)'
    ).run(nombre, tipo, precio);
    res.json({ id: resultado.lastInsertRowid, nombre, tipo, precio });
});

// PUT - Actualizar producto
router.put('/:id', (req, res) => {
    const { nombre, tipo, precio } = req.body;
    db.prepare(
        'UPDATE productos SET nombre = ?, tipo = ?, precio = ? WHERE id = ?'
    ).run(nombre, tipo, precio, req.params.id);
    res.json({ ok: true });
});

// DELETE - Eliminar producto
router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM productos WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;