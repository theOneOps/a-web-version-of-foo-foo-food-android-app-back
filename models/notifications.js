const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    body: { type: String, required: true },
    status_order: { type: String, default: '' },
    status_notif: { type: String, default: 'unread' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notifications', NotificationSchema);