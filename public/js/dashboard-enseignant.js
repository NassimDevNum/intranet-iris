const API_URL = 'http://localhost:3000/api';
let questionCount = 0;

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
    
    // Charger les examens si on affiche la liste
    if (tabName === 'list') {
      loadExams();
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

// Créer un examen
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
    const response = await fetch(`${API_URL}/exams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examData)
    });
    
    if (!response.ok) throw new Error('Erreur lors de la création');
    
    alert('✅ Examen créé avec succès !');
    e.target.reset();
    document.getElementById('questionsContainer').innerHTML = '';
    questionCount = 0;
    
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
          <button class="btn-edit" onclick="alert('Fonctionnalité à venir')">✏️ Modifier</button>
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

// Charger les étudiants au démarrage
loadStudents();