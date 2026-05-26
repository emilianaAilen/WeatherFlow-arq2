import request from "supertest";

const STATIONS_API_URL = process.env.STATIONS_API_URL || 'http://localhost:4010';
const ALERTING_API_URL = process.env.ALERTING_API_URL || 'http://localhost:4011';

describe("WeatherFlow E2E Cross-Service Flow", () => {
  let createdUserId: string;
  let createdStationId: string;

  it("1. should create a user in station_management", async () => {
    const res = await request(STATIONS_API_URL)
      .post("/users")
      .send({
        name: "E2E",
        surname: "Tester",
        email: `e2e-user-${Date.now()}@example.com`,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    createdUserId = res.body.id;
  });

  it("2. should create a weather station in station_management", async () => {
    const res = await request(STATIONS_API_URL)
      .post("/weatherStations")
      .send({
        name: `E2E Station ${Date.now()}`,
        model: "Vantage Pro2",
        location: {
          latitude: -34.6037,
          longitude: -58.3816,
        },
        ownerId: createdUserId,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    createdStationId = res.body.id;
  });

  it("3. should process event and allow creating measurement in alerting", async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const res = await request(ALERTING_API_URL).post("/measurements").send({
      temperature: 55.0,
      humidity: 60,
      atmosphericPressure: 1013,
      stationId: createdStationId,
    });

    expect(res.status).toBe(201);
    expect(res.body.stationId).toBe(createdStationId);
    expect(res.body.alert.status).toBe(true);
  });
});
