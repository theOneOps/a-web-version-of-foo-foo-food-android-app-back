const User = require("../models/users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { isValidRole } = require("../utils/validationFunctions");
const Restaurant = require("../models/restaurants");

exports.getUser = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getUserFromToken = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login
// exports.login = async (req, res) => {
//     try {
//         console.log(req.body);
//         const {email, password} = req.body;
//         const user = await User.findOne({email});
//         if (!user) return res.status(404).json({error: "User not found"});

//         const isMatch = await user.comparePassword(password);
//         if (!isMatch) return res.status(400).json({error: "Invalid credentials"});

//         const token = jwt.sign({id: user._id, email: user.email, role: user.role}, process.env.JWT_KEY, {
//             expiresIn: "1h",
//         });

//         res.status(200).json({user, token});
//     } catch (err) {
//         res.status(400).json({error: err.message});
//     }
// };

exports.login = async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role},
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    // Définir le cookie HttpOnly
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });
    console.log('Request cookies after setting:', req.cookies);

    res.status(200).json({ user }); // On ne renvoie pas le token ici
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Verifier si un utilisateur est connecté
exports.checkAuth = async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  try {
    const decoded = await jwt.verify(token, process.env.JWT_KEY);
    res.status(200).json({ 
      authenticated: true,
      role: decoded.role,  // Role par défaut si non défini
      email: decoded.email,
    });
  } catch (err) {
    res.status(401).json({ authenticated: false });
  }
};



// Register a user
exports.initiateRegistration = async (req, res) => {
  try {
    let { email, password} = req.body;
    console.log(req.body)
    // Check if the user already exists
    const user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ error: "This email is already registered" });
    else {
      // hash the password
      password = await bcrypt.hash(password, 8);

      const new_user = new User({
        ...req.body,
        password: password,
      });
      await new_user.save();

      res.status(201).json({new_user});
    }
  } catch (err) {
    res.status(400).json( { message: " account created successfully" } );
  }
};

// Complete user profile
exports.completeRegistration = async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (role && !isValidRole(role.toString().toLowerCase())) {
      return res.status(400).json({
        error:
          "Role's value should be among ['client', 'livreur', 'restaurateur']",
      });
    }

    user.role = role.toString().toLowerCase();
    user.registrationComplete = true;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role},
      process.env.JWT_KEY,
      {
        expiresIn: "1h",
      }
    );

    // Définir le cookie HttpOnly
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// exports.logout = async (req, res) => {
//     try {
//         const authHeader = req.header('Authorization');
//         if (!authHeader) {
//             return res.status(401).json({error: 'Authorization token missing'});
//         }

//         const token = authHeader.replace('Bearer ', '');

//         res.status(200).json({message: 'Logged out successfully'});
//     } catch (err) {
//         res.status(400).json({error: err.message});
//     }
// }

