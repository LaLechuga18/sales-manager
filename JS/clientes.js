// ── Clientes ──────────────────────────────────────────────

let clienteActivoId = null;

function agregarCliente() {
    const nombre = document.getElementById('cli-nombre').value.trim();
    const tel    = document.getElementById('cli-tel').value.trim();
    if (!nombre) return alert('Escribe el nombre del cliente.');
    const dup = clientes.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
    if (dup) return alert(`Ya existe un cliente llamado "${dup.nombre}".`);
    clientes.push({ id: Date.now(), nombre, tel, cargos: [] });
    save();
    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-tel').value    = '';
    renderClientes();
    toast('Cliente agregado');
}

function renderClientes() {
    const el = document.getElementById('lista-clientes');
    if (!clientes.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">👤</div>Sin clientes aun.</div>';
        return;
    }
    el.innerHTML = clientes.map(c => {
        const total = c.cargos.reduce((a, x) => a + x.total, 0);
        return `
        <div class="prod-item" style="cursor:pointer;" onclick="abrirCliente('${c.id}')">
            <span class="prod-name">${c.nombre}${c.tel ? ' · ' + c.tel : ''}</span>
            <span class="prod-price" style="color:var(--red);">$${total.toFixed(2)}</span>
            <span style="font-size:0.75rem;color:var(--muted);">${c.cargos.length} cargos</span>
        </div>`;
    }).join('');
}

function abrirCliente(id) {
    const c = clientes.find(c => String(c.id) === String(id));
    if (!c) return;
    clienteActivoId = id;
    document.getElementById('modal-cli-nombre').textContent = c.nombre;

    const sel = document.getElementById('cli-venta-producto');
    sel.innerHTML = '<option value="">— Selecciona producto —</option>' +
        productos.map(p => `<option value="${p.id}">${p.nombre} (${p.tipo === 'kilo' ? 'kg' : 'pieza'})</option>`).join('');

    sel.value = '';
    document.getElementById('cli-venta-cantidad').value = '';
    document.getElementById('cli-venta-kilos').value    = '';
    document.getElementById('cli-venta-precio').value   = '';
    document.getElementById('cli-venta-total').value    = '';
    document.getElementById('cli-venta-nota').value     = '';
    document.getElementById('cli-campo-pieza').style.display = 'block';
    document.getElementById('cli-campo-kilo').style.display  = 'none';

    renderCargosModal(c);
    document.getElementById('modal-cliente').classList.add('open');
}

function cerrarModalCliente() {
    clienteActivoId = null;
    document.getElementById('modal-cliente').classList.remove('open');
}

document.getElementById('modal-cliente').addEventListener('click', function(e) {
    if (e.target === this) cerrarModalCliente();
});

