require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));


const OpenAI = require('openai');
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Chatbot API Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful diabetes care assistant. Provide concise, accurate information about managing diabetes, including medications, diet, exercise, and blood sugar level management. Focus on Type 1 and Type 2 diabetes. Always recommend consulting with a healthcare professional for personalized advice."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        });
        
        res.json({
            reply: response.data.choices[0].message.content
        });
    } catch (error) {
        console.error('Error with OpenAI API:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

// Questions API Endpoints (simplified)
let questions = [];

app.post('/api/questions', (req, res) => {
    const { title, details } = req.body;
    const newQuestion = {
        id: Date.now(),
        title,
        details,
        date: new Date().toLocaleDateString(),
        status: 'Pending'
    };
    questions.push(newQuestion);
    res.status(201).json(newQuestion);
});

app.get('/api/questions', (req, res) => {
    res.json(questions);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});