import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, Plus, TrendingUp, Calendar, Target, Lightbulb, Trash2, ChevronRight, Activity, ClipboardList, Info, X, Cloud, CloudOff, Check, AlertCircle, Settings as SettingsIcon, Download, Upload } from 'lucide-react';

// Muscle groups we track
const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Core'];

// Exercise library - organized by muscle group, suitable for full gym + general fitness/tone
const EXERCISE_LIBRARY = {
  Chest: ['Dumbbell Bench Press', 'Incline Dumbbell Press', 'Cable Chest Fly', 'Push-ups', 'Machine Chest Press'],
  Back: ['Lat Pulldown', 'Seated Cable Row', 'Dumbbell Row', 'Face Pulls', 'Assisted Pull-ups'],
  Shoulders: ['Dumbbell Shoulder Press', 'Lateral Raises', 'Rear Delt Fly', 'Cable Lateral Raise', 'Arnold Press', 'Goblet Squat to Press'],
  Biceps: ['Dumbbell Bicep Curl', 'Cable Curls', 'Hammer Curls', 'Preacher Curls'],
  Triceps: ['Cable Tricep Pushdown', 'Overhead Tricep Extension', 'Tricep Dips', 'Skull Crushers'],
  Quads: ['Barbell Squat', 'Goblet Squats', 'Leg Press', 'Leg Extensions', 'Bulgarian Split Squats', 'Walking Lunges'],
  Hamstrings: ['Romanian Deadlifts', 'Leg Curls', 'Good Mornings', 'Single-Leg RDL'],
  Glutes: ['Hip Thrust (Machine)', 'Cable Glute Kickback', 'Cable Side Leg Abduction', 'Glute Bridges', 'Step-ups'],
  Calves: ['Standing Calf Raise', 'Seated Calf Raises'],
  Core: ['Plank', 'Superman Plank', 'Cable Crunches', 'Hanging Leg Raises', 'Russian Twists', 'Dead Bug']
};

// Flat list with muscle group lookup
const ALL_EXERCISES = Object.entries(EXERCISE_LIBRARY).flatMap(([mg, exs]) =>
  exs.map(name => ({ name, muscleGroup: mg }))
);

// Aistė's coach plan - reference for quick logging
const COACH_PLAN = {
  'Day 1: Lower Body': [
    { name: 'Hip Thrust (Machine)', target: '3×10-12' },
    { name: 'Cable Glute Kickback', target: '3×12 @ 20kg per leg' },
    { name: 'Cable Side Leg Abduction', target: '3×12 @ 15kg per leg' },
    { name: 'Barbell Squat', target: '3×8-10' },
    { name: 'Standing Calf Raise', target: '3×15-20' }
  ],
  'Day 2: Upper Body': [
    { name: 'Dumbbell Bench Press', target: '3×10-12' },
    { name: 'Lat Pulldown', target: '3×10-12' },
    { name: 'Dumbbell Bicep Curl', target: '3×12' },
    { name: 'Push-ups', target: '3×12-15' }
  ],
  'Day 3: Upper & Lower Combo': [
    { name: 'Goblet Squat to Press', target: '3×12' },
    { name: 'Cable Glute Kickback', target: '3×12 @ 20kg superset' },
    { name: 'Cable Side Leg Abduction', target: '3×12 @ 15kg superset' },
    { name: 'Dumbbell Bench Press', target: '3×10-12' },
    { name: 'Lat Pulldown', target: '3×10-12' },
    { name: 'Superman Plank', target: '3 × 30-60s' }
  ]
};

// Similarity map: if user hasn't done exercise X, estimate from exercise Y using multiplier
const EXERCISE_SIMILARITY = {
  // Chest
  'Incline Dumbbell Press': [{ from: 'Dumbbell Bench Press', mult: 0.85 }],
  'Machine Chest Press': [{ from: 'Dumbbell Bench Press', mult: 1.3 }],
  'Cable Chest Fly': [{ from: 'Dumbbell Bench Press', mult: 0.5 }],
  // Back
  'Seated Cable Row': [{ from: 'Lat Pulldown', mult: 1.0 }],
  'Dumbbell Row': [{ from: 'Lat Pulldown', mult: 0.4 }],
  'Face Pulls': [{ from: 'Lat Pulldown', mult: 0.5 }],
  // Shoulders
  'Lateral Raises': [{ from: 'Dumbbell Bicep Curl', mult: 0.5 }],
  'Cable Lateral Raise': [{ from: 'Dumbbell Bicep Curl', mult: 0.6 }],
  'Rear Delt Fly': [{ from: 'Dumbbell Bicep Curl', mult: 0.6 }],
  'Dumbbell Shoulder Press': [{ from: 'Dumbbell Bench Press', mult: 0.7 }],
  'Arnold Press': [{ from: 'Dumbbell Bench Press', mult: 0.65 }],
  // Biceps
  'Cable Curls': [{ from: 'Dumbbell Bicep Curl', mult: 1.2 }],
  'Hammer Curls': [{ from: 'Dumbbell Bicep Curl', mult: 1.1 }],
  'Preacher Curls': [{ from: 'Dumbbell Bicep Curl', mult: 0.9 }],
  // Triceps
  'Cable Tricep Pushdown': [{ from: 'Dumbbell Bicep Curl', mult: 1.5 }],
  'Overhead Tricep Extension': [{ from: 'Dumbbell Bicep Curl', mult: 1.0 }],
  'Skull Crushers': [{ from: 'Dumbbell Bicep Curl', mult: 1.2 }],
  // Quads
  'Goblet Squats': [{ from: 'Barbell Squat', mult: 0.4 }],
  'Leg Press': [{ from: 'Barbell Squat', mult: 1.8 }],
  'Leg Extensions': [{ from: 'Barbell Squat', mult: 0.5 }],
  'Bulgarian Split Squats': [{ from: 'Barbell Squat', mult: 0.3 }],
  // Hamstrings/Glutes
  'Romanian Deadlifts': [{ from: 'Barbell Squat', mult: 0.9 }, { from: 'Hip Thrust (Machine)', mult: 0.6 }],
  'Leg Curls': [{ from: 'Cable Glute Kickback', mult: 1.2 }],
  'Glute Bridges': [{ from: 'Hip Thrust (Machine)', mult: 0.7 }],
  'Step-ups': [{ from: 'Dumbbell Bicep Curl', mult: 1.5 }]
};

