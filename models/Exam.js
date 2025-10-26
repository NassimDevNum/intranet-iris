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
    type: mongoose.Schema.Types.Mixed  // Peut être string ou array
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
    min: 1  // minimum 1 minute
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
    type: Date
  },
  dateFin: {
    type: Date
  },
  statut: {
    type: String,
    enum: ['brouillon', 'publie', 'termine'],
    default: 'brouillon'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);