const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect, authorize } = require('../middleware/auth');

// Exporter les résultats d'un examen spécifique en CSV (enseignants uniquement)
router.get('/exam/:examId/csv', protect, authorize('enseignant'), exportController.exportExamResultsCSV);

// Exporter tous les résultats en CSV (enseignants uniquement)
router.get('/all/csv', protect, authorize('enseignant'), exportController.exportAllResultsCSV);

module.exports = router;