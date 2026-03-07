import fs from 'fs';
import cp from 'child_process';
console.log(cp.execSync('git log -p App.tsx | head -n 500').toString());
