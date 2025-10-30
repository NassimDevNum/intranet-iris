const API_URL = 'http://localhost:3000/api';

// Éléments du DOM
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const backToLoginBtn = document.getElementById('backToLogin');
const loginBox = document.querySelector('.login-box');
const registerBox = document.getElementById('registerBox');
const errorMessage = document.getElementById('errorMessage');
const registerError = document.getElementById('registerError');

// Afficher le formulaire d'inscription
showRegisterBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  loginBox.classList.add('hidden');
  registerBox.classList.remove('hidden');
});

// Retour au formulaire de connexion
backToLoginBtn?.addEventListener('click', () => {
  registerBox.classList.add('hidden');
  loginBox.classList.remove('hidden');
});

// Connexion
loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur de connexion');
    }
    
    // Sauvegarder le token et les infos utilisateur
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(result.user));
    
    // Redirection selon le rôle
    if (result.user.role === 'enseignant') {
      window.location.href = 'dashboard-enseignant.html';
    } else {
      window.location.href = 'dashboard-etudiant.html';
    }
    
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.classList.remove('hidden');
  }
});

// Inscription
registerForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  try {
    const response = await fetch(`${API_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de l\'inscription');
    }
    
    alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
    registerForm.reset();
    
  } catch (error) {
    registerError.textContent = error.message;
    registerError.classList.remove('hidden');
  }
});