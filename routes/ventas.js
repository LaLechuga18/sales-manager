const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    const { fecha } = req.query;
    const ventas = fecha
        ? db.prepare('SELECT * FROM ventas WHERE fecha = ?').all(fecha)
        : db.prepare('SELECT * FROM ventas').all();
    res.json(ventas);
});

router.post('/', (req, res) => {
    const { fecha, hora, producto_id, producto_nombre, tipo, cantidad, unidad, precio, total, nota } = req.body;
    const resultado = db.prepare(`
        INSERT INTO ventas (fecha, hora, producto_id, producto_nombre, tipo, cantidad, unidad, precio, total, nota)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fecha, hora, producto_id, producto_nombre, tipo, cantidad, unidad, precio, total, nota || '');
    res.json({ id: resultado.lastInsertRowid });
});

router.delete('/:id', (req, res) => {
    db.prepare('DELETE FROM ventas WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
});

router.delete('/', (req, res) => {
    const { fecha } = req.query;
    db.prepare('DELETE FROM ventas WHERE fecha = ?').run(fecha);
    res.json({ ok: true });
});

module.exports = router;
