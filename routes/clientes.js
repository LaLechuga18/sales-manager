const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    const clientes = db.prepare('SELECT * FROM clientes').all();
    clientes.forEach(c => {
        c.cargos = db.prepare('SELECT * FROM cargos WHERE cliente_id = ?').all(c.id);
    });
    res.json(clientes);
});

router.get('/:id', (req, res) => {
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });
    cliente.cargos = db.prepare('SELECT * FROM cargos WHERE cliente_id = ?').all(cliente.id);
    res.json(cliente);
});

router.post('/', (req, res) => {
    const { nombre, tel } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Falta el nombre.' });
    const dup = db.prepare('SELECT id FROM clientes WHERE LOWER(nombre) = LOWER(?)').get(nombre);
    if (dup) return res.status(400).json({ error: `Ya existe un cliente llamado "${nombre}".` });
    const resultado = db.prepare(
        'INSERT INTO clientes (nombre, telefono) VALUES (?, ?)'
    ).run(nombre, tel || '');
    res.json({ id: resultado.lastInsertRowid, nombre, tel, cargos: [] });
});

router.delete('/:id', (req, res) => {
    const id = req.params.id;
    // Eliminar en orden para respetar foreign keys:
    // 1. cargos del cliente
    db.prepare('DELETE FROM cargos WHERE cliente_id = ?').run(id);
    // 2. usuario asociado (si existe)
    db.prepare('DELETE FROM usuarios WHERE cliente_id = ?').run(id);
    // 3. el cliente
    db.prepare('DELETE FROM clientes WHERE id = ?').run(id);
    res.json({ ok: true });
});

router.post('/:id/cargos', (req, res) => {
    const { fecha, producto_nombre, cantidad, unidad, precio, total, nota } = req.body;
    const resultado = db.prepare(`
        INSERT INTO cargos (cliente_id, fecha, producto_nombre, cantidad, unidad, precio, total, nota)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, fecha, producto_nombre, cantidad, unidad, precio, total, nota || '');
    res.json({ id: resultado.lastInsertRowid });
});

router.delete('/:id/cargos/:cargoId', (req, res) => {
    db.prepare('DELETE FROM cargos WHERE id = ? AND cliente_id = ?').run(req.params.cargoId, req.params.id);
    res.json({ ok: true });
});

router.delete('/:id/cargos', (req, res) => {
    db.prepare('DELETE FROM cargos WHERE cliente_id = ?').run(req.params.id);
    res.json({ ok: true });
});

module.exports = router;