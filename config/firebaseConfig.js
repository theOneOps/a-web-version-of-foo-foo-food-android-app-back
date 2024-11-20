const admin = require("firebase-admin");

// Replace with the path to your Firebase service account JSON file
const serviceAccount = require("./foo-foo-food-demo-firebase-adminsdk-892jn-3c0b2e613f.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
