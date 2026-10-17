import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
    { duration: '1m', target: 5000 },   // Target 5,000 concurrent users per §7.1
    { duration: '30s', target: 5000 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<250'],
    http_req_failed: ['rate<0.02'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const rand = Math.random();

  if (rand < 0.7) {
    // 70% Reads: Feed or Item Search
    http.get(`${BASE_URL}/api/items?limit=20`);
  } else if (rand < 0.9) {
    // 20% Search
    http.get(`${BASE_URL}/api/items?q=ريفو`);
  } else {
    // 10% Health probe
    http.get(`${BASE_URL}/api/health`);
  }

  sleep(1);
}
