export class Temperature {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Temperature {
    return new Temperature(value);
  }

  getValue(): number {
    return this.value;
  }

  // TODO: Implement logic to determine if temperature is extreme heat based on value
  isExtremeHeat(): boolean {
    return false;
  }

  // TODO: Implement logic to determine if temperature is frost based on value
  isFrost(): boolean {
    return false;
  }
}
