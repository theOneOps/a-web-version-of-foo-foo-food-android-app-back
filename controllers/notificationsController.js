const Notification = require("../models/notifications");

exports.createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();
        res.status(201).send(notification);
    } catch (error) {
        res.status(400).send(error);
    }
}

exports.getNotificationsUnreadByUserId = async (req, res) => {
    try {
        const notifications = await Notification.find({userId: req.params.userId, status_notif: 'unread'}).sort({createdAt: -1});
        res.send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.getNotificationsByUserId = async (req, res) => {
    try {
        const notifications = await Notification.find({userId: req.params.userId}).sort({createdAt: -1});
        res.send(notifications);
    } catch (error) {
        res.status(500).send(error);
    }
}

exports.updateNotification = async (req, res) => {
    try {
        await Notification.updateMany({userId: req.params.userId}, {status_notif: 'read'});
        res.send();
    } catch (error) {
        res.status(500).send(error);
    }
}