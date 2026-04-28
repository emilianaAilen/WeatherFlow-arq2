export class SubscriptionsList {
  readonly stationIds: string[];

  constructor(stationIds: string[] = []) {
    this.stationIds = stationIds;
  }

  static create(stationIds: string[] = []): SubscriptionsList {
    return new SubscriptionsList(stationIds);
  }

  add(stationId: string): void {
    if (!this.stationIds.includes(stationId)) {
      this.stationIds.push(stationId);
    }
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
