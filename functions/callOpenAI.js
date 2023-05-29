const { Configuration, OpenAIApi } = require('openai');
const cors = require('cors')({ origin: true });
const functions = require('firebase-functions');

const openaiApiKey = functions.config().openai.key;

const chatgpt = async function (req, res) {
    cors(req, res, async () => {
        const systemPrompt = req.body.systemPrompt;
        const userInput = req.body.userInput;

        const configuration = new Configuration({
            apiKey: openaiApiKey,
        });

        const openai = new OpenAIApi(configuration);

        try {
            const response = await openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt,
                    },
                    {
                        role: 'user',
                        content: userInput,
                    },
                ],
                max_tokens: 150,
                n: 1,
                stop: null,
                temperature: 0.7,
            });

            res.status(200).send(response.data.choices[0].message.content);
        } catch (error) {
            res.status(500).send(error);
        }
    });
};

module.exports = { chatgpt };
