const { chromium } = require('patchright');
const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const path = require('path');

// Disclaimer: This code is provided for educational purposes only.
// The authors and contributors are not responsible for any misuse, violations of terms of service, bans, or any other consequences arising from its use.
// Users are required to implement their own OTP fetching mechanism based on their email provider's API or method.
// Do not use this for any illegal activities.

const IMAP_CONFIG = {
    host: 'mail.exconair.com',
    port: 993,
    secure: true
};

const colors = {
    purple: '\x1b[35m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m',
};

function readCredentialsFromFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const credentials = content.split('\n').filter(line => line.trim());
        return credentials.map(line => {
            const parts = line.split(':');
            const email = parts[0] ? parts[0].trim() : '';
            const password = parts[1] ? parts[1].trim() : '';
            return { email, password };
        });
    } catch (error) {
        printError(`Error reading credentials file: ${error.message}`);
        return [];
    }
}

function removeEmailFromFile(filePath, emailToRemove) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        
        const updatedLines = lines.filter(line => {
            const [email] = line.split(':');
            return email.trim() !== emailToRemove;
        });
        
        fs.writeFileSync(filePath, updatedLines.join('\n') + (updatedLines.length > 0 ? '\n' : ''), 'utf-8');
        printSuccess(`Removed ${emailToRemove} from ${filePath}`);
        printInfo(`${updatedLines.length} credentials remaining in ${filePath}`);
    } catch (error) {
        printError(`Error removing email from file: ${error.message}`);
    }
}

async function getVerificationLink(emailUser, emailPass, quiet = false) {
    // NOTE: Users must implement their own OTP fetching mechanism here according to their email provider.
    // This function currently calls a Python script (fetch_otp.py) as an example.
    // Replace this with your own implementation to fetch OTP from emails.

function getTimestamp() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function printInfo(msg) {
  console.log(`${colors.purple}[${getTimestamp()}]${colors.reset} ${colors.cyan}[ * ]${colors.reset} ${msg}`);
}

function printSuccess(msg) {
  console.log(`${colors.purple}[${getTimestamp()}]${colors.reset} ${colors.green}[ + ]${colors.reset} ${msg}`);
}

function printError(msg) {
  console.log(`${colors.purple}[${getTimestamp()}]${colors.reset} ${colors.red}[ - ]${colors.reset} ${msg}`);
}

function printOther(msg) {
  console.log(`${colors.purple}[${getTimestamp()}]${colors.reset} ${colors.yellow}[ & ]${colors.reset} ${msg}`);
}

async function switchIPVPN() {
  return new Promise((resolve) => {
    printInfo("Switching IP with NordVPN...");
    const python = spawn('python', ['ip.py'], {
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    python.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    python.stderr.on('data', (data) => {
      console.log(data.toString());
    });
    
    let timeout = setTimeout(() => {
      python.kill();
      printError("IP switch timeout (30s)");
      resolve(false);
    }, 30000);
    
    python.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        printSuccess("IP switched successfully");
        resolve(true);
      } else {
        printError("IP switch failed");
        resolve(false);
      }
    });
  });
}

let globalThreadStop = false;
let processedAccountsCount = 0;
let ipSwapInterval = 2;

function recordAccountProcessed() {
    processedAccountsCount++;
    try {
        fs.writeFileSync('processed_count.txt', processedAccountsCount.toString());
    } catch (e) {}
    
    if (processedAccountsCount % ipSwapInterval === 0) {
        return true;
    }
    return false;
}

function checkAndResetCounter() {
    try {
        if (fs.existsSync('processed_count.txt')) {
            const count = parseInt(fs.readFileSync('processed_count.txt', 'utf-8'));
            return count >= ipSwapInterval;
        }
    } catch (e) {}
    return false;
}

function resetCounter() {
    try {
        fs.writeFileSync('processed_count.txt', '0');
    } catch (e) {}
}

let ipMonitorActive = false;
let ipSwitchInProgress = false;
let ipSwitchRequested = false;
let activeWorkers = 0;
let threadsWaitingLogged = false;
let ipPause = false;
let credentialQueue = [];

