require("dotenv").config();
const User = require('./models/users');  // Importez votre modèle User

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cookieParser = require('cookie-parser');

const {checkMongoDBConnection} = require("./middlewares/dbConnected")
// Utilisation du middleware cookie-parser


const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:5173', // L'origine de ton frontend
  credentials: true, // Permet l'envoi des cookies
};

/**
 * 
 *  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Les méthodes autorisées
  allowedHeaders: ['Content-Type', 'Authorization'] // Les en-têtes autorisés
 */

// Applique la configuration CORS à ton application
const app = express();

app.use(cors(corsOptions));
app.use(cookieParser());


// Autorise toutes les origines

//Cette ligne permet au serveur Express de traiter les corps de requêtes au format JSON.
// Elle est importante pour les routes API qui reçoivent des données JSON, comme les requêtes POST.
app.use(express.json());

const connectDB = require("./config/db");

// connexion à la base de données

connectDB();



// Création d'un serveur HTTP pour utiliser Socket.IO
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Remplace par les origines que tu souhaites autoriser
    methods: ["GET", "POST"],
  },
});

// importation des routes

const restaurantsRoutes = require("./routes/restaurantsRoutes");
const ordersRoutes = require("./routes/ordersRoutes");
const usersRoutes = require("./routes/usersRoutes");
const menuRoutes = require("./routes/menuRoutes");
const notificationRoutes = require("./routes/notificationsRoutes");

// Utilisation des routes
app.use("/api/users",checkMongoDBConnection, usersRoutes);
app.use("/api/restaurants",checkMongoDBConnection, restaurantsRoutes);
app.use("/api/orders",checkMongoDBConnection, ordersRoutes);
app.use("/api/menus",checkMongoDBConnection, menuRoutes);
app.use("/api/notifications",checkMongoDBConnection, notificationRoutes);

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log("Nouvelle connexion client établie");

  // Joindre un "room" pour les livreurs, par exemple via leur email
  socket.on("join", (email) => {
    socket.join(email);
    console.log(`Livreur avec email ${email} a rejoint le room.`);
  });

  socket.on("register", (data) => {
    const { clientEmail } = data;
    socket.join(clientEmail); // Join a room named after the client email
    console.log(`Socket ${socket.id} joined room ${clientEmail}`);
  });

  // Déconnexion
  socket.on("disconnect", () => {
    console.log("Client déconnecté");
  });
});


app.get("/api/status", async (req, res) => {
  try {
    // Vérifier si le modèle User existe dans la base de données
    const userExists = await User.exists({});  // Requête qui vérifie l'existence d'un utilisateur

    if (userExists) {
      // Si des utilisateurs existent, vous êtes connecté
      res.json({ status: 'OK', modeOffline: false });
    }
  } catch (error) {
    // En cas d'erreur (par exemple, si la connexion à la base de données échoue)
    console.error('Erreur lors de la vérification de l\'existence du modèle User:', false);
    res.status(503).json({ error: "Database error", modeOffline: true });
  }
});


// Rendre `io` accessible dans les contrôleurs
app.set("socketio", io);

// Lancement du serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});



