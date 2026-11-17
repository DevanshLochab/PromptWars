import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENS_DIR = path.resolve('docs/screens');
if (!fs.existsSync(SCREENS_DIR)) {
  fs.mkdirSync(SCREENS_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
];

const PAGES = [
  { route: '/', name: 'today' },
  { route: '/plan', name: 'plan' },
  { route: '/what-if', name: 'compare' },
  { route: '/community', name: 'community' },
  { route: '/ask', name: 'ask' },
];

async function run() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  console.log('Capturing screenshots across viewports, themes, and languages...');

  // 1. Welcome & Onboarding screenshots
  for (const vp of [{ name: '390x844', width: 390, height: 844 }, { name: '1440x900', width: 1440, height: 900 }]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      const page = await context.newPage();

      // Clear storage so welcome screen shows
      await page.goto('http://localhost:3000');
      await page.evaluate((th) => {
        localStorage.clear();
        localStorage.setItem('saans-theme', th);
        if (th === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, theme);
      await page.reload();
      await page.waitForTimeout(1000);

      const welcomeFile = path.join(SCREENS_DIR, `welcome_${vp.name}_${theme}.png`);
      await page.screenshot({ path: welcomeFile, fullPage: false });
      console.log(`Saved ${welcomeFile}`);

      // Click "Set up my family's plan" to see Step 1 of onboarding
      const setupBtn = page.getByRole('button', { name: /set up my family's plan/i });
      if (await setupBtn.isVisible()) {
        await setupBtn.click();
        await page.waitForTimeout(600);
        const onbFile = path.join(SCREENS_DIR, `onboarding_step1_${vp.name}_${theme}.png`);
        await page.screenshot({ path: onbFile, fullPage: false });
        console.log(`Saved ${onbFile}`);
      }

      await context.close();
    }
  }

  // 2. Full app screens with demo profile loaded across all 5 viewports × 2 themes (Light/Dark)
  for (const vp of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });
      const page = await context.newPage();

      // Seed onboardingComplete + demo profile
      await page.goto('http://localhost:3000');
      await page.evaluate((th) => {
        localStorage.setItem('saans_onboarding_complete_v1', 'true');
        localStorage.setItem('saans_demo_mode_active', 'true');
        localStorage.setItem('saans-theme', th);
        if (th === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, theme);

      for (const p of PAGES) {
        await page.goto(`http://localhost:3000${p.route}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(600);

        const filename = `${p.name}_${vp.name}_${theme}.png`;
        const filePath = path.join(SCREENS_DIR, filename);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved ${filePath}`);
      }

      await context.close();
    }
  }

  // 3. Hindi pass sample on 390x844 (Mobile) and 1440x900 (Desktop)
  const demoSnap = JSON.parse(fs.readFileSync('data/demo_snapshot.json', 'utf8'));
  const hiProfile = { ...demoSnap.profile, language: 'hi' };

  for (const vp of [{ name: '390x844', width: 390, height: 844 }, { name: '1440x900', width: 1440, height: 900 }]) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    await page.evaluate((prof) => {
      localStorage.setItem('saans_onboarding_complete_v1', 'true');
      localStorage.setItem('saans_demo_mode_active', 'true');
      localStorage.setItem('saans_household_profile_v1', JSON.stringify(prof));
    }, hiProfile);

    for (const p of PAGES) {
      await page.goto(`http://localhost:3000${p.route}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);

      const filename = `${p.name}_${vp.name}_hindi.png`;
      const filePath = path.join(SCREENS_DIR, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${filePath}`);
    }
    await context.close();
  }

  await browser.close();
  console.log('All screenshots captured successfully in docs/screens!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
