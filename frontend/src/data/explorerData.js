// SAMPLE DATA ONLY for temperature, rainfall and NDVI values.
// Coordinates are real places in Bengaluru; the measurements are NOT real.

export const explorerCenter = [12.9716, 77.5946]

export const explorerLayers = [
  { id: 'temp', label: 'Temperature', unit: '°C', color: '#f97316' },
  { id: 'rain', label: 'Rainfall', unit: 'mm/yr', color: '#38bdf8' },
  { id: 'ndvi', label: 'Vegetation (NDVI)', unit: '', color: '#34d399' },
]

export const explorerYears = [2018, 2019, 2020, 2021, 2022, 2023]

export const explorerPlaces = [
  { id: 'cubbon', name: 'Cubbon Park', lat: 12.9763, lng: 77.5929, temp: 24.1, rain: 920, ndvi: 0.62 },
  { id: 'lalbagh', name: 'Lalbagh', lat: 12.9507, lng: 77.5848, temp: 24.3, rain: 915, ndvi: 0.58 },
  { id: 'whitefield', name: 'Whitefield', lat: 12.9698, lng: 77.7500, temp: 25.2, rain: 880, ndvi: 0.31 },
  { id: 'electroniccity', name: 'Electronic City', lat: 12.8452, lng: 77.6602, temp: 25.4, rain: 860, ndvi: 0.28 },
  { id: 'yelahanka', name: 'Yelahanka', lat: 13.1007, lng: 77.5963, temp: 24.7, rain: 840, ndvi: 0.38 },
  { id: 'jayanagar', name: 'Jayanagar', lat: 12.9250, lng: 77.5938, temp: 24.5, rain: 905, ndvi: 0.44 },
]
