# NexusQueue

A hybrid, high-throughput in-memory background job processing engine. NexusQueue pairs a low-level C++ queue core (via Node-API) with an asynchronous Node.js / Express REST API and PostgreSQL persistence, designed for predictable low-latency task scheduling and worker execution.

---

## Architecture Overview

```text
 Client (HTTP / REST)
         │
         ▼
 ┌─────────────────────────────────────────┐
 │       Express.js Application Layer      │
 │  • Input validation & route handling    │
 │  • Asynchronous worker dispatch         │
 └────────────────────┬────────────────────┘
                      │ Node-API (`node-addon-api`)
                      ▼
 ┌─────────────────────────────────────────┐
 │       C++ Native Queue Core Engine      │
 │  • In-memory Thread-Safe Circular Queue │
 │  • Min/Max Priority Binary Heap         │
 │  • Sub-millisecond enqueue/dequeue      │
 └────────────────────┬────────────────────┘
                      │ (Job Completion / State Sync)
                      ▼
 ┌─────────────────────────────────────────┐
 │          PostgreSQL Persistence         │
 │  • Job audit log & status tracking      │
 └─────────────────────────────────────────┘
 ```
---

## File Architecture
```
NexusQueue/
├── src/
│   ├── queue.cpp          # Core C++ Queue DSA & Node-API bindings
│   ├── db.js              # PostgreSQL client connection & queries
│   ├── worker.js          # Async background worker consuming from queue
│   └── server.js          # Express REST API endpoints
├── tests/
│   ├── queue.test.js      # Jest unit & integration test suite
│   └── load-test.js       # k6 performance & benchmark script
├── eslint.config.mjs      # ESLint code style rules
├── binding.gyp            # C++ build config for node-gyp
├── Dockerfile             # Container setup
├── .dockerignore          # Docker ignore file
├── package.json           # Scripts & dependencies
└── README.md
```
---
## Tech Stack
*Core Queue Engine:* C++ (Thread-Safe Ring Buffer / Priority Queue)
*Addon Binding:* Node-API (node-addon-api, node-gyp)
*API Framework:* Node.js, Express.js
*Persistence:* PostgreSQL
*Testing & Quality:* Jest (Unit/Integration), ESLint
*Performance Testing:* k6 Engine
*Containerization:* Docker & Docker Compose

## Key Features
*Native Memory Management:* Core queue allocations and scheduling live in `C++`, minimizing `garbage collection overhead`.
*Non-Blocking REST Endpoints:* Accepts client workloads via standard HTTP 202 Accepted patterns.
*Pluggable DSA:* Supports standard `FIFO` circular buffers or Priority Queues via custom binary heaps.
*State Persistence:* Audits job state transitions (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`) to `PostgreSQL`.
*Load Verified:* Pre-configured `k6 test scripts` to measure enqueue/dequeue latency under sustained load.

## Prerequisites
**Node.js (>= 18.x)**
**C++17 compliant compiler (gcc, clang, or MSVC)**
**Python 3 (required by node-gyp)**
**Docker & Docker Compose**

---

### Clone the repository:
```bash
git clone [https://github.com/your-username/nexus-queue.git](https://github.com/hamidrezaghavami/NexusQueue.git)
cd nexus-queue
```
Start PostgreSQL via Docker & Run the server:
```bash
docker-compose up -d db
npm run dev
```
### Testing & Benchmarking:
Jest:
`npm run test`

Code Quality & Linting:
`npx eslint .`

Load Testing with k6:
` node --env-file=.env src/server.js `
in another terminal write:
`k6 run load-test.js`

### Performance & Load Test Results (k6)
```
Tested with 200 concurrent virtual users over 50 seconds.

✓ error_rate.....................: 0.00%   (Zero server crashes)
✓ http_req_duration (p95)........: 42.81ms (Unblocked event loop)

http_reqs........................: 228,195 (4,563 requests/second)
jobs_enqueued....................: 34,406  (688 DB writes/second)
queue_full_errors (HTTP 429).....: 193,789 (Expected backpressure)
```