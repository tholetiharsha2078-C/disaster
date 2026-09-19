import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { generateEmergencyAdvice } from './backend/assistant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Disaster Response & React Platform', timestamp: new Date().toISOString() });
  });

  // Emergency Assistant API
  app.post('/api/assistant/chat', async (req, res) => {
    try {
      const { message, context } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      const reply = await generateEmergencyAdvice(message, context);
      res.json({ reply });
    } catch (error) {
      console.error('Error in /api/assistant/chat:', error);
      res.status(500).json({ error: 'Failed to generate guidance' });
    }
  });

  // Vite middleware for development vs Static file serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Disaster Response Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
