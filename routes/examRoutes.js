const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');

// Créer un examen
router.post('/', examController.createExam);

// Récupérer tous les examens
router.get('/', examController.getAllExams);

// Récupérer un examen par ID
router.get('/:id', examController.getExamById);

// Mettre à jour un examen
router.put('/:id', examController.updateExam);

// Supprimer un examen
router.delete('/:id', examController.deleteExam);

module.exports = router;