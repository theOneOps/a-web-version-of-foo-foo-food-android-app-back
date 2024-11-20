const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const {Schema} = mongoose;

const {isValidEmail} = require("../utils/validationFunctions");

const addressSchema = new Schema(
    {
    number: {type: Number},
    street: {type: String},
    city: {type: String},
    zipCode: {type: String},
    state: {type: String},
    country: {type: String},
}, {_id: false}); // _id: false pour éviter d'avoir un _id pour chaque sous-document

// Schéma pour l'utilisateur
const userSchema = new Schema({
    name: {type: String, required: true, lowercase: false},
    email: {
        type: String, required: true, validate: {
            validator: isValidEmail, message: "Invalid email",
        }, lowercase: true, unique: true,
    },
    password: {type: String, required: true},
    role: {
        type: String, enum: ["admin", "client", "livreur", "restaurateur"], lowercase: true
    },
    address: addressSchema,
    restaurantId: {
        type: Schema.Types.ObjectId, ref: "Restaurant", // Assurez-vous que cela correspond au modèle de restaurant
        validate: {
            // Validation pour le rôle 'restorer'
            validator: function (value) {
                return this.role !== "restorer" || value != null; // restaurantId doit être présent si le rôle est 'restorer'
            }, message: (props) => `Restaurant ID is required for role 'restorer'!`,
        },
        default:null,
    },
    deliveryAvailability: {type: Boolean, required: false},
    registrationComplete:{type:Boolean, default:false}
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = function (passwordToCompareWith) {
    return bcrypt.compare(passwordToCompareWith, this.password);
};

// Export du modèle User
module.exports = mongoose.model("User", userSchema);
