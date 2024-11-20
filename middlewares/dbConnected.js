const mongoose = require('mongoose');


// Middleware pour vérifier la connexion MongoDB
exports.checkMongoDBConnection = (req, res, next) => {
    if (mongoose.connection.readyState !== 1) { // 1 signifie connecté
      res.status(503).json({ error: "Database offline", modeOffline: true });
    } else {
      next();
    }
  };
  