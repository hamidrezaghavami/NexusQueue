import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate } from 'k6/metrics';

// Custom benchmark metrics
const jobsEnqueued = new Counter('jobs_enqueued');
const queueFullErrors = new Counter('queue_full_errors');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Ramp up to 50 virtual users
    { duration: '30s', target: 200 }, // Stress test at 200 virtual users
    { duration: '10s', target: 0 },   // Ramp down to 0
  ],
  thresholds: {
    // 95% of ingestion requests must complete within 50ms
    http_req_duration: ['p(95)<50'],
    // Unhandled server errors (500s) must stay below 1%
    error_rate: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    task: 'process_transaction',
    userId: Math.floor(Math.random() * 100000),
    amount: (Math.random() * 500).toFixed(2),
    timestamp: Date.now(),
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/jobs`, payload, params);

  const isSuccess = check(res, {
    'status is 201': (r) => r.status === 201,
  });

  if (isSuccess) {
    jobsEnqueued.add(1);
    errorRate.add(0);
  } else if (res.status === 429) {
    // Expected behavior when C++ circular buffer capacity is reached
    queueFullErrors.add(1);
    errorRate.add(0);
  } else {
    // Unexpected crash or 500 error
    errorRate.add(1);
  }

  sleep(0.01);
}