function onCliProductoChange() {
    const id   = document.getElementById('cli-venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return;
    document.getElementById('cli-venta-precio').value = prod.precio;
    const esKilo = prod.tipo === 'kilo';
    document.getElementById('cli-campo-pieza').style.display = esKilo ? 'none' : 'block';
    document.getElementById('cli-campo-kilo').style.display  = esKilo ? 'block' : 'none';
    calcularTotalCli();
}

function calcularTotalCli() {
    const id   = document.getElementById('cli-venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    const precio = parseFloat(document.getElementById('cli-venta-precio').value) || 0;
    let qty = 0;
    if (prod && prod.tipo === 'kilo') {
        qty = parseFloat(document.getElementById('cli-venta-kilos').value) || 0;
    } else {
        qty = parseFloat(document.getElementById('cli-venta-cantidad').value) || 0;
    }
    document.getElementById('cli-venta-total').value = (precio * qty).toFixed(2);
}

function registrarVentaCliente() {
    const c = clientes.find(c => String(c.id) === String(clienteActivoId));
    if (!c) return;
    const id   = document.getElementById('cli-venta-producto').value;
    const prod = productos.find(p => String(p.id) === String(id));
    if (!prod) return alert('Selecciona un producto.');
    const precio = parseFloat(document.getElementById('cli-venta-precio').value);
    const nota   = document.getElementById('cli-venta-nota').value.trim();
    let qty, unidad;
    if (prod.tipo === 'kilo') {
        qty    = parseFloat(document.getElementById('cli-venta-kilos').value);
        unidad = 'kg';
    } else {
        qty    = parseFloat(document.getElementById('cli-venta-cantidad').value);
        unidad = qty === 1 ? 'pieza' : 'piezas';
    }
    if (!qty || qty <= 0) return alert('Ingresa una cantidad valida.');
    if (!precio || precio <= 0) return alert('Ingresa un precio valido.');

    c.cargos.push({
        id: Date.now(),
        fecha: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
        productoNombre: prod.nombre,
        qty, unidad, precio,
        total: precio * qty,
        nota
    });
    save();

    document.getElementById('cli-venta-producto').value = '';
    document.getElementById('cli-venta-cantidad').value = '';
    document.getElementById('cli-venta-kilos').value    = '';
    document.getElementById('cli-venta-precio').value   = '';
    document.getElementById('cli-venta-total').value    = '';
    document.getElementById('cli-venta-nota').value     = '';
    document.getElementById('cli-campo-pieza').style.display = 'block';
    document.getElementById('cli-campo-kilo').style.display  = 'none';

    renderCargosModal(c);
    toast('Cargo agregado a la cuenta');
}

function renderCargosModal(c) {
    const total = c.cargos.reduce((a, x) => a + x.total, 0);
    document.getElementById('modal-cli-total').textContent = '$' + total.toFixed(2);

    const el = document.getElementById('modal-cli-ventas');
    if (!c.cargos.length) {
        el.innerHTML = '<div class="empty" style="padding:20px 0;">Sin cargos aun.</div>';
        return;
    }
    el.innerHTML = [...c.cargos].reverse().map(x => `
        <div class="venta-item">
            <div class="venta-info">
                <div class="venta-nombre">${x.productoNombre}</div>
                <div class="venta-detalle">${x.qty} ${x.unidad} x $${x.precio.toFixed(2)} · ${x.fecha}${x.nota ? ' · ' + x.nota : ''}</div>
            </div>
            <div class="venta-actions">
                <span class="venta-total">$${x.total.toFixed(2)}</span>
                <button class="btn btn-danger" onclick="eliminarCargo('${x.id}')">X</button>
            </div>
        </div>
    `).join('');
}

function eliminarCargo(cargoId) {
    const c = clientes.find(c => String(c.id) === String(clienteActivoId));
    if (!c) return;
    if (!confirm('Eliminar este cargo?')) return;
    c.cargos = c.cargos.filter(x => String(x.id) !== String(cargoId));
    save();
    renderCargosModal(c);
    toast('Cargo eliminado');
}

function saldarCuenta() {
    const c = clientes.find(c => String(c.id) === String(clienteActivoId));
    if (!c) return;
    if (!c.cargos.length) return alert('No hay cargos en la cuenta.');
    if (!confirm(`Marcar la cuenta de ${c.nombre} como pagada y limpiar los cargos?`)) return;
    c.cargos = [];
    save();
    renderCargosModal(c);
    renderClientes();
    toast('Cuenta saldada');
}

function eliminarCliente() {
    const c = clientes.find(c => String(c.id) === String(clienteActivoId));
    if (!c) return;
    if (!confirm(`Eliminar al cliente "${c.nombre}" y toda su cuenta?`)) return;
    clientes = clientes.filter(c => String(c.id) !== String(clienteActivoId));
    save();
    cerrarModalCliente();
    renderClientes();
    toast('Cliente eliminado');
}

function imprimirPDF() {
    const c = clientes.find(c => String(c.id) === String(clienteActivoId));
    if (!c) return;
    if (!c.cargos.length) return alert('No hay cargos para imprimir.');

    const total = c.cargos.reduce((a, x) => a + x.total, 0);
    const filas = c.cargos.map(x => `
        <tr>
            <td>${x.fecha}</td>
            <td>${x.productoNombre}${x.nota ? ' (' + x.nota + ')' : ''}</td>
            <td>${x.qty} ${x.unidad}</td>
            <td style="text-align:right;">$${x.total.toFixed(2)}</td>
        </tr>
    `).join('');

    const html = `<!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Cuenta - ${c.nombre}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
                h1 { font-size: 1.4rem; margin-bottom: 4px; }
                .sub { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th { background: #f0f0f0; padding: 10px 8px; text-align: left; font-size: 0.85rem; }
                td { padding: 9px 8px; border-bottom: 1px solid #e0e0e0; font-size: 0.9rem; }
                .total-row td { font-weight: bold; border-top: 2px solid #111; border-bottom: none; padding-top: 12px; }
                .footer { margin-top: 40px; font-size: 0.8rem; color: #999; }
            </style>
        </head>
        <body>
            <h1>Cuenta de: ${c.nombre}</h1>
            <div class="sub">${c.tel ? 'Tel: ' + c.tel + ' &nbsp;|&nbsp; ' : ''}Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th><th>Producto</th><th>Cantidad</th><th style="text-align:right;">Importe</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                    <tr class="total-row">
                        <td colspan="3">Total acumulado</td>
                        <td style="text-align:right;">$${total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="footer">RegistroVentas</div>
        </body>
        </html>`;

    const ventana = window.open('', '_blank');
    ventana.document.write(html);
    ventana.document.close();
    ventana.focus();
    ventana.print();
}