import { DomainError } from '../../errors/DomainError';

export class SubscriptionsList {
  readonly stationIds: string[];

  constructor(stationIds: string[] = []) {
    this.stationIds = stationIds;
  }

  static create(stationIds: string[] = []): SubscriptionsList {
    return new SubscriptionsList(stationIds);
  }

  add(stationId: string): SubscriptionsList {
    if (this.stationIds.includes(stationId)) {
      throw new DomainError('User is already subscribed to this weather station');
    }
    return new SubscriptionsList([...this.stationIds, stationId]);
  }

  remove(stationId: string): void {
    const index = this.stationIds.indexOf(stationId);
    if (index > -1) {
      this.stationIds.splice(index, 1);
    }
  }

  isSubscribed(stationId: string): boolean {
    return this.stationIds.includes(stationId);
  }
}
