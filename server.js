require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques
app.use(express.static('public'));

// Connexion à MongoDB
connectDB();

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/exams', require('./routes/examRoutes'));  // ← Décommente cette ligne

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'API IRIS Exam - Serveur démarré ✅' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});