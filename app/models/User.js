const { Schema, model } = require('mongoose');

const User = new Schema({
    chatId: { type: String, required: true, unique: true },
    mode: { type: String, required: true },
    lastMessage: { type: String, default: "Привет!" },
    lastCompetion: { type: String, default: "Привет!" }
})

module.exports = model('User', User);