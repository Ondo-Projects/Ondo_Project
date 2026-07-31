/**
 * Phase 0 — API 로딩 베이스라인 측정
 *
 * 사용법 (BN 서버 기동 후):
 *   $env:API_BASE="http://localhost:8081"
 *   $env:STUDENT_USER="student-id"
 *   $env:STUDENT_PASS="password"
 *   $env:TEACHER_USER="teacher-id"
 *   $env:TEACHER_PASS="password"
 *   node scripts/measure-api-baseline.mjs
 *
 * 역할별로 STUDENT_* 또는 TEACHER_* 만 설정해도 됩니다.
 */

const API_BASE = (process.env.API_BASE ?? 'http://localhost:8081').replace(/\/$/, '');

const ROLES = [
  {
    label: 'student',
    username: process.env.STUDENT_USER,
    password: process.env.STUDENT_PASS,
    endpoints: [
      { name: 'profile/school', path: '/api/student/profile/school' },
      { name: 'assignment', path: '/api/student/assignment', optional: true },
      { name: 'meals/today', path: '/api/student/meals/today', external: 'NEIS' },
      { name: 'weather/today', path: '/api/student/weather/today', external: '기상청' },
      { name: 'schedule/upcoming', path: '/api/common/school-schedule/upcoming?days=14', external: 'NEIS' },
      { name: 'timetable/today', path: '/api/student/timetable/today', external: 'NEIS' },
      { name: 'notices', path: '/api/student/notices', optional: true },
      { name: 'mood/today', path: '/api/student/mood/today' },
      { name: 'pre-counsel', path: '/api/student/pre-counseling-profile' },
      { name: 'counseling/my', path: '/api/counseling/my' },
      { name: 'suggestions', path: '/api/student/suggestions' },
      { name: 'student/home (aggregate)', path: '/api/student/home', aggregate: true },
      { name: 'profile/class', path: '/api/student/profile/class' },
      { name: 'announcements', path: '/api/common/announcements?page=0&size=10' },
    ],
  },
  {
    label: 'teacher',
    username: process.env.TEACHER_USER,
    password: process.env.TEACHER_PASS,
    endpoints: [
      { name: 'profile/school', path: '/api/teacher/profile/school' },
      { name: 'weather/today (home)', path: '/api/common/weather/today', external: '기상청' },
      { name: 'schedule/upcoming', path: '/api/common/school-schedule/upcoming?days=14', external: 'NEIS' },
      { name: 'counseling/unread', path: '/api/counseling/unread-count' },
      { name: 'counseling/teacher', path: '/api/counseling/teacher' },
      { name: 'pre-counsel-profiles', path: '/api/teacher/pre-counseling-profiles' },
      { name: 'suggestions', path: '/api/teacher/suggestions' },
      { name: 'teacher/home (aggregate)', path: '/api/teacher/home', aggregate: true },
      { name: 'notification-settings', path: '/api/teacher/profile/notification-settings' },
      { name: 'invite-code', path: '/api/teacher/invite-code' },
      { name: 'notices', path: '/api/teacher/notices' },
      { name: 'mood/today', path: '/api/teacher/mood/today' },
      { name: 'mood/weekly', path: '/api/teacher/mood/weekly' },
      { name: 'announcements', path: '/api/common/announcements?page=0&size=10' },
    ],
  },
  {
    label: 'home-student',
    username: process.env.STUDENT_USER,
    password: process.env.STUDENT_PASS,
    endpoints: [
      { name: 'common/home (aggregate)', path: '/api/common/home?days=14', aggregate: true },
      { name: 'announcements', path: '/api/common/announcements?page=0&size=10' },
    ],
  },
];

async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`login failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.accessToken;
}

async function measureEndpoint(token, endpoint) {
  const started = performance.now();
  let status = 0;
  let ok = false;
  let error = '';

  try {
    const response = await fetch(`${API_BASE}${endpoint.path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    status = response.status;
    ok = response.ok;
    if (!response.ok) {
      error = (await response.text()).slice(0, 120);
    } else {
      await response.text();
    }
  } catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  const durationMs = Math.round(performance.now() - started);
  return { ...endpoint, status, ok, durationMs, error };
}

async function measureRole(roleConfig) {
  if (!roleConfig.username || !roleConfig.password) {
    console.log(`\n[skip] ${roleConfig.label} — credentials not set`);
    return [];
  }

  console.log(`\n=== ${roleConfig.label} ===`);
  const token = await login(roleConfig.username, roleConfig.password);
  const results = [];

  for (const endpoint of roleConfig.endpoints) {
    const result = await measureEndpoint(token, endpoint);
    results.push(result);
    const flag = result.ok ? 'OK' : 'FAIL';
    const ext = result.external ? ` [${result.external}]` : '';
    console.log(
      `${flag.padEnd(4)} ${String(result.durationMs).padStart(5)}ms  ${result.status}  ${result.name}${ext}`,
    );
    if (result.error) {
      console.log(`      ${result.error}`);
    }
  }

  return results;
}

async function main() {
  console.log(`API base: ${API_BASE}`);
  console.log(`Measured at: ${new Date().toISOString()}`);

  try {
    const probe = await fetch(`${API_BASE}/api/auth/me`, { method: 'GET' });
    console.log(`Server probe /api/auth/me → ${probe.status}`);
  } catch (error) {
    console.error('\n[ERROR] BN 서버에 연결할 수 없습니다. application.properties port(8081) 확인 후 재실행하세요.');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }

  const allResults = [];
  for (const role of ROLES) {
    allResults.push(...(await measureRole(role)));
  }

  const successful = allResults.filter((item) => item.ok);
  const slowest = [...successful].sort((a, b) => b.durationMs - a.durationMs).slice(0, 5);

  console.log('\n=== Slow API Top 5 (successful requests) ===');
  if (slowest.length === 0) {
    console.log('(no successful samples — check credentials or server data)');
  } else {
    for (const item of slowest) {
      const ext = item.external ? ` [${item.external}]` : '';
      console.log(`${item.durationMs}ms  ${item.name}${ext}  ${item.path}`);
    }
  }

  const totalMs = successful.reduce((sum, item) => sum + item.durationMs, 0);
  console.log(`\nSequential sum (endpoints only): ${totalMs}ms across ${successful.length} OK requests`);
  console.log('Note: 브라우저는 병렬/중복 호출로 실제 체감 시간·요청 수가 다를 수 있습니다.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
