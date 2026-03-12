const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');

/**
 * MIDDLEWARE D'AUTHENTIFICATION JWT (partagé entre services)
 * Pattern : Middleware Chain
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token manquant' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ============================================================
// GET /api/posts → Feed principal (tous les posts publics)
// ============================================================
router.get('/', async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: 'public' })
      .sort({ createdAt: -1 }) // Tri par date décroissante
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments({ visibility: 'public' });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/posts → Créer un post
// ============================================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, imageUrl, visibility, tags } = req.body;

    const post = new Post({
      userId: req.userId,
      content,
      imageUrl,
      visibility,
      tags
    });

    await post.save();

    res.status(201).json({
      message: 'Post créé avec succès',
      post
    });
  } catch (error) {
    console.error('Erreur création post:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/posts/:id → Récupérer un post par ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PUT /api/posts/:id → Modifier un post
// ============================================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    // Vérifier l'autorisation : seul l'auteur peut modifier
    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const { content, visibility, tags } = req.body;
    post.content = content || post.content;
    post.visibility = visibility || post.visibility;
    post.tags = tags || post.tags;
    await post.save();

    res.json({ message: 'Post modifié', post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// DELETE /api/posts/:id → Supprimer un post
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post non trouvé' });

    if (post.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post supprimé' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GET /api/posts/user/:userId → Posts d'un utilisateur
// ============================================================
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({
      userId: req.params.userId,
      visibility: 'public'
    }).sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/posts/:id/like → Liker un post
// ============================================================
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post non trouvé' });
    }

    // Incrémenter le compteur
    await post.incrementLikes();

    res.json({
      message: 'Post liké',
      likesCount: post.likesCount
    });

  } catch (error) {
    console.error('Erreur like post:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
