const Exam = require('../models/Exam');
const Submission = require('../models/Submission');

/**
 * Vérifie tous les examens expirés et crée des soumissions avec note 0
 * pour les étudiants qui n'ont pas passé l'examen
 */
async function checkExpiredExams() {
  try {
    const now = new Date();
    
    // Trouver tous les examens publiés dont la date limite est dépassée
    const expiredExams = await Exam.find({
      statut: 'publie',
      dateFin: { $lt: now }
    }).populate('etudiantsAssignes');

    console.log(`🔍 Vérification des examens expirés... ${expiredExams.length} trouvé(s)`);

    for (const exam of expiredExams) {
      // Récupérer toutes les soumissions pour cet examen
      const submissions = await Submission.find({ examId: exam._id });
      const submittedStudentIds = submissions.map(s => s.etudiantId.toString());

      // Trouver les étudiants qui n'ont PAS soumis
      const missingStudents = exam.etudiantsAssignes.filter(
        student => !submittedStudentIds.includes(student._id.toString())
      );

      // Créer des soumissions avec note 0 pour les étudiants manquants
      for (const student of missingStudents) {
        const zeroSubmission = await Submission.create({
          examId: exam._id,
          etudiantId: student._id,
          reponses: exam.questions.map(q => ({
            questionNumero: q.numero,
            reponse: ''
          })),
          note: 0,
          dateDebut: exam.dateFin,
          dateFin: exam.dateFin,
          statut: 'expire'
        });

        console.log(`❌ Note 0 attribuée à ${student.prenom} ${student.nom} pour "${exam.titre}"`);
      }

      // Marquer l'examen comme expiré
      exam.statut = 'expire';
      await exam.save();
      
      console.log(`⏰ Examen "${exam.titre}" marqué comme expiré`);
    }

    return {
      success: true,
      expiredExams: expiredExams.length
    };

  } catch (error) {
    console.error('❌ Erreur lors de la vérification des examens expirés:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Démarrer la vérification automatique toutes les heures
 */
function startAutoCheck() {
  // Vérification immédiate au démarrage
  checkExpiredExams();

  // Puis toutes les heures
  setInterval(() => {
    console.log('⏰ Vérification automatique des examens expirés...');
    checkExpiredExams();
  }, 60 * 60 * 1000); // 1 heure

  console.log('✅ Vérification automatique des examens expirés activée (toutes les heures)');
}

module.exports = {
  checkExpiredExams,
  startAutoCheck
};