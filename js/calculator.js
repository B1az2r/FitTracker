// =============================================
// calculator.js - 계산 엔진
// =============================================

// ── 신체 지표 계산 ──────────────────────────

function calcBMI(weight, heightCm) {
  const h = heightCm / 100;
  return weight / (h * h);
}

function calcBMR(gender, age, heightCm, weight) {
  // Mifflin-St Jeor 공식
  if (gender === "male") {
    return 10 * weight + 6.25 * heightCm - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * heightCm - 5 * age - 161;
  }
}

function calcIdealWeight(gender, heightCm) {
  // 브로카 변법
  const base = heightCm - 100;
  return gender === "male" ? base * 0.9 : base * 0.85;
}

function calcRecommendedCalories(bmr) {
  // 보통 활동량 기준 (TDEE: BMR × 1.55)
  return Math.round(bmr * 1.55);
}

// 체지방 미입력 시 추정 (성별/나이/BMI 기반)
function estimateBodyFat(gender, age, bmi) {
  // Deurenberg 공식
  if (gender === "male") {
    return 1.20 * bmi + 0.23 * age - 16.2;
  } else {
    return 1.20 * bmi + 0.23 * age - 5.4;
  }
}

// ── 유산소 계산 ─────────────────────────────

// 구간 하나의 kcal 계산
function calcCardioInterval(met, weightKg, durationMin) {
  return met * weightKg * (durationMin / 60);
}

// 전체 유산소 세션 계산
// intervals: [{ type, speed, durationMin, incline(선택) }]
function calcCardioTotal(intervals, weightKg) {
  const results = intervals.map(interval => {
    const cardioInfo = CARDIO_DB.find(c => c.type === interval.type);
    if (!cardioInfo) return { ...interval, kcal: 0 };

    let met = cardioInfo.getMET(interval.speed);

    // 경사도 보정 (경사도 1%당 약 0.07 MET 추가 - 걷기/달리기에만 적용)
    if (interval.incline && interval.incline > 0 &&
        (interval.type === "walking" || interval.type === "running")) {
      met += interval.incline * 0.07;
    }

    const kcal = calcCardioInterval(met, weightKg, interval.durationMin);
    return {
      ...interval,
      met: Math.round(met * 10) / 10,
      kcal: Math.round(kcal * 10) / 10
    };
  });

  const totalKcal = results.reduce((sum, r) => sum + r.kcal, 0);
  return {
    intervals: results,
    totalKcal: Math.round(totalKcal * 10) / 10
  };
}

// ── 웨이트 계산 ─────────────────────────────

// Lytle & Lambert (2019) 회귀방정식
// totalVolume: 전체 세션 총 볼륨 (kg)
// heightCm, age, fatMass, leanMass
function calcLytleSession(heightCm, age, fatMass, leanMass, totalVolume) {
  const kcal = 0.874 * heightCm
             - 0.596 * age
             - 1.016 * fatMass
             + 1.638 * leanMass
             + 2.461 * (totalVolume * 0.001)
             - 110.742;
  return Math.max(kcal, 0); // 음수 방지
}

// 운동별 score 계산
function calcExerciseScore(exercise, restSeconds, userWeight) {
  // 어시스트 머신 역산: 실제 부하 = 체중 - 입력값
  // 예) 체중 70kg, 어시스트 40kg → 실제 부하 30kg
  const effectiveSets = exercise.isAssist
    ? exercise.sets.map(s => ({
        weight: Math.max((userWeight || 70) - s.weight, 0),
        reps: s.reps
      }))
    : exercise.sets;

  // 볼륨 계산: 실제 유효 부하 × 반복수 합산
  const volume = effectiveSets.reduce((sum, set) => sum + set.weight * set.reps, 0);

  const groupWeight = GROUP_WEIGHTS[exercise.group] || 1.0;
  const correction = exercise.correction || 1.0;
  const restCorrection = getRestCorrection(restSeconds);

  const score = volume * groupWeight * correction * restCorrection;

  return { volume, score };
}

// 전체 웨이트 세션 계산
// userInfo: { heightCm, age, weight, fatMass(선택), leanMass(선택) }
// exercises: [{ name, group, correction, sets: [{weight, reps}], restSeconds }]
function calcWeightSession(userInfo, exercises) {
  const { heightCm, age, weight } = userInfo;

  // 체지방량 처리
  let fatMass = userInfo.fatMass;
  let leanMass = userInfo.leanMass;
  let isPreciseMode = true;

  if (!fatMass) {
    // 미입력 시 추정
    isPreciseMode = false;
    const bmi = calcBMI(weight, heightCm);
    const fatPercent = estimateBodyFat(userInfo.gender, age, bmi);
    fatMass = weight * (fatPercent / 100);
    leanMass = weight - fatMass;
  } else if (!leanMass) {
    leanMass = weight - fatMass;
  }

  // 각 운동별 score 계산 + 어시스트 노트 수집
  const assistNotes = [];
  const exerciseScores = exercises.map(ex => {
    const { volume, score } = calcExerciseScore(ex, ex.restSeconds || 90, userInfo.weight);
    if (ex.isAssist) {
      const avgAssist = ex.sets.reduce((s, set) => s + set.weight, 0) / ex.sets.length;
      assistNotes.push({
        name: ex.name,
        assistWeight: Math.round(avgAssist * 10) / 10,
        effectiveLoad: Math.round((userInfo.weight - avgAssist) * 10) / 10,
        bodyWeight: userInfo.weight
      });
    }
    return { ...ex, volume, score };
  });

  // 총 볼륨 및 총 score
  const totalVolume = exerciseScores.reduce((sum, ex) => sum + ex.volume, 0);
  const totalScore = exerciseScores.reduce((sum, ex) => sum + ex.score, 0);

  // Lytle 식으로 세션 총 kcal 계산
  const sessionKcal = calcLytleSession(heightCm, age, fatMass, leanMass, totalVolume);

  // 오차 범위: 정밀모드 ±21%, 추정모드 ±30%
  const errorRate = isPreciseMode ? 0.215 : 0.30;
  const sessionMin = Math.round(sessionKcal * (1 - errorRate));
  const sessionMax = Math.round(sessionKcal * (1 + errorRate));

  // 운동별 kcal 분배 (score 비율로)
  const exerciseResults = exerciseScores.map(ex => {
    const ratio = totalScore > 0 ? ex.score / totalScore : 0;
    const kcal = Math.round(sessionKcal * ratio);
    const kcalMin = Math.round(sessionMin * ratio);
    const kcalMax = Math.round(sessionMax * ratio);
    return {
      name: ex.name,
      volume: Math.round(ex.volume),
      sets: ex.sets.length,
      totalReps: ex.sets.reduce((sum, s) => sum + s.reps, 0),
      kcal, kcalMin, kcalMax
    };
  });

  return {
    isPreciseMode,
    totalVolume: Math.round(totalVolume),
    sessionKcal: Math.round(sessionKcal),
    sessionMin,
    sessionMax,
    exercises: exerciseResults,
    assistNotes
  };
}
