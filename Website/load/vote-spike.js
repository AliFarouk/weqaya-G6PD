import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '30s', target: 150 },   // 150 votes/s peak per §7.1
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],    // 95% of votes below 300ms
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const TARGET_ITEM_ID = 1; // Popular hot item

export default function () {
  // Generate distinct virtual user token simulation
  const vuId = __VU * 10000 + __ITER;
  const voteType = Math.random() > 0.3 ? 'safe' : 'hemolysis';

  // Fast registration for token
  const authPayload = JSON.stringify({
    name: `مشارك ${vuId}`,
    identifier: `vu_${vuId}_${Date.now()}@weqaya.load`,
    password: 'Password123!',
    is_doctor: false,
  });

  const regRes = http.post(`${BASE_URL}/api/auth/register`, authPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (regRes.status === 201) {
    const token = JSON.parse(regRes.body).token;

    // Submit Atomic Vote
    const votePayload = JSON.stringify({ vote_type: voteType });
    const voteRes = http.post(`${BASE_URL}/api/items/${TARGET_ITEM_ID}/vote`, votePayload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    check(voteRes, {
      'vote status is 200': (r) => r.status === 200,
      'stats returned': (r) => JSON.parse(r.body).updated_stats !== undefined,
    });
  }

  sleep(0.5);
}
