const express = require("express");
const router = express.Router();
const restaurantController = require("../controllers/restaurantsController");
const {auth, isAdmin, isRestorer} = require("../middlewares/auth");

// Route to get all restaurants
router.get("/", restaurantController.getAllRestaurants);

// Route to get only restaurants with no menu's items
router.get("/admin/allRestaurants", restaurantController.getAllRestaurantsAdmin); // auth, admin

// Route to get a restaurant by ID
router.get("/:id", restaurantController.getRestaurantById); // auth

// Route to get a restaurant by its name
router.get("/by/:name", auth, restaurantController.getRestaurantByNameAdmin); // auth, admin

// Route to create a new restaurant (admin or restaurant owner)
router.post("/", restaurantController.createRestaurant); // auth, isAdmin,

// Route to update a restaurant (admin or restaurant owner)
router.put("/:id", auth, isRestorer, restaurantController.updateRestaurant);

// Route to delete a restaurant (admin or restaurant owner)
router.delete("/:id", restaurantController.deleteRestaurant); //auth, isAdmin,

router.put("/linkarestorer/:id/:restaurantId",  restaurantController.linkedARestorer); // auth, isAdmin,

module.exports = router;

