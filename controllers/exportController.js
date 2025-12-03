const Exam = require('../models/Exam');
const Submission = require('../models/Submission');

/**
 * Exporter les résultats d'un examen en CSV
 */
exports.exportExamResultsCSV = async (req, res) => {
  try {
    const { examId } = req.params;

    // Récupérer l'examen
    const exam = await Exam.findById(examId)
      .populate('createdBy', 'nom prenom')
      .populate('etudiantsAssignes', 'nom prenom email');

    if (!exam) {
      return res.status(404).json({ message: 'Examen non trouvé' });
    }

    // Récupérer toutes les soumissions pour cet examen
    const submissions = await Submission.find({ examId })
      .populate('etudiantId', 'nom prenom email')
      .sort({ note: -1 }); // Tri par note décroissante

    // Créer le contenu CSV
    let csvContent = '';

    // En-tête du CSV
    csvContent += `Titre de l'examen,"${exam.titre}"\n`;
    csvContent += `Créé par,"${exam.createdBy.prenom} ${exam.createdBy.nom}"\n`;
    csvContent += `Date de création,${new Date(exam.createdBy).toLocaleDateString('fr-FR')}\n`;
    csvContent += `Date limite,${new Date(exam.dateFin).toLocaleString('fr-FR')}\n`;
    csvContent += `Nombre de questions,${exam.questions.length}\n`;
    csvContent += `Durée,${exam.duree} minutes\n`;
    csvContent += `\n`;

    // En-tête du tableau des résultats
    csvContent += `Nom,Prénom,Email,Note (/100),Statut,Date de soumission,Détails\n`;

    // Créer un Map des soumissions par étudiant
    const submissionMap = new Map();
    submissions.forEach(sub => {
      submissionMap.set(sub.etudiantId._id.toString(), sub);
    });

    // Parcourir tous les étudiants assignés
    exam.etudiantsAssignes.forEach(etudiant => {
      const submission = submissionMap.get(etudiant._id.toString());

      if (submission) {
        // L'étudiant a passé l'examen
        const statut = submission.statut === 'expire' ? 'Expiré (non passé)' : 'Soumis';
        const dateSubmission = new Date(submission.dateFin).toLocaleString('fr-FR');
        
        csvContent += `"${etudiant.nom}","${etudiant.prenom}","${etudiant.email}",${submission.note},"${statut}","${dateSubmission}","${submission.reponses.length} réponses"\n`;
      } else {
        // L'étudiant n'a pas encore passé l'examen
        csvContent += `"${etudiant.nom}","${etudiant.prenom}","${etudiant.email}",N/A,"Non passé","N/A","Aucune soumission"\n`;
      }
    });

    // Statistiques
    csvContent += `\n`;
    csvContent += `STATISTIQUES\n`;
    csvContent += `Étudiants assignés,${exam.etudiantsAssignes.length}\n`;
    csvContent += `Ont passé l'examen,${submissions.length}\n`;
    csvContent += `N'ont pas passé,${exam.etudiantsAssignes.length - submissions.length}\n`;

    if (submissions.length > 0) {
      const notes = submissions.map(s => s.note);
      const moyenne = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2);
      const noteMax = Math.max(...notes);
      const noteMin = Math.min(...notes);

      csvContent += `Note moyenne,${moyenne}\n`;
      csvContent += `Note maximale,${noteMax}\n`;
      csvContent += `Note minimale,${noteMin}\n`;
    }

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="resultats_${exam.titre.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv"`);

    // Ajouter le BOM UTF-8 pour Excel
    res.write('\ufeff');
    res.write(csvContent);
    res.end();

  } catch (error) {
    console.error('Erreur export CSV:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export', error: error.message });
  }
};

/**
 * Exporter tous les résultats de tous les examens d'un enseignant en CSV
 */
exports.exportAllResultsCSV = async (req, res) => {
  try {
    const enseignantId = req.user._id;

    // Récupérer tous les examens de l'enseignant
    const exams = await Exam.find({ createdBy: enseignantId })
      .populate('etudiantsAssignes', 'nom prenom email');

    if (exams.length === 0) {
      return res.status(404).json({ message: 'Aucun examen trouvé' });
    }

    // Récupérer toutes les soumissions
    const examIds = exams.map(e => e._id);
    const submissions = await Submission.find({ examId: { $in: examIds } })
      .populate('etudiantId', 'nom prenom email')
      .populate('examId', 'titre');

    // Créer le contenu CSV
    let csvContent = '';

    // En-tête
    csvContent += `EXPORT COMPLET DES RÉSULTATS\n`;
    csvContent += `Date d'export,${new Date().toLocaleString('fr-FR')}\n`;
    csvContent += `Nombre d'examens,${exams.length}\n`;
    csvContent += `\n`;

    // En-tête du tableau
    csvContent += `Examen,Étudiant Nom,Étudiant Prénom,Email,Note (/100),Statut,Date de soumission\n`;

    // Données
    submissions.forEach(sub => {
      const statut = sub.statut === 'expire' ? 'Expiré' : 'Soumis';
      csvContent += `"${sub.examId.titre}","${sub.etudiantId.nom}","${sub.etudiantId.prenom}","${sub.etudiantId.email}",${sub.note},"${statut}","${new Date(sub.dateFin).toLocaleString('fr-FR')}"\n`;
    });

    // Statistiques globales
    csvContent += `\n`;
    csvContent += `STATISTIQUES GLOBALES\n`;
    csvContent += `Total de soumissions,${submissions.length}\n`;

    if (submissions.length > 0) {
      const moyenne = (submissions.reduce((sum, s) => sum + s.note, 0) / submissions.length).toFixed(2);
      csvContent += `Note moyenne générale,${moyenne}\n`;
    }

    // Headers pour le téléchargement
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tous_les_resultats_${Date.now()}.csv"`);

    res.write('\ufeff');
    res.write(csvContent);
    res.end();

  } catch (error) {
    console.error('Erreur export CSV complet:', error);
    res.status(500).json({ message: 'Erreur lors de l\'export', error: error.message });
  }
};