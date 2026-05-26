#!/bin/bash
set -e

echo "======================================"
echo "Starting E2E Environment..."
echo "======================================"

docker-compose -f docker-compose.e2e.yml up -d --build

echo "Waiting for APIs to be ready on ports 4010 and 4011..."
npx wait-on tcp:4010 tcp:4011 -t 30000

echo "======================================"
echo "Running E2E Tests..."
echo "======================================"

cd tests/e2e
if [ ! -d "node_modules" ]; then
  npm install
fi

TEST_EXIT_CODE=0
npm run test:e2e || TEST_EXIT_CODE=$?

cd ../..

echo "======================================"
echo "Tearing down E2E Environment..."
echo "======================================"

docker-compose -f docker-compose.e2e.yml down -v

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ E2E Tests Passed!"
  exit 0
else
  echo "❌ E2E Tests Failed!"
  exit $TEST_EXIT_CODE
fi
