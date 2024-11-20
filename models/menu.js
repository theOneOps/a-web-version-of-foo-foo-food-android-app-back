const mongoose = require("mongoose");
const {isValidPrice} = require("../utils/validationFunctions");

const {Schema} = mongoose;
// all the required properties : name, price, category, restaurantId
const menuSchema = new Schema({
    name: {type: String, required: true, lowercase: true},
    description: {type: String, maxLength: 500, lowercase: true, required: true},
    price: {type: Number, default: 0, required: true, validate: {
            validator: isValidPrice, message: (props) => `${props.value} is not a valid price!`,
        }},
    category: {type: String, default: "", lowercase: true, required: true},
    image: {type: String, default: ""},
    restaurantId: {
        type: Schema.Types.ObjectId, required: true, ref: "Restaurants",
    },
    ingredients: {type: [String], default: []},
});

module.exports = mongoose.model("Menus", menuSchema);
