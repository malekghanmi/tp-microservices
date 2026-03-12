const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * MIDDLEWARE D'AUTHENTIFICATION JWT
 * Design Pattern : Middleware Chain (chaîne de responsabilité)
 * Vérifie le token JWT avant d'accéder aux routes protégées
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token manquant' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ============================================================
// POST /api/users/register → Inscription
// ============================================================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email ou username déjà utilisé' });
    }

    // Créer l'utilisateur (le hook pre-save hashera le mot de passe)
    const user = new User({ username, email, password });
    await user.save();

    // Générer un token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Inscription réussie',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/users/login → Connexion
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Chercher l'utilisateur par email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Comparer les mots de passe
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/users/profile → Profil de l'utilisateur connecté
// ============================================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/users/:id → Profil public d'un utilisateur
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username avatar')
      .populate('following', 'username avatar');

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// GET /api/users → Liste tous les utilisateurs
// ============================================================
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// POST /api/users/:id/follow → Suivre un utilisateur
// ============================================================
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!targetUser) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    if (req.params.id === req.userId) return res.status(400).json({ error: 'Vous ne pouvez pas vous suivre vous-même' });

    if (!currentUser.following.includes(req.params.id)) {
      currentUser.following.push(req.params.id);
      targetUser.followers.push(req.userId);
      await currentUser.save();
      await targetUser.save();
    }

    res.json({ message: `Vous suivez maintenant ${targetUser.username}` });
  } catch (error) {
    console.error('Erreur follow:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================
// DELETE /api/users/:id/unfollow → Ne plus suivre
// ============================================================
router.delete('/:id/unfollow', authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.id);

    currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.userId);

    await currentUser.save();
    await targetUser.save();

    res.json({ message: 'Vous ne suivez plus cet utilisateur' });
  } catch (error) {
    console.error('Erreur unfollow:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
