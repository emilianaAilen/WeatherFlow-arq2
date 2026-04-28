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

  // TODO: Implement logic to determine if humidity is critical based on value
  isCritical(): boolean {
    return false;
  }
}
