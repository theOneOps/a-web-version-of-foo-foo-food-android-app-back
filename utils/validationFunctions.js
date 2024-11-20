function isValidEmail(email) {
    const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email.toLowerCase())
}

function isValidPhone(v) {
    const regex = /^\+?(\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/;
    return regex.test(v);
}

function isValidHours(hours) {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]\s?-\s?([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(hours);
}

function isValidRole(role) {
    return role && ["client", "restaurateur", "livreur", "admin"].includes(role)
}

function isValidPrice(price) {
    return price >= 0
}

module.exports = {isValidEmail, isValidPhone, isValidHours, isValidRole, isValidPrice}