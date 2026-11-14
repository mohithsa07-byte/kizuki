// SAMPLE DATA ONLY - illustrative numbers for building the interface.
// These are NOT real measurements. Real data replaces this in Milestone 4.

export const monthlyClimate = [
  { month: 'Jan', temp: 22.1, rain: 3 },
  { month: 'Feb', temp: 24.0, rain: 5 },
  { month: 'Mar', temp: 26.5, rain: 12 },
  { month: 'Apr', temp: 28.2, rain: 45 },
  { month: 'May', temp: 27.8, rain: 110 },
  { month: 'Jun', temp: 25.4, rain: 80 },
  { month: 'Jul', temp: 24.3, rain: 105 },
  { month: 'Aug', temp: 24.1, rain: 125 },
  { month: 'Sep', temp: 24.6, rain: 165 },
  { month: 'Oct', temp: 24.0, rain: 170 },
  { month: 'Nov', temp: 22.9, rain: 60 },
  { month: 'Dec', temp: 21.7, rain: 20 },
]

export const yearlyTemp = [
  { year: 2016, temp: 24.6 },
  { year: 2017, temp: 24.4 },
  { year: 2018, temp: 24.3 },
  { year: 2019, temp: 24.8 },
  { year: 2020, temp: 24.5 },
  { year: 2021, temp: 24.4 },
  { year: 2022, temp: 24.7 },
  { year: 2023, temp: 24.9 },
]

export const overviewStats = [
  { id: 'temp', label: 'Average temperature', value: '24.6', unit: '°C', note: 'Air temperature (2 m)', source: 'Sample' },
  { id: 'rain', label: 'Annual rainfall', value: '900', unit: 'mm', note: 'Total precipitation', source: 'Sample' },
  { id: 'ndvi', label: 'Vegetation index', value: '0.42', unit: 'NDVI', note: 'Greenness, not tree count', source: 'Sample' },
  { id: 'aqi', label: 'Air quality', value: 'N/A', unit: '', note: 'No reliable source connected yet', source: 'Not connected' },
]

export const insights = [
  'Rainfall peaks in September and October in this sample series.',
  'The sample yearly temperature shows a small upward drift.',
  'Air quality will appear once a reliable source is connected.',
]
