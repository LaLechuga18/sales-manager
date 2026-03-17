const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(session({
    secret: 'gallostore_secreto_123',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}));

// Middleware de autenticación
function requireAuth(req, res, next) {
    if (!req.session.usuario) return res.status(401).json({ error: 'No autenticado.' });
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado.' });
    }
    next();
}

// Rutas públicas
app.use('/api/auth', require('./routes/auth'));

// Rutas protegidas
app.use('/api/productos', requireAuth, require('./routes/productos'));
app.use('/api/ventas',    requireAuth, require('./routes/ventas'));
app.use('/api/clientes',  requireAuth, require('./routes/clientes'));

// Servir login como página principal
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'HTML', 'login.html'));
});

// Proteger el frontend — redirigir a login si no está autenticado
app.get('/', (req, res) => {
    if (!req.session.usuario) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'HTML', 'index.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});