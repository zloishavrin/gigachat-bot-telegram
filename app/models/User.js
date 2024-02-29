const { Schema, model } = require('mongoose');

const User = new Schema({
    chatId: { type: String, required: true, unique: true },
    mode: { type: String, required: true },
})

module.exports = model('User', User);