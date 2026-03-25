# K6 Load Tests

These scripts are split into two groups:

- `public-pages-load.k6.js`
  Safe against the live site defined by `APP_BASE_URL`.
- `homepage-journey-load.k6.js`
  Safe against the live site defined by `APP_BASE_URL`.
- `login-load.local-only.k6.js`
  Transactional and blocked for non-local targets unless you explicitly opt in.
- `mock-purchase-flow.local-only.k6.js`
  Transactional and blocked for non-local targets unless you explicitly opt in.

## Safe Production Usage

These commands use `APP_BASE_URL` from `.env` through `scripts/run-k6.mjs`.

```bash
npm run load:public-pages
npm run load:homepage-journey
```

Custom concurrency and duration:

```bash
VUS=50 DURATION=30s npm run load:public-pages
VUS=50 DURATION=45s npm run load:homepage-journey
```

## Local / Test-Only Transactional Usage

Run these only against a local or test environment where:

- `PAYMENT_MODE=test`
- test users are disposable
- no real payment processor is involved

Login load example with 50 different users:

```bash
BASE_URL=http://localhost:3000 \
LOGIN_USERS_JSON='[{"username":"user1","password":"1234"},{"username":"user2","password":"1234"}]' \
VUS=50 ITERATIONS=50 \
npm run load:login
```

Mock purchase flow example with 10 concurrent dummy purchases:

```bash
BASE_URL=http://localhost:3000 \
VUS=10 ITERATIONS=10 \
npm run load:mock-purchase
```

## Reports

Each run writes a JSON summary into `tests/load/reports/` with:

- request failure rate
- average request time
- p95 request time
- average iteration time
- checks pass rate

## Notes

- `k6` must be installed on the machine.
- Production-safe scripts only hit public pages.
- The transactional scripts intentionally refuse remote hosts unless `ALLOW_REMOTE_TRANSACTIONAL_LOAD=1` is set.
