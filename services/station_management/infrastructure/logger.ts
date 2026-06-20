import pino from 'pino';

export const logger = pino({
  name: 'station_management',
  level: process.env.NODE_ENV === 'test' ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
  ...(process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && {
    transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } },
  }),
});