// Exercise details: muscles worked (primary/secondary) + how-to instructions
// Muscle region keys correspond to SVG body diagram regions
const EXERCISE_DETAILS = {
  // Chest
  'Dumbbell Bench Press': {
    primary: ['chest'], secondary: ['shoulders-front', 'triceps'],
    howTo: 'Lie on a flat bench, dumbbell in each hand at chest level, palms forward. Press up until arms are extended (don\'t lock elbows). Lower slowly to chest level. Inhale down, exhale up. Keep shoulder blades retracted, feet flat.'
  },
  'Incline Dumbbell Press': {
    primary: ['chest', 'shoulders-front'], secondary: ['triceps'],
    howTo: 'Set bench to 30-45° incline. Same press motion as flat bench but emphasizes upper chest. Keep wrists stacked over elbows.'
  },
  'Cable Chest Fly': {
    primary: ['chest'], secondary: ['shoulders-front'],
    howTo: 'Stand between two cable pulleys set high. Slight bend in elbows, sweep arms down and together in an arc. Squeeze chest at the bottom, return slowly with control.'
  },
  'Push-ups': {
    primary: ['chest'], secondary: ['shoulders-front', 'triceps', 'core'],
    howTo: 'Hands under shoulders, body in a straight line from head to heels. Lower chest toward floor with elbows tucked. Exhale pushing up, inhale lowering. No sagging hips, no flaring elbows.'
  },
  'Machine Chest Press': {
    primary: ['chest'], secondary: ['shoulders-front', 'triceps'],
    howTo: 'Adjust seat so handles align with mid-chest. Press handles forward smoothly, don\'t lock elbows. Return slowly with control.'
  },
  // Back
  'Lat Pulldown': {
    primary: ['back-lats'], secondary: ['biceps', 'back-upper'],
    howTo: 'Wide grip on bar, knees secured under pad. Pull shoulder blades down and back first, then pull bar to upper chest. Pause, return slowly. Exhale pulling down, inhale up. No swinging.'
  },
  'Seated Cable Row': {
    primary: ['back-upper', 'back-lats'], secondary: ['biceps'],
    howTo: 'Sit with feet on platform, slight knee bend. Pull handle to lower ribs, squeeze shoulder blades together. Keep chest up, don\'t lean back excessively.'
  },
  'Dumbbell Row': {
    primary: ['back-lats', 'back-upper'], secondary: ['biceps'],
    howTo: 'One knee and hand on bench, other foot on floor. Pull dumbbell to hip, elbow close to body. Squeeze at the top, lower with control.'
  },
  'Face Pulls': {
    primary: ['back-upper', 'shoulders-rear'], secondary: [],
    howTo: 'Rope attachment at upper-chest height. Pull rope toward face, separating hands at the end. Great for posture and shoulder health.'
  },
  'Assisted Pull-ups': {
    primary: ['back-lats'], secondary: ['biceps', 'back-upper'],
    howTo: 'Use assisted pull-up machine or band. Grip bar wider than shoulders, pull chest to bar, lower with control. Focus on engaging lats first.'
  },
  // Shoulders
  'Dumbbell Shoulder Press': {
    primary: ['shoulders-front', 'shoulders-side'], secondary: ['triceps'],
    howTo: 'Sit or stand with dumbbells at shoulder height, palms forward. Press overhead until arms extended. Lower to ear level. Don\'t arch lower back.'
  },
  'Lateral Raises': {
    primary: ['shoulders-side'], secondary: [],
    howTo: 'Dumbbells at sides, slight elbow bend. Raise arms out to sides until parallel with floor. Lead with elbows, not hands. Lower slowly.'
  },
  'Rear Delt Fly': {
    primary: ['shoulders-rear'], secondary: ['back-upper'],
    howTo: 'Bend forward at hips, dumbbells hanging. Raise arms out to sides, squeezing shoulder blades. Don\'t use momentum.'
  },
  'Cable Lateral Raise': {
    primary: ['shoulders-side'], secondary: [],
    howTo: 'Low cable, handle in opposite hand. Raise arm out to side to shoulder height. Constant tension throughout, slower than dumbbells.'
  },
  'Arnold Press': {
    primary: ['shoulders-front', 'shoulders-side'], secondary: ['triceps'],
    howTo: 'Start with dumbbells in front of shoulders, palms facing you. Rotate palms forward as you press overhead. Reverse on the way down.'
  },
  'Goblet Squat to Press': {
    primary: ['quads', 'glutes', 'shoulders-front'], secondary: ['core', 'triceps'],
    howTo: 'Hold one dumbbell at chest. Squat down keeping chest up. As you stand, press dumbbell overhead. Inhale squatting, exhale pressing.'
  },
  // Biceps
  'Dumbbell Bicep Curl': {
    primary: ['biceps'], secondary: [],
    howTo: 'Stand tall, dumbbell each hand, palms forward. Curl to shoulders, keeping elbows close to torso. Exhale curling up, inhale lowering. No swinging.'
  },
  'Cable Curls': {
    primary: ['biceps'], secondary: [],
    howTo: 'Low cable with straight or EZ bar. Curl with constant tension, keep elbows pinned at sides. Squeeze at the top.'
  },
  'Hammer Curls': {
    primary: ['biceps'], secondary: ['forearms'],
    howTo: 'Same as bicep curl but palms face each other throughout. Targets a different part of the biceps and forearm.'
  },
  'Preacher Curls': {
    primary: ['biceps'], secondary: [],
    howTo: 'Arms on preacher bench pad. Curl up, control the lowering phase. The bench prevents cheating with body momentum.'
  },
  // Triceps
  'Cable Tricep Pushdown': {
    primary: ['triceps'], secondary: [],
    howTo: 'High cable, rope or bar attachment. Elbows pinned at sides, push down by extending forearms. Squeeze at the bottom.'
  },
  'Overhead Tricep Extension': {
    primary: ['triceps'], secondary: [],
    howTo: 'Dumbbell held overhead with both hands. Lower behind head by bending elbows. Extend back up, keep elbows pointing forward.'
  },
  'Tricep Dips': {
    primary: ['triceps'], secondary: ['chest', 'shoulders-front'],
    howTo: 'Hands on bench behind you, feet forward. Lower by bending elbows to 90°, push back up. Keep shoulders down (not up by ears).'
  },
  'Skull Crushers': {
    primary: ['triceps'], secondary: [],
    howTo: 'Lie on bench, EZ bar or dumbbells overhead. Lower bar toward forehead by bending elbows only. Extend back up, elbows stay in place.'
  },
  // Quads
  'Barbell Squat': {
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'],
    howTo: 'Bar across upper back, feet just outside hip-width. Brace core, bend knees, lower until thighs at least parallel. Chest up, back neutral. Press through whole foot to stand.'
  },
  'Goblet Squats': {
    primary: ['quads', 'glutes'], secondary: ['core'],
    howTo: 'Hold dumbbell at chest. Squat down keeping elbows pointing down, chest up. Knees track over toes, don\'t cave in.'
  },
  'Leg Press': {
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    howTo: 'Feet shoulder-width on platform. Lower until knees ~90°. Press through heels. Don\'t lock knees at top.'
  },
  'Leg Extensions': {
    primary: ['quads'], secondary: [],
    howTo: 'Sit in machine, shins behind pad. Extend knees to straighten legs. Pause at top, lower slowly. Isolated quad work.'
  },
  'Bulgarian Split Squats': {
    primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'],
    howTo: 'Rear foot elevated on bench, front foot well forward. Lower until front thigh parallel. Drive through front heel to stand.'
  },
  'Walking Lunges': {
    primary: ['quads', 'glutes'], secondary: ['hamstrings'],
    howTo: 'Step forward into a lunge, back knee nearly touching floor. Push off front foot, step the other leg into a lunge. Keep torso upright.'
  },
  // Hamstrings
  'Romanian Deadlifts': {
    primary: ['hamstrings', 'glutes'], secondary: ['back-lower'],
    howTo: 'Dumbbells or barbell in front. Hinge at hips (not squat) with slight knee bend. Lower until you feel hamstring stretch. Return by squeezing glutes.'
  },
  'Leg Curls': {
    primary: ['hamstrings'], secondary: [],
    howTo: 'Lie face down (or sit) in machine, pad on lower calves. Curl heels toward glutes. Squeeze hamstrings, lower with control.'
  },
  'Good Mornings': {
    primary: ['hamstrings', 'back-lower'], secondary: ['glutes'],
    howTo: 'Bar on upper back. Hinge at hips with slight knee bend, lowering torso toward parallel. Return by squeezing glutes. Keep back flat.'
  },
  'Single-Leg RDL': {
    primary: ['hamstrings', 'glutes'], secondary: ['back-lower', 'core'],
    howTo: 'Stand on one leg, dumbbell in opposite hand. Hinge forward, free leg extends back for balance. Return upright. Great for balance.'
  },
  // Glutes
  'Hip Thrust (Machine)': {
    primary: ['glutes'], secondary: ['hamstrings'],
    howTo: 'Upper back against pad, feet shoulder-width. Push through heels, extend hips until knees and hips at 90°. Squeeze glutes at top. Don\'t arch lower back.'
  },
  'Cable Glute Kickback': {
    primary: ['glutes'], secondary: ['hamstrings'],
    howTo: 'Ankle cuff on low cable. Hinge forward ~45°, brace core. Drive leg straight back using glutes, knee slightly bent. Squeeze at top.'
  },
  'Cable Side Leg Abduction': {
    primary: ['glutes'], secondary: [],
    howTo: 'Same setup as kickback but turn to the side. Lift leg away from body, pause briefly, return. Targets glute medius (side glute).'
  },
  'Glute Bridges': {
    primary: ['glutes'], secondary: ['hamstrings'],
    howTo: 'Lie on back, knees bent, feet flat. Drive heels into floor, lift hips. Squeeze glutes at top, lower slowly. Bodyweight or barbell on hips.'
  },
  'Step-ups': {
    primary: ['glutes', 'quads'], secondary: ['hamstrings'],
    howTo: 'Box or bench at knee height, dumbbell each hand. Step up driving through heel of stepping leg. Step down with control. Alternate legs.'
  },
  // Calves
  'Standing Calf Raise': {
    primary: ['calves'], secondary: [],
    howTo: 'Feet hip-width, hands on wall/bench for balance. Push through balls of feet, lift heels high. Hold briefly, lower slowly. No bouncing.'
  },
  'Seated Calf Raises': {
    primary: ['calves'], secondary: [],
    howTo: 'Sit in machine, pads on lower thighs, balls of feet on platform. Raise heels as high as possible, lower slowly. Targets soleus more than standing.'
  },
  // Core
  'Plank': {
    primary: ['core'], secondary: ['shoulders-front'],
    howTo: 'Forearms on floor, elbows under shoulders, body straight from head to heels. Hold position, breathe normally. Squeeze glutes, don\'t sag or pike hips.'
  },
  'Superman Plank': {
    primary: ['core', 'back-lower'], secondary: ['glutes', 'shoulders-rear'],
    howTo: 'Start in forearm plank. Lift one arm and opposite leg parallel to floor. Hold briefly, switch sides. Hips stay level (don\'t rotate).'
  },
  'Cable Crunches': {
    primary: ['core'], secondary: [],
    howTo: 'Kneel facing cable, rope at top. Hold rope at forehead, crunch down by rounding spine (not just hip flexion). Squeeze abs at the bottom.'
  },
  'Hanging Leg Raises': {
    primary: ['core'], secondary: [],
    howTo: 'Hang from pull-up bar. Raise legs to parallel (or higher if you can). Lower slowly without swinging. Hardest core move on the list.'
  },
  'Russian Twists': {
    primary: ['core'], secondary: [],
    howTo: 'Sit on floor, lean back ~45°, feet off floor. Rotate torso side to side, tapping floor (or holding weight). Move from the core, not just the arms.'
  },
  'Dead Bug': {
    primary: ['core'], secondary: [],
    howTo: 'Lie on back, arms up, knees over hips. Lower opposite arm and leg slowly, keeping lower back pressed into floor. Return, switch sides.'
  }
};

