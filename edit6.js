const fs = require('fs');

// AssignmentsClientView.tsx
const path2 = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(teacher)\\assignments\\AssignmentsClientView.tsx';
let content2 = fs.readFileSync(path2, 'utf8');

content2 = content2.replace(/const qText = "\\n--- Questions ---\\n" \+ selected\.map\(\(q, i\) => \$\{i \+ 1\}\. \)\.join\("\\n"\)/g, 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');

fs.writeFileSync(path2, content2, 'utf8');

// TasksClientView.tsx
const path1 = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(student)\\portal\\tasks\\TasksClientView.tsx';
let content1 = fs.readFileSync(path1, 'utf8');

// The error is probably a missing brace. Let's see if there's a missing brace for const TaskCard = ({ task }: { task: Task }) => {
// Let's count { and }
let open = 0, close = 0;
for(let char of content1) {
  if (char === '{') open++;
  if (char === '}') close++;
}
console.log('TasksClientView.tsx', 'open:', open, 'close:', close);

if (open > close) {
  content1 += '}'.repeat(open - close);
}

fs.writeFileSync(path1, content1, 'utf8');
