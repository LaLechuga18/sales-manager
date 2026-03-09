// ── Estado ──────────────────────────────────────────────
let productos = JSON.parse(localStorage.getItem('gs_productos') || '[]');
let ventas = JSON.parse(localStorage.getItem('gs_ventas') || '[]');

// ── Fecha actual ────────────────────────────────────────
const hoy = new Date();
const fechaStr = hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaKey = hoy.toISOString().split('T')[0];
document.getElementById('header-date').textContent = fechaStr;
document.getElementById('res-fecha').textContent = fechaStr;

function ventasHoy() {
    return ventas.filter(v => v.fecha === fechaKey);
}

// ── Guardar ─────────────────────────────────────────────
function save() {
    localStorage.setItem('gs_productos', JSON.stringify(productos));
    localStorage.setItem('gs_ventas', JSON.stringify(ventas));
}

// ── Toast ───────────────────────────────────────────────
function toast(msg = 'Guardado') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Tabs ────────────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    const idx = ['ventas', 'nueva-venta', 'productos', 'resumen'].indexOf(name);
    document.querySelectorAll('nav.tabs button')[idx].classList.add('active');
    if (name === 'ventas') renderVentas();
    if (name === 'productos') renderProductos();
    if (name === 'resumen') renderResumen();
    if (name === 'nueva-venta') poblarSelectProductos();
}

