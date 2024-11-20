const jwt = require('jsonwebtoken');


// Middleware d'authentification
// exports.auth = (req, res, next) => {
//     // Vérifie si l'en-tête Authorization existe
//     const authHeader = req.header('Authorization');
//     if (!authHeader) {
//         return res.status(401).json({error: 'Authorization token missing'});
//     }

//     // Vérifie si l'en-tête contient le mot-clé 'Bearer'
//     const token = authHeader.replace('Bearer ', '');
//     if (!token) {
//         return res.status(401).json({error: 'Access denied, invalid token'});
//     }

//     // Vérifie si le token est dans la liste noire
//     if (blacklistedTokens.includes(token)) {
//         return res.status(401).json({error: 'Access denied, token has been invalidated'});
//     }

//     try {
//         // Vérifie le token
//         req.user = jwt.verify(token, process.env.JWT_KEY); // Ajoute l'utilisateur vérifié à la requête
//         next();
//     } catch (err) {
//         res.status(400).json({error: 'Invalid token'});
//     }
// };

exports.auth = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        req.user = decoded; // Stocke les infos décodées dans req.user
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};


// Middleware pour vérifier les rôles
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({sucess: false, message: 'Access denied. You are not an admin.'});
    }
};

exports.isRestorer = (req, res, next) => {
    if (req.user && req.user.role === 'restaurateur') {
        next();
    } else {
        return res.status(403).json({success: false, message: 'Access denied, you need to be a restorer'});
    }
};

exports.isDeliver = (req, res, next) => {
    if (req.user && req.user.role === 'livreur') {
        next();
    } else {
        return res.status(403).json({success: false, message: 'Access denied, you need to be a restorer'});
    }
};