async function ipMonitor() {
    while (ipMonitorActive) {
        try {
            if (checkAndResetCounter()) {
                ipSwitchRequested = true;
                ipPause = true;
                threadsWaitingLogged = true;
                printOther(`IP switch requested — pausing threads and switching now...`);

                await new Promise(r => setTimeout(r, 2000));

                ipSwitchInProgress = true;
                printOther(`Switching IP now...`);
                try {
                    await switchIPVPN();
                } catch (e) {}
                resetCounter();
                ipSwitchInProgress = false;
                ipSwitchRequested = false;
                ipPause = false;
                threadsWaitingLogged = false;
            }
        } catch (e) {}
        await new Promise(r => setTimeout(r, 1000));
    }
}


function displayBanner() {
  const banner = `
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
─██████████████─██████████████─██████████████─██████──────────██████──────────────────────██████████████─██████████─
─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░░░░░░░░░██─██░░██████████████░░██──────────────────────██░░░░░░░░░░██─██░░░░░░██─
─██████░░██████─██░░██████████─██░░██████░░██─██░░░░░░░░░░░░░░░░░░██──────────────────────██░░██████░░██─████░░████─
─────██░░██─────██░░██─────────██░░██──██░░██─██░░██████░░██████░░██──────────────────────██░░██──██░░██───██░░██───
─────██░░██─────██░░██████████─██░░██████░░██─██░░██──██░░██──██░░██────██████████████────██░░██████░░██───██░░██───
─────██░░██─────██░░░░░░░░░░██─██░░░░░░░░░░██─██░░██──██░░██──██░░██────██░░░░░░░░░░██────██░░░░░░░░░░██───██░░██───
─────██░░██─────██░░██████████─██░░██████░░██─██░░██──██████──██░░██────██████████████────██░░██████░░██───██░░██───
─────██░░██─────██░░██─────────██░░██──██░░██─██░░██──────────██░░██──────────────────────██░░██──██░░██───██░░██───
─────██░░██─────██░░██████████─██░░██──██░░██─██░░██──────────██░░██──────────────────────██░░██──██░░██─████░░████─
─────██░░██─────██░░░░░░░░░░██─██░░██──██░░██─██░░██──────────██░░██──────────────────────██░░██──██░░██─██░░░░░░██─
─────██████─────██████████████─██████──██████─██████──────────██████──────────────────────██████──██████─██████████─
────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
                                             .gg/recaptcha
                                         made by @ai.legend.
`;
  console.log(`${colors.purple}${banner}${colors.reset}`);
}



function saveEmailToken(email, password) {
    fs.appendFileSync('saved.txt', `${email}:${password}\n`, 'utf-8');
}

function generateRandomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function inputVerificationCode(page, code) {

    const firstInput = page.locator('input[name="code-input-0"]');
    try {
        await firstInput.waitFor({ state: 'visible', timeout: 2000000 });
    } catch (e) {
        printError(`OTP input field did not appear: ${e.message}`);
    }

    for (let i = 0; i < code.length && i < 6; i++) {
        const inputField = page.locator(`input[name="code-input-${i}"]`);
        try {
            await inputField.fill('');
            await inputField.click();
            await inputField.type(code[i], { delay: 50 });
        } catch (error) {
            printError(`Failed to enter digit ${i + 1}`);
        }
    }

    await page.waitForTimeout(500);
    printSuccess(`Entered OTP: ${code}`);
}

async function waitForOtpOrCaptcha(page, threadId, timeoutMs = 180000) {
    const start = Date.now();
    const captchaSelectors = ["iframe[src*='hcaptcha.com']", "#h_captcha_challenge_registration_prod", ".h_captcha_challenge", "iframe[src*='recaptcha']", "[data-sitekey]"];

    while (Date.now() - start < timeoutMs) {
        try {
            const otpVisible = await page.locator('input[name="code-input-0"]').isVisible().catch(() => false);
            if (otpVisible) {
                printSuccess(`[Thread ${threadId}] OTP input field is ready`);
                return 'otp';
            }

            let captchaFound = false;
            for (const selector of captchaSelectors) {
                try {
                    const isVisible = await page.locator(selector).isVisible().catch(() => false);
                    if (isVisible) {
                        captchaFound = true;
                        break;
                    }
                } catch (e) {}
            }

            if (captchaFound) {
                printOther(`[Thread ${threadId}] hCaptcha detected — waiting for manual completion...`);
                printInfo(`[Thread ${threadId}] Please complete the captcha in the browser.`);

                const remaining = Math.max(1000, timeoutMs - (Date.now() - start));
                let captchaDisappeared = false;

                for (const selector of captchaSelectors) {
                    try {
                        await page.waitForSelector(selector, { state: 'hidden', timeout: remaining }).catch(() => null);
                        captchaDisappeared = true;
                    } catch (e) {}
                }

                if (captchaDisappeared) {
                    printSuccess(`[Thread ${threadId}] Captcha solved!`);
                }

                await page.waitForTimeout(1000);
                continue;
            }

            await page.waitForTimeout(1000);
        } catch (e) {
            await page.waitForTimeout(1000);
        }
    }

    printError(`[Thread ${threadId}] Timeout waiting for OTP input or captcha (waited ${timeoutMs / 1000}s)`);
    return null;
}

