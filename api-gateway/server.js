/**
 * API GATEWAY
 * 
 * DESIGN PATTERNS UTILISÉS :
 * 1. Gateway Pattern     → Point d'entrée unique pour tous les services
 * 2. Proxy Pattern       → Redirige les requêtes vers les bons services
 * 3. Middleware Chain    → helmet → cors → rate-limit → auth → proxy
 * 4. Façade Pattern      → Cache la complexité des microservices au client
 */

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const app = express();

// ============================================================
// COUCHE 1 : SÉCURITÉ - Helmet (headers HTTP sécurisés)
// ============================================================
app.use(helmet());

// ============================================================
// COUCHE 2 : CORS
// ============================================================
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================================
// COUCHE 3 : RATE LIMITING (protection contre les abus)
// ============================================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                   // 100 requêtes max par fenêtre
  message: { error: 'Trop de requêtes, réessayez dans 15 minutes' }
});
app.use(limiter);

// ============================================================
// COUCHE 4 : MIDDLEWARE JWT (authentification centralisée)
// Routes publiques exemptées : /api/users/register et /api/users/login
// ============================================================
const publicRoutes = [
  { path: '/api/users/register', method: 'POST' },
  { path: '/api/users/login', method: 'POST' },
  { path: '/health', method: 'GET' }
];

const authMiddleware = (req, res, next) => {
  // Vérifier si la route est publique
  const isPublic = publicRoutes.some(route =>
    req.path === route.path && req.method === route.method
  );

  if (isPublic) return next();

  // Vérifier le token JWT
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Authentification requise' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.headers['x-user-id'] = decoded.userId; // Passer l'ID au service cible
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

app.use(authMiddleware);

// ============================================================
// COUCHE 5 : PROXY ROUTING
// Redirige chaque route vers le bon microservice
// ============================================================

// Proxy vers le service User (port 3001)
const userServiceURL = `http://localhost:${process.env.USER_SERVICE_PORT || 3001}`;
app.use('/api/users', createProxyMiddleware({
  target: userServiceURL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('User Service indisponible:', err.message);
      res.status(503).json({ error: 'User Service indisponible' });
    }
  }
}));

// Proxy vers le service Post (port 3002)
const postServiceURL = `http://localhost:${process.env.POST_SERVICE_PORT || 3002}`;
app.use('/api/posts', createProxyMiddleware({
  target: postServiceURL,
  changeOrigin: true,
  on: {
    error: (err, req, res) => {
      console.error('Post Service indisponible:', err.message);
      res.status(503).json({ error: 'Post Service indisponible' });
    }
  }
}));

// ============================================================
// ROUTE DE SANTÉ DU GATEWAY
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date(),
    services: {
      users: userServiceURL,
      posts: postServiceURL
    }
  });
});

// ============================================================
// DÉMARRAGE
// ============================================================
const PORT = process.env.API_GATEWAY_PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔀 API Gateway démarré sur le port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log('\n📡 Services proxifiés:');
  console.log(`  - User Service: http://localhost:${process.env.USER_SERVICE_PORT || 3001}`);
  console.log(`  - Post Service: http://localhost:${process.env.POST_SERVICE_PORT || 3002}`);
});
