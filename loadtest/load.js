import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '40s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export default function () {
  const token = __ENV.UPMATCH_TOKEN || '';
  const email = __ENV.UPMATCH_EMAIL || '';

  const res = http.get('https://upmatch.tcmg.me/swipe', {
    headers: {
      Cookie: `up_match_token=${token}; upmatch_email=${email}`,
    },
    redirects: 0,
    tags: { page: 'swipe' },
  });

  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'HTML response': (r) =>
      (r.headers['Content-Type'] || '').includes('text/html'),
    'not redirected to login': (r) => r.status !== 307 && r.status !== 302,
  });

  sleep(1);
}
