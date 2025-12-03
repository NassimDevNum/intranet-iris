const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  numero: {
    type: Number,
    required: true
  },
  texte: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['qcm', 'text', 'vrai_faux'],
    required: true
  },
  points: {
    type: Number,
    required: true,
    default: 1
  },
  options: [{
    type: String
  }],
  reponseCorrecte: {
    type: mongoose.Schema.Types.Mixed
  }
});

const examSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: [true, 'Titre requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  duree: {
    type: Number,
    required: [true, 'Durée requise'],
    min: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  etudiantsAssignes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dateDebut: {
    type: Date,
    default: Date.now // Date de création/publication
  },
  dateFin: {
    type: Date,
    // Par défaut : 48h après la création
    default: function() {
      return new Date(Date.now() + 48 * 60 * 60 * 1000);
    }
  },
  statut: {
    type: String,
    enum: ['brouillon', 'publie', 'termine', 'expire'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

// Méthode pour vérifier si l'examen est expiré
examSchema.methods.isExpired = function() {
  return new Date() > this.dateFin;
};

// Méthode pour vérifier si l'examen est disponible
examSchema.methods.isAvailable = function() {
  const now = new Date();
  return now >= this.dateDebut && now <= this.dateFin && this.statut === 'publie';
};

module.exports = mongoose.model('Exam', examSchema);