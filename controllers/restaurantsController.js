const Restaurant = require("../models/restaurants");
const User = require("../models/users");

// Get all restaurants
exports.getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find().populate("items");
        res.status(200).json(restaurants);
    } catch (err) {
        res.status(500).json({message: "Error fetching restaurants", error: err});
    }
};

exports.getAllRestaurantsAdmin = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (err) {
        res.status(500).json({message: "Error fetching restaurants", error: err});
    }
};

// Get a specific restaurant by ID
exports.getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate("items");
        if (!restaurant) return res.status(404).json({message: "Restaurant not found"});
        res.status(200).json(restaurant);
    } catch (err) {
        res.status(500).json({message: "Error fetching restaurant", error: err});
    }
};

exports.getRestaurantByNameAdmin = async (req, res) => {
    try {
        const restaurant = await Restaurant.find({name:req.params.name});
        if (!restaurant) return res.status(404).json({message: "Restaurant not found"});
        res.status(200).json(restaurant);
    } catch (err) {
        res.status(500).json({message: "Error fetching restaurant", error: err});
    }
};

// Create a new restaurant
exports.createRestaurant = async (req, res) => {
    try {
        // Suppression de l'`_id` de l'adresse, si présent dans la requête
        if (req.body.address && req.body.address._id) {
            delete req.body.address._id;
        }

        console.log(`le contenu du body : ${req.body}`)

        // Configuration d'un restaurant avec les champs fournis dans req.body
        const restaurantData = {
            name: req.body.name,
            address: req.body.address,
            speciality: req.body.speciality || "Aucune",
            phone: req.body.phone || "",
            openingHours: req.body.openingHours || "10:00 - 22:00",
            items: req.body.items || [],
            rating: req.body.rating || 0,
            imageUrl: req.body.imageUrl || "", // URL d’image par défaut est déjà dans le modèle
            userId: req.body.userId || null, // userId peut être null si non fourni
        };

        // Création du document avec les données nettoyées
        const restaurant = new Restaurant(restaurantData);

        // Sauvegarde dans la base de données
        await restaurant.save();

        res.status(201).json({
            success: true, message: "Restaurant created successfully", restaurant,
        });
        console.log("Restaurant created successfully:", restaurant);
    } catch (err) {
        console.error("Error creating restaurant:", err); // Log détaillé de l’erreur
        res.status(400).json({success: false, error: err.message});
    }
};

// Update a restaurant
exports.updateRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {new: true});

        console.log(restaurant);
        if (!restaurant) return res
            .status(404)
            .json({success: false, message: "Restaurant not found"});
        res.status(200).json({
            success: true, message: "Restaurant updated successfully", restaurant,
        });
        console.log(restaurant);
    } catch (err) {
        res.status(400).json({sucess: false, error: err.message});
    }
};


exports.deleteRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res
                .status(404)
                .json({success: false, message: "Restaurant not found"});
        }
        // remove the user as restorer of the restaurant
        if (restaurant.userId) {
            await User.findByIdAndUpdate(restaurant.userId, {restaurantId: null});
        }

        await restaurant.deleteOne();

        return res
            .status(200)
            .json({success: true, message: "Restaurant deleted successfully"});
    } catch (err) {
        return res
            .status(500)
            .json({
                success: false, message: "Error deleting restaurant", error: err,
            });
    }
};

// link a restorer to a restaurant
exports.linkedARestorer = async (req, res) => {
    try {
        const {id, restaurantId} = req.params;
        const restaurant = await Restaurant.findById(restaurantId);
        const user = await User.findById(id);

        if (!restaurant || !user) {
            return res
                .status(404)
                .json({success: false, message: "User or Restaurant not found"});
        }

        // Vérifie le rôle de l'utilisateur et s'il n'est pas déjà lié à un restaurant
        if (user.role === "restaurateur" && (!user.restaurantId || user.restaurantId === "")) {
            // Vérifie si le restaurant n'a pas déjà un restaurateur lié
            if (!restaurant.userId || restaurant.userId === "") {
                await Restaurant.findByIdAndUpdate(restaurantId, {userId: id});
                await User.findByIdAndUpdate(id, {restaurantId: restaurantId});

                return res.status(200).json({
                    success: true,
                    message: `Successfully linked the restorer ${user._id} and the restaurant ${restaurant._id}`,
                });
            }
            return res.status(400).json({
                success: false, message: `Restaurant ${restaurant._id} already has a restorer linked`,
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `User ${user._id} is either not a restorer or is already linked to a restaurant`,
            });
        }
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};
