const users = require("../models/users");
const Order = require("../models/orders");
const Restaurant = require("../models/restaurants");
const Notification = require("../models/notifications");

exports.addOrder = async (req, res) => {
    try {
        const {
            restaurantId, clientEmail, clientName, deliveryAddress, dishes, // This includes the full Menu object in each dish
            status,
        } = req.body;

        // Fetch restaurant details based on restaurantId for order metadata
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(400).json({error: "Restaurant not found"});
        }

        // Create a new order with embedded menu details in dishes
        const order = new Order({
            clientEmail, clientName, deliveryAddress, dishes, // Directly use the dishes array with embedded Menu details
            status, restaurantId, restaurantName: restaurant.name, restaurantAddress: {
                street: restaurant.address.street,
                number: restaurant.address.number,
                city: restaurant.address.city,
                state: restaurant.address.state,
                zipCode: restaurant.address.zipCode,
                country: restaurant.address.country,
            },
        });

        // Save the new order
        await order.save();
        res.status(201).json(order);
    } catch (err) {
        console.error(err);
        res.status(400).json({error: err.message});
    }
};

exports.hasActiveOrder = async (req, res) => {
    try {
        const {clientEmail} = req.params;
        console.log("checking order for " + clientEmail);
        const activeOrder = await Order.findOne({
            clientEmail, status: {
                $in: ["en attente d'un livreur", "en cours de préparation", "en cours de livraison",],
            },
        });

        if (activeOrder) {
            return res.status(200).json({hasActiveOrder: true});
        }
        res.status(200).json({hasActiveOrder: false});
    } catch (err) {
        res.status(500).json({error: err.message});
    }
};

// track command by ID
exports.trackOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate("items");
        if (!order) return res.status(404).json({error: "Order not found"});
        res.status(200).json(order);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
};

// change command's status
exports.changeOrderStatus = async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(req.params.orderId, {status: req.body.status}, {new: true});
        if (!order) return res.status(404).json({error: "Order not found"});
        res.status(200).json(order);
    } catch (err) {
        res.status(400).json({error: err.message});
    }
};

