const mongoose = require("mongoose");

// all required models

const Menus = require("./menu").schema;

const {Schema} = mongoose;

const orderSchema = new Schema({
    deliveryManEmail: {type: String, required: false, lowercase: true}, //dishes liste de couple (menu, quantite)
    dishes: [{
        menu: Menus, quantity: {type: Number, required: true},
    },],
    clientEmail: {type: String, required: true, lowercase: true},
    clientName: {type: String, required: true, lowercase: true},
    restaurantName: {type: String, required: true, lowercase: true},
    restaurantAddress: {
        street: {type: String, required: true},
        number: {type: String, required: true},
        city: {type: String, required: true},
        state: {type: String},
        zipCode: {type: String},
        country: {type: String, required: true},
    },
    deliveryAddress: {
        street: {type: String, required: true},
        number: {type: String, required: true},
        city: {type: String, required: true},
        state: {type: String},
        zipCode: {type: String},
        country: {type: String, required: true},
    },
    status: {
        type: String,
        enum: ["en attente d'un livreur", "en cours de préparation", "en cours de livraison", "livrée",],
        default: "en attente d'un livreur",
        lowercase: true,
    },
}, {timestamps: true});

module.exports = mongoose.model("Orders", orderSchema);
