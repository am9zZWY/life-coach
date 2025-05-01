import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Weather, WeatherApiResponse } from '@/models/weather.ts'
import { useDB } from '@/composables/useDB.ts'

export const useWeatherStore = defineStore('weather', () => {
  const db = useDB()
  const location = ref<string>(db.get('weather-location') ?? '')
  const weather = ref<Weather>({ lastUpdated: '', location: '', temperature: 0, weather: '' })
  const weatherApiKey = ref<string>(db.get('weather-api-key') ?? '')
  watch(weatherApiKey, () => {
    db.set('weather-api-key', weatherApiKey.value)
  })
  watch(location, () => {
    db.set('weather-location', location.value)
    fetchWeather()
  })

  const fetchWeather = async () => {
    if (!weatherApiKey.value) {
      console.error('Weather API key not found!')
      return
    }

    await fetch(`https://api.weatherapi.com/v
1/current.json?key=${weatherApiKey.value}&q=${location.value}`)
      .then((response) => response.json() as Promise<WeatherApiResponse>)
      .then((data: WeatherApiResponse) => {
        // Extract weather data
        weather.value.location = `${data.location.name}, ${data.location.country}`
        weather.value.temperature = data.current.temp_c
        weather.value.weather = data.current.condition.text
        weather.value.lastUpdated = new Date(data.current.last_updated_epoch * 1000).toLocaleString().replace(',', '').slice(0, -3)
      }).catch(e => console.error(e))
  }
  fetchWeather()

  return {
    weather,
    weatherApiKey,
    location
  }
})
