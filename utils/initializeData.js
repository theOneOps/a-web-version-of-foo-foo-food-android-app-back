const Users = require("../models/users");
const Restaurants = require("../models/restaurants");
const Menus = require("../models/menu");
const { isValidPhone, isValidHours } = require("../utils/validationFunctions");
const {
  isValidEmail,
  isValidRole,
  isValidPrice,
} = require("./validationFunctions");

const initializeDatabase = async () => {
  try {
    // Check and add initial restaurants
    const restaurantCount = await Restaurants.countDocuments();
    if (restaurantCount === 0) {
      console.log("No restaurants found. Adding initial restaurant data...");

      // Define fake restaurant data with valid phone numbers and opening hours
      const restaurants = require("../data/restaurants.json");

      // Validate and add restaurants to the database
      const validRestaurants = restaurants.filter((restaurant) => {
        return (
          isValidPhone(restaurant.phone) &&
          isValidHours(restaurant.openingHours)
        );
      });

      if (validRestaurants.length > 0) {
        await Restaurants.create(validRestaurants);
        console.log("Initial restaurant data added.");
      } else {
        console.log("No valid restaurant data to add.");
      }
    }

    const userCount = await Users.countDocuments();
    if (userCount === 0) {
      console.log("No users found. Adding initial user data...");

      // Define fake user data
      const users = require("../data/users.json");
      const validatedUsers = users.filter((user) => {
        return isValidEmail(user.email) && isValidRole(user.role);
      });

      if (validatedUsers.length > 0) {
        await Users.create(validatedUsers);
        console.log("Initial user data added.");
      } else {
        console.log("No valid user data to add.");
      }
    }

    const menuCount = await Menus.countDocuments();
    if (menuCount === 0) {
      console.log("No menus found. Adding initial menu data...");

      // Define fake menu data
      // import content from menu.json
      const menus = require("../data/menus.json");
      const validatedMenus = menus.filter((menu) => {
        return isValidPrice(menu.price);
      });

      if (validatedMenus.length > 0) {
        await Menus.create(validatedMenus);
        console.log("Initial menu data added.");
      } else {
        console.log("No valid menu data to add.");
      }
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

module.exports = initializeDatabase;
