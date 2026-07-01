import { logger } from '@/infrastructure/logger';
import { owmCircuitBreakerState } from '@/infrastructure/telemetry/metrics';

export class CircuitOpenError extends Error {
  constructor() {
    super('Circuit breaker is OPEN');
    this.name = 'CircuitOpenError';
  }
}

enum CircuitState {
  CLOSED,
  OPEN,
  HALF_OPEN,
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  openDurationMs: number;
  name?: string;
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private openedAt: number | null = null;
  private readonly name: string;

  constructor(private readonly options: CircuitBreakerOptions) {
    this.name = options.name ?? 'unknown';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.openedAt! >= this.options.openDurationMs) {
        this.state = CircuitState.HALF_OPEN;
        this.failureCount = 0;
        this.successCount = 0;
        owmCircuitBreakerState.set(2);
        logger.info({ service: this.name }, 'Circuit breaker probing (HALF_OPEN)');
      } else {
        logger.warn({ service: this.name }, 'Circuit breaker is OPEN, request skipped');
        throw new CircuitOpenError();
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return CircuitState[this.state] as 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        this.openedAt = null;
        owmCircuitBreakerState.set(0);
        logger.info({ service: this.name }, 'Circuit breaker recovered (CLOSED)');
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
      this.failureCount = 0;
      owmCircuitBreakerState.set(1);
      logger.warn({ service: this.name }, 'Circuit breaker re-opened during probe');
      return;
    }
    this.failureCount++;
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.openedAt = Date.now();
      owmCircuitBreakerState.set(1);
      logger.warn({ service: this.name, failureCount: this.failureCount }, 'Circuit breaker opened');
    }
  }
}
