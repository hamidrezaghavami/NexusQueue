import 'dotenv/config';
import { NexusQueue } from './index.js';
import { Worker } from './worker.js';
import { getJobStats, initDB, closeDB } from './db.js';
import express from 'express';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT) || 3000;

const queue = new NexusQueue({capacity: 10000});
const worker = new Worker(queue, { pollInterval: 50});

// ingest jobs
app.post('/jobs', (req,res) => {
    try {
    queue.push(req.body);
    res.status(201).json({ status: 'enqueued'});
    } catch (err) { 
        res.status(429).json({ error: err.message });
    }
});

// Queue & DB Stats
app.get('/stats', async (req,res) => {
    try {
    const dbStats = await getJobStats();
    res.status(200).json({
        queueSize: queue.size(),
        dbStats,
    });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health Check
app.get('/health', (req,res) => {
    res.status(200).json({ status: 'ok'});
});

// Bootstrap Server & Worker
async function startServer() {
    try { 
        await initDB();
        worker.start();

        const server = app.listen(PORT, () => { 
            console.log(`Server is running on port ${PORT}`);
        });

        const shutdown = async () => { 
            console.log('\nShutting down gracefully...');
            server.close();
            await worker.stop();
            await closeDB();
            process.exit(0);
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (err) { 
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

startServer();