exports.getAllOrdersByClientId = async (req, res) => {
    try {
        // Verify that the client ID exists in the token
        if (!req.user || !req.user.id) {
            return res.status(400).json({ error: "Client ID is missing in the token" });
        }

        const clientId = req.user.id;

        // Check if the client exists
        const client = await users.findById(clientId);
        if (!client) {
            return res.status(404).json({ error: `Client with ID ${clientId} not found` });
        }

        // Fetch all orders associated with the client ID
        const allOrders = await Order.find({ clientEmail: client.email });

        // If no orders are found, send an appropriate message
        if (!allOrders || allOrders.length === 0) {
            return res.status(404).json({ message: `No orders found for client with ID: ${clientId}` });
        }

        // Return the orders in the response
        res.status(200).json(allOrders);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const MAX_ATTEMPTS = 50; // Nombre maximum de tentatives avant d'arrêter
const RETRY_DELAY_MS = 30000; // Délai de 30 secondes entre les tentatives

// Assign a new order to an available delivery person
exports.assignOrderToAvailableDeliveryPerson = async (req, res) => {
    try {
        // Étape 1: Trouver la commande en attente par son ID
        const order = await Order.findById(req.params._id);
        if (!order || order.status !== "en attente d'un livreur") {
            return res
                .status(400)
                .json({error: "Order not found or already assigned."});
        }

        // Tentative d'assignation avec répétition si aucun livreur n'est disponible
        let attempt = 0;

        async function tryAssignOrder() {
            attempt++;

            // Étape 2: Trouver un livreur disponible
            const availableDeliveryPerson = await users.findOne({
                deliveryAvailability: true,
            });

            if (!availableDeliveryPerson) {
                console.log(`No available delivery person found. Attempt ${attempt} of ${MAX_ATTEMPTS}`);

                // Vérifier si le nombre maximum de tentatives est atteint
                if (attempt < MAX_ATTEMPTS) {
                    setTimeout(tryAssignOrder, RETRY_DELAY_MS); // Réessayer après un délai
                } else {
                    res.status(400).json({
                        error: "No available delivery person found after multiple attempts.",
                    });
                }

                return;
            }

            // Étape 3: Assigner la commande au livreur
            order.deliveryManEmail = availableDeliveryPerson.email;
            order.status = "en cours de préparation"; // Mettre à jour le statut de la commande
            await order.save();

            // Étape 4: Mettre à jour la disponibilité du livreur
            availableDeliveryPerson.deliveryAvailability = false;
            availableDeliveryPerson.currentOrder = order.email;
            await availableDeliveryPerson.save();

            // Émettre un événement Socket.IO pour notifier le livreur
            const io = req.app.get("socketio");
            io.to(availableDeliveryPerson.email).emit("orderAssigned", {
                order: order,
            });

            const deliveryPerson = await users.findOne({email: order.deliveryManEmail});
            if (!deliveryPerson) {
                console.error("Delivery person not found");
            }
            else {
                const notification = new Notification({
                    userId: deliveryPerson._id,
                    body: "Vous avez une nouvelle commande à livrer",
                    status_order: "Nouvelle commande",
                    status_notif: "unread",
                });

                await notification.save();

                io.to(order.deliveryManEmail).emit("newNotification", {
                    notification: notification,
                });
            }
            
            // Envoyer au client
            io.to(order.clientEmail).emit("orderStatusUpdated", {
                orderId: order._id,
                status: order.status
            });

            const client = await users.findOne({email: order.clientEmail});
            if (!client) {
                console.error("Client not found");
            }
            else {
                const notification = new Notification({
                    userId: client._id,
                    body: "Votre commande a été assignée à un livreur",
                    status_order: order.status,
                    status_notif: "unread",
                });

                await notification.save();

                io.to(order.clientEmail).emit("newNotification", {
                    notification: notification,
                });
            }

            // Log pour confirmer que l'événement a été émis
            console.log(`Événement orderAssigned émis à ${availableDeliveryPerson.email}`);
            console.log(`Événement orderStatusUpdated émis à ${order.clientEmail}`);

            res.status(200).json({
                message: "Order successfully assigned.", order, deliveryPerson: availableDeliveryPerson,
            });
        }

        // Démarrer la première tentative d'assignation
        tryAssignOrder();
    } catch (error) {
        res.status(400).json({error: error.message});
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const orderId = req.params.orderId;

        if (orderId == undefined) {
            return res.status(400).json({message: 'L\'ID de la commande est requis.'});
        }

        // Rechercher la commande avec l'ID fourni
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({message: 'Commande non trouvée.'});
        }

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Erreur serveur. Veuillez réessayer plus tard.'});
    }
};

// Fonction pour obtenir les commandes par email du livreur
exports.getOrdersByDeliveryManEmail = async (req, res) => {
    try {

        const email = req.params.deliveryManEmail;
        console.log(email)
        if (!email) {
            return res.status(400).json({message: 'Email du livreur est requis.'});
        }

        // Rechercher les commandes assignées à ce livreur et dont le status est "en cours de préparation" ou "en cours de livraison"
        const orders = await Order.find({deliveryManEmail: email});

        if (orders.length === 0) {
            return res.status(404).json({message: 'Aucune commande en cours pour ce livreur.'});
        }

        res.status(200).json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Erreur serveur. Veuillez réessayer plus tard.'});
    }
};

exports.updateOrderStatusDelivery = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const {status} = req.body; // Récupérer le nouveau statut depuis le corps de la requête

        // Vérifier si `orderId` et `status` sont définis
        if (!orderId) {
            return res.status(400).json({message: "L'ID de la commande est requis."});
        }

        if (!status) {
            return res.status(400).json({message: "Le statut de la commande est requis."});
        }

        // Optionnel : Validation du statut pour s'assurer qu'il est valide
        const validStatuses = ["en attente d'un livreur", "en cours de préparation", "en cours de livraison", "livrée"];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({message: "Statut de commande invalide."});
        }

        // Rechercher la commande avec l'ID fourni
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({message: 'Commande non trouvée.'});
        }

        // Mettre à jour le statut de la commande
        order.status = status;
        await order.save();

        // Retourner la commande mise à jour
        res.status(200).json({message: "Statut de la commande mis à jour avec succès.", order});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: 'Erreur serveur. Veuillez réessayer plus tard.'});
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const {orderId, status, deliveryManEmail} = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({message: "Commande non trouvée."});
        }

        order.status = status;
        order.deliveryManEmail = deliveryManEmail || null;
        await order.save();

        res.status(200).json({message: "Commande mise à jour avec succès.", order});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Erreur serveur."});
    }
};

exports.getCurrentOrderByClientEmail = async (req, res) => {
    try {
        const clientEmail = req.params.clientEmail;

        if (!clientEmail) {
            return res.status(400).json({message: "Client email is required."});
        }

        // Find the most recent active order for the client
        const order = await Order.findOne({
            clientEmail: clientEmail,
        }).sort({createdAt: -1}); // Ensure 'timestamps: true' in your schema

        if (!order) {
            return res
                .status(404)
                .json({message: "No active order found for this client."});
        }

        //console.log("Order being sent:", order);

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error. Please try again later."});
    }
};

// Function to update order status and notify the user
exports.updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const {status} = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({message: "Order not found."});
        }

        order.status = status;
        await order.save();

        // Emit socket event to update the frontend in real-time
        const io = req.app.get("socketio");
        io.to(order.clientEmail).emit("orderStatusUpdated", {
            orderId: order._id, status: order.status,
        });

        let notifsMessage = ""

        if (status === "en cours de préparation") {
            notifsMessage = "Votre commande est en cours de préparation."
        }
        if (status === "en cours de livraison") {
            notifsMessage = "Votre commande est en cours de livraison."
        }
        if (status === "livrée") {
            notifsMessage = "Votre commande a été livrée."
        }

        const user = await users.findOne({email: order.clientEmail});
        if (!user) {
            console.error("User not found");
        } else {
            const notification = new Notification({
                userId: user._id,
                body: notifsMessage,
                status_order: order.status,
                status_notif: "unread"
            });

            await notification.save();

            io.to(order.clientEmail).emit("newNotification", {
                notification: notification
            });
        }

        // Send notification to user
        //await sendNotificationToUser(order.clientEmail, "Mise à jour de commande", `Votre commande est maintenant ${status}.`);

        res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Server error. Please try again later."});
    }
};