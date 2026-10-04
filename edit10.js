const fs = require('fs');
const path = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(teacher)\\assignments\\AssignmentsClientView.tsx';
let content = fs.readFileSync(path, 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].indexOf('const qText = ') !== -1) {
    console.log("Found line to replace at: " + i);
    lines[i] = '                const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => `${i + 1}. ${q.body}`).join("\\n")';
  }
}
fs.writeFileSync(path, lines.join('\n'), 'utf8');