// Suggest weight for an exercise based on history + similarity
function suggestWeight(exerciseName, sessions) {
  // 1. Check history for this exact exercise
  const history = [];
  sessions.forEach(s => {
    s.exercises.forEach(e => {
      if (e.name === exerciseName) {
        history.push({ date: s.date, weight: e.weight, reps: e.reps });
      }
    });
  });
  history.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (history.length > 0) {
    const latest = history[history.length - 1];
    if (latest.reps >= 12) {
      const increase = latest.weight < 10 ? 1 : latest.weight < 30 ? 2 : 2.5;
      return {
        weight: latest.weight + increase,
        confidence: 'high',
        reason: `Last: ${latest.weight}kg × ${latest.reps} reps — ready to bump up`
      };
    }
    return {
      weight: latest.weight,
      confidence: 'high',
      reason: `Same as last: ${latest.weight}kg × ${latest.reps} reps`
    };
  }

  // 2. No history — try similarity estimate
  const similar = EXERCISE_SIMILARITY[exerciseName];
  if (similar) {
    for (const { from, mult } of similar) {
      const sourceHistory = [];
      sessions.forEach(s => {
        s.exercises.forEach(e => {
          if (e.name === from) sourceHistory.push({ date: s.date, weight: e.weight });
        });
      });
      if (sourceHistory.length > 0) {
        sourceHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        const sourceWeight = sourceHistory[sourceHistory.length - 1].weight;
        const estimated = Math.round((sourceWeight * mult) * 2) / 2;
        return {
          weight: estimated,
          confidence: 'medium',
          reason: `Estimate from ${from} (${sourceWeight}kg)`
        };
      }
    }
  }

  // 3. No data at all
  return {
    weight: null,
    confidence: 'low',
    reason: 'Start light — find a weight you can do 15 reps cleanly'
  };
}

