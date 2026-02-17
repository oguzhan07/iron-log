/* ============================================================
   HELPER FUNCTIONS
   ============================================================ */

// Format date to Turkish locale
export function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Calculate 1RM using Epley formula
export function calc1RM(kg, reps) {
  if (!kg || !reps || reps <= 0) return 0;
  return Math.round(kg * (1 + reps / 30));
}

// Calculate total volume (kg × reps) for sets
export function getVolume(sets) {
  return sets.reduce((sum, set) => {
    return sum + (parseFloat(set.kg) || 0) * (parseFloat(set.reps) || 0);
  }, 0);
}

// Get max kg from sets
export function getMaxKg(sets) {
  return Math.max(0, ...sets.map(s => parseFloat(s.kg) || 0));
}

// Get today's day index (0 = Monday)
export function getTodayIndex() {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1;
}