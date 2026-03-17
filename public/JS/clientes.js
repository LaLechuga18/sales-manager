// ── Clientes ──────────────────────────────────────────────

let clienteActivoId = null;

async function cargarClientes() {
    const res = await fetch('/api/clientes');
    if (!res.ok) return;
    clientes = await res.json();
    renderClientes();
}

async function agregarCliente() {
    const nombre = document.getElementById('cli-nombre').value.trim();
    const tel    = document.getElementById('cli-tel').value.trim();
    if (!nombre) return alert('Escribe el nombre del cliente.');

    const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, tel })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error al agregar cliente.');

    document.getElementById('cli-nombre').value = '';
    document.getElementById('cli-tel').value    = '';
    await cargarClientes();
    toast('Cliente agregado');
}

function renderClientes() {
    const el = document.getElementById('lista-clientes');
    if (!clientes.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">👤</div>Sin clientes aun.</div>';
        return;
    }
    el.innerHTML = clientes.map(c => {
        const total = (c.cargos || []).reduce((a, x) => a + x.total, 0);
        return `
        <div class="prod-item" style="cursor:pointer;" onclick="abrirCliente('${c.id}')">
            <span class="prod-name">${c.nombre}${c.telefono ? ' · ' + c.telefono : ''}</span>
            <span class="prod-price" style="color:var(--red);">$${total.toFixed(2)}</span>
            <span style="font-size:0.75rem;color:var(--muted);">${(c.cargos || []).length} cargos</span>
        </div>`;
    }).join('');
}

async function abrirCliente(id) {
    const res = await fetch(`/api/clientes/${id}`);
    if (!res.ok) return;
    const c = await res.json();
    clienteActivoId = id;

    document.getElementById('modal-cli-nombre').textContent = c.nombre;

    // Verificar si ya tiene usuario asignado
    await verificarUsuarioCliente(id);

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

// Verifica si el cliente ya tiene usuario y muestra el estado en el modal
async function verificarUsuarioCliente(clienteId) {
    const seccion = document.getElementById('cli-acceso-seccion');
    const res = await fetch(`/api/auth/cliente-usuario/${clienteId}`);
    const data = await res.json();

    if (data.tiene_usuario) {
        seccion.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;">
                <span style="font-size:1rem;">✅</span>
                <div>
                    <div style="font-size:0.82rem;font-weight:600;color:var(--text);">Usuario: <span style="color:var(--accent);">${data.username}</span></div>
                    <div style="font-size:0.75rem;color:var(--muted);">Ya puede acceder a su cuenta</div>
                </div>
            </div>`;
    } else {
        seccion.innerHTML = `
            <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:12px;">
                <div style="font-size:0.78rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">
                    🔑 Crear acceso para este cliente
                </div>
                <input type="text" id="cli-new-username" placeholder="Usuario (ej: juanlopez)" style="margin-bottom:8px;" />
                <input type="password" id="cli-new-password" placeholder="Contraseña" style="margin-bottom:8px;" />
                <div id="cli-acceso-error" style="color:var(--red);font-size:0.78rem;margin-bottom:8px;display:none;"></div>
                <button class="btn btn-primary" style="background:var(--accent);font-size:0.85rem;padding:9px;" onclick="crearAccesoCliente()">
                    Crear acceso
                </button>
            </div>`;
    }
}

async function crearAccesoCliente() {
    const username = document.getElementById('cli-new-username').value.trim();
    const password = document.getElementById('cli-new-password').value;
    const errEl    = document.getElementById('cli-acceso-error');
    errEl.style.display = 'none';

    if (!username || !password) {
        errEl.textContent = 'Completa usuario y contraseña.';
        errEl.style.display = 'block';
        return;
    }
    if (password.length < 4) {
        errEl.textContent = 'La contraseña debe tener al menos 4 caracteres.';
        errEl.style.display = 'block';
        return;
    }

    const res = await fetch('/api/auth/usuarios/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteActivoId, username, password })
    });
    const data = await res.json();

    if (!res.ok) {
        errEl.textContent = data.error || 'Error al crear acceso.';
        errEl.style.display = 'block';
        return;
    }

    await verificarUsuarioCliente(clienteActivoId);
    toast('Acceso creado ✓');
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

async function registrarVentaCliente() {
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

    const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

    const res = await fetch(`/api/clientes/${clienteActivoId}/cargos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha, producto_nombre: prod.nombre, cantidad: qty, unidad, precio, total: precio * qty, nota })
    });
    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error al agregar cargo.');

    document.getElementById('cli-venta-producto').value = '';
    document.getElementById('cli-venta-cantidad').value = '';
    document.getElementById('cli-venta-kilos').value    = '';
    document.getElementById('cli-venta-precio').value   = '';
    document.getElementById('cli-venta-total').value    = '';
    document.getElementById('cli-venta-nota').value     = '';
    document.getElementById('cli-campo-pieza').style.display = 'block';
    document.getElementById('cli-campo-kilo').style.display  = 'none';

    await abrirCliente(clienteActivoId);
    await cargarClientes();
    toast('Cargo agregado a la cuenta');
}

