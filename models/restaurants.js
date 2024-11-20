const mongoose = require("mongoose");

const {Schema} = mongoose;

const {isValidPhone, isValidHours} = require("../utils/validationFunctions");

// all the required properties : name
const restaurantSchema = new Schema({
    name: {type: String, required: true, unique: true},
    address: {
        street: {type: String, required: true},
        number: {type: String, required: true},
        city: {type: String, required: true},
        state: {type: String},
        zipCode: {type: String},
        country: {type: String, required: true},
    },
    speciality: {
        type: String, default: "Aucune",
    },
    phone: {
        type: String, validate: {
            validator: isValidPhone, message: (props) => `${props.value} is not a valid phone number!`,
        },
    },
    openingHours: {
        type: String, validate: {validator: isValidHours, message: "invalid hours"},
    },
    items: [{type: Schema.Types.ObjectId, ref: "Menus"}],
    imageUrl: {
        type: String,
        default: "",
    }, // Référence à l'utilisateur propriétaire du restaurant
    userId: {
        type: Schema.Types.ObjectId, ref: "Users", // Le modèle "User" auquel ce champ fait référence
    },
    rating:{type:Number, default:""}
});

module.exports = mongoose.model("Restaurants", restaurantSchema);
