// ── Ventas ────────────────────────────────────────────────

function poblarSelectProductos() {
    const sel = document.getElementById('venta-producto');
    sel.innerHTML = '<option value="">— Selecciona un producto —</option>' +
        productos.map(p => `<option value="${p.id}">${p.nombre} (${p.tipo === 'kilo' ? 'kg' : 'pieza'})</option>`).join('');
}

function onProductoChange() {
    const id   = document.getElementById('venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return;
    document.getElementById('venta-precio').value = prod.precio;
    const esKilo = prod.tipo === 'kilo';
    document.getElementById('campo-cantidad-pieza').style.display = esKilo ? 'none' : 'block';
    document.getElementById('campo-cantidad-kilo').style.display  = esKilo ? 'block' : 'none';
    calcularTotal();
}

function calcularTotal() {
    const id   = document.getElementById('venta-producto').value;
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

async function registrarVenta() {
    const id   = document.getElementById('venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return alert('Selecciona un producto.');
    const precio = parseFloat(document.getElementById('venta-precio').value);
    const nota   = document.getElementById('venta-nota').value.trim();
    let qty, unidad;
    if (prod.tipo === 'kilo') {
        qty    = parseFloat(document.getElementById('venta-kilos').value);
        unidad = 'kg';
    } else {
        qty    = parseFloat(document.getElementById('venta-cantidad').value);
        unidad = qty === 1 ? 'pieza' : 'piezas';
    }
    if (!qty || qty <= 0) return alert('Ingresa una cantidad valida.');
    if (!precio || precio <= 0) return alert('Ingresa un precio valido.');

    const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            fecha: fechaKey,
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            tipo: prod.tipo,
            cantidad: qty,
            unidad, precio,
            total: precio * qty,
            nota
        })
    });
    const data = await res.json();
    if (data.error) return alert(data.error);

    document.getElementById('venta-producto').value   = '';
    document.getElementById('venta-cantidad').value   = '';
    document.getElementById('venta-kilos').value      = '';
    document.getElementById('venta-precio').value     = '';
    document.getElementById('venta-total-calc').value = '';
    document.getElementById('venta-nota').value       = '';
    document.getElementById('campo-cantidad-pieza').style.display = 'block';
    document.getElementById('campo-cantidad-kilo').style.display  = 'none';

    toast('Venta registrada');
    showTab('ventas');
}

async function renderVentas() {
    const res = await fetch(`/api/ventas?fecha=${fechaKey}`);
    ventas = await res.json();

    const el = document.getElementById('lista-ventas');
    const totalDinero    = ventas.reduce((a, v) => a + v.total, 0);
    const totalArticulos = ventas.reduce((a, v) => a + v.cantidad, 0);
    document.getElementById('sum-ventas').textContent    = ventas.length;
    document.getElementById('sum-total').textContent     = '$' + totalDinero.toFixed(2);
    document.getElementById('sum-productos').textContent = totalArticulos % 1 === 0 ? totalArticulos : totalArticulos.toFixed(1);

    if (!ventas.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">🐓</div>Aun no hay ventas hoy.<br>Registra la primera!</div>';
        return;
    }
    el.innerHTML = [...ventas].reverse().map(v => `
        <div class="venta-item">
            <div class="venta-info">
                <div class="venta-nombre">
                    ${v.producto_nombre}
                    <span class="tag-tipo ${v.tipo === 'kilo' ? 'tag-kilo' : 'tag-pieza'}">${v.tipo === 'kilo' ? 'kg' : 'pieza'}</span>
                </div>
                <div class="venta-detalle">${v.cantidad} ${v.unidad} x $${v.precio.toFixed(2)} · ${v.hora}${v.nota ? ' · ' + v.nota : ''}</div>
            </div>
            <div class="venta-actions">
                <span class="venta-total">$${v.total.toFixed(2)}</span>
                <button class="btn btn-danger" onclick="eliminarVenta('${v.id}')">X</button>
            </div>
        </div>
    `).join('');
}

async function eliminarVenta(id) {
    if (!confirm('Eliminar esta venta?')) return;
    await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
    await renderVentas();
    toast('Venta eliminada');
}

async function renderResumen() {
    const res = await fetch(`/api/ventas?fecha=${fechaKey}`);
    const hoyVentas = await res.json();
    const total     = hoyVentas.reduce((a, v) => a + v.total, 0);
    const articulos = hoyVentas.reduce((a, v) => a + v.cantidad, 0);

    document.getElementById('res-n-ventas').textContent  = hoyVentas.length;
    document.getElementById('res-articulos').textContent = articulos % 1 === 0 ? articulos : articulos.toFixed(2);
    document.getElementById('res-total').textContent     = '$' + total.toFixed(2);

    const desglose = {};
    hoyVentas.forEach(v => {
        if (!desglose[v.producto_nombre]) desglose[v.producto_nombre] = { qty: 0, total: 0, tipo: v.tipo };
        desglose[v.producto_nombre].qty   += v.cantidad;
        desglose[v.producto_nombre].total += v.total;
    });

    const el      = document.getElementById('res-desglose');
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

async function borrarVentasHoy() {
    if (!confirm('Seguro que quieres borrar todas las ventas de hoy?')) return;
    await fetch(`/api/ventas?fecha=${fechaKey}`, { method: 'DELETE' });
    await renderResumen();
    toast('Ventas del dia borradas');
}