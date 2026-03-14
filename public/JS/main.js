// ── Estado compartido ────────────────────────────────────
let productos = [];
let ventas    = [];
let clientes  = [];

// ── Fecha actual ─────────────────────────────────────────
const hoy      = new Date();
const fechaStr = hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaKey = hoy.toISOString().split('T')[0];
document.getElementById('header-date').textContent = fechaStr;
document.getElementById('res-fecha').textContent   = fechaStr;

function ventasHoy() {
    return ventas.filter(v => v.fecha === fechaKey);
}

// ── Toast ─────────────────────────────────────────────────
function toast(msg = 'Guardado') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2200);
}

// ── Tabs ──────────────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    const idx = ['ventas', 'nueva-venta', 'productos', 'resumen', 'clientes', 'usuarios'].indexOf(name);
    document.querySelectorAll('nav.tabs button')[idx].classList.add('active');
    if (name === 'ventas')      renderVentas();
    if (name === 'productos')   renderProductos();
    if (name === 'resumen')     renderResumen();
    if (name === 'nueva-venta') poblarSelectProductos();
    if (name === 'clientes')    renderClientes();
	if (name === 'usuarios') renderPendientes();
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
}


window.addEventListener('load', () => {
    renderVentas();
    renderProductos();
    poblarSelectProductos();
    renderClientes();
});
