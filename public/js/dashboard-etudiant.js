const API_URL = 'http://localhost:3000/api';
let currentExam = null;
let timerInterval = null;
let startTime = null;

// Vérifier l'authentification
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'etudiant') {
  window.location.href = 'index.html';
}

// Message de bienvenue
document.getElementById('welcomeMessage').textContent = 
  `Bienvenue, ${user.prenom} ${user.nom}`;

// Déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'index.html';
});

// Gestion des onglets
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'results') {
      loadResults();
    }
  });
});

// Charger les examens assignés
async function loadExams() {
  try {
    const response = await fetch(`${API_URL}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const allExams = await response.json();
    
    // Filtrer uniquement les examens assignés à cet étudiant
    const myExams = allExams.filter(exam => 
      exam.etudiantsAssignes.some(e => e._id === user.id)
    );
    
    const container = document.getElementById('examsList');
    
    if (myExams.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun examen assigné pour le moment</div>';
      return;
    }
    
    container.innerHTML = myExams.map(exam => `
      <div class="exam-card">
        <span class="exam-status disponible">Disponible</span>
        <h3>${exam.titre}</h3>
        <div class="exam-info">
          <p>${exam.description || 'Pas de description'}</p>
          <p>⏱️ Durée: ${exam.duree} minutes</p>
          <p>📝 ${exam.questions.length} questions</p>
          <p>👨‍🏫 Par: ${exam.createdBy.prenom} ${exam.createdBy.nom}</p>
        </div>
        <button class="btn-start-exam" onclick="startExam('${exam._id}')">
          ▶️ Commencer l'examen
        </button>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Erreur chargement examens:', error);
  }
}

// Démarrer un examen
async function startExam(examId) {
  try {
    const response = await fetch(`${API_URL}/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    currentExam = await response.json();
    startTime = Date.now();
    
    // Afficher le modal
    document.getElementById('examModal').classList.remove('hidden');
    document.getElementById('examTitle').textContent = currentExam.titre;
    
    // Générer les questions
    const questionsHTML = currentExam.questions.map((q, index) => {
      let answerHTML = '';
      
      if (q.type === 'qcm') {
        answerHTML = q.options.map((opt, i) => `
          <div class="answer-option">
            <input type="radio" id="q${index}_opt${i}" name="question_${index}" value="${opt}">
            <label for="q${index}_opt${i}">${opt}</label>
          </div>
        `).join('');
      } else if (q.type === 'vrai_faux') {
        answerHTML = `
          <div class="answer-option">
            <input type="radio" id="q${index}_vrai" name="question_${index}" value="Vrai">
            <label for="q${index}_vrai">Vrai</label>
          </div>
          <div class="answer-option">
            <input type="radio" id="q${index}_faux" name="question_${index}" value="Faux">
            <label for="q${index}_faux">Faux</label>
          </div>
        `;
      } else {
        answerHTML = `
          <textarea name="question_${index}" rows="4" placeholder="Votre réponse ici..." style="width: 100%;"></textarea>
        `;
      }
      
      return `
        <div class="question-box">
          <h3>Question ${q.numero}</h3>
          <p>${q.texte}</p>
          <span class="points">${q.points} point(s)</span>
          <div style="margin-top: 15px;">
            ${answerHTML}
          </div>
        </div>
      `;
    }).join('');
    
    document.getElementById('examQuestions').innerHTML = questionsHTML;
    
    // Démarrer le timer
    startTimer(currentExam.duree);
    
  } catch (error) {
    alert('❌ Erreur lors du chargement de l\'examen');
    console.error(error);
  }
}

// Timer
function startTimer(durationMinutes) {
  const endTime = Date.now() + (durationMinutes * 60 * 1000);
  
  timerInterval = setInterval(() => {
    const remaining = endTime - Date.now();
    
    if (remaining <= 0) {
      clearInterval(timerInterval);
      alert('⏰ Temps écoulé ! L\'examen est automatiquement soumis.');
      submitExam();
      return;
    }
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    document.getElementById('timeRemaining').textContent = 
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Alerte à 5 minutes
    if (remaining <= 5 * 60 * 1000 && remaining > 5 * 60 * 1000 - 1000) {
      alert('⚠️ Plus que 5 minutes !');
    }
  }, 1000);
}

// Soumettre l'examen
document.getElementById('submitExam').addEventListener('click', () => {
  if (confirm('Êtes-vous sûr de vouloir soumettre votre examen ?')) {
    submitExam();
  }
});

async function submitExam() {
  clearInterval(timerInterval);
  
  // Récupérer les réponses
  const reponses = [];
  currentExam.questions.forEach((q, index) => {
    let reponse = '';
    
    if (q.type === 'text') {
      reponse = document.querySelector(`[name="question_${index}"]`).value;
    } else {
      const selected = document.querySelector(`[name="question_${index}"]:checked`);
      reponse = selected ? selected.value : '';
    }
    
    reponses.push({
      questionNumero: q.numero,
      reponse: reponse
    });
  });
  
  // Calculer la note (correction automatique)
  let totalPoints = 0;
  let obtenuPoints = 0;
  
  currentExam.questions.forEach((q, index) => {
    totalPoints += q.points;
    
    const userAnswer = reponses[index].reponse.trim().toLowerCase();
    const correctAnswer = q.reponseCorrecte.trim().toLowerCase();
    
    if (userAnswer === correctAnswer) {
      obtenuPoints += q.points;
    }
  });
  
  const note = Math.round((obtenuPoints / totalPoints) * 100);
  
  // Sauvegarder la soumission
  try {
    const response = await fetch(`${API_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        examId: currentExam._id,
        etudiantId: user.id,
        reponses,
        note,
        statut: 'soumis',
        dateFin: new Date()
      })
    });
    
    if (response.ok) {
      alert(`✅ Examen soumis avec succès !\n\nVotre note: ${note}/100`);
      closeModal();
      loadExams();
    } else {
      throw new Error('Erreur lors de la soumission');
    }
    
  } catch (error) {
    alert('❌ Erreur: ' + error.message);
    console.error(error);
  }
}

// Annuler l'examen
document.getElementById('cancelExam').addEventListener('click', () => {
  if (confirm('Êtes-vous sûr de vouloir annuler ? Vos réponses seront perdues.')) {
    closeModal();
  }
});

function closeModal() {
  clearInterval(timerInterval);
  document.getElementById('examModal').classList.add('hidden');
  currentExam = null;
}

// Charger les résultats
async function loadResults() {
  try {
    const response = await fetch(`${API_URL}/submissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const allSubmissions = await response.json();
    
    // Filtrer les soumissions de l'étudiant
    const mySubmissions = allSubmissions.filter(s => s.etudiantId === user.id);
    
    const container = document.getElementById('resultsList');
    
    if (mySubmissions.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun résultat pour le moment</div>';
      return;
    }
    
    container.innerHTML = mySubmissions.map(sub => `
      <div class="result-card">
        <h3>${sub.examId.titre}</h3>
        <div class="result-score">${sub.note}/100</div>
        <div class="result-details">
          <p>📅 Passé le: ${new Date(sub.dateFin).toLocaleDateString('fr-FR')}</p>
          <p>📝 ${sub.reponses.length} questions répondues</p>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Erreur chargement résultats:', error);
  }
}

// Charger les examens au démarrage
loadExams();