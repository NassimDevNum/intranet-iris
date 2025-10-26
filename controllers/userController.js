const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Créer un token JWT
const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'  // Le token expire après 7 jours
  });
};

// Inscription d'un nouvel utilisateur
exports.register = async (req, res) => {
  try {
    const { email, password, role, nom, prenom } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer le nouvel utilisateur
    const user = await User.create({
      email,
      password,
      role,
      nom,
      prenom
    });

    // Créer un token
    const token = createToken(user._id);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Créer un token
    const token = createToken(user._id);

    res.status(200).json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        nom: user.nom,
        prenom: user.prenom
      },
      token
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};

// Récupérer tous les utilisateurs (pour l'admin)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');  // On ne renvoie pas les mots de passe
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
};