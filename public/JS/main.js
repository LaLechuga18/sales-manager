// ── Estado compartido ────────────────────────────────────
let productos = JSON.parse(localStorage.getItem('gs_productos') || '[]');
let ventas    = JSON.parse(localStorage.getItem('gs_ventas')    || '[]');
let clientes  = JSON.parse(localStorage.getItem('gs_clientes')  || '[]');

// ── Fecha actual ─────────────────────────────────────────
const hoy      = new Date();
const fechaStr = hoy.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
const fechaKey = hoy.toISOString().split('T')[0];
document.getElementById('header-date').textContent = fechaStr;
document.getElementById('res-fecha').textContent   = fechaStr;

function ventasHoy() {
    return ventas.filter(v => v.fecha === fechaKey);
}

// ── Guardar ──────────────────────────────────────────────
function save() {
    localStorage.setItem('gs_productos', JSON.stringify(productos));
    localStorage.setItem('gs_ventas',    JSON.stringify(ventas));
    localStorage.setItem('gs_clientes',  JSON.stringify(clientes));
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
    const idx = ['ventas', 'nueva-venta', 'productos', 'resumen', 'clientes'].indexOf(name);
    document.querySelectorAll('nav.tabs button')[idx].classList.add('active');
    if (name === 'ventas')      renderVentas();
    if (name === 'productos')   renderProductos();
    if (name === 'resumen')     renderResumen();
    if (name === 'nueva-venta') poblarSelectProductos();
    if (name === 'clientes')    renderClientes();
}

// ── Init ──────────────────────────────────────────────────
renderVentas();
renderProductos();
poblarSelectProductos();