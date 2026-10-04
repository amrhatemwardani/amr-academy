const fs = require('fs');
const path = 'c:\\Users\\hp\\Documents\\Amr Acadmy\\src\\app\\[locale]\\(teacher)\\assignments\\AssignmentsClientView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/const qText = "[\\s\\S]*?\\.join\\("[\\s\\S]*?"\\)/, 'const qText = "\\n--- Questions ---\\n" + selected.map((q, i) => ${i + 1}. ).join("\\n")');

fs.writeFileSync(path, content, 'utf8');
