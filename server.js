const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Caption Magic Server Running' });
});

// Captions with user's API key
app.post('/api/captions/generate', async (req, res) => {
  try {
    const { text, language, groqApiKey, geminiApiKey, provider } = req.body;
    
    if (provider === 'groq') {
      if (!groqApiKey) return res.status(400).json({ error: 'Groq API key required' });
      
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'mixtral-8x7b-32768',
          messages: [{
            role: 'user',
            content: `Generate captions in ${language} for: ${text}`
          }]
        },
        {
          headers: { Authorization: `Bearer ${groqApiKey}` }
        }
      );
      
      res.json({ captions: response.data.choices[0].message.content });
    } 
    else if (provider === 'gemini') {
      if (!geminiApiKey) return res.status(400).json({ error: 'Gemini API key required' });
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          contents: [{
            parts: [{
              text: `Generate captions in ${language} for: ${text}`
            }]
          }]
        }
      );
      
      res.json({ captions: response.data.candidates[0].content.parts[0].text });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Video upload
app.post('/api/video/upload', upload.single('video'), async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Video received',
      fileName: req.file.originalname 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Caption Magic Server on port ${PORT}`));
