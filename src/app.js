import express from 'express';

import app from './server.js';

// Vercel's Express detector requires this entry module to import Express.
// The configured application is assembled in server.js.
void express;

export default app;
