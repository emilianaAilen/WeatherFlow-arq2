export interface OWMWeatherData {
  temperature: number; // °C
  humidity: number;    // %
  pressure: number;    // hPa
}

export interface IOWMWeatherClient {
  fetchWeather(latitude: number, longitude: number): Promise<OWMWeatherData>;
}
