const mongoose = require('mongoose');

const reponseSchema = new mongoose.Schema({
  questionNumero: {
    type: Number,
    required: true
  },
  reponse: {
    type: mongoose.Schema.Types.Mixed  // Peut être string ou array
  }
});

const submissionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  etudiantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reponses: [reponseSchema],
  dateDebut: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date
  },
  statut: {
    type: String,
    enum: ['en_cours', 'soumis'],
    default: 'en_cours'
  },
  note: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);