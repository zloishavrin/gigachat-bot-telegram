const TelegramBot = require('node-telegram-bot-api');
const User = require('./models/User');
const OpenAI = require('openai').OpenAI;

const bot = new TelegramBot(process.env.BOT_TOKEN, { 
    polling: true
});

const openai = new OpenAI({
    apiKey: process.env.BOT_GPT
});

const startBot = () => {
    bot.on('message', async (msg) => {
        try {
            const chatId = msg.chat.id;
            const user = await User.findOne({ chatId });
            if(msg.text === '/start') {
                if(!user) {
                    User.create({ chatId, mode: 'GPT' });
                }
    
                await bot.sendMessage(chatId, 'Добро пожаловать в КарунаБот!', {
                    reply_markup: {
                        keyboard: [
                            ['Сгенерировать ответ'],
                            ['Сгенерировать картинку']
                        ],
                        resize_keyboard: true
                    }
                })
            }
            else if(msg.text === 'Сгенерировать картинку') {
                user.mode = 'IMG';
                await user.save();
                bot.sendMessage(chatId, 'Вы выбрали режим генерации картинок!');
            }
            else if(msg.text === 'Сгенерировать ответ') {
                user.mode = 'GPT';
                await user.save();
                bot.sendMessage(chatId, 'Вы выбрали режим генерации ответов!');
            }
            else {
                const waitMessage = await bot.sendMessage(chatId, 'Пожалуйста, подождите...');
                if(user.mode === 'GPT') {
                    try {
                        const response = await openai.chat.completions.create({
                            messages: [{ role: 'user', content: msg.text }],
                            model: 'gpt-4',
                        });
                        const answer = response.choices[0].message.content;
                        await bot.deleteMessage(chatId, waitMessage.message_id);
                        await bot.sendMessage(chatId, answer);
                    }
                    catch(error) {
                        await bot.deleteMessage(chatId, waitMessage.message_id);
                        await bot.sendMessage(chatId, 'Не удалось сгенерировать ответ.');
                    }
                }
                else {
                    try {
                        const image = await openai.images.generate({ 
                            model: "dall-e-3", 
                            prompt: msg.text 
                        });
                        await bot.deleteMessage(chatId, waitMessage.message_id);
                        await bot.sendPhoto(chatId, image.data.url);
                    }
                    catch(error) {
                        await bot.deleteMessage(chatId, waitMessage.message_id);
                        await bot.sendMessage(chatId, 'Не удалось сгенерировать ответ.');
                    }
                }
            }
        }
        catch(error) {
            console.log(error);
        }
    })
}

module.exports = {
    startBot: startBot
}