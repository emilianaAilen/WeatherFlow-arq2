import cron from 'node-cron';
import { IngestionScheduler } from './IngestionScheduler';
import { WeatherIngestionService } from '@/application/WeatherIngestionService';

jest.mock('node-cron');

describe('IngestionScheduler', () => {
  let ingestionService: jest.Mocked<Pick<WeatherIngestionService, 'runIngestionCycle'>>;
  let mockTask: { stop: jest.Mock };
  let scheduler: IngestionScheduler;

  beforeEach(() => {
    ingestionService = { runIngestionCycle: jest.fn().mockResolvedValue(undefined) };
    mockTask = { stop: jest.fn() };
    (cron.schedule as jest.Mock).mockReturnValue(mockTask);
    scheduler = new IngestionScheduler(ingestionService as unknown as WeatherIngestionService, '*/5 * * * *');
  });

  afterEach(() => jest.clearAllMocks());

  const getCronCallback = () => (cron.schedule as jest.Mock).mock.calls[0][1] as () => Promise<void>;

  it('should register a cron task with the given expression on start()', () => {
    scheduler.start();

    expect(cron.schedule).toHaveBeenCalledWith('*/5 * * * *', expect.any(Function));
  });

  it('should call runIngestionCycle when the cron fires', async () => {
    scheduler.start();
    await getCronCallback()();

    expect(ingestionService.runIngestionCycle).toHaveBeenCalledTimes(1);
  });

  it('should skip tick if previous cycle is still running (isRunning guard)', async () => {
    let resolveCycle!: () => void;
    ingestionService.runIngestionCycle.mockReturnValue(
      new Promise<void>((resolve) => { resolveCycle = resolve; }),
    );

    scheduler.start();
    const callback = getCronCallback();

    const firstTick = callback();  // starts, does not finish
    await callback();               // second tick — should be skipped

    expect(ingestionService.runIngestionCycle).toHaveBeenCalledTimes(1);

    resolveCycle();
    await firstTick;
  });

  it('should reset isRunning after the cycle completes', async () => {
    scheduler.start();
    const callback = getCronCallback();

    await callback();  // first tick completes
    await callback();  // second tick should run normally

    expect(ingestionService.runIngestionCycle).toHaveBeenCalledTimes(2);
  });

  it('should reset isRunning even if the cycle throws', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    ingestionService.runIngestionCycle
      .mockRejectedValueOnce(new Error('cycle failed'))
      .mockResolvedValueOnce(undefined);

    scheduler.start();
    const callback = getCronCallback();

    await callback();  // throws but isRunning resets
    await callback();  // should run normally

    expect(ingestionService.runIngestionCycle).toHaveBeenCalledTimes(2);
    consoleErrorSpy.mockRestore();
  });

  it('should call task.stop() when stop() is called', () => {
    scheduler.start();
    scheduler.stop();

    expect(mockTask.stop).toHaveBeenCalledTimes(1);
  });

  it('should not throw when stop() is called before start()', () => {
    expect(() => scheduler.stop()).not.toThrow();
  });
});
