const API_URL = 'http://localhost:3000/api';
let questionCount = 0;
let editMode = false;
let currentExamId = null;

// Vérifier l'authentification
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token || user.role !== 'enseignant') {
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
    
    // Activer l'onglet
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Afficher le contenu
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Charger le contenu approprié
    if (tabName === 'list') {
      loadExams();
    } else if (tabName === 'results') {
      loadExamResults();
    } else if (tabName === 'create') {
      // Réinitialiser le formulaire si on revient à l'onglet création
      if (editMode) {
        resetCreateForm();
      }
    }
  });
});

// Ajouter une question
document.getElementById('addQuestionBtn').addEventListener('click', () => {
  questionCount++;
  const container = document.getElementById('questionsContainer');
  
  const questionHTML = `
    <div class="question-item" data-question="${questionCount}">
      <div class="question-header">
        <h4>Question ${questionCount}</h4>
        <button type="button" class="remove-question" onclick="removeQuestion(${questionCount})">
          ❌ Supprimer
        </button>
      </div>
      
      <div class="form-group">
        <label>Texte de la question *</label>
        <textarea name="question_${questionCount}_texte" required rows="2"></textarea>
      </div>
      
      <div class="form-group">
        <label>Type de question *</label>
        <select name="question_${questionCount}_type" onchange="handleQuestionTypeChange(${questionCount})" required>
          <option value="">Choisir un type</option>
          <option value="qcm">QCM (Choix multiples)</option>
          <option value="text">Texte libre</option>
          <option value="vrai_faux">Vrai/Faux</option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Points *</label>
        <input type="number" name="question_${questionCount}_points" min="1" value="1" required>
      </div>
      
      <div id="options_${questionCount}" class="options-container hidden">
        <label>Options de réponse</label>
        <div id="optionsList_${questionCount}"></div>
        <button type="button" class="btn btn-secondary" onclick="addOption(${questionCount})" style="width: auto; padding: 8px 15px; margin-top: 10px;">
          ➕ Ajouter une option
        </button>
      </div>
      
      <div class="form-group">
        <label>Réponse correcte *</label>
        <input type="text" name="question_${questionCount}_reponse" required placeholder="Entrez la réponse correcte">
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', questionHTML);
});

// Supprimer une question
function removeQuestion(id) {
  const question = document.querySelector(`[data-question="${id}"]`);
  question.remove();
}

// Gérer le changement de type de question
function handleQuestionTypeChange(questionId) {
  const select = document.querySelector(`[name="question_${questionId}_type"]`);
  const optionsContainer = document.getElementById(`options_${questionId}`);
  
  if (select.value === 'qcm' || select.value === 'vrai_faux') {
    optionsContainer.classList.remove('hidden');
    
    // Ajouter options par défaut pour vrai/faux
    if (select.value === 'vrai_faux') {
      const optionsList = document.getElementById(`optionsList_${questionId}`);
      optionsList.innerHTML = `
        <div class="option-item">
          <input type="text" value="Vrai" readonly name="question_${questionId}_option">
        </div>
        <div class="option-item">
          <input type="text" value="Faux" readonly name="question_${questionId}_option">
        </div>
      `;
    }
  } else {
    optionsContainer.classList.add('hidden');
  }
}

// Ajouter une option
function addOption(questionId) {
  const optionsList = document.getElementById(`optionsList_${questionId}`);
  const optionHTML = `
    <div class="option-item">
      <input type="text" name="question_${questionId}_option" placeholder="Option" required>
      <button type="button" onclick="this.parentElement.remove()">❌</button>
    </div>
  `;
  optionsList.insertAdjacentHTML('beforeend', optionHTML);
}

// Charger les étudiants
async function loadStudents() {
  try {
    const response = await fetch(`${API_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const users = await response.json();
    const etudiants = users.filter(u => u.role === 'etudiant');
    
    const select = document.getElementById('etudiants');
    select.innerHTML = etudiants.map(e => 
      `<option value="${e._id}">${e.prenom} ${e.nom} (${e.email})</option>`
    ).join('');
    
  } catch (error) {
    console.error('Erreur chargement étudiants:', error);
  }
}

// Réinitialiser le formulaire de création
function resetCreateForm() {
  editMode = false;
  currentExamId = null;
  document.getElementById('createExamForm').reset();
  document.getElementById('questionsContainer').innerHTML = '';
  questionCount = 0;
  
  // Changer le titre et le bouton
  document.querySelector('#createTab h2').textContent = '📝 Créer un nouvel examen';
  document.querySelector('#createExamForm button[type="submit"]').textContent = '✅ Créer l\'examen';
}

// Charger un examen pour édition
async function editExam(examId) {
  try {
    // Récupérer l'examen
    const response = await fetch(`${API_URL}/exams/${examId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const exam = await response.json();
    
    // Passer en mode édition
    editMode = true;
    currentExamId = examId;
    
    // Changer vers l'onglet création
    document.querySelector('[data-tab="create"]').click();
    
    // Changer le titre et le bouton
    document.querySelector('#createTab h2').textContent = '✏️ Modifier l\'examen';
    document.querySelector('#createExamForm button[type="submit"]').textContent = '💾 Enregistrer les modifications';
    
    // Remplir les champs de base
    document.getElementById('titre').value = exam.titre;
    document.getElementById('description').value = exam.description || '';
    document.getElementById('duree').value = exam.duree;
    
    // Charger les questions
    document.getElementById('questionsContainer').innerHTML = '';
    questionCount = 0;
    
    exam.questions.forEach((question, index) => {
      questionCount++;
      const container = document.getElementById('questionsContainer');
      
      const questionHTML = `
        <div class="question-item" data-question="${questionCount}">
          <div class="question-header">
            <h4>Question ${questionCount}</h4>
            <button type="button" class="remove-question" onclick="removeQuestion(${questionCount})">
              ❌ Supprimer
            </button>
          </div>
          
          <div class="form-group">
            <label>Texte de la question *</label>
            <textarea name="question_${questionCount}_texte" required rows="2">${question.texte}</textarea>
          </div>
          
          <div class="form-group">
            <label>Type de question *</label>
            <select name="question_${questionCount}_type" onchange="handleQuestionTypeChange(${questionCount})" required>
              <option value="">Choisir un type</option>
              <option value="qcm" ${question.type === 'qcm' ? 'selected' : ''}>QCM (Choix multiples)</option>
              <option value="text" ${question.type === 'text' ? 'selected' : ''}>Texte libre</option>
              <option value="vrai_faux" ${question.type === 'vrai_faux' ? 'selected' : ''}>Vrai/Faux</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Points *</label>
            <input type="number" name="question_${questionCount}_points" min="1" value="${question.points}" required>
          </div>
          
          <div id="options_${questionCount}" class="options-container ${question.options && question.options.length > 0 ? '' : 'hidden'}">
            <label>Options de réponse</label>
            <div id="optionsList_${questionCount}">
              ${question.options ? question.options.map(opt => `
                <div class="option-item">
                  <input type="text" name="question_${questionCount}_option" value="${opt}" ${question.type === 'vrai_faux' ? 'readonly' : ''}>
                  ${question.type !== 'vrai_faux' ? '<button type="button" onclick="this.parentElement.remove()">❌</button>' : ''}
                </div>
              `).join('') : ''}
            </div>
            <button type="button" class="btn btn-secondary" onclick="addOption(${questionCount})" style="width: auto; padding: 8px 15px; margin-top: 10px;">
              ➕ Ajouter une option
            </button>
          </div>
          
          <div class="form-group">
            <label>Réponse correcte *</label>
            <input type="text" name="question_${questionCount}_reponse" required value="${question.reponseCorrecte}">
          </div>
        </div>
      `;
      
      container.insertAdjacentHTML('beforeend', questionHTML);
    });
    
    // Sélectionner les étudiants assignés
    const select = document.getElementById('etudiants');
    Array.from(select.options).forEach(option => {
      option.selected = exam.etudiantsAssignes.some(e => e._id === option.value);
    });
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Erreur chargement examen:', error);
    alert('❌ Erreur lors du chargement de l\'examen');
  }
}

// Créer ou mettre à jour un examen
document.getElementById('createExamForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  
  // Construire les questions
  const questions = [];
  for (let i = 1; i <= questionCount; i++) {
    const texte = formData.get(`question_${i}_texte`);
    if (!texte) continue;
    
    const type = formData.get(`question_${i}_type`);
    const points = parseInt(formData.get(`question_${i}_points`));
    const reponse = formData.get(`question_${i}_reponse`);
    
    // Récupérer les options si QCM
    const options = [];
    formData.getAll(`question_${i}_option`).forEach(opt => {
      if (opt) options.push(opt);
    });
    
    questions.push({
      numero: i,
      texte,
      type,
      points,
      options: options.length > 0 ? options : undefined,
      reponseCorrecte: reponse
    });
  }
  
  // Récupérer les étudiants sélectionnés
  const select = document.getElementById('etudiants');
  const etudiantsAssignes = Array.from(select.selectedOptions).map(opt => opt.value);
  
  const examData = {
    titre: formData.get('titre'),
    description: formData.get('description'),
    duree: parseInt(formData.get('duree')),
    questions,
    etudiantsAssignes
  };
  
  try {
    const url = editMode ? `${API_URL}/exams/${currentExamId}` : `${API_URL}/exams`;
    const method = editMode ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examData)
    });
    
    if (!response.ok) throw new Error('Erreur lors de l\'enregistrement');
    
    alert(editMode ? '✅ Examen modifié avec succès !' : '✅ Examen créé avec succès !');
    
    // Réinitialiser le formulaire
    resetCreateForm();
    
    // Recharger la liste des examens
    loadExams();
    
    // Revenir à l'onglet liste
    document.querySelector('[data-tab="list"]').click();
    
  } catch (error) {
    alert('❌ Erreur: ' + error.message);
  }
});

// Charger les examens
async function loadExams() {
  try {
    const response = await fetch(`${API_URL}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const exams = await response.json();
    const container = document.getElementById('examsList');
    
    if (exams.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun examen créé pour le moment</div>';
      return;
    }
    
    container.innerHTML = exams.map(exam => `
      <div class="exam-item">
        <h3>${exam.titre}</h3>
        <div class="exam-meta">
          <p>${exam.description || 'Pas de description'}</p>
          <p>⏱️ Durée: ${exam.duree} minutes | 📝 ${exam.questions.length} questions</p>
          <p>👥 ${exam.etudiantsAssignes.length} étudiant(s) assigné(s)</p>
          <p>📊 Statut: ${exam.statut}</p>
        </div>
        <div class="exam-actions">
          <button class="btn-edit" onclick="editExam('${exam._id}')">✏️ Modifier</button>
          <button class="btn-delete" onclick="deleteExam('${exam._id}')">🗑️ Supprimer</button>
        </div>
      </div>
    `).join('');
    
  } catch (error) {
    console.error('Erreur chargement examens:', error);
  }
}

// Supprimer un examen
async function deleteExam(id) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet examen ?')) return;
  
  try {
    await fetch(`${API_URL}/exams/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    alert('✅ Examen supprimé');
    loadExams();
    
  } catch (error) {
    alert('❌ Erreur lors de la suppression');
  }
}

async function loadExamResults() {
  try {
    const examsResponse = await fetch(`${API_URL}/exams`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allExams = await examsResponse.json();
    const myExams = allExams.filter(e => e.createdBy._id === user.id);
    
    const submissionsResponse = await fetch(`${API_URL}/submissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const allSubmissions = await submissionsResponse.json();
    
    const container = document.getElementById('resultsExamsList');
    
    if (myExams.length === 0) {
      container.innerHTML = '<div class="empty-state">Aucun examen créé pour le moment</div>';
      return;
    }
    
    container.innerHTML = myExams.map(exam => {
      const examSubmissions = allSubmissions.filter(s => s.examId._id === exam._id);
      
      const totalStudents = exam.etudiantsAssignes.length;
      const completedStudents = examSubmissions.length;
      const pendingStudents = totalStudents - completedStudents;
      
      const averageGrade = examSubmissions.length > 0
        ? Math.round(examSubmissions.reduce((sum, s) => sum + s.note, 0) / examSubmissions.length)
        : 0;
      
      let studentsTableHTML = '';
      
      if (completedStudents === 0) {
        studentsTableHTML = '<p style="color: #999; text-align: center; padding: 20px;">Aucun étudiant n\'a encore passé cet examen</p>';
      } else {
        studentsTableHTML = `
          <table class="students-results-table">
            <thead>
              <tr>
                <th>Étudiant</th>
                <th>Note</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${examSubmissions.map(sub => {
                const gradeClass = 
                  sub.note >= 80 ? 'grade-excellent' :
                  sub.note >= 60 ? 'grade-good' :
                  sub.note >= 40 ? 'grade-average' : 'grade-poor';
                
                return `
                  <tr>
                    <td>${sub.etudiantId.prenom} ${sub.etudiantId.nom}</td>
                    <td><span class="grade-badge ${gradeClass}">${sub.note}/100</span></td>
                    <td>${new Date(sub.dateFin).toLocaleDateString('fr-FR')} ${new Date(sub.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span class="status-badge status-done">✓ Terminé</span></td>
                    <td>
                      <button class="btn-view-details" onclick='viewSubmissionDetails(${JSON.stringify(sub)}, ${JSON.stringify(exam)})'>
                        👁️ Voir les détails
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
      
      const assignedStudentIds = exam.etudiantsAssignes.map(e => e._id);
      const completedStudentIds = examSubmissions.map(s => s.etudiantId._id);
      const pendingStudentsList = exam.etudiantsAssignes.filter(e => !completedStudentIds.includes(e._id));
      
      let pendingStudentsHTML = '';
      if (pendingStudentsList.length > 0) {
        pendingStudentsHTML = `
          <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px;">
            <h4 style="color: #856404; margin-bottom: 10px;">⏳ Étudiants n'ayant pas encore passé l'examen :</h4>
            <ul style="margin-left: 20px; color: #856404;">
              ${pendingStudentsList.map(s => `<li>${s.prenom} ${s.nom}</li>`).join('')}
            </ul>
          </div>
        `;
      }
      
      return `
        <div class="results-exam-card">
          <h3>
            ${exam.titre}
            <span style="font-size: 14px; font-weight: normal; color: #666;">
              ${exam.questions.length} questions | ${exam.duree} min
            </span>
          </h3>
          
          <div class="results-stats">
            <div class="stat-box">
              <div class="stat-label">Étudiants assignés</div>
              <div class="stat-number">${totalStudents}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Ont passé l'examen</div>
              <div class="stat-number">${completedStudents}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">En attente</div>
              <div class="stat-number">${pendingStudents}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Note moyenne</div>
              <div class="stat-number">${averageGrade}/100</div>
            </div>
          </div>
          
          ${studentsTableHTML}
          ${pendingStudentsHTML}
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error('Erreur chargement résultats:', error);
  }
}

function viewSubmissionDetails(submission, exam) {
  const modal = document.getElementById('resultDetailModal');
  modal.classList.remove('hidden');
  
  document.getElementById('resultStudentName').textContent = 
    `${submission.etudiantId.prenom} ${submission.etudiantId.nom}`;
  
  const gradeClass = 
    submission.note >= 80 ? 'grade-excellent' :
    submission.note >= 60 ? 'grade-good' :
    submission.note >= 40 ? 'grade-average' : 'grade-poor';
  
  document.getElementById('resultExamInfo').innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0 0 10px 0;">${exam.titre}</h3>
        <p style="margin: 5px 0; color: #666;">
          📅 Passé le: ${new Date(submission.dateFin).toLocaleDateString('fr-FR')} à ${new Date(submission.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 48px; font-weight: bold; color: #667eea;">${submission.note}/100</div>
        <span class="grade-badge ${gradeClass}">
          ${submission.note >= 80 ? 'Excellent' : submission.note >= 60 ? 'Bien' : submission.note >= 40 ? 'Passable' : 'Insuffisant'}
        </span>
      </div>
    </div>
  `;
  
  const answersHTML = exam.questions.map((question, index) => {
    const userAnswer = submission.reponses.find(r => r.questionNumero === question.numero);
    const isCorrect = userAnswer && 
      userAnswer.reponse.trim().toLowerCase() === question.reponseCorrecte.trim().toLowerCase();
    
    return `
      <div class="answer-review">
        <h4>Question ${question.numero} (${question.points} points)</h4>
        <p style="color: #333; margin-bottom: 15px;"><strong>${question.texte}</strong></p>
        
        <div class="answer-comparison">
          <div class="answer-box ${isCorrect ? 'correct' : 'incorrect'}">
            <h5>${isCorrect ? '✓ Réponse de l\'étudiant (Correcte)' : '✗ Réponse de l\'étudiant (Incorrecte)'}</h5>
            <p>${userAnswer ? userAnswer.reponse : '<em>Aucune réponse</em>'}</p>
          </div>
          
          <div class="answer-box correct">
            <h5>✓ Réponse attendue</h5>
            <p>${question.reponseCorrecte}</p>
          </div>
        </div>
        
        ${question.options && question.options.length > 0 ? `
          <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px;">
            <h5 style="font-size: 14px; color: #666; margin-bottom: 8px;">Options proposées :</h5>
            <ul style="margin-left: 20px;">
              ${question.options.map(opt => `<li>${opt}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
  
  document.getElementById('resultAnswers').innerHTML = answersHTML;
}

function closeResultModal() {
  document.getElementById('resultDetailModal').classList.add('hidden');
}

// Charger les étudiants au démarrage
loadStudents();