const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const { protect } = require('../middleware/auth');

// Créer une soumission
router.post('/', protect, async (req, res) => {
  try {
    const submission = await Submission.create(req.body);
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Récupérer toutes les soumissions
router.get('/', protect, async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('examId', 'titre')
      .populate('etudiantId', 'nom prenom');
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;