function getWindowPosition(threadId, totalThreads) {
    const screenWidth = 1920;
    const screenHeight = 1080;
    
    if (totalThreads === 1) {
        return { x: 0, y: 0, width: screenWidth, height: screenHeight };
    } else if (totalThreads === 2) {
        return threadId === 0 
            ? { x: 0, y: 0, width: screenWidth / 2, height: screenHeight }
            : { x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight };
    } else if (totalThreads === 3) {
        if (threadId === 0) return { x: 0, y: 0, width: screenWidth / 2, height: screenHeight / 2 };
        if (threadId === 1) return { x: screenWidth / 2, y: 0, width: screenWidth / 2, height: screenHeight / 2 };
        return { x: screenWidth / 4, y: screenHeight / 2, width: screenWidth / 2, height: screenHeight / 2 };
    } else if (totalThreads === 4) {
        const w = screenWidth / 2;
        const h = screenHeight / 2;
        const positions = [
            { x: 0, y: 0, width: w, height: h },
            { x: w, y: 0, width: w, height: h },
            { x: 0, y: h, width: w, height: h },
            { x: w, y: h, width: w, height: h }
        ];
        return positions[threadId];
    } else {
        const cols = Math.ceil(Math.sqrt(totalThreads));
        const rows = Math.ceil(totalThreads / cols);
        const w = screenWidth / cols;
        const h = screenHeight / rows;
        const row = Math.floor(threadId / cols);
        const col = threadId % cols;
        return { x: col * w, y: row * h, width: w, height: h };
    }
}

