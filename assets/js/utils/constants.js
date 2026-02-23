/* ============================================================
   CONSTANTS
   ============================================================ */

export const DAYS = [
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar'
];

export const TAG_CLASSES = {
  push: 'tag-push',
  pull: 'tag-pull',
  legs: 'tag-legs',
  full: 'tag-full',
  rest: 'tag-rest'
};

export const TAG_LABELS = {
  push: '🔴 PUSH',
  pull: '🔵 PULL',
  legs: '🟢 LEGS',
  full: 'FULL BODY',
  rest: 'OFF'
};

// Hazır antrenman templateleri
export const BUILT_IN_TEMPLATES = [
  {
    id: 'push',
    name: '🔴 PUSH — Göğüs / Omuz / Triceps',
    type: 'push',
    exercises: [
      { name: 'Bench Press', sets: 4, reps: '6–8', note: 'Göğüs' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8–10', note: 'Göğüs' },
      { name: 'Fly', sets: 3, reps: '12', note: 'Göğüs' },
      { name: 'Seated Shoulder Press', sets: 3, reps: '6–8', note: 'Omuz' },
      { name: 'Lateral Raise', sets: 4, reps: '12–15', note: 'Omuz' },
      { name: 'Reverse Fly', sets: 3, reps: '12–15', note: 'Omuz' },
      { name: 'Cable Triceps Pushdown', sets: 3, reps: '10–12', note: 'Triceps' },
      { name: 'Overhead Triceps Extension', sets: 3, reps: '12', note: 'Triceps' }
    ]
  },
  {
    id: 'pull',
    name: '🔵 PULL — Sırt / Biceps / Ön Kol',
    type: 'pull',
    exercises: [
      { name: 'Deadlift', sets: 3, reps: '5', note: 'Sırt' },
      { name: 'Pull-up / Lat Pulldown', sets: 4, reps: '8–10', note: 'Sırt' },
      { name: 'Barbell Row', sets: 3, reps: '8', note: 'Sırt' },
      { name: 'Face Pull', sets: 3, reps: '12–15', note: 'Sırt' },
      { name: 'Machine Curl', sets: 3, reps: '10–12', note: 'Biceps' },
      { name: 'Hammer Curl', sets: 3, reps: '10–12', note: 'Biceps' },
      { name: 'Reverse Curl', sets: 2, reps: '12', note: 'Ön Kol' },
      { name: 'Wrist Curl', sets: 2, reps: '15', note: 'Ön Kol' }
    ]
  },
  {
    id: 'legs',
    name: '🟢 LEGS — Bacak / Core',
    type: 'legs',
    exercises: [
      { name: 'Squat', sets: 4, reps: '6–8', note: 'Bacak' },
      { name: 'Leg Press', sets: 3, reps: '10', note: 'Bacak' },
      { name: 'Romanian Deadlift', sets: 3, reps: '8', note: 'Hamstring + Glute' },
      { name: 'Seated Leg Curl', sets: 3, reps: '12', note: 'Hamstring' },
      { name: 'Standing Calf Raise', sets: 4, reps: '15', note: 'Baldır' },
      { name: 'Plank / Hanging Leg Raise', sets: 3, reps: '—', note: 'Core' }
    ]
  }
];

// Haftanın tam programı (PPL + Off)
export const WEEKLY_TEMPLATE = [
  { day: 0, templateId: 'push' },   // Pazartesi - Push
  { day: 1, templateId: 'pull' },   // Salı - Pull
  { day: 2, templateId: 'legs' },   // Çarşamba - Legs
  { day: 3, templateId: 'push' },   // Perşembe - Push
  { day: 4, templateId: 'pull' },   // Cuma - Pull
  { day: 5, templateId: 'legs' },   // Cumartesi - Legs
  { day: 6, type: 'rest' }          // Pazar - Off
];