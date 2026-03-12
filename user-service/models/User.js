const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * DESIGN PATTERN : Repository Pattern + Active Record
 * Le modèle encapsule à la fois la structure des données
 * et les méthodes métier (hashage mot de passe, etc.)
 */
const userSchema = new mongoose.Schema({
  // Nom d'utilisateur unique
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Au moins 3 caractères'],
    maxlength: [30, 'Maximum 30 caractères']
  },

  // Email unique
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },

  // Mot de passe hashé (jamais en clair)
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Au moins 6 caractères']
  },

  // Informations de profil
  bio: { type: String, maxlength: 160, default: '' },
  avatar: { type: String, default: '' },

  // Liste des abonnés (référence vers d'autres Users)
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Liste des abonnements
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Date de création automatique
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

/**
 * MIDDLEWARE PRE-SAVE (Hook Mongoose)
 * Pattern : Intercepteur / Observer
 * Hash le mot de passe avant chaque sauvegarde
 */
userSchema.pre('save', async function(next) {
  // Ne re-hashe que si le mot de passe a changé
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * MÉTHODE D'INSTANCE
 * Compare un mot de passe en clair avec le hash stocké
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * MÉTHODE VIRTUELLE
 * Calcule le nombre d'abonnés sans le stocker en BD
 */
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

/**
 * MÉTHODE D'INSTANCE
 * Retourne un objet utilisateur sans le mot de passe
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password; // Ne jamais retourner le mot de passe
  return user;
};

module.exports = mongoose.model('User', userSchema);