function promptUser(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

async function waitForIpResume() {
    while (ipPause) {
        if (!threadsWaitingLogged) {
            printOther('Pausing for IP switch...');
            threadsWaitingLogged = true;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    threadsWaitingLogged = false;
}

async function processRegistration(threadId, credential, totalThreads) {
    const email = credential.email;
    const password = credential.password;

    if (!email || !password) {
        printError(`[Thread ${threadId}] Invalid credentials: missing email or password`);
        removeEmailFromFile('input/mails.txt', email);
        return;
    }

    let accountSaved = false;

    await waitForIpResume();

    const browser = await chromium.launch({
        headless: false
    });

    const windowPos = getWindowPosition(threadId, totalThreads);
    await browser.close(); 
    
    const browserWithPosition = await chromium.launch({
        headless: false,
        args: [
            `--window-position=${Math.floor(windowPos.x)},${Math.floor(windowPos.y)}`,
            `--window-size=${Math.floor(windowPos.width)},${Math.floor(windowPos.height)}`
        ]
    });

    const page = await browserWithPosition.newPage();
    await page.setViewportSize({ width: Math.floor(windowPos.width), height: Math.floor(windowPos.height) });

    const registrationUrl = 'https://www.epicgames.com/id/register/date-of-birth?lang=en-US&redirect_uri=https%3A%2F%2Fstore.epicgames.com%2Fen-US%2Fp%2Fdiscord--discord-nitro&client_id=875a3b57d3a640a6b7f9b4e883463ab4';
    
    page.on('framenavigated', async () => {
        if (globalThreadStop) return;
        try {
            const errorMsg = await page.querySelector("#form-error-message");
            if (errorMsg) {
                const errorText = await errorMsg.textContent();
                if (errorText && errorText.trim()) {
                    printError(`[Thread ${threadId}] ERROR DETECTED: ${errorText}`);
                    globalThreadStop = true;
                    try { await browserWithPosition.close(); } catch (e) {}
                    printOther(`[Thread ${threadId}] Stopped due to error; global IP monitor will handle switching.`);
                }
            }
        } catch (e) {}
    });
    
    await page.goto(registrationUrl, { waitUntil: 'networkidle' });

    const randomDay = Math.floor(Math.random() * 28) + 1;
    const randomYear = Math.floor(Math.random() * (2004 - 1990 + 1)) + 1990;
    
    await page.locator('#month').click();
    await page.locator('[role="listbox"] li').first().click();

    await page.locator('#day').click();
    const dayOptions = await page.locator('[role="listbox"] li');
    await dayOptions.nth(randomDay).click();

    const yearInput = page.locator('input[id*="year"]').first();
    await yearInput.focus();
    await yearInput.type(randomYear.toString());

    await page.locator('#continue').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
        const btn = document.querySelector('#continue');
        return btn && !btn.disabled && btn.offsetParent !== null;
    }, { timeout: 10000 });
    await page.locator('#continue').click();
    await page.waitForLoadState('networkidle');

    printInfo(`[Thread ${threadId}] Filling registration form with email: ${email}`);

    await page.locator('#email').fill(email);

    await page.locator('#send').click();
    await page.waitForLoadState('networkidle');

    await page.locator('#name').fill('legend');
    
    await page.locator('#lastName').fill('legend');

    const displayName = generateRandomString();
    await page.locator('#displayName').fill(displayName);

    await page.locator('#password').fill(password);

    await page.locator('#tos').click();

    await page.locator('#btn-submit').click();


    let otpVerified = false;

    await waitForOtpOrCaptcha(page, threadId, 180000);

    while (!otpVerified) {
        await waitForIpResume();
        try {
            let otp = null;
            let otpRetries = 0;
            const maxOtpRetries = 3;
            
            while (otpRetries < maxOtpRetries) {
                const code = await getVerificationLink(email, password, true);
                if (code) {
                    otp = code;
                    break;
                }
                otpRetries++;
                if (otpRetries < maxOtpRetries) {
                    await new Promise(r => setTimeout(r, 5000));
                }
            }

            if (!otp) {
                printError(`[Thread ${threadId}] Failed to get OTP after ${maxOtpRetries} attempts. Moving to next account.`);
                removeEmailFromFile('input/mails.txt', email);
                await browserWithPosition.close();
                return;
            }

            if (otp) {
                await inputVerificationCode(page, otp);
                
                await page.waitForTimeout(1000);
                
                let verifyClicked = false;
                try {
                    const verifyButton = page.locator("button:has-text('Verify'), button[aria-label*='Verify'], #continue");
                    if (await verifyButton.isVisible({ timeout: 180000 })) {
                        await verifyButton.click();
                        verifyClicked = true;
                        printSuccess(`[Thread ${threadId}] Verify button clicked`);
                    }
                } catch (e) {
                    printOther(`[Thread ${threadId}] Standard verify button not found, trying alternative...`);
                }
                
                if (!verifyClicked) {
                    await page.keyboard.press('Enter');
                    printInfo(`[Thread ${threadId}] Pressed Enter to verify`);
                }

                printSuccess(`[Thread ${threadId}] Email verified successfully`);
                if (!accountSaved) {
                    saveEmailToken(email, password);
                    accountSaved = true;
                }

                otpVerified = true;
                break;
            }
        } catch (error) {
            printError(`[Thread ${threadId}] OTP fetch error: ${error.message}`);
        }
        
        await page.waitForTimeout(5000);
    }

    await page.waitForTimeout(2000);

    try {
        const doneLinkingButton = page.locator("#link-success");
        
        await doneLinkingButton.waitFor({ state: 'attached', timeout: 180000 });
        
        await doneLinkingButton.scrollIntoViewIfNeeded();
        await doneLinkingButton.click();
        printSuccess(`[Thread ${threadId}] 'Done linking' button clicked`);
    } catch (e) {
        printError(`[Thread ${threadId}] 'Done linking' button error: ${e.message}`);
    }

    try {
        const getButton = page.locator("button[data-testid='purchase-cta-button']");
        await getButton.waitFor({ state: 'visible', timeout: 180000 });
        
        await page.waitForFunction(() => {
            const btn = document.querySelector("button[data-testid='purchase-cta-button']");
            return btn && !btn.disabled;
        }, { timeout: 180000 });
        
        
        await waitForIpResume();
        await getButton.scrollIntoViewIfNeeded();
        await getButton.click();
        printSuccess(`[Thread ${threadId}] 'Get' button clicked`);
    } catch (e) {
        printError(`[Thread ${threadId}] 'Get' button error: ${e.message}`);
    }


    try {
        const purchaseIframe = page.locator('iframe[src*="/purchase?"]');
        await purchaseIframe.waitFor({ state: 'attached', timeout: 180000 });
        
        const iframeElement = await purchaseIframe.elementHandle();
        const frameHandle = await iframeElement.contentFrame();
        
        const placeOrderButton = frameHandle.locator("button:has-text('Place Order')").first();
        await placeOrderButton.waitFor({ state: 'visible', timeout: 180000 });
        
        await waitForIpResume();
        await placeOrderButton.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        await placeOrderButton.click();
        printSuccess(`[Thread ${threadId}] 'Place Order' button clicked`);

        let orderConfirmed = false;
        const startTime = Date.now();
        const maxWaitTime = 180000;

        while (!orderConfirmed && (Date.now() - startTime) < maxWaitTime) {
            try {
                const captchaSelectors = ["iframe[src*='hcaptcha.com']", "#h_captcha_challenge", "iframe[src*='recaptcha']", "[data-sitekey]"];
                let captchaFound = false;

                for (const selector of captchaSelectors) {
                    try {
                        const isVisible = await page.locator(selector).isVisible().catch(() => false);
                        if (isVisible) {
                            captchaFound = true;
                            break;
                        }
                    } catch (e) {}
                }

                if (captchaFound) {
                    printOther(`[Thread ${threadId}] Captcha detected after Place Order! Waiting for user to complete...`);
                    printInfo(`[Thread ${threadId}] Please complete the captcha in the browser.`);

                    let captchaGone = false;
                    const captchaWaitStart = Date.now();
                    while (!captchaGone && (Date.now() - captchaWaitStart) < maxWaitTime) {
                        let stillVisible = false;
                        for (const selector of captchaSelectors) {
                            try {
                                const isVisible = await page.locator(selector).isVisible().catch(() => false);
                                if (isVisible) {
                                    stillVisible = true;
                                    break;
                                }
                            } catch (e) {}
                        }
                        if (!stillVisible) {
                            captchaGone = true;
                            printSuccess(`[Thread ${threadId}] Captcha solved!`);
                        } else {
                            await page.waitForTimeout(1000);
                        }
                    }
                    continue;
                }

                const confirmationVisible = await page.locator('[data-testid="checkout-success-title"]').isVisible().catch(() => false);
                if (confirmationVisible) {
                    printSuccess(`[Thread ${threadId}] Order confirmation modal appeared`);
                    orderConfirmed = true;
                    break;
                }

                await page.waitForTimeout(1000);
            } catch (e) {
                await page.waitForTimeout(1000);
            }
        }

        if (!orderConfirmed) {
            printOther(`[Thread ${threadId}] Timeout waiting for confirmation modal after ${maxWaitTime / 1000}s`);
        }

        try {
            if (!accountSaved) {
                saveEmailToken(email, password);
                accountSaved = true;
            }
            removeEmailFromFile('input/mails.txt', email);
            printSuccess(`[Thread ${threadId}] Email ${email} processed successfully`);
            const shouldSwitch = recordAccountProcessed();
            if (shouldSwitch) {
                ipSwitchRequested = true;
                threadsWaitingLogged = true;
            }
        } catch (e) {}

        await browserWithPosition.close();
        return;
                
    } catch (e) {
        printError(`[Thread ${threadId}] 'Place Order' button error: ${e.message}`);
    }

    try {
        const orderConfirmSelector = 'body > div:nth-child(15) > div > div > div > div.css-1d8plm0 > div > h4 > span';
        const orderEl = await page.waitForSelector(orderConfirmSelector, { timeout: 180000 }).catch(() => null);
        if (orderEl) {
            if (!accountSaved) {
                saveEmailToken(email, password);
                accountSaved = true;
            }
            removeEmailFromFile('input/mails.txt', email);
            printSuccess(`[Thread ${threadId}] Email ${email} processed successfully`);
            const shouldSwitch = recordAccountProcessed();
            if (shouldSwitch) {
                ipSwitchRequested = true;
                threadsWaitingLogged = true;
            }
            await page.waitForTimeout(5000);
            await browserWithPosition.close();
            return;
        }
    } catch (e) {}

    removeEmailFromFile('input/mails.txt', email);

    printSuccess(`[Thread ${threadId}] Email ${email} processed successfully`);

    const shouldSwitch = recordAccountProcessed();
    if (shouldSwitch) {
        ipSwitchRequested = true;
        threadsWaitingLogged = true;
    }

    printOther(`[Thread ${threadId}] Waiting 6 seconds before next mail...`);
    await page.waitForTimeout(6000);
    await browserWithPosition.close();
}

async function processThreadWorker(threadId, credentials, totalThreads) {
    while (!globalThreadStop) {
        while (ipPause || ipSwitchInProgress || ipSwitchRequested) {
            if (!threadsWaitingLogged) {
                printOther('Waiting for global IP switch to complete...');
                threadsWaitingLogged = true;
            }
            await new Promise(r => setTimeout(r, 2000));
        }

        const credential = credentialQueue.shift();
        if (!credential) {
            break;
        }

        try {
            activeWorkers++;
            await processRegistration(threadId, credential, totalThreads);
        } catch (error) {
            printError(`[Thread ${threadId}] Error: ${error.message}`);
        } finally {
            if (activeWorkers > 0) activeWorkers--;
        }
        
        if (globalThreadStop) break;
    }
    
    printSuccess(`[Thread ${threadId}] All assigned credentials processed`);
}

async function main() {
    console.clear();
    displayBanner();
    
    console.log(`${colors.cyan}                                 -- > Team - Ai${colors.reset}`);
    console.log(`${colors.cyan}                                -- > .gg/recaptcha @ai.legend.${colors.reset}`);

    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        printSuccess(`Current IP: ${data.ip}`);
    } catch (e) {
        printOther('Could not fetch current IP');
    }

    const threadCountInput = await promptUser('\n💬 How many threads do you want to run? (1-8): ');
    let threadCount = parseInt(threadCountInput);
    
    if (isNaN(threadCount) || threadCount < 1 || threadCount > 8) {
        threadCount = 1;
        printOther('Invalid input, defaulting to 1 thread');
    }

    const ipSwapInput = await promptUser('💬 After how many accounts should IP be swapped? (default 2): ');
    ipSwapInterval = parseInt(ipSwapInput);
    
    if (isNaN(ipSwapInterval) || ipSwapInterval < 1) {
        ipSwapInterval = 2;
        printOther('Invalid input, defaulting to 2 accounts');
    }

    const credentialsPath = 'input/mails.txt';
    const credentials = readCredentialsFromFile(credentialsPath);

    if (credentials.length === 0) {
        printError("No credentials found in input/mails.txt");
        return;
    }

    printSuccess(`Loaded ${credentials.length} email credentials from input/mails.txt`);
    resetCounter();

    const totalCredentials = credentials.length;
    const batchSize = threadCount;
    
    for (let batchStart = 0; batchStart < totalCredentials; batchStart += batchSize) {
        const batchEnd = Math.min(batchStart + batchSize, totalCredentials);
        const currentBatch = credentials.slice(batchStart, batchEnd);
        
        credentialQueue = [...currentBatch];

        const threadPromises = [];
        ipMonitorActive = true;
        const ipMonitorPromise = ipMonitor();
        
        for (let i = 0; i < threadCount; i++) {
            threadPromises.push(
                processThreadWorker(i, currentBatch, threadCount).catch(error => {
                    printError(`[Thread ${i}] Fatal Error: ${error.message}`);
                })
            );
        }

        await Promise.all(threadPromises);
        ipMonitorActive = false;
        await ipMonitorPromise;
        
        if (batchEnd < totalCredentials) {
            printOther(`Batch complete. Waiting before next batch...`);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    
    printSuccess("All batches completed!");
    process.exit(0);
}

main().catch(error => {
    printError(`Fatal Error: ${error.message}`);
    process.exit(1);
});

