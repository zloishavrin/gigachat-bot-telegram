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
    
                await bot.sendMessage(chatId, 'Добро пожаловать в GPTBot!\n\nЧем я могу Вам помочь?', {
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
                bot.sendMessage(chatId, 'Вы выбрали режим генерации картинок!\n\nЧто вы хотите изобразить?');
            }
            else if(msg.text === 'Сгенерировать ответ') {
                user.mode = 'GPT';
                await user.save();
                bot.sendMessage(chatId, 'Вы выбрали режим генерации ответов!\n\nЧем я могу Вам помочь?');
            }
            else {
                const waitMessage = await bot.sendMessage(chatId, 'Пожалуйста, подождите...');
                if(user.mode === 'GPT') {
                    try {
                        const response = await openai.chat.completions.create({
                            messages: [
                                {
                                    role: 'user',
                                    content: user.lastMessage
                                },
                                {
                                    role: 'assistant',
                                    content: user.lastCompetion
                                },
                                { 
                                    role: 'user', 
                                    content: msg.text 
                                }
                            ],
                            model: 'gpt-4o',
                        });
                        const answer = response.choices[0].message.content;

                        user.lastMessage = msg.text;
                        user.lastCompetion = answer;
                        await user.save()

                        await bot.deleteMessage(chatId, waitMessage.message_id);
                        await bot.sendMessage(chatId, answer);
                    }
                    catch(error) {
                        console.log(error);
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
                        console.log(error);
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