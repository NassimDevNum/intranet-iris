// Dans controllers/submissionController.js

exports.createSubmission = async (req, res) => {
  try {
    const { examId, reponses, dateDebut, dateFin, note } = req.body;
    const etudiantId = req.user._id; // ID de l'étudiant connecté

    // ✅ VÉRIFIER SI L'ÉTUDIANT A DÉJÀ SOUMIS CET EXAMEN
    const existingSubmission = await Submission.findOne({
      examId: examId,
      etudiantId: etudiantId
    });

    if (existingSubmission) {
      return res.status(400).json({ 
        message: 'Vous avez déjà passé cet examen. Vous ne pouvez pas le repasser.',
        alreadySubmitted: true
      });
    }

    // Continuer avec la création normale si pas de doublon
    const submission = await Submission.create({
      examId,
      etudiantId,
      reponses,
      dateDebut,
      dateFin,
      note
    });

    res.status(201).json({
      message: 'Examen soumis avec succès',
      submission
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};