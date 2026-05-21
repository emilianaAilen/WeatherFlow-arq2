export class Humidity {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Humidity {
    return new Humidity(value);
  }

  getValue(): number {
    return this.value;
  }

  isCritical(): boolean {
    return this.value > 90;
  }
}
