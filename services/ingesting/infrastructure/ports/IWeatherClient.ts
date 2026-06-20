export interface WeatherData {
  temperature: number; // °C
  humidity: number;    // %
  pressure: number;    // hPa
}

export interface IWeatherClient {
  fetchWeather(latitude: number, longitude: number): Promise<WeatherData>;
}
