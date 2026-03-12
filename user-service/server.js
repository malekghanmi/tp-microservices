// Importation des modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

// Initialisation de l'application Express
const app = express();

/**
 * MIDDLEWARES
 * Fonctions qui s'exécutent avant les routes
 */

// 1. CORS : Autoriser les requêtes cross-origin
app.use(cors());

// 2. Parser JSON : Convertit le body en objet JavaScript
app.use(express.json());

// 3. Logger simple (optionnel)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // Passe au middleware suivant
});

/**
 * CONNEXION MONGODB
 */
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ User Service: MongoDB connecté');
})
.catch(err => {
  console.error('❌ Erreur connexion MongoDB:', err);
  process.exit(1); // Arrête le processus en cas d'erreur
});

/**
 * ROUTES
 */

// Route de santé (pour vérifier que le service fonctionne)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'user-service',
    timestamp: new Date()
  });
});

// Routes utilisateurs
app.use('/api/users', require('./routes/users'));

/**
 * GESTION DES ERREURS
 * Middleware pour attraper toutes les erreurs
 */
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({
    error: 'Erreur serveur interne'
  });
});

/**
 * DÉMARRAGE DU SERVEUR
 */
const PORT = process.env.USER_SERVICE_PORT || 3001;
app.listen(PORT, () => {
  console.log(`👤 User Service démarré sur le port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});