function renderCargosModal(c) {
    const cargos = c.cargos || [];
    const total = cargos.reduce((a, x) => a + x.total, 0);
    document.getElementById('modal-cli-total').textContent = '$' + total.toFixed(2);

    const el = document.getElementById('modal-cli-ventas');
    if (!cargos.length) {
        el.innerHTML = '<div class="empty" style="padding:20px 0;">Sin cargos aun.</div>';
        return;
    }
    el.innerHTML = [...cargos].reverse().map(x => `
        <div class="venta-item">
            <div class="venta-info">
                <div class="venta-nombre">${x.producto_nombre}</div>
                <div class="venta-detalle">${x.cantidad} ${x.unidad} x $${x.precio.toFixed(2)} · ${x.fecha}${x.nota ? ' · ' + x.nota : ''}</div>
            </div>
            <div class="venta-actions">
                <span class="venta-total">$${x.total.toFixed(2)}</span>
                <button class="btn btn-danger" onclick="eliminarCargo('${x.id}')">X</button>
            </div>
        </div>
    `).join('');
}

async function eliminarCargo(cargoId) {
    if (!confirm('Eliminar este cargo?')) return;
    const res = await fetch(`/api/clientes/${clienteActivoId}/cargos/${cargoId}`, { method: 'DELETE' });
    if (!res.ok) return alert('Error al eliminar cargo.');
    await abrirCliente(clienteActivoId);
    await cargarClientes();
    toast('Cargo eliminado');
}

async function saldarCuenta() {
    const res = await fetch(`/api/clientes/${clienteActivoId}`);
    if (!res.ok) return alert('Error al cargar el cliente.');
    const c = await res.json();
    if (!(c.cargos || []).length) return alert('No hay cargos en la cuenta.');
    if (!confirm(`Marcar la cuenta de ${c.nombre} como pagada y limpiar los cargos?`)) return;

    const resDel = await fetch(`/api/clientes/${clienteActivoId}/cargos`, { method: 'DELETE' });
    if (!resDel.ok) return alert('Error al saldar cuenta.');

    await abrirCliente(clienteActivoId);
    await cargarClientes();
    toast('Cuenta saldada ✓');
}

async function eliminarCliente() {
    const res = await fetch(`/api/clientes/${clienteActivoId}`);
    if (!res.ok) return alert('Error al cargar el cliente.');
    const c = await res.json();
    if (!confirm(`Eliminar al cliente "${c.nombre}" y toda su cuenta?`)) return;

    const resDel = await fetch(`/api/clientes/${clienteActivoId}`, { method: 'DELETE' });
    if (!resDel.ok) return alert('Error al eliminar cliente.');

    cerrarModalCliente();
    await cargarClientes();
    toast('Cliente eliminado');
}

function imprimirPDF() {
    fetch(`/api/clientes/${clienteActivoId}`)
        .then(r => r.json())
        .then(c => {
            const cargos = c.cargos || [];
            if (!cargos.length) return alert('No hay cargos para imprimir.');
            const total = cargos.reduce((a, x) => a + x.total, 0);
            const filas = cargos.map(x => `
                <tr>
                    <td>${x.fecha}</td>
                    <td>${x.producto_nombre}${x.nota ? ' (' + x.nota + ')' : ''}</td>
                    <td>${x.cantidad} ${x.unidad}</td>
                    <td style="text-align:right;">$${x.total.toFixed(2)}</td>
                </tr>
            `).join('');
            const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cuenta - ${c.nombre}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
                    h1 { font-size: 1.4rem; margin-bottom: 4px; }
                    .sub { color: #666; font-size: 0.9rem; margin-bottom: 24px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background: #f0f0f0; padding: 10px 8px; text-align: left; font-size: 0.85rem; }
                    td { padding: 9px 8px; border-bottom: 1px solid #e0e0e0; font-size: 0.9rem; }
                    .total-row td { font-weight: bold; border-top: 2px solid #111; border-bottom: none; padding-top: 12px; }
                    .footer { margin-top: 40px; font-size: 0.8rem; color: #999; }
                </style></head><body>
                <h1>Cuenta de: ${c.nombre}</h1>
                <div class="sub">${c.telefono ? 'Tel: ' + c.telefono + ' &nbsp;|&nbsp; ' : ''}Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                <table><thead><tr><th>Fecha</th><th>Producto</th><th>Cantidad</th><th style="text-align:right;">Importe</th></tr></thead>
                <tbody>${filas}
                <tr class="total-row"><td colspan="3">Total acumulado</td><td style="text-align:right;">$${total.toFixed(2)}</td></tr>
                </tbody></table>
                <div class="footer">RegistroVentas</div></body></html>`;
            const ventana = window.open('', '_blank');
            ventana.document.write(html);
            ventana.document.close();
            ventana.focus();
            ventana.print();
        });
}