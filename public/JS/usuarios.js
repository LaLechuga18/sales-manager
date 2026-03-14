// ── Usuarios ──────────────────────────────────────────────

async function renderPendientes() {
    const res = await fetch('/api/auth/pendientes');
    const pendientes = await res.json();

    const el = document.getElementById('lista-pendientes');
    if (!pendientes.length) {
        el.innerHTML = '<div class="empty"><div class="empty-icon">👥</div>Sin usuarios pendientes.</div>';
        return;
    }
    el.innerHTML = pendientes.map(u => `
        <div class="prod-item">
            <span class="prod-name">${u.username}</span>
            <button class="btn-edit" onclick="aprobarUsuario('${u.id}')">✅ Aprobar</button>
            <button class="btn btn-danger" onclick="rechazarUsuario('${u.id}')">✕</button>
        </div>
    `).join('');
}

async function aprobarUsuario(id) {
    await fetch(`/api/auth/usuarios/${id}/aprobar`, { method: 'PUT' });
    await renderPendientes();
    toast('Usuario aprobado');
}

async function rechazarUsuario(id) {
    if (!confirm('Rechazar y eliminar este usuario?')) return;
    await fetch(`/api/auth/usuarios/${id}`, { method: 'DELETE' });
    await renderPendientes();
    toast('Usuario rechazado');
}
