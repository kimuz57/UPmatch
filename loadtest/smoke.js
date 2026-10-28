import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    checks: ['rate>0.99'],
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const res = http.get('https://upmatch.tcmg.me/about', {
    redirects: 5,
    timeout: '15s',
    tags: { name: 'public_about' },
  });

  check(res, {
    'HTTP status is 200': (r) => r.status === 200,
    'HTML response received': (r) =>
      (r.headers['Content-Type'] || '').includes('text/html'),
    'UPyes page content exists': (r) =>
      r.body.includes('UPyes'),
  });

  sleep(1);
}