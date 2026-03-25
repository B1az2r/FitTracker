// =============================================
// data.js - 운동 DB 및 MET 테이블
// =============================================

// 유산소 MET 테이블 (속도 km/h 기준)
const CARDIO_DB = [
  {
    type: "walking",
    name: "걷기",
    getMET: (speed) => {
      if (speed <= 4.0) return 2.8;
      if (speed <= 5.0) return 3.5;
      if (speed <= 6.0) return 4.1;
      if (speed <= 7.0) return 4.5;
      return 5.0;
    }
  },
  {
    type: "running",
    name: "달리기",
    getMET: (speed) => {
      if (speed <= 8.0)  return 8.0;
      if (speed <= 9.0)  return 9.0;
      if (speed <= 10.0) return 10.0;
      if (speed <= 11.0) return 10.5;
      if (speed <= 12.0) return 11.0;
      if (speed <= 13.0) return 11.5;
      if (speed <= 14.0) return 12.3;
      return 13.0;
    }
  },
  {
    type: "cycling",
    name: "실내자전거",
    getMET: (speed) => {
      if (speed <= 10.0) return 4.0;
      if (speed <= 15.0) return 6.8;
      if (speed <= 20.0) return 8.0;
      return 10.0;
    }
  },
  {
    type: "stairs",
    name: "계단오르기",
    getMET: () => 8.0
  },
  {
    type: "elliptical",
    name: "일립티컬",
    getMET: () => 5.0
  }
];

// 웨이트 운동군 가중치
const GROUP_WEIGHTS = {
  "하체복합":      1.00,
  "상체복합당기기": 0.85,
  "상체복합밀기":   0.82,
  "하체고립":      0.72,
  "상체고립":      0.65
};

// 웨이트 운동 DB
// isAssist: true → 어시스트 머신 (숫자가 클수록 쉬움, 실제 부하 = 체중 - 입력값)
const WEIGHT_DB = [
  // 하체 복합
  { name: "레그프레스",         group: "하체복합",      displayGroup: "하체 — 복합",   correction: 1.03 },
  { name: "스쿼트",             group: "하체복합",      displayGroup: "하체 — 복합",   correction: 1.05 },
  { name: "런지",               group: "하체복합",      displayGroup: "하체 — 복합",   correction: 1.04 },
  { name: "데드리프트",         group: "하체복합",      displayGroup: "하체 — 복합",   correction: 1.05 },
  // 하체 고립
  { name: "레그익스텐션",       group: "하체고립",      displayGroup: "하체 — 고립",   correction: 1.03 },
  { name: "레그컬",             group: "하체고립",      displayGroup: "하체 — 고립",   correction: 0.99 },
  { name: "이너타이",           group: "하체고립",      displayGroup: "하체 — 고립",   correction: 0.96 },
  { name: "아우터타이",         group: "하체고립",      displayGroup: "하체 — 고립",   correction: 0.96 },
  { name: "카프레이즈",         group: "하체고립",      displayGroup: "하체 — 고립",   correction: 0.95 },
  // 상체 복합 당기기
  { name: "랫풀다운",           group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 1.00 },
  { name: "시티드로우(롱풀)",   group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 0.99 },
  { name: "원암시티드로우",     group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 0.99 },
  { name: "티바로우",           group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 1.02 },
  { name: "로우풀리",           group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 0.99 },
  { name: "어시스트풀업",       group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 1.01, isAssist: true },
  { name: "어시스트딥스",       group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 1.01, isAssist: true },
  { name: "바벨로우",           group: "상체복합당기기", displayGroup: "상체 — 당기기", correction: 1.02 },
  // 상체 복합 밀기
  { name: "체스트프레스",       group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 1.00 },
  { name: "벤치프레스",         group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 1.02 },
  { name: "숄더프레스",         group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 0.99 },
  { name: "인클라인벤치프레스", group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 1.01 },
  { name: "딥스",               group: "상체복합밀기",   displayGroup: "상체 — 밀기",   correction: 1.02 },
  // 상체 고립
  { name: "펙덱플라이",         group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "암컬머신",           group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "바벨컬",             group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "덤벨컬",             group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "트라이셉스익스텐션", group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "케이블푸시다운",     group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.97 },
  { name: "사이드레터럴레이즈", group: "상체고립",       displayGroup: "상체 — 고립",   correction: 0.96 },
];

// 휴식시간 보정
function getRestCorrection(restSeconds) {
  if (restSeconds <= 60)  return 1.03;
  if (restSeconds <= 120) return 1.00;
  return 0.97;
}
