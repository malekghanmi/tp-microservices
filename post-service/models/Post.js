const mongoose = require('mongoose');

/**
 * SCHÉMA POST
 * Design Pattern : Document Model (MongoDB/Mongoose)
 * Dénormalisation intentionnelle pour la performance
 */
const postSchema = new mongoose.Schema({
  // Référence vers l'utilisateur auteur (cross-service)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'L\'auteur est requis'],
    ref: 'User' // Référence au modèle User (même si dans une autre BD)
  },

  // Contenu du post
  content: {
    type: String,
    required: [true, 'Le contenu est requis'],
    maxlength: [2000, 'Maximum 2000 caractères']
  },

  // Image optionnelle (URL)
  imageUrl: { type: String, default: null },

  // Visibilité du post
  visibility: {
    type: String,
    enum: ['public', 'friends', 'private'], // Valeurs limitées
    default: 'public'
  },

  // Dénormalisation : stocker le compteur pour éviter de compter à chaque fois
  likesCount: { type: Number, default: 0 },

  // Tags pour la recherche
  tags: [{ type: String, trim: true }],

  // Commentaires (référence vers comment-service)
  commentsCount: { type: Number, default: 0 }

}, {
  timestamps: true
});

// INDEX pour accélérer les requêtes fréquentes
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ tags: 1 });

/**
 * MÉTHODE D'INSTANCE : Incrémenter les likes
 * Pattern : Active Record
 */
postSchema.methods.incrementLikes = function() {
  this.likesCount += 1;
  return this.save();
};

/**
 * MÉTHODE D'INSTANCE : Décrémenter les likes
 */
postSchema.methods.decrementLikes = function() {
  if (this.likesCount > 0) {
    this.likesCount -= 1;
  }
  return this.save();
};

module.exports = mongoose.model('Post', postSchema);
