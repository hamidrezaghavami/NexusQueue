import { createRequire } from 'node:module'; const { Queue } = createRequire(import.meta.url)('../build/Release/queue_native.node');

export class NexusQueue {
    constructor(options = {}) { 
        const capacity = options?.capacity ?? 1000
        this.queue = new Queue(capacity);
    }

    push(data) {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        const success = this.queue.push(payload);

        if (!success) {
            throw new Error("Queue is full1");
        }
        return true;
    }

    pop() { 
        const raw = this.queue.pop();
        if ( raw === null ) return null;

        try { 
            return JSON.parse(raw);
        } catch { 
            return raw;
        }
    }

    peek() { 
        const raw = this.queue.peek();
        if ( raw === null ) return null;
        try { 
            return JSON.parse(raw);
        } catch { 
            return raw;
        }
    }

    size() { 
        return this.queue.size();
    }

    isEmpty() { 
        return this.queue.isEmpty();
    }

    pushMany(items) { 
        
        if (!Array.isArray(items)) { 
            throw new TypeError("Expected an array of items");
        }
        
        let inserted = 0;
        for ( const item of items ) {
            try { 
                this.push(item);
                inserted++;
            } catch { 
                break;
            }
        }
        return inserted;
    }

    popMany (count = 10) {
        let results = [];

        for ( let i = 0; i < count; ++i ) {
            const item = this.pop();
            if ( item === null ) { 
                break;
            }
            results.push(item);
        }
        return results;
    }
}