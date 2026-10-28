import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 2 },
    { duration: '20s', target: 5 },
    { duration: '30s', target: 5 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const res = http.get('https://upmatch.tcmg.me/about', {
    timeout: '15s',
    tags: { name: 'public_about' },
  });

  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'HTML received': (r) =>
      (r.headers['Content-Type'] || '').includes('text/html'),
    'UPyes content': (r) => r.body.includes('UPyes'),
  });

  sleep(1);
}