exports.logout = async (req, res) => {
  try {
    // Supprime le cookie en le réinitialisant avec une date d'expiration passée
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    //sameSite: 'strict',  // Permet de traverser les domaines en développement

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { previousEmail, email } = req.body;
    if (previousEmail === email)
      return res
        .status(400)
        .json({ error: "The new email is the same as the previous one" });

    const user = await User.findOne({ email: email });
    if (user)
      return res
        .status(400)
        .json({ error: "This email is already registered" });

    const userUpdated = await User.findOne({ email: previousEmail });
    userUpdated.email = email;
    await userUpdated.save();

    console.log(userUpdated);

    res.status(200).json({ message: " email changed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { newPassword, previousPassword } = req.body;
    console.log(req.body);
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(newPassword, user.password);
    if (isMatch)
      return res
        .status(400)
        .json({ message: "The new password is the same as the previous one" });

    const isMatchPrevious = await bcrypt.compare(
      previousPassword,
      user.password
    );
    if (!isMatchPrevious)
      return res
        .status(400)
        .json({ message: "The previous password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 8);
    await user.save();
    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { number, street, city, zipCode, state, country } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const address = { number, street, city, zipCode, state, country };
    console.log(address);
    user.address = address;
    await user.save();
    return res
      .status(200)
      .json({ message: "Address updated successfully", user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    console.log(req);
    const users = await User.find({ role: { $ne: "admin" } });
    res.status(200).json(users); // Renvoie la liste des utilisateurs au format JSON
  } catch (err) {
    res.status(500).json({
      message: "Erreur lors de la récupération des utilisateurs",
      error: err,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params; // Récupérer l'ID depuis les paramètres
    const user = await User.findById(id); // Utilise findById pour chercher par _id
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateRole = async (req, res) => {
  const { email } = req.params;
  const { newRole } = req.body;

  try {
    // Vérifier si le rôle est valide (optionnel)
    const validRoles = ["admin", "client", "restaurateur", "livreur"]; // Par exemple
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: "Rôle invalide." });
    }

    // Rechercher l'utilisateur par email et mettre à jour son rôle
    const updatedUser = await User.findOneAndUpdate(
      { email: email }, // Critère de recherche
      { role: newRole }, // Changement à appliquer
      { new: true } // Retourne l'utilisateur mis à jour
    );

    // Vérifier si l'utilisateur a été trouvé et mis à jour
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Répondre avec succès
    res
      .status(200)
      .json({ message: "Rôle mis à jour avec succès.", user: updatedUser });
  } catch (error) {
    // Gestion des erreurs
    console.error(`Erreur lors de la mise à jour du rôle : ${error.message}`);
    res
      .status(500)
      .json({ error: "Erreur serveur. Impossible de mettre à jour le rôle." });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    // Obtenez l'email de l'utilisateur à partir du jeton d'authentification (middleware `auth`)
    const userEmail = req.user.email;

    // Recherchez l'utilisateur en base de données par email
    const user = await User.findOne({ email: userEmail }); // Utilise `findOne` avec `email`
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérifiez la disponibilité de l'utilisateur
    const isAvailable = user.deliveryAvailability || false; // `deliveryAvailability` selon votre champ en base de données

    // Réponse avec la disponibilité actuelle
    res.status(200).json({ isAvailable });
  } catch (error) {
    console.error("Erreur lors de la récupération de la disponibilité:", error);
    res.status(500).json({
      message: "Erreur serveur. Impossible de récupérer la disponibilité.",
    });
  }
};

exports.updateAvailability = async (req, res) => {
  const { available } = req.body;


  try {
    // Rechercher l'utilisateur par email et mettre à jour son rôle
    const updatedUser = await User.findOneAndUpdate(
      { email: req.user.email }, // Critère de recherche
      { deliveryAvailability: available }, // Changement à appliquer
      { new: true } // Retourne l'utilisateur mis à jour
    );

    // Vérifier si l'utilisateur a été trouvé et mis à jour
    if (!updatedUser) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Répondre avec succès
    res.status(200).json({
      message: "Disponibilité de livraison mise à jour avec succès.",
      user: updatedUser,
    });
  } catch (error) {
    // Gestion des erreurs
    console.error(
      `Erreur lors de la mise à jour de la disponibilité de livraison : ${error.message}`
    );
    res.status(500).json({
      error:
        "Erreur serveur. Impossible de mettre à jour la disponibilité de livraison.",
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Chercher l'utilisateur par son ID
    const user = await User.findById(req.params.id);

    // Vérifier si l'utilisateur existe
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // remove the user as restorer of the restaurant
    if (user.restaurantId) {
      await Restaurant.findByIdAndUpdate(user.restaurantId, { userId: null });
    }
    const userId = user._id;
    // Supprimer l'utilisateur
    await user.deleteOne();

    // Retourner une réponse de succès
    return res.status(200).json({
      success: true,
      message: `User with ID ${userId} has been deleted`,
    });
  } catch (error) {
    console.error(error); // Afficher l'erreur dans la console pour le débogage
    return res.status(500).json({ success: false, message: error.message });
  }
};
