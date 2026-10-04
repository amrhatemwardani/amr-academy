const fs = require('fs');

const path = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(student)\\portal\\tasks\\TasksClientView.tsx';
let content = fs.readFileSync(path, 'utf8');

// I will just remove anything after the last bracket of the component if there is any garbage.
let matches = content.match(/[\s\S]*\}\s*\n$/);
if (!matches) {
  // Let's just fix the bracket at the end.
  const lastBracket = content.lastIndexOf('}');
  if (lastBracket !== -1) {
    content = content.substring(0, lastBracket + 1) + '\\n';
    fs.writeFileSync(path, content, 'utf8');
  }
}

const path2 = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(teacher)\\assignments\\AssignmentsClientView.tsx';
let content2 = fs.readFileSync(path2, 'utf8');
content2 = content2.replace('const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => . ).join("\\n")', 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');
content2 = content2.replace('const qText = "\\r\\n--- Questions ---\\r\\n" + selected.map((q, i) => . ).join("\\r\\n")', 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');
content2 = content2.replace('const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ).join("\\n")', 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');
content2 = content2.replace(/const qText = "[^"]*" \+ selected\.map\(\(q, i\) => [^)]*\)\.join\("[^"]*"\)/g, 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');

fs.writeFileSync(path2, content2, 'utf8');
