const Exam = require('../models/Exam');
const User = require('../models/User');

// Créer un examen (enseignant uniquement)
exports.createExam = async (req, res) => {
  try {
    const { titre, description, duree, questions, etudiantsAssignes, dateDebut, dateFin } = req.body;
    const { userId } = req.body;  // On récupère l'ID de l'enseignant (à améliorer avec un middleware plus tard)

    const exam = await Exam.create({
      titre,
      description,
      duree,
      questions,
      etudiantsAssignes,
      dateDebut,
      dateFin,
      createdBy: userId,
      statut: 'brouillon'
    });

    res.status(201).json({
      message: 'Examen créé avec succès',
      exam
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer tous les examens
exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find()
      .populate('createdBy', 'nom prenom email')  // Récupère les infos de l'enseignant
      .populate('etudiantsAssignes', 'nom prenom email');  // Récupère les infos des étudiants

    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer un examen par ID
exports.getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'nom prenom email')
      .populate('etudiantsAssignes', 'nom prenom email');

    if (!exam) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }

    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Mettre à jour un examen
exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!exam) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }

    res.status(200).json({
      message: 'Examen mis à jour',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Supprimer un examen
exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }

    res.status(200).json({ message: 'Examen supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Créer un examen (enseignant uniquement)
exports.createExam = async (req, res) => {
  try {
    const { titre, description, duree, questions, etudiantsAssignes, dateDebut, dateFin } = req.body;

    const exam = await Exam.create({
      titre,
      description,
      duree,
      questions,
      etudiantsAssignes,
      dateDebut,
      dateFin,
      createdBy: req.user._id,  // On récupère l'ID depuis req.user
      statut: 'brouillon'
    });

    res.status(201).json({
      message: 'Examen créé avec succès',
      exam
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};