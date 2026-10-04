const fs = require('fs');

// TasksClientView.tsx
const path1 = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(student)\\portal\\tasks\\TasksClientView.tsx';
let content1 = fs.readFileSync(path1, 'utf8');

const lastBrace = content1.lastIndexOf('}');
if (lastBrace !== -1) {
  content1 = content1.substring(0, lastBrace) + content1.substring(lastBrace + 1);
}
fs.writeFileSync(path1, content1, 'utf8');