// ── Productos ───────────────────────────────────────────
function agregarProducto() {
    const nombre = document.getElementById('prod-nombre').value.trim();
    const tipo = document.getElementById('prod-tipo').value;
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

function eliminarProducto(id) {
    if (!confirm('Eliminar este producto?')) return;
    productos = productos.filter(p => String(p.id) !== String(id));
    save();
    renderProductos();
    poblarSelectProductos();
    toast('Eliminado');
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

// ── Modal editar ─────────────────────────────────────────
let editandoId = null;

function abrirEditar(id) {
    const p = productos.find(p => String(p.id) === String(id));
    if (!p) return;
    editandoId = id;
    document.getElementById('edit-nombre').value = p.nombre;
    document.getElementById('edit-tipo').value = p.tipo;
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
    const id = editandoId;
    const nombre = document.getElementById('edit-nombre').value.trim();
    const tipo = document.getElementById('edit-tipo').value;
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

document.getElementById('modal-editar').addEventListener('click', function (e) {
    if (e.target === this) cerrarModal();
});

// ── Nueva venta ─────────────────────────────────────────
function poblarSelectProductos() {
    const sel = document.getElementById('venta-producto');
    sel.innerHTML = '<option value="">— Selecciona un producto —</option>' +
        productos.map(p => `<option value="${p.id}">${p.nombre} (${p.tipo === 'kilo' ? 'kg' : 'pieza'})</option>`).join('');
}

function onProductoChange() {
    const id = document.getElementById('venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return;
    document.getElementById('venta-precio').value = prod.precio;
    const esKilo = prod.tipo === 'kilo';
    document.getElementById('campo-cantidad-pieza').style.display = esKilo ? 'none' : 'block';
    document.getElementById('campo-cantidad-kilo').style.display = esKilo ? 'block' : 'none';
    calcularTotal();
}

function calcularTotal() {
    const id = document.getElementById('venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    const precio = parseFloat(document.getElementById('venta-precio').value) || 0;
    let qty = 0;
    if (prod && prod.tipo === 'kilo') {
        qty = parseFloat(document.getElementById('venta-kilos').value) || 0;
    } else {
        qty = parseFloat(document.getElementById('venta-cantidad').value) || 0;
    }
    document.getElementById('venta-total-calc').value = (precio * qty).toFixed(2);
}

function registrarVenta() {
    const id = document.getElementById('venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return alert('Selecciona un producto.');
    const precio = parseFloat(document.getElementById('venta-precio').value);
    const nota = document.getElementById('venta-nota').value.trim();
    let qty, unidad;
    if (prod.tipo === 'kilo') {
        qty = parseFloat(document.getElementById('venta-kilos').value);
        unidad = 'kg';
    } else {
        qty = parseFloat(document.getElementById('venta-cantidad').value);
        unidad = qty === 1 ? 'pieza' : 'piezas';
    }
    if (!qty || qty <= 0) return alert('Ingresa una cantidad valida.');
    if (!precio || precio <= 0) return alert('Ingresa un precio valido.');

    ventas.push({
        id: Date.now(),
        fecha: fechaKey,
        productoId: prod.id,
        productoNombre: prod.nombre,
        tipo: prod.tipo,
        qty,
        unidad,
        precio,
        total: precio * qty,
        nota,
        hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    });
    save();

    document.getElementById('venta-producto').value = '';
    document.getElementById('venta-cantidad').value = '';
    document.getElementById('venta-kilos').value = '';
    document.getElementById('venta-precio').value = '';
    document.getElementById('venta-total-calc').value = '';
    document.getElementById('venta-nota').value = '';
    document.getElementById('campo-cantidad-pieza').style.display = 'block';
    document.getElementById('campo-cantidad-kilo').style.display = 'none';

    toast('Venta registrada');
    showTab('ventas');
}

// ── Render ventas ───────────────────────────────────────
function renderVentas() {
    const hoyVentas = ventasHoy();
    const el = document.getElementById('lista-ventas');

    const totalDinero = hoyVentas.reduce((a, v) => a + v.total, 0);
    const totalArticulos = hoyVentas.reduce((a, v) => a + v.qty, 0);
    document.getElementById('sum-ventas').textContent = hoyVentas.length;
    document.getElementById('sum-total').textContent = '$' + totalDinero.toFixed(2);
    document.getElementById('sum-productos').textContent = totalArticulos % 1 === 0 ? totalArticulos : totalArticulos.toFixed(1);

    if (!hoyVentas.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">🐓</div>Aun no hay ventas hoy.<br>Registra la primera!</div>';
        return;
    }

    el.innerHTML = [...hoyVentas].reverse().map(v => `
        <div class="venta-item">
            <div class="venta-info">
                <div class="venta-nombre">
                    ${v.productoNombre}
                    <span class="tag-tipo ${v.tipo === 'kilo' ? 'tag-kilo' : 'tag-pieza'}">${v.tipo === 'kilo' ? 'kg' : 'pieza'}</span>
                </div>
                <div class="venta-detalle">${v.qty} ${v.unidad} x $${v.precio.toFixed(2)} · ${v.hora}${v.nota ? ' · ' + v.nota : ''}</div>
            </div>
            <div class="venta-actions">
                <span class="venta-total">$${v.total.toFixed(2)}</span>
                <button class="btn btn-danger" onclick="eliminarVenta('${v.id}')">X</button>
            </div>
        </div>
    `).join('');
}

function eliminarVenta(id) {
    if (!confirm('Eliminar esta venta?')) return;
    ventas = ventas.filter(v => String(v.id) !== String(id));
    save();
    renderVentas();
    toast('Venta eliminada');
}

// ── Resumen ─────────────────────────────────────────────
function renderResumen() {
    const hoyVentas = ventasHoy();
    const total = hoyVentas.reduce((a, v) => a + v.total, 0);
    const articulos = hoyVentas.reduce((a, v) => a + v.qty, 0);

    document.getElementById('res-n-ventas').textContent = hoyVentas.length;
    document.getElementById('res-articulos').textContent = articulos % 1 === 0 ? articulos : articulos.toFixed(2);
    document.getElementById('res-total').textContent = '$' + total.toFixed(2);

    const desglose = {};
    hoyVentas.forEach(v => {
        if (!desglose[v.productoNombre]) desglose[v.productoNombre] = { qty: 0, total: 0, tipo: v.tipo };
        desglose[v.productoNombre].qty += v.qty;
        desglose[v.productoNombre].total += v.total;
    });

    const el = document.getElementById('res-desglose');
    const entries = Object.entries(desglose);
    if (!entries.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">📊</div>Sin ventas para mostrar.</div>';
        return;
    }
    el.innerHTML = entries.map(([nombre, d]) => `
        <div class="venta-item">
            <div class="venta-info">
                <div class="venta-nombre">${nombre}</div>
                <div class="venta-detalle">${d.qty % 1 === 0 ? d.qty : d.qty.toFixed(2)} ${d.tipo === 'kilo' ? 'kg' : 'piezas'}</div>
            </div>
            <span class="venta-total">$${d.total.toFixed(2)}</span>
        </div>
    `).join('');
}

function borrarVentasHoy() {
    if (!confirm('Seguro que quieres borrar todas las ventas de hoy?')) return;
    ventas = ventas.filter(v => v.fecha !== fechaKey);
    save();
    renderResumen();
    toast('Ventas del dia borradas');
}

// ── Init ─────────────────────────────────────────────────
renderVentas();
renderProductos();
poblarSelectProductos();