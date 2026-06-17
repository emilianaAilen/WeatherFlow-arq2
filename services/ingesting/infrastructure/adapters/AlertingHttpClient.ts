import { IAlertingClient, MeasurementPayload } from '@/infrastructure/ports';

export class AlertingApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AlertingApiError';
  }
}

export class AlertingHttpClient implements IAlertingClient {
  constructor(private readonly baseUrl: string) {}

  async postMeasurement(payload: MeasurementPayload): Promise<void> {
    const response = await fetch(`${this.baseUrl}/measurements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new AlertingApiError(`Alerting API responded with status ${response.status}`);
    }
  }
}
