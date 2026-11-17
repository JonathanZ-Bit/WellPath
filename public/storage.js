const STORAGE_KEY = 'wellpath-v1';

const starter = {
  meals: [{ id: 'sample-meal', name: 'Oatmeal with berries', createdAt: new Date().toISOString() }],
  exercises: [{ id: 'sample-exercise', name: 'Walking', minutes: 10, createdAt: new Date().toISOString() }]
};

export function loadWellPath() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || starter; } catch { return starter; }
}

export function saveWellPath(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
