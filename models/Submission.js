const mongoose = require('mongoose');

const reponseSchema = new mongoose.Schema({
  questionNumero: {
    type: Number,
    required: true
  },
  reponse: {
    type: mongoose.Schema.Types.Mixed
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
  note: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  dateDebut: {
    type: Date,
    default: Date.now
  },
  dateFin: {
    type: Date,
    default: Date.now
  },
  statut: {
    type: String,
    enum: ['soumis', 'expire'],
    default: 'soumis'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);