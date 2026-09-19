import { saveJobs } from "./db.js"

/*a small line of code that takes a number in 
milliseconds and returns a Promise that resolves after that 
duration using setTimeout. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class Worker {
    constructor(queue, options = {}) {
        this.queue = queue;
        this.isRunning = false;
        this.pollInterval = options.pollInterval || 100;
        this.activeJobs = 0;
    };

    start() { 
        if ( this.isRunning ) { 
            return true;
        }
        this.isRunning = true;
        this.run();
    }
    
    async run() {
        while(this.isRunning) {
            const job = this.queue.pop();
            
            if (job!== null) {
                await this.processJob(job);
            } else { 
                await sleep(this.pollInterval);
            }
        }
    }

    async processJob(rawJob) {
        this.activeJobs++;
        
        try {
            let payload;
            try { 
                payload = typeof rawJob === 'string' ? JSON.parse(rawJob) : rawJob;
            } catch { 
                payload = { raw: rawJob };
            }

            await saveJobs(payload, 'completed');
        } catch (err) {
            await saveJobs(rawJob, 'failed', err.message);
        } finally { 
            this.activeJobs--;
        }
    }

    async stop() {
        this.isRunning = false;

        while (this.activeJobs > 0 ) {
            await sleep(50);
        }
    }

}; // class worker close bracket

export default Worker; // exporting the class