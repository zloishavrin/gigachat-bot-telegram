
const mongoose = require('mongoose');
const startBot = require('./bot').startBot;

const dbUri = `mongodb://${process.env.MONGO_ROOT_USER}:${process.env.MONGO_ROOT_PASSWORD}@mongo:27017/karuna?authSource=admin`;

const start = async () => {
    try {
        await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true })
        startBot();
    }
    catch(error) {
        console.log(error);
    }
}

start();

