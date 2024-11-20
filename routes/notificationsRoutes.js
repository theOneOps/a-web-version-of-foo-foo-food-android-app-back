const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationsController");
const {auth} = require("../middlewares/auth");

router.post('/', auth, notificationController.createNotification)

router.get('/unread/:userId', notificationController.getNotificationsUnreadByUserId)

router.get('/:userId', notificationController.getNotificationsByUserId)

router.put('/markAsRead/:userId', notificationController.updateNotification)

module.exports = router;
