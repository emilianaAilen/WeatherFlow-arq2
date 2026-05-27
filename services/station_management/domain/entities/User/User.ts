import { SubscriptionsList } from '../../value-objects/SubscriptionsList';

export class User {
  readonly id: string;
  readonly name: string;
  readonly surname: string;
  readonly email: string;
  readonly subscriptions: SubscriptionsList;

  constructor(
    id: string,
    name: string,
    surname: string,
    email: string,
    subscriptions: SubscriptionsList = SubscriptionsList.create(),
  ) {
    this.id = id;
    this.name = name;
    this.surname = surname;
    this.email = email;
    this.subscriptions = subscriptions;
  }

  static create(
    id: string,
    name: string,
    surname: string,
    email: string,
    subscriptions: SubscriptionsList = SubscriptionsList.create(),
  ): User {
    return new User(id, name, surname, email, subscriptions);
  }

  subscribe(stationId: string): User {
    const updatedSubscriptions = this.subscriptions.add(stationId);
    return new User(this.id, this.name, this.surname, this.email, updatedSubscriptions);
  }

  getFullName(): string {
    return `${this.name} ${this.surname}`;
  }

  getEmail(): string {
    return this.email;
  }

  getSubscriptions(): SubscriptionsList {
    return this.subscriptions;
  }
}
