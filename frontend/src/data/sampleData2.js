// SAMPLE DATA ONLY - none of these numbers are real measurements or model outputs.

export const ndviPeriods = ['Jan - Mar 2019', 'Jan - Mar 2021', 'Jan - Mar 2023']

export const ndviSummary = {
  before: 0.46,
  after: 0.41,
  note: 'Both periods are dry-season (Jan - Mar) so the comparison is seasonally fair.',
}

export const ndviZones = [
  { id: 'cubbon', name: 'Cubbon Park area', before: 0.64, after: 0.62 },
  { id: 'lalbagh', name: 'Lalbagh area', before: 0.6, after: 0.58 },
  { id: 'whitefield', name: 'Whitefield', before: 0.42, after: 0.31 },
  { id: 'electroniccity', name: 'Electronic City', before: 0.36, after: 0.28 },
  { id: 'yelahanka', name: 'Yelahanka', before: 0.4, after: 0.38 },
]

export const forecastSeries = [
  { month: 'Jul', actual: 24.3, forecast: null, low: null, high: null },
  { month: 'Aug', actual: 24.1, forecast: null, low: null, high: null },
  { month: 'Sep', actual: 24.6, forecast: null, low: null, high: null },
  { month: 'Oct', actual: 24.0, forecast: 24.0, low: 24.0, high: 24.0 },
  { month: 'Nov', actual: null, forecast: 23.0, low: 22.0, high: 24.0 },
  { month: 'Dec', actual: null, forecast: 21.9, low: 20.5, high: 23.3 },
  { month: 'Jan', actual: null, forecast: 22.2, low: 20.4, high: 24.0 },
  { month: 'Feb', actual: null, forecast: 24.1, low: 22.0, high: 26.2 },
]

export const modelMetrics = [
  { name: 'Baseline (seasonal average)', mae: 'n/a', rmse: 'n/a', note: 'Placeholder - computed in Milestone 6' },
  { name: 'Gradient boosting', mae: 'n/a', rmse: 'n/a', note: 'Placeholder - computed in Milestone 6' },
]

export const analystSuggestions = [
  'How has Bengaluru\'s temperature changed?',
  'Which areas show vegetation decline?',
  'What does the NDVI value indicate?',
  'What are the environmental trends in this region?',
]