const findMuscleGroup = (exerciseName) => {
  const match = ALL_EXERCISES.find(e => e.name === exerciseName);
  return match ? match.muscleGroup : null;
};

// Get start of current week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

// ============ BODY DIAGRAM ============
// Anatomical SVG with regions that highlight when muscles are activated
function BodyDiagram({ primary = [], secondary = [] }) {
  const isPrimary = (m) => primary.includes(m);
  const isSecondary = (m) => secondary.includes(m);
  const fill = (m) => isPrimary(m) ? '#dc2626' : isSecondary(m) ? '#fca5a5' : '#e2e8f0';
  const stroke = '#475569';

  return (
    <div className="flex justify-center gap-4">
      {/* FRONT VIEW */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 200" className="w-32 h-64" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="15" rx="9" ry="11" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Neck */}
          <rect x="46" y="24" width="8" height="6" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Shoulders - front delts */}
          <ellipse cx="33" cy="35" rx="8" ry="6" fill={fill('shoulders-front')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="67" cy="35" rx="8" ry="6" fill={fill('shoulders-front')} stroke={stroke} strokeWidth="0.5" />
          {/* Shoulders - side delts (small visible from front) */}
          <ellipse cx="27" cy="38" rx="3" ry="5" fill={fill('shoulders-side')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="73" cy="38" rx="3" ry="5" fill={fill('shoulders-side')} stroke={stroke} strokeWidth="0.5" />
          {/* Chest */}
          <path d="M 35 35 Q 50 38 65 35 L 67 55 Q 50 60 33 55 Z" fill={fill('chest')} stroke={stroke} strokeWidth="0.5" />
          {/* Biceps */}
          <ellipse cx="25" cy="55" rx="5" ry="10" fill={fill('biceps')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="75" cy="55" rx="5" ry="10" fill={fill('biceps')} stroke={stroke} strokeWidth="0.5" />
          {/* Forearms */}
          <ellipse cx="22" cy="78" rx="4" ry="10" fill={fill('forearms')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="78" cy="78" rx="4" ry="10" fill={fill('forearms')} stroke={stroke} strokeWidth="0.5" />
          {/* Core/Abs */}
          <rect x="40" y="60" width="20" height="28" rx="3" fill={fill('core')} stroke={stroke} strokeWidth="0.5" />
          {/* Hips */}
          <path d="M 36 88 L 64 88 L 66 100 L 34 100 Z" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Quads */}
          <ellipse cx="42" cy="125" rx="7" ry="20" fill={fill('quads')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="125" rx="7" ry="20" fill={fill('quads')} stroke={stroke} strokeWidth="0.5" />
          {/* Knees */}
          <circle cx="42" cy="148" r="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          <circle cx="58" cy="148" r="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Calves (front - shins are neutral) */}
          <ellipse cx="42" cy="170" rx="5" ry="15" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="170" rx="5" ry="15" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Feet */}
          <ellipse cx="42" cy="190" rx="5" ry="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="190" rx="5" ry="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
        </svg>
        <span className="text-xs text-slate-500 mt-1">Front</span>
      </div>

      {/* BACK VIEW */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 100 200" className="w-32 h-64" xmlns="http://www.w3.org/2000/svg">
          {/* Head */}
          <ellipse cx="50" cy="15" rx="9" ry="11" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Neck */}
          <rect x="46" y="24" width="8" height="6" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Rear delts */}
          <ellipse cx="33" cy="35" rx="8" ry="6" fill={fill('shoulders-rear')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="67" cy="35" rx="8" ry="6" fill={fill('shoulders-rear')} stroke={stroke} strokeWidth="0.5" />
          {/* Side delts */}
          <ellipse cx="27" cy="38" rx="3" ry="5" fill={fill('shoulders-side')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="73" cy="38" rx="3" ry="5" fill={fill('shoulders-side')} stroke={stroke} strokeWidth="0.5" />
          {/* Upper back (traps + rhomboids) */}
          <path d="M 35 32 Q 50 30 65 32 L 62 50 Q 50 52 38 50 Z" fill={fill('back-upper')} stroke={stroke} strokeWidth="0.5" />
          {/* Lats */}
          <path d="M 38 50 Q 50 55 62 50 L 65 75 Q 50 80 35 75 Z" fill={fill('back-lats')} stroke={stroke} strokeWidth="0.5" />
          {/* Triceps */}
          <ellipse cx="25" cy="55" rx="5" ry="10" fill={fill('triceps')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="75" cy="55" rx="5" ry="10" fill={fill('triceps')} stroke={stroke} strokeWidth="0.5" />
          {/* Forearms */}
          <ellipse cx="22" cy="78" rx="4" ry="10" fill={fill('forearms')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="78" cy="78" rx="4" ry="10" fill={fill('forearms')} stroke={stroke} strokeWidth="0.5" />
          {/* Lower back */}
          <rect x="40" y="75" width="20" height="14" rx="2" fill={fill('back-lower')} stroke={stroke} strokeWidth="0.5" />
          {/* Glutes */}
          <ellipse cx="42" cy="98" rx="8" ry="9" fill={fill('glutes')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="98" rx="8" ry="9" fill={fill('glutes')} stroke={stroke} strokeWidth="0.5" />
          {/* Hamstrings */}
          <ellipse cx="42" cy="125" rx="7" ry="20" fill={fill('hamstrings')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="125" rx="7" ry="20" fill={fill('hamstrings')} stroke={stroke} strokeWidth="0.5" />
          {/* Knees */}
          <circle cx="42" cy="148" r="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          <circle cx="58" cy="148" r="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          {/* Calves */}
          <ellipse cx="42" cy="170" rx="5" ry="15" fill={fill('calves')} stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="170" rx="5" ry="15" fill={fill('calves')} stroke={stroke} strokeWidth="0.5" />
          {/* Feet */}
          <ellipse cx="42" cy="190" rx="5" ry="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
          <ellipse cx="58" cy="190" rx="5" ry="3" fill="#e2e8f0" stroke={stroke} strokeWidth="0.5" />
        </svg>
        <span className="text-xs text-slate-500 mt-1">Back</span>
      </div>
    </div>
  );
}

// ============ EXERCISE DETAIL MODAL ============
function ExerciseDetailModal({ exerciseName, onClose }) {
  const details = EXERCISE_DETAILS[exerciseName];
  if (!details) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-lg p-5 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-900">{exerciseName}</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
          </div>
          <p className="text-sm text-slate-600">Details for this exercise aren't available yet.</p>
        </div>
      </div>
    );
  }

  // Map specific muscle regions back to readable names
  const muscleNames = {
    'chest': 'Chest', 'back-lats': 'Lats', 'back-upper': 'Upper Back', 'back-lower': 'Lower Back',
    'shoulders-front': 'Front Delts', 'shoulders-side': 'Side Delts', 'shoulders-rear': 'Rear Delts',
    'biceps': 'Biceps', 'triceps': 'Triceps', 'forearms': 'Forearms',
    'quads': 'Quads', 'hamstrings': 'Hamstrings', 'glutes': 'Glutes', 'calves': 'Calves',
    'core': 'Core'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{exerciseName}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Body diagram */}
          <div>
            <BodyDiagram primary={details.primary} secondary={details.secondary} />
            <div className="flex justify-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#dc2626' }}></div>
                <span className="text-slate-600">Primary</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm" style={{ background: '#fca5a5' }}></div>
                <span className="text-slate-600">Secondary</span>
              </div>
            </div>
          </div>

          {/* Muscles list */}
          <div className="bg-slate-50 rounded-md p-3">
            <div className="text-xs font-medium text-slate-700 mb-1">Muscles worked</div>
            <div className="flex flex-wrap gap-1.5">
              {details.primary.map(m => (
                <span key={m} className="px-2 py-0.5 rounded text-xs bg-red-600 text-white">{muscleNames[m] || m}</span>
              ))}
              {details.secondary.map(m => (
                <span key={m} className="px-2 py-0.5 rounded text-xs bg-red-200 text-red-900">{muscleNames[m] || m}</span>
              ))}
            </div>
          </div>

          {/* How to */}
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">How to perform</div>
            <p className="text-sm text-slate-700 leading-relaxed">{details.howTo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN ============
export default function WorkoutTracker() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('log');

  // Sync state
  const [syncUrl, setSyncUrl] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle'); // idle | syncing | synced | error | offline
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const syncTimerRef = React.useRef(null);
  const hasLoadedRef = React.useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('workout-sessions');
      if (stored) setSessions(JSON.parse(stored));

      const url = localStorage.getItem('sync-url') || '';
      setSyncUrl(url);

      const last = localStorage.getItem('last-synced-at');
      if (last) setLastSyncedAt(Number(last));
    } catch (e) {
      console.error('Load failed', e);
    }
    setLoading(false);
    hasLoadedRef.current = true;
  }, []);

  // Push to Google Sheets
  const pushToSheet = async (sessionsToSync) => {
    if (!syncUrl) return;
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      // Note: Apps Script web apps don't support CORS preflight, so we use
      // text/plain content-type to make it a "simple request"
      const res = await fetch(syncUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'backup', sessions: sessionsToSync })
      });
      const data = await res.json();
      if (data.ok) {
        const now = Date.now();
        setSyncStatus('synced');
        setLastSyncedAt(now);
        localStorage.setItem('last-synced-at', String(now));
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (e) {
      setSyncStatus('error');
      setSyncError(e.message || 'Network error');
    }
  };

  // Auto-sync with debounce after every change
  useEffect(() => {
    if (!hasLoadedRef.current || !syncUrl) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushToSheet(sessions);
    }, 1500); // wait 1.5s after last change before syncing
    return () => clearTimeout(syncTimerRef.current);
  }, [sessions, syncUrl]);

  // Watch online/offline
  useEffect(() => {
    const onOffline = () => setSyncStatus('offline');
    const onOnline = () => {
      if (syncUrl) pushToSheet(sessions);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [sessions, syncUrl]);

  // Save whenever sessions change
  const saveSessions = (newSessions) => {
    setSessions(newSessions);
    try {
      localStorage.setItem('workout-sessions', JSON.stringify(newSessions));
    } catch (e) {
      console.error('Save failed', e);
    }
  };

  const addSession = (session) => {
    saveSessions([...sessions, { ...session, id: Date.now() }]);
  };

  const deleteSession = (id) => {
    saveSessions(sessions.filter(s => s.id !== id));
  };

  // Update sync URL (called from Settings)
  const updateSyncUrl = (url) => {
    const trimmed = (url || '').trim();
    setSyncUrl(trimmed);
    if (trimmed) {
      localStorage.setItem('sync-url', trimmed);
    } else {
      localStorage.removeItem('sync-url');
    }
  };

  // Manual sync trigger
  const syncNow = () => pushToSheet(sessions);

  // Restore from sheet (replaces current data)
  const restoreFromSheet = async () => {
    if (!syncUrl) return { ok: false, error: 'No sync URL set' };
    if (!navigator.onLine) return { ok: false, error: 'You are offline' };
    try {
      const res = await fetch(syncUrl + '?action=restore', { method: 'GET' });
      const data = await res.json();
      if (data.ok && Array.isArray(data.sessions)) {
        saveSessions(data.sessions);
        return { ok: true, count: data.sessions.length };
      }
      return { ok: false, error: data.error || 'Restore failed' };
    } catch (e) {
      return { ok: false, error: e.message || 'Network error' };
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading your training data...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <Dumbbell className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Training Tracker</h1>
              <p className="text-sm text-slate-500">Coach sessions + solo workouts</p>
            </div>
          </div>
          <SyncBadge syncUrl={syncUrl} syncStatus={syncStatus} lastSyncedAt={lastSyncedAt} onClick={() => setActiveTab('settings')} />
        </div>


        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white p-1 rounded-lg border border-slate-200 overflow-x-auto">
          {[
            { id: 'log', label: 'Log', icon: Plus },
            { id: 'plan', label: 'Coach', icon: ClipboardList },
            { id: 'solo', label: 'Solo', icon: Target },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'history', label: 'History', icon: Calendar },
            { id: 'settings', label: 'Settings', icon: SettingsIcon }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-fit flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
                  activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'log' && <LogTab onAdd={addSession} />}
        {activeTab === 'plan' && <CoachPlanTab />}
        {activeTab === 'solo' && <SoloPlanTab sessions={sessions} onAdd={addSession} />}
        {activeTab === 'progress' && <ProgressTab sessions={sessions} />}
        {activeTab === 'history' && <HistoryTab sessions={sessions} onDelete={deleteSession} />}
        {activeTab === 'settings' && (
          <SettingsTab
            syncUrl={syncUrl}
            onUpdateUrl={updateSyncUrl}
            syncStatus={syncStatus}
            lastSyncedAt={lastSyncedAt}
            syncError={syncError}
            onSyncNow={syncNow}
            onRestore={restoreFromSheet}
            sessionsCount={sessions.length}
          />
        )}
      </div>
    </div>
  );
}

// ============ SYNC BADGE ============
function SyncBadge({ syncUrl, syncStatus, lastSyncedAt, onClick }) {
  if (!syncUrl) {
    return (
      <button onClick={onClick} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
        <CloudOff size={14} />
        <span className="hidden sm:inline">Setup sync</span>
      </button>
    );
  }

  const statusConfig = {
    idle: { icon: Cloud, color: 'bg-slate-100 text-slate-600', label: 'Idle' },
    syncing: { icon: Cloud, color: 'bg-blue-100 text-blue-700 animate-pulse', label: 'Syncing...' },
    synced: { icon: Check, color: 'bg-green-100 text-green-700', label: lastSyncedAt ? `Synced ${formatRelativeTime(lastSyncedAt)}` : 'Synced' },
    error: { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Error' },
    offline: { icon: CloudOff, color: 'bg-amber-100 text-amber-700', label: 'Offline' }
  };
  const { icon: Icon, color, label } = statusConfig[syncStatus] || statusConfig.idle;

  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${color}`}>
      <Icon size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function formatRelativeTime(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ============ SETTINGS TAB ============
function SettingsTab({ syncUrl, onUpdateUrl, syncStatus, lastSyncedAt, syncError, onSyncNow, onRestore, sessionsCount }) {
  const [urlInput, setUrlInput] = useState(syncUrl);
  const [restoreState, setRestoreState] = useState(null); // null | 'confirming' | 'restoring' | result
  const [restoreResult, setRestoreResult] = useState(null);

  const saveUrl = () => {
    onUpdateUrl(urlInput);
  };

  const handleRestore = async () => {
    setRestoreState('restoring');
    const result = await onRestore();
    setRestoreResult(result);
    setRestoreState('result');
  };

  return (
    <div className="space-y-4">
      {/* Sync setup card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Cloud size={18} className="text-slate-700" />
          <h2 className="font-semibold text-slate-900">Google Sheets Sync</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {syncUrl ? 'Auto-syncs to your Google Sheet whenever you log a session' : 'Not connected. Follow setup steps below.'}
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Web App URL</label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={saveUrl}
              className="flex-1 bg-slate-900 text-white py-2 rounded-md font-medium text-sm hover:bg-slate-800"
            >
              {syncUrl === urlInput && syncUrl ? 'Saved' : 'Save URL'}
            </button>
            {syncUrl && (
              <button
                onClick={onSyncNow}
                disabled={syncStatus === 'syncing'}
                className="px-4 py-2 border border-slate-300 rounded-md font-medium text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Sync now
              </button>
            )}
          </div>
        </div>

        {/* Status */}
        {syncUrl && (
          <div className="mt-4 p-3 bg-slate-50 rounded-md text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Status</span>
              <span className="font-medium text-slate-900">
                {syncStatus === 'synced' && lastSyncedAt && <>✓ Synced {formatRelativeTime(lastSyncedAt)}</>}
                {syncStatus === 'syncing' && '⟳ Syncing...'}
                {syncStatus === 'error' && <span className="text-red-600">⚠ Error</span>}
                {syncStatus === 'offline' && <span className="text-amber-600">⚠ Offline</span>}
                {syncStatus === 'idle' && 'Ready'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-slate-600">Sessions stored</span>
              <span className="font-medium text-slate-900">{sessionsCount}</span>
            </div>
            {syncError && (
              <div className="mt-2 text-xs text-red-600 break-words">{syncError}</div>
            )}
          </div>
        )}
      </div>

      {/* Restore card */}
      {syncUrl && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Download size={18} className="text-slate-700" />
            <h2 className="font-semibold text-slate-900">Restore from Sheet</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Replace all local data with what's in your Google Sheet. Use this on a new phone or if you cleared Safari data.
          </p>

          {restoreState === null && (
            <button
              onClick={() => setRestoreState('confirming')}
              className="w-full border border-slate-300 text-slate-700 py-2 rounded-md font-medium text-sm hover:bg-slate-50"
            >
              Restore data from Google Sheet
            </button>
          )}

          {restoreState === 'confirming' && (
            <div className="border border-amber-200 bg-amber-50 rounded-md p-3 space-y-3">
              <p className="text-sm text-amber-900">
                <strong>This will replace your current {sessionsCount} session{sessionsCount !== 1 ? 's' : ''}</strong> with data from the sheet. Continue?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRestore}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-md font-medium text-sm hover:bg-amber-700"
                >
                  Yes, restore
                </button>
                <button
                  onClick={() => setRestoreState(null)}
                  className="flex-1 border border-slate-300 py-2 rounded-md font-medium text-sm hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {restoreState === 'restoring' && (
            <div className="text-center py-4 text-sm text-slate-500">Restoring...</div>
          )}

          {restoreState === 'result' && restoreResult && (
            <div className={`rounded-md p-3 ${restoreResult.ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-sm ${restoreResult.ok ? 'text-green-900' : 'text-red-900'}`}>
                {restoreResult.ok
                  ? `✓ Restored ${restoreResult.count} session${restoreResult.count !== 1 ? 's' : ''} from sheet.`
                  : `✗ Restore failed: ${restoreResult.error}`}
              </p>
              <button
                onClick={() => { setRestoreState(null); setRestoreResult(null); }}
                className="mt-2 text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Setup instructions */}
      {!syncUrl && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">First-time setup</h3>
          <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
            <li>Create a new Google Sheet at <strong>sheets.new</strong></li>
            <li>In the menu, choose <strong>Extensions → Apps Script</strong></li>
            <li>Delete any default code, paste in the script from <code className="bg-blue-100 px-1 rounded">google-apps-script.js</code> (in your project folder)</li>
            <li>Click <strong>Deploy → New deployment</strong></li>
            <li>Type: <strong>Web app</strong>. Execute as: <strong>Me</strong>. Access: <strong>Anyone</strong></li>
            <li>Click <strong>Deploy</strong>, authorize, copy the Web App URL</li>
            <li>Paste it above and tap <strong>Save URL</strong></li>
          </ol>
          <p className="text-xs text-blue-700 mt-3">
            <strong>Note:</strong> "Anyone" sounds scary but only people with the exact URL can access — and the URL is unguessable. Keep it private like a password.
          </p>
        </div>
      )}
    </div>
  );
}

// ============ COACH PLAN TAB ============
function CoachPlanTab() {
  const [detailExercise, setDetailExercise] = useState(null);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList size={18} className="text-slate-700" />
          <h2 className="font-semibold text-slate-900">Your 3-Day Coach Plan</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Reference for your sessions with the coach</p>

        <div className="space-y-4">
          {Object.entries(COACH_PLAN).map(([day, exercises]) => (
            <div key={day} className="border border-slate-200 rounded-md p-3">
              <h3 className="font-medium text-sm text-slate-900 mb-2">{day}</h3>
              <div className="space-y-1.5">
                {exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-700">{ex.name}</span>
                      <button
                        onClick={() => setDetailExercise(ex.name)}
                        className="text-slate-400 hover:text-blue-600 transition"
                        title="See muscles & how-to"
                      >
                        <Info size={13} />
                      </button>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">{ex.target}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <strong>Training principles from your coach:</strong>
        <ul className="mt-2 space-y-1 list-disc list-inside">
          <li>Warm up 5–10 min light cardio + dynamic stretches</li>
          <li>Inhale on the lowering phase, exhale on the lifting phase</li>
          <li>Move weights slowly and under control — no momentum</li>
          <li>Keep core engaged, spine neutral, joints aligned</li>
          <li>Stop if you feel pain or discomfort</li>
        </ul>
      </div>

      {detailExercise && (
        <ExerciseDetailModal
          exerciseName={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  );
}

// ============ LOG TAB ============
function LogTab({ onAdd }) {
  const [type, setType] = useState('coach');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState([{ name: '', weight: '', sets: '3', reps: '10' }]);
  const [showToast, setShowToast] = useState(false);

  const updateExercise = (i, field, value) => {
    const updated = [...exercises];
    updated[i] = { ...updated[i], [field]: value };
    setExercises(updated);
  };

  const addExerciseRow = () => {
    setExercises([...exercises, { name: '', weight: '', sets: '3', reps: '10' }]);
  };

  const removeExerciseRow = (i) => {
    if (exercises.length > 1) setExercises(exercises.filter((_, idx) => idx !== i));
  };

  const handleSubmit = () => {
    const validExercises = exercises
      .filter(e => e.name && e.weight)
      .map(e => ({
        name: e.name,
        muscleGroup: findMuscleGroup(e.name),
        weight: parseFloat(e.weight),
        sets: parseInt(e.sets) || 3,
        reps: parseInt(e.reps) || 10
      }));

    if (validExercises.length === 0) return;

    onAdd({
      type,
      date,
      exercises: validExercises
    });

    setExercises([{ name: '', weight: '', sets: '3', reps: '10' }]);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="space-y-4">
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Session logged!
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Session Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setType('coach')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border ${
                  type === 'coach' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                With Coach
              </button>
              <button
                onClick={() => setType('solo')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border ${
                  type === 'solo' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Solo
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-2">Exercises</label>
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <select
                  value={ex.name}
                  onChange={(e) => updateExercise(i, 'name', e.target.value)}
                  className="col-span-5 px-2 py-2 border border-slate-300 rounded-md text-sm bg-white"
                >
                  <option value="">Select exercise...</option>
                  {Object.entries(EXERCISE_LIBRARY).map(([mg, exs]) => (
                    <optgroup key={mg} label={mg}>
                      {exs.map(name => <option key={name} value={name}>{name}</option>)}
                    </optgroup>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="kg"
                  value={ex.weight}
                  onChange={(e) => updateExercise(i, 'weight', e.target.value)}
                  className="col-span-2 px-2 py-2 border border-slate-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="sets"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, 'sets', e.target.value)}
                  className="col-span-2 px-2 py-2 border border-slate-300 rounded-md text-sm"
                />
                <input
                  type="number"
                  placeholder="reps"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                  className="col-span-2 px-2 py-2 border border-slate-300 rounded-md text-sm"
                />
                <button
                  onClick={() => removeExerciseRow(i)}
                  className="col-span-1 text-slate-400 hover:text-red-600 flex justify-center"
                  disabled={exercises.length === 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addExerciseRow}
            className="mt-2 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <Plus size={14} /> Add exercise
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-slate-900 text-white py-2.5 rounded-md font-medium hover:bg-slate-800 transition"
        >
          Save Session
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
        <strong>Tip:</strong> Log your coach sessions first — then head to the "Solo Plan" tab to get suggestions for muscle groups your coach skipped this week.
      </div>
    </div>
  );
}

// ============ SOLO PLAN TAB ============
function SoloPlanTab({ sessions, onAdd }) {
  const weekStart = getWeekStart();
  const [detailExercise, setDetailExercise] = useState(null);

  // Find muscle groups hit this week (by coach + solo)
  const hitThisWeek = useMemo(() => {
    const hit = new Set();
    sessions.forEach(s => {
      if (new Date(s.date) >= weekStart) {
        s.exercises.forEach(e => {
          if (e.muscleGroup) hit.add(e.muscleGroup);
        });
      }
    });
    return hit;
  }, [sessions]);

  const skippedGroups = MUSCLE_GROUPS.filter(mg => !hitThisWeek.has(mg));

  // Suggest a balanced solo workout from skipped groups
  // For "general fitness & tone": pick 2-3 compound + 2-3 isolation, ~5-6 exercises total
  const suggestedWorkout = useMemo(() => {
    if (skippedGroups.length === 0) return [];

    const priorityOrder = ['Back', 'Chest', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Biceps', 'Triceps', 'Core', 'Calves'];
    const sorted = [...skippedGroups].sort((a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b));

    const workout = [];
    sorted.slice(0, 5).forEach(mg => {
      const exercises = EXERCISE_LIBRARY[mg];
      if (exercises && exercises.length > 0) {
        const name = exercises[0];
        workout.push({
          muscleGroup: mg,
          name,
          sets: 3,
          reps: 12,
          suggestion: suggestWeight(name, sessions)
        });
      }
    });
    if (!workout.find(w => w.muscleGroup === 'Core') && skippedGroups.includes('Core')) {
      workout.push({
        muscleGroup: 'Core',
        name: 'Plank',
        sets: 3,
        reps: 30,
        suggestion: { weight: null, confidence: 'low', reason: 'Hold for time, no weight needed' }
      });
    }
    return workout;
  }, [skippedGroups, sessions]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-1">This Week's Coverage</h2>
        <p className="text-xs text-slate-500 mb-4">Week of {weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>

        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map(mg => (
            <span
              key={mg}
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                hitThisWeek.has(mg)
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {hitThisWeek.has(mg) ? '✓ ' : ''}{mg}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="bg-green-50 rounded-md p-3">
            <div className="text-2xl font-semibold text-green-900">{hitThisWeek.size}</div>
            <div className="text-xs text-green-700">Muscle groups hit</div>
          </div>
          <div className="bg-amber-50 rounded-md p-3">
            <div className="text-2xl font-semibold text-amber-900">{skippedGroups.length}</div>
            <div className="text-xs text-amber-700">Still to target</div>
          </div>
        </div>
      </div>

      {suggestedWorkout.length > 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Target size={18} className="text-slate-700" />
            <h2 className="font-semibold text-slate-900">Suggested Solo Workout</h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">Targeting muscles your coach skipped this week</p>

          <div className="space-y-2">
            {suggestedWorkout.map((ex, i) => {
              const { weight, confidence, reason } = ex.suggestion;
              const confColor = confidence === 'high'
                ? 'bg-green-100 text-green-800'
                : confidence === 'medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-600';
              const confLabel = confidence === 'high' ? 'from history' : confidence === 'medium' ? 'estimate' : 'new';
              return (
                <div key={i} className="p-3 bg-slate-50 rounded-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-sm text-slate-900">{ex.name}</div>
                        <button
                          onClick={() => setDetailExercise(ex.name)}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title="See muscles & how-to"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                      <div className="text-xs text-slate-500">{ex.muscleGroup}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-slate-900">
                        {weight !== null ? `${weight} kg` : '—'}
                      </div>
                      <div className="text-xs text-slate-500">
                        {ex.sets} × {ex.reps}{ex.muscleGroup === 'Core' && ex.name === 'Plank' ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${confColor}`}>
                      {confLabel}
                    </span>
                    <span className="text-xs text-slate-600">{reason}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-slate-50 rounded-md p-3 text-xs text-slate-600">
            <strong>Warm-up:</strong> 5 min light cardio + dynamic stretching. <strong>Rest:</strong> 60-90s between sets. If a suggested weight feels too light or heavy on the first set, adjust — log what you actually did so next time's suggestion is sharper.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
          <div className="text-3xl mb-2">💪</div>
          <h3 className="font-semibold text-slate-900 mb-1">All muscle groups covered!</h3>
          <p className="text-sm text-slate-500">Great week. Consider a rest day or light cardio session.</p>
        </div>
      )}

      {detailExercise && (
        <ExerciseDetailModal
          exerciseName={detailExercise}
          onClose={() => setDetailExercise(null)}
        />
      )}
    </div>
  );
}

