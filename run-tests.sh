#!/bin/bash

SERVICES=("station_management" "alerting" "ingesting")
OVERALL=0
SUMMARY=""

print_header() {
  echo ""
  echo "======================================"
  echo "  $1"
  echo "======================================"
}

run_tests() {
  local service=$1
  local label=$2
  local jest_args=$3

  echo ""
  echo "▶ [$service] $label"
  echo "--------------------------------------"

  (cd "services/$service" && npx jest $jest_args --no-coverage --forceExit 2>&1)
  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    SUMMARY="${SUMMARY}\n  ${service} / ${label}: ✅ PASS"
  else
    SUMMARY="${SUMMARY}\n  ${service} / ${label}: ❌ FAIL"
    OVERALL=1
  fi
}

print_header "Running Unit Tests"
for service in "${SERVICES[@]}"; do
  run_tests "$service" "unit" "--testPathIgnorePatterns='tests/integration'"
done

print_header "Running Integration Tests"
for service in "${SERVICES[@]}"; do
  run_tests "$service" "integration" "tests/integration"
done

print_header "Test Summary"
echo -e "$SUMMARY"
echo ""

if [ $OVERALL -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed."
fi

exit $OVERALL
