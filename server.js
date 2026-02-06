const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const NEWS_API_KEY = process.env.NEWS_API_KEY;

app.get('/', (req, res) => {
  res.json({ status: 'TNews Backend is running!' });
});

app.get('/api/news/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=20&apiKey=${NEWS_API_KEY}`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok') {
      res.json(data);
    } else {
      res.status(400).json({ error: data.message || 'Failed to fetch news' });
    }
  } catch (error) {
    console.error('News fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'ok') {
      res.json(data);
    } else {
      res.status(400).json({ error: data.message || 'Failed to search news' });
    }
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/synthesize', async (req, res) => {
  try {
    const { article, level } = req.body;
    
    if (!article || !level) {
      return res.status(400).json({ error: 'Article and level required' });
    }
    
    const prompts = {
      summary: `Provide a concise 2-3 sentence summary of this news article. Focus on the key facts and main point: "${article.title}". ${article.description || ''}`,
      expert: `Provide expert analysis of this news topic in 4-5 sentences. Include different perspectives, context, and implications: "${article.title}". ${article.description || ''}`,
      deep: `Provide a comprehensive deep dive analysis in 6-8 sentences covering: timeline, stakeholder perspectives, broader implications, and related contexts for: "${article.title}". ${article.description || ''}`
    };

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompts[level] }]
    });

    const synthesis = message.content[0].text;
    res.json({ synthesis });
  } catch (error) {
    console.error('Synthesis error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 TNews Backend running on port ${PORT}`);
});