// ============ PROGRESS TAB ============
function ProgressTab({ sessions }) {
  // Get all unique exercises that have been logged
  const loggedExercises = useMemo(() => {
    const map = new Map();
    sessions.forEach(s => {
      s.exercises.forEach(e => {
        if (!map.has(e.name)) map.set(e.name, []);
        map.get(e.name).push({ date: s.date, weight: e.weight, reps: e.reps, sets: e.sets, type: s.type });
      });
    });
    // Sort each by date
    map.forEach(arr => arr.sort((a, b) => new Date(a.date) - new Date(b.date)));
    return map;
  }, [sessions]);

  const exerciseNames = [...loggedExercises.keys()];
  const [selectedExercise, setSelectedExercise] = useState(exerciseNames[0] || null);

  // Update selection if list changes
  useEffect(() => {
    if (!selectedExercise && exerciseNames.length > 0) setSelectedExercise(exerciseNames[0]);
  }, [exerciseNames, selectedExercise]);

  if (exerciseNames.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Activity size={32} className="mx-auto text-slate-300 mb-2" />
        <h3 className="font-semibold text-slate-900 mb-1">No data yet</h3>
        <p className="text-sm text-slate-500">Log a few sessions to see your progress over time.</p>
      </div>
    );
  }

  const data = loggedExercises.get(selectedExercise) || [];
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    weight: d.weight,
    reps: d.reps
  }));

  // Weight progression advice
  const advice = generateAdvice(data);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <label className="block text-xs font-medium text-slate-600 mb-2">Exercise</label>
        <select
          value={selectedExercise || ''}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          {exerciseNames.map(name => <option key={name} value={name}>{name}</option>)}
        </select>
      </div>

      {data.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-1">Weight Progression</h3>
            <p className="text-xs text-slate-500 mb-4">{data.length} session{data.length !== 1 ? 's' : ''} logged</p>

            {chartData.length > 1 ? (
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}
                      formatter={(v) => `${v} kg`}
                    />
                    <Line type="monotone" dataKey="weight" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                Log this exercise more than once to see a trend chart.
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-500">Latest</div>
                <div className="font-semibold text-slate-900">{data[data.length - 1].weight} kg</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-500">Best</div>
                <div className="font-semibold text-slate-900">{Math.max(...data.map(d => d.weight))} kg</div>
              </div>
              <div className="bg-slate-50 rounded-md p-3">
                <div className="text-xs text-slate-500">Change</div>
                <div className={`font-semibold ${data[data.length - 1].weight - data[0].weight >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {data[data.length - 1].weight - data[0].weight > 0 ? '+' : ''}
                  {(data[data.length - 1].weight - data[0].weight).toFixed(1)} kg
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Lightbulb size={18} className="text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-amber-900 text-sm mb-1">Advice</h4>
                <p className="text-sm text-amber-900">{advice}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function generateAdvice(data) {
  if (data.length === 0) return "Log this exercise to start getting personalized advice.";
  if (data.length === 1) return "Log this exercise at least 2-3 times to get progression advice. For your second session, try the same weight and focus on form.";

  const latest = data[data.length - 1];
  const prev = data[data.length - 2];
  const lastThree = data.slice(-3);
  const sameWeightStreak = lastThree.filter(d => d.weight === latest.weight && d.reps >= 10).length;

  // For general fitness & tone: target 10-15 reps, modest weight increases
  if (latest.reps >= 12 && sameWeightStreak >= 2) {
    const increase = latest.weight < 10 ? 1 : latest.weight < 30 ? 2 : 2.5;
    return `You've hit ${latest.reps}+ reps at ${latest.weight} kg for ${sameWeightStreak} sessions. Time to bump up to ${(latest.weight + increase).toFixed(1)} kg. Drop to 8-10 reps and build back up.`;
  }

  if (latest.reps < 8) {
    return `${latest.reps} reps is on the lower end for general fitness goals. Consider dropping the weight slightly (try ${(latest.weight * 0.9).toFixed(1)} kg) so you can hit 10-12 clean reps with good form.`;
  }

  if (latest.weight > prev.weight && latest.reps < prev.reps - 2) {
    return `You jumped from ${prev.weight} to ${latest.weight} kg but reps dropped from ${prev.reps} to ${latest.reps}. That's expected — stick with this weight for 2-3 more sessions until you can hit 10-12 reps again.`;
  }

  if (latest.reps >= 10 && latest.reps <= 12) {
    return `${latest.reps} reps at ${latest.weight} kg is right in the sweet spot for toning. Keep this weight until you can comfortably hit 12+ reps for all sets, then increase.`;
  }

  return `You're at ${latest.reps} reps with ${latest.weight} kg. Aim for 10-12 reps per set with good form before considering a weight increase.`;
}

// ============ HISTORY TAB ============
function HistoryTab({ sessions, onDelete }) {
  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Calendar size={32} className="mx-auto text-slate-300 mb-2" />
        <h3 className="font-semibold text-slate-900 mb-1">No sessions yet</h3>
        <p className="text-sm text-slate-500">Head to the Log tab to record your first session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map(session => (
        <div key={session.id} className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                session.type === 'coach' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {session.type === 'coach' ? 'Coach' : 'Solo'}
              </span>
              <span className="text-sm font-medium text-slate-900">{formatDate(session.date)}</span>
            </div>
            <button
              onClick={() => onDelete(session.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <div className="space-y-1">
            {session.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1">
                <div>
                  <span className="text-slate-900">{ex.name}</span>
                  {ex.muscleGroup && <span className="text-xs text-slate-400 ml-2">{ex.muscleGroup}</span>}
                </div>
                <span className="text-slate-600 text-xs">
                  {ex.weight} kg • {ex.sets} × {ex.reps}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
