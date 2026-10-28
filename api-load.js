import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = 'https://upmatch.tcmg.me/api/v1';

export const options = {
  stages: [
    { duration: '5s', target: 10 },
    { duration: '20s', target: 10 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const email = encodeURIComponent(__ENV.UPMATCH_EMAIL || '');

  const endpoints = [
    { name: 'feed', url: `${BASE}/feed?limit=10&email=${email}` },
    { name: 'me', url: `${BASE}/me?email=${email}` },
    { name: 'who-likes-me', url: `${BASE}/who-likes-me?email=${email}` },
    { name: 'matches', url: `${BASE}/matches?email=${email}` },
    { name: 'chats', url: `${BASE}/chats?email=${email}` },
  ];

  for (const endpoint of endpoints) {
    const res = http.get(endpoint.url, {
      tags: { endpoint: endpoint.name },
    });

    check(res, {
      [`${endpoint.name}: HTTP 2xx`]: (r) =>
        r.status >= 200 && r.status < 300,
    });
  }

  sleep(1);
}