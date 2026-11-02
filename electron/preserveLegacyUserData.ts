import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// Keep existing installs on their original profile after the display name
// changes. New installs use Electron's Sneak-Peek default profile path.
if (!process.env.NATIVELY_TEST_USERDATA) {
  const appData = app.getPath('appData');
  const names = app.isPackaged ? ['Natively', 'natively'] : ['natively', 'Natively'];
  const legacyPath = names
    .map((name) => path.join(appData, name))
    .find((candidate) => {
      try {
        return fs.statSync(candidate).isDirectory();
      } catch {
        return false;
      }
    });

  if (legacyPath) {
    app.setPath('userData', legacyPath);
    app.setPath('sessionData', legacyPath);
  }
}
