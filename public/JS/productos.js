// ── Productos ─────────────────────────────────────────────

function agregarProducto() {
    const nombre = document.getElementById('prod-nombre').value.trim();
    const tipo   = document.getElementById('prod-tipo').value;
    const precio = parseFloat(document.getElementById('prod-precio').value);
    if (!nombre) return alert('Escribe el nombre del producto.');
    if (isNaN(precio) || precio < 0) return alert('Precio invalido.');

    const duplicado = productos.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
    if (duplicado) return alert(`Ya existe un producto llamado "${duplicado.nombre}".`);

    productos.push({ id: Date.now(), nombre, tipo, precio });
    save();
    document.getElementById('prod-nombre').value = '';
    document.getElementById('prod-precio').value = '';
    renderProductos();
    toast('Producto agregado');
}

function renderProductos() {
    const el = document.getElementById('lista-productos');
    if (!productos.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">📦</div>Sin productos aun.<br>Agrega el primero arriba.</div>';
        return;
    }
    el.innerHTML = productos.map(p => `
        <div class="prod-item">
            <span class="prod-tag ${p.tipo === 'kilo' ? 'kilo' : ''}">${p.tipo === 'kilo' ? 'kg' : 'pieza'}</span>
            <span class="prod-name">${p.nombre}</span>
            <span class="prod-price">$${p.precio.toFixed(2)}</span>
            <button class="btn-edit" onclick="abrirEditar('${p.id}')">✏️</button>
        </div>
    `).join('');
}

// ── Modal editar ──────────────────────────────────────────
let editandoId = null;

function abrirEditar(id) {
    const p = productos.find(p => String(p.id) === String(id));
    if (!p) return;
    editandoId = id;
    document.getElementById('edit-nombre').value = p.nombre;
    document.getElementById('edit-tipo').value   = p.tipo;
    document.getElementById('edit-precio').value = p.precio;
    document.getElementById('edit-nombre-error').style.display = 'none';
    document.getElementById('edit-nombre').classList.remove('input-error');
    document.getElementById('modal-editar').classList.add('open');
}

function cerrarModal() {
    editandoId = null;
    document.getElementById('modal-editar').classList.remove('open');
}

function guardarEdicion() {
    const id     = editandoId;
    const nombre = document.getElementById('edit-nombre').value.trim();
    const tipo   = document.getElementById('edit-tipo').value;
    const precio = parseFloat(document.getElementById('edit-precio').value);

    const duplicado = productos.find(p => String(p.id) !== String(id) && p.nombre.toLowerCase() === nombre.toLowerCase());
    if (duplicado) {
        document.getElementById('edit-nombre').classList.add('input-error');
        document.getElementById('edit-nombre-error').style.display = 'block';
        return;
    }
    if (!nombre) return alert('El nombre no puede estar vacio.');
    if (isNaN(precio) || precio < 0) return alert('Precio invalido.');

    const idx = productos.findIndex(p => String(p.id) === String(id));
    if (idx === -1) return;
    productos[idx] = { ...productos[idx], nombre, tipo, precio };
    save();
    cerrarModal();
    renderProductos();
    poblarSelectProductos();
    toast('Producto actualizado');
}

function eliminarDesdeModal() {
    if (!editandoId) return;
    if (!confirm('Eliminar este producto?')) return;
    productos = productos.filter(p => String(p.id) !== String(editandoId));
    save();
    cerrarModal();
    renderProductos();
    poblarSelectProductos();
    toast('Eliminado');
}

document.getElementById('modal-editar').addEventListener('click', function(e) {
    if (e.target === this) cerrarModal();
});