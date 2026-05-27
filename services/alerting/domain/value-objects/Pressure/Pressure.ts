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

  isLowPressure(): boolean {
    return this.value < 980;
  }
}
