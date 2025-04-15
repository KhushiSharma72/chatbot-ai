require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Securely load API key from environment variables
const OPENAI_KEY = process.env.OPENAI_KEY;

app.post('/api/ask', async (req, res) => {
  const { message, userData } = req.body;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are GlucoBot, a medical assistant for diabetes patients. " +
                    `User profile: ${userData.age}yo, ${userData.diabetesType}. ` +
                    "Provide concise, accurate advice."
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("OpenAI Error:", error.response?.data || error.message);
    res.status(500).json({ error: "AI service error" });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));