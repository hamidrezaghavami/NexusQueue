import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    database: process.env.PGDATABASE || "nexusqueue",
    max: 20,
    idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
    console.log("Unexpected error on idle PostgreSQL client", err);
})

export async function initDB() {
    const queryText = `
        CREATE TABLE IF NOT EXISTS jobs (
            id BIGSERIAL PRIMARY KEY,
            payload JSONB NOT NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'completed',
            processed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            error_message TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    `;
    await pool.query(queryText);
}

export async function saveJobs(payload, status = 'completed', error_message = null ) { 
    const queryJobs = `
        INSERT INTO jobs (payload, status, error_message)
        VALUES ( $1, $2, $3)
        RETURNING *;
    `;
    const res = await pool.query(queryJobs, [payload, status, error_message]);
    return res.rows[0];
}

export async function getJobStats() {
    const queryStats = `
        SELECT status, COUNT(*)::int AS count
        FROM jobs
        GROUP BY status;
        `;
        const res = await pool.query(queryStats);
        return res.rows;
}

export async function query(text, params) {
    await pool.query(text, params);
}

export async function closeDB() {
    pool.end();
    console.log("Database connection pool closed.!");
}