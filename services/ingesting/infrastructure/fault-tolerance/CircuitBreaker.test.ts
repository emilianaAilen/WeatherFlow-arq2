import { CircuitBreaker, CircuitOpenError } from './CircuitBreaker';

const OPTIONS = { failureThreshold: 3, successThreshold: 2, openDurationMs: 30_000 };

describe('CircuitBreaker', () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    jest.useFakeTimers();
    cb = new CircuitBreaker(OPTIONS);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const succeed = () => cb.execute(() => Promise.resolve('ok'));
  const fail = () => cb.execute(() => Promise.reject(new Error('fail')));

  describe('CLOSED state', () => {
    it('should start in CLOSED state', () => {
      expect(cb.getState()).toBe('CLOSED');
    });

    it('should execute and return result when function succeeds', async () => {
      const result = await succeed();
      expect(result).toBe('ok');
      expect(cb.getState()).toBe('CLOSED');
    });

    it('should transition to OPEN after reaching failureThreshold', async () => {
      await expect(fail()).rejects.toThrow('fail');
      await expect(fail()).rejects.toThrow('fail');
      expect(cb.getState()).toBe('CLOSED');
      await expect(fail()).rejects.toThrow('fail');
      expect(cb.getState()).toBe('OPEN');
    });

    it('should reset failure count on success', async () => {
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      await succeed();
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      expect(cb.getState()).toBe('CLOSED'); // needs one more failure to open
    });
  });

  describe('OPEN state', () => {
    beforeEach(async () => {
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      expect(cb.getState()).toBe('OPEN');
    });

    it('should throw CircuitOpenError without calling the function', async () => {
      const fn = jest.fn().mockResolvedValue('ok');
      await expect(cb.execute(fn)).rejects.toThrow(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after openDurationMs', async () => {
      jest.advanceTimersByTime(OPTIONS.openDurationMs);
      const fn = jest.fn().mockResolvedValue('ok');
      await cb.execute(fn);
      expect(cb.getState()).toBe('HALF_OPEN');
    });

    it('should remain OPEN before openDurationMs elapses', async () => {
      jest.advanceTimersByTime(OPTIONS.openDurationMs - 1);
      await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow(CircuitOpenError);
      expect(cb.getState()).toBe('OPEN');
    });
  });

  describe('HALF_OPEN state', () => {
    beforeEach(async () => {
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      await expect(fail()).rejects.toThrow();
      jest.advanceTimersByTime(OPTIONS.openDurationMs);
    });

    it('should transition to CLOSED after successThreshold successes', async () => {
      await succeed();
      expect(cb.getState()).toBe('HALF_OPEN');
      await succeed();
      expect(cb.getState()).toBe('CLOSED');
    });

    it('should transition back to OPEN on failure', async () => {
      await succeed(); // first success in HALF_OPEN
      await expect(fail()).rejects.toThrow('fail');
      expect(cb.getState()).toBe('OPEN');
    });
  });
});
