const express = require('express');
const helmet = require('helmet');

const VERSION = process.env.APP_VERSION || 'dev';
const MAX_NOTE_LENGTH = 200;

function validateNote(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return 'text is required';
  }
  if (text.length > MAX_NOTE_LENGTH) {
    return `text must be at most ${MAX_NOTE_LENGTH} characters`;
  }
  return null;
}

function createApp() {
  const app = express();
  const notes = [];

  app.disable('x-powered-by');
  app.use(helmet());                       // secure HTTP headers
  app.use(express.json({ limit: '10kb' })); // reject huge bodies

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/', (_req, res) => res.json({ service: 's17-devsecops-demo', version: VERSION }));

  app.get('/notes', (_req, res) => res.json(notes));

  app.post('/notes', (req, res) => {
    const error = validateNote(req.body && req.body.text);
    if (error) {
      return res.status(400).json({ error });
    }
    const note = { id: notes.length + 1, text: req.body.text.trim() };
    notes.push(note);
    return res.status(201).json(note);
  });

  return app;
}

module.exports = { createApp, validateNote, VERSION };
