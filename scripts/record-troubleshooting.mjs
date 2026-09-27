import { appendFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const [, , checkName, logPath] = process.argv;

if (!checkName || !logPath) {
  console.error('Usage: node scripts/record-troubleshooting.mjs <check> <log-file>');
  process.exit(2);
}

const date = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const output = (await readFile(logPath, 'utf8')).trim() || '(출력 없음)';
const safeOutput = output.replaceAll('```', "''' ");
const filePath = path.join('docs', 'troubleshooting', `${date}.md`);
const entry = `\n# ${date} ${checkName} 검사 실패\n\n## 🐞 에러 내용\n커밋 전 \`pnpm ${checkName}\` 검사 실패\n\n## 🔍 원인 분석\n- 아래 자동 수집 로그를 확인해야 함\n\n\`\`\`text\n${safeOutput}\n\`\`\`\n\n## ✅ 해결 방법\n- 오류를 수정한 뒤 \`pnpm ${checkName}\`을 다시 실행\n\n## 회고\n- 테스트와 린트 실패를 커밋 전에 확인한다.\n`;

await appendFile(filePath, entry, 'utf8');
