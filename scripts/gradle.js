#!/usr/bin/env node
/**
 * Runs the Gradle wrapper on any OS:  npm run gradle -- clean
 * (uses gradlew.bat on Windows, ./gradlew elsewhere)
 */
const {spawnSync} = require('child_process');
const path = require('path');

const androidDir = path.resolve(__dirname, '..', 'android');
const isWin = process.platform === 'win32';
const cmd = isWin ? 'gradlew.bat' : './gradlew';
const result = spawnSync(cmd, process.argv.slice(2), {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin, // .bat files need a shell on Windows
});
process.exit(result.status === null ? 1 : result.status);
