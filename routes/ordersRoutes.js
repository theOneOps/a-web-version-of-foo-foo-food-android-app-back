const express = require("express");
const router = express.Router();
const orderController = require("../controllers/ordersController");

const {auth} = require("../middlewares/auth");

// Routes pour les commandes
router.post("/checkout", auth, orderController.addOrder); // auth
router.get("/track/:orderId", auth, orderController.trackOrder); // auth
router.put("/changeStatus/:orderId", auth, orderController.changeOrderStatus); // auth

router.get("/hasActiveOrder/:clientEmail", auth, orderController.hasActiveOrder);

router.get("/userOrders", auth, orderController.getAllOrdersByClientId);

router.get("/order/:orderId", orderController.getOrderById);

router.get("/deliveryMan/:deliveryManEmail", orderController.getOrdersByDeliveryManEmail);

router.get('/order/:orderId', orderController.getOrderById);
router.put('/order/:orderId/status', orderController.updateOrderStatus);
router.get('/deliveryMan/:deliveryManEmail', orderController.getOrdersByDeliveryManEmail);
router.post('/assign-order/:_id', orderController.assignOrderToAvailableDeliveryPerson);
router.put('/order/update', orderController.updateOrder);

router.get("/currentOrder/:clientEmail", auth, orderController.getCurrentOrderByClientEmail);

router.put("/updateStatus/:orderId", auth, orderController.updateOrderStatusDelivery);

module.exports = router;
