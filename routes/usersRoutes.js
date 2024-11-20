const express = require("express");
const router = express.Router();
const userController = require("../controllers/usersController");
const {auth, isAdmin} = require("../middlewares/auth");

// Inscription utilisateur
router.post("/auth/register", userController.initiateRegistration);

// Suite de l'Inscription avec choix du role et création du cookie httponly
router.post("/auth/completeRegistration", userController.completeRegistration)

// Connexion utilisateur
router.post("/auth/login", userController.login);

// Checker si un utilisateur est connecté
router.get('/auth/check', userController.checkAuth);

// déconnexion
router.post("/auth/logout", auth, userController.logout);

// update some of the user's field
router.put("/auth/update-email", auth, userController.updateEmail);

router.put("/auth/update-password", auth, userController.updatePassword);

router.put("/auth/update-address", auth, userController.updateAddress);

// Récupérer tous les utilisateurs (route réservée aux administrateurs)
router.get("/all",auth, isAdmin, userController.getAllUsers); // ,  // works

router.get("/by/:id", auth, isAdmin, userController.getUserById) // works

// Modifier role (route réservée aux administrateurs)
router.put("/:email/role",auth, isAdmin, userController.updateRole); // auth, isAdmin

router.put("/delivery/deliveryAvailability", auth, userController.updateAvailability);

router.get('/delivery/deliveryAvailability', auth, userController.getAvailability)

router.get("/user/:email", userController.getUser);

router.get("/user", auth, userController.getUserFromToken);

router.delete('/delete-account/:id',auth, isAdmin,  userController.deleteUser); //auth, isAdmin,

module.exports = router;
