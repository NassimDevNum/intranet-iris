const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { protect, authorize } = require('../middleware/auth');

// Créer une soumission (étudiants uniquement)
router.post('/', protect, authorize('etudiant'), submissionController.createSubmission);

// Récupérer toutes les soumissions (authentifié)
router.get('/', protect, submissionController.getAllSubmissions);

// Récupérer les soumissions d'un étudiant (l'étudiant lui-même)
router.get('/student/me', protect, authorize('etudiant'), submissionController.getSubmissionsByStudent);

// Récupérer les soumissions pour un examen spécifique
router.get('/exam/:examId', protect, submissionController.getSubmissionsByExam);

// Récupérer une soumission par ID (authentifié)
router.get('/:id', protect, submissionController.getSubmissionById);

// Supprimer une soumission (enseignants uniquement)
router.delete('/:id', protect, authorize('enseignant'), submissionController.deleteSubmission);

module.exports = router;