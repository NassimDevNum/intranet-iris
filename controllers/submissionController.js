const Submission = require('../models/Submission');
const Exam = require('../models/Exam');

// Créer une soumission (étudiant passe l'examen)
exports.createSubmission = async (req, res) => {
  try {
    const { examId, reponses, dateDebut, dateFin, note } = req.body;
    const etudiantId = req.user._id; // ID de l'étudiant connecté depuis le middleware auth

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

    // ✅ VÉRIFIER QUE L'ÉTUDIANT EST BIEN ASSIGNÉ À CET EXAMEN
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }

    const isAssigned = exam.etudiantsAssignes.some(
      id => id.toString() === etudiantId.toString()
    );

    if (!isAssigned) {
      return res.status(403).json({ 
        message: 'Vous n\'êtes pas autorisé à passer cet examen',
        notAssigned: true
      });
    }

    // Créer la soumission
    const submission = await Submission.create({
      examId,
      etudiantId,
      reponses,
      dateDebut,
      dateFin,
      note
    });

    // Peupler les données pour la réponse
    await submission.populate('examId etudiantId');

    res.status(201).json({
      message: 'Examen soumis avec succès',
      submission
    });

  } catch (error) {
    console.error('Erreur création soumission:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer toutes les soumissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate('examId', 'titre description duree questions')
      .populate('etudiantId', 'nom prenom email')
      .sort({ dateFin: -1 }); // Plus récentes en premier

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer une soumission par ID
exports.getSubmissionById = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('examId')
      .populate('etudiantId', 'nom prenom email');

    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les soumissions d'un étudiant spécifique
exports.getSubmissionsByStudent = async (req, res) => {
  try {
    const etudiantId = req.user._id;

    const submissions = await Submission.find({ etudiantId })
      .populate('examId', 'titre description duree')
      .sort({ dateFin: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer les soumissions pour un examen spécifique
exports.getSubmissionsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const submissions = await Submission.find({ examId })
      .populate('etudiantId', 'nom prenom email')
      .sort({ dateFin: -1 });

    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer une soumission (admin ou enseignant)
exports.deleteSubmission = async (req, res) => {
  try {
    const submission = await Submission.findByIdAndDelete(req.params.id);

    if (!submission) {
      return res.status(404).json({ message: 'Soumission non trouvée' });
    }

    res.status(200).json({ message: 'Soumission supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};