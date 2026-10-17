import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },   // Ramp-up to 500 VUs
    { duration: '1m', target: 1500 },   // Scale to 1,500 VUs
    { duration: '30s', target: 0 },      // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<150'],    // 95% of requests must complete below 150ms per §7.1
    http_req_failed: ['rate<0.005'],     // Error rate < 0.5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const QUERIES = ['طعمية', 'ريفو', 'لانشون', 'كتاكيتو', 'بنادول', 'فول', 'شيبسي', 'حمص'];

export default function () {
  // 1. Browse main feed with category filter
  const cat = Math.random() > 0.5 ? 'food' : 'medication';
  const feedRes = http.get(`${BASE_URL}/api/items?category=${cat}&limit=20`);
  check(feedRes, {
    'feed status is 200': (r) => r.status === 200,
    'feed has items': (r) => JSON.parse(r.body).data.length > 0,
  });

  sleep(0.5);

  // 2. Instant search query
  const randomQ = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const searchRes = http.get(`${BASE_URL}/api/items?q=${encodeURIComponent(randomQ)}`);
  check(searchRes, {
    'search status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
