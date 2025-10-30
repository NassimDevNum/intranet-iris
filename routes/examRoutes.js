const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');

// Créer un examen (enseignants uniquement)
router.post('/', protect, authorize('enseignant'), examController.createExam);

// Récupérer tous les examens (authentifié)
router.get('/', protect, examController.getAllExams);

// Récupérer un examen par ID (authentifié)
router.get('/:id', protect, examController.getExamById);

// Mettre à jour un examen (enseignants uniquement)
router.put('/:id', protect, authorize('enseignant'), examController.updateExam);

// Supprimer un examen (enseignants uniquement)
router.delete('/:id', protect, authorize('enseignant'), examController.deleteExam);

module.exports = router;