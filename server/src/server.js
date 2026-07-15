import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.get('/health', (_req, res) => res.json({ ok: true, app: 'SprintHub' }));
app.use((req, res) => { res.status(404).json({ message: 'Not found' }); });
app.use((err, req, res, next) => { console.error('Error:', err); res.status(err.status||500).json({ message: err.message||'Internal server error' }); });
app.listen(env.PORT||8081, () => { console.log(`SprintHub API on port ${env.PORT||8081}`); });
