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

  isExtremeHeat(): boolean {
    return this.value > 40;
  }

  isFrost(): boolean {
    return this.value < 0;
  }
}
