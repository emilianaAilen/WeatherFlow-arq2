export class Pressure {
  readonly value: number;

  constructor(value: number) {
    this.value = value;
  }

  static create(value: number): Pressure {
    return new Pressure(value);
  }

  getValue(): number {
    return this.value;
  }

  // TODO: Implement logic to determine if pressure is low based on value
  isLowPressure(): boolean {
    return false;
  }
}
