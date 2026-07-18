// Weather Service for Open-Meteo API with 6-hour Local Caching

export async function getWeatherForecast(lat, lon, districtName = '') {
  const cacheKey = `kisan_weather_${districtName || `${lat}_${lon}`}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      const ageInMs = Date.now() - timestamp;
      const sixHoursInMs = 6 * 60 * 60 * 1000;
      
      if (ageInMs < sixHoursInMs) {
        console.log(`Loading cached weather data for: ${districtName || `${lat},${lon}`}`);
        return data;
      }
    } catch (e) {
      console.error("Error reading weather cache, fetching fresh...", e);
    }
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max&timezone=Asia%2FKolkata&forecast_days=14`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather API failed");
    
    const data = await res.json();
    
    // Store in cache
    localStorage.setItem(cacheKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    
    console.log(`Fetched fresh weather data for: ${districtName || `${lat},${lon}`}`);
    return data;
  } catch (error) {
    console.error("Failed to fetch fresh weather data:", error);
    // Return cached data even if expired as fallback, or return hardcoded mock data
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data;
    }
    
    // Ultimate fallback mock weather data so dashboard doesn't break
    return getMockWeather();
  }
}

function getMockWeather() {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return {
    daily: {
      time: dates,
      temperature_2m_max: [38, 39, 40, 37, 36, 38, 39, 41, 40, 39, 38, 37, 39, 40],
      temperature_2m_min: [28, 29, 30, 27, 26, 27, 28, 29, 30, 29, 28, 27, 28, 29],
      precipitation_sum: [0, 0, 1.2, 12.5, 4.2, 0, 0, 0, 2.5, 1.0, 0, 0, 0, 0],
      windspeed_10m_max: [12.5, 14.2, 18.1, 24.5, 15.0, 10.2, 11.5, 13.0, 12.2, 11.0, 10.5, 9.8, 12.0, 13.5],
      relative_humidity_2m_max: [65, 70, 75, 85, 80, 70, 68, 65, 72, 70, 68, 65, 66, 68]
    }
  };
}
