const fs = require('fs');
const path = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(teacher)\\assignments\\AssignmentsClientView.tsx';
let content = fs.readFileSync(path, 'utf8');

const bad1 = 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => . ).join("\\n")';
const good = 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")';

content = content.replace(bad1, good);

const bad2 = 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => . ).join("\\n")'; // wait, it might contain actual dollar sign $
// Let's just find const qText =  and replace until .join
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const qText = ')) {
    lines[i] = '                const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")';
  }
}
fs.writeFileSync(path, lines.join('\n'), 'utf8');
