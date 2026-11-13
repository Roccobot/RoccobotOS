// The browser engine of the page tests. WebKit is the default, because the site is read in Safari;
// TEST_BROWSER=chromium (or firefox) runs the same checks where WebKit is not installed, as in a
// Linux container. PLAYWRIGHT_WEBKIT_EXECUTABLE still points WebKit at a build of its own.
// Author: Rocco Casadei, a.k.a. Roccobot
const playwright = require('playwright');

const ENGINES = ['webkit', 'chromium', 'firefox'];

function engineName() {
  const name = process.env.TEST_BROWSER || 'webkit';
  if (!ENGINES.includes(name)) throw new Error(`TEST_BROWSER must be one of ${ENGINES.join(', ')}, not ${name}`);
  return name;
}

function launch() {
  const name = engineName();
  const executable = name === 'webkit' && process.env.PLAYWRIGHT_WEBKIT_EXECUTABLE;
  return playwright[name].launch({ ...(executable ? { executablePath: executable } : {}), headless: true });
}

module.exports = { engineName, launch };
