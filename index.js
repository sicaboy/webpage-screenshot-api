const express = require('express');
const puppeteer = require('puppeteer-core');
const { KnownDevices } = require('puppeteer-core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT || 'ws://browser:3000';
const API_SECRET = process.env.API_SECRET;

app.get('/', (req, res) => {
    const requiresAuth = !!API_SECRET;
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Webpage Screenshot API</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #0f172a;
                    color: #f8fafc;
                    min-height: 100vh;
                    padding: 2rem;
                }
                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 0.5rem;
                    background: linear-gradient(to right, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-align: center;
                }
                .subtitle {
                    text-align: center;
                    color: #94a3b8;
                    margin-bottom: 2rem;
                }
                .main-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .form-section, .result-section {
                    background-color: #1e293b;
                    border-radius: 12px;
                    padding: 2rem;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .form-group {
                    margin-bottom: 1.5rem;
                }
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    color: #cbd5e1;
                    font-weight: 500;
                }
                input, select {
                    width: 100%;
                    padding: 0.75rem;
                    background-color: #334155;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    color: #f8fafc;
                    font-size: 1rem;
                }
                input:focus, select:focus {
                    outline: none;
                    border-color: #3b82f6;
                }
                input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .checkbox-group input[type="checkbox"] {
                    width: auto;
                    cursor: pointer;
                }
                .btn {
                    width: 100%;
                    padding: 0.75rem 1.5rem;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn:hover:not(:disabled) {
                    background-color: #2563eb;
                    transform: translateY(-1px);
                }
                .btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .result-section h2 {
                    color: #f8fafc;
                    margin-bottom: 1rem;
                }
                .screenshot-container {
                    background-color: #334155;
                    border-radius: 8px;
                    padding: 1rem;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .screenshot-container img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                }
                .placeholder {
                    color: #64748b;
                    text-align: center;
                }
                .loading {
                    text-align: center;
                    color: #60a5fa;
                }
                .spinner {
                    border: 3px solid #334155;
                    border-top: 3px solid #60a5fa;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 1rem;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .error {
                    background-color: #7f1d1d;
                    color: #fecaca;
                    padding: 1rem;
                    border-radius: 6px;
                    margin-bottom: 1rem;
                }
                .info-badge {
                    display: inline-block;
                    background-color: #065f46;
                    color: #6ee7b7;
                    padding: 0.25rem 0.75rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    margin-left: 0.5rem;
                }
                @media (max-width: 768px) {
                    .main-content {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📸 Webpage Screenshot API</h1>
                <p class="subtitle">Generate pixel-perfect screenshots of any webpage</p>
                
                <div class="main-content">
                    <div class="form-section">
                        <h2>Screenshot Settings</h2>
                        <form id="screenshotForm">
                            <div class="form-group">
                                <label for="url">URL *</label>
                                <input type="url" id="url" name="url" placeholder="https://www.google.com" required>
                            </div>
                            
                            ${requiresAuth ? `
                            <div class="form-group">
                                <label for="apiSecret">API Secret Key *</label>
                                <input type="password" id="apiSecret" name="apiSecret" placeholder="Enter your API secret" required>
                            </div>
                            ` : `
                            <div class="form-group">
                                <label>API Secret Key <span class="info-badge">Not Required</span></label>
                                <input type="password" id="apiSecret" name="apiSecret" placeholder="No secret key required" disabled>
                            </div>
                            `}
                            
                            <div class="form-group">
                                <label for="device">Device Emulation</label>
                                <select id="device" name="device">
                                    <option value="">Custom Size</option>
                                    <option value="iPhone 13">iPhone 13</option>
                                    <option value="iPhone 13 Pro">iPhone 13 Pro</option>
                                    <option value="iPhone 13 Pro Max">iPhone 13 Pro Max</option>
                                    <option value="iPhone 12">iPhone 12</option>
                                    <option value="iPhone 12 Pro">iPhone 12 Pro</option>
                                    <option value="iPhone SE">iPhone SE</option>
                                    <option value="iPad Pro">iPad Pro</option>
                                    <option value="iPad Mini">iPad Mini</option>
                                    <option value="iPad">iPad</option>
                                    <option value="Galaxy S9+">Galaxy S9+</option>
                                    <option value="Galaxy S20">Galaxy S20</option>
                                    <option value="Pixel 5">Pixel 5</option>
                                </select>
                            </div>
                            
                            <div class="form-group" id="customSizeGroup">
                                <label for="width">Width (px)</label>
                                <input type="number" id="width" name="width" placeholder="1280" value="1280">
                            </div>
                            
                            <div class="form-group" id="customHeightGroup">
                                <label for="height">Height (px)</label>
                                <input type="number" id="height" name="height" placeholder="800" value="800">
                            </div>
                            
                            <div class="form-group">
                                <label for="delay">Delay (ms)</label>
                                <input type="number" id="delay" name="delay" placeholder="0" min="0">
                            </div>
                            
                            <div class="form-group">
                                <label for="waitForSelector">Wait for CSS Selector (optional)</label>
                                <input type="text" id="waitForSelector" name="waitForSelector" placeholder=".main-content">
                            </div>
                            
                            <div class="form-group checkbox-group">
                                <input type="checkbox" id="fullPage" name="fullPage">
                                <label for="fullPage">Full Page Screenshot</label>
                            </div>
                            
                            <div class="form-group checkbox-group">
                                <input type="checkbox" id="darkMode" name="darkMode">
                                <label for="darkMode">Dark Mode</label>
                            </div>
                            
                            <button type="submit" class="btn" id="submitBtn">Generate Screenshot</button>
                        </form>
                    </div>
                    
                    <div class="result-section">
                        <h2>Result</h2>
                        <div id="errorContainer"></div>
                        <div class="screenshot-container" id="screenshotContainer">
                            <div class="placeholder">Your screenshot will appear here</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <script>
                const form = document.getElementById('screenshotForm');
                const deviceSelect = document.getElementById('device');
                const customSizeGroup = document.getElementById('customSizeGroup');
                const customHeightGroup = document.getElementById('customHeightGroup');
                const screenshotContainer = document.getElementById('screenshotContainer');
                const errorContainer = document.getElementById('errorContainer');
                const submitBtn = document.getElementById('submitBtn');
                const requiresAuth = ${requiresAuth};
                
                // Toggle custom size inputs based on device selection
                deviceSelect.addEventListener('change', () => {
                    const isCustom = deviceSelect.value === '';
                    customSizeGroup.style.display = isCustom ? 'block' : 'none';
                    customHeightGroup.style.display = isCustom ? 'block' : 'none';
                });
                
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    // Clear previous errors
                    errorContainer.innerHTML = '';
                    
                    // Show loading state
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Generating...';
                    screenshotContainer.innerHTML = \`
                        <div class="loading">
                            <div class="spinner"></div>
                            <p>Taking screenshot...</p>
                        </div>
                    \`;
                    
                    // Collect form data
                    const formData = new FormData(form);
                    const data = {
                        url: formData.get('url'),
                        fullPage: formData.get('fullPage') === 'on',
                        darkMode: formData.get('darkMode') === 'on'
                    };
                    
                    // Add optional fields
                    const device = formData.get('device');
                    if (device) {
                        data.device = device;
                    } else {
                        const width = formData.get('width');
                        const height = formData.get('height');
                        if (width) data.width = parseInt(width);
                        if (height) data.height = parseInt(height);
                    }
                    
                    const delay = formData.get('delay');
                    if (delay) data.delay = parseInt(delay);
                    
                    const waitForSelector = formData.get('waitForSelector');
                    if (waitForSelector) data.waitForSelector = waitForSelector;
                    
                    try {
                        // Prepare headers
                        const headers = {
                            'Content-Type': 'application/json'
                        };
                        
                        // Add API secret if required
                        if (requiresAuth) {
                            const apiSecret = formData.get('apiSecret');
                            if (apiSecret) {
                                headers['X-API-Secret'] = apiSecret;
                            }
                        }
                        
                        const response = await fetch('/screenshot', {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify(data)
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok && result.success) {
                            screenshotContainer.innerHTML = \`
                                <img src="data:image/png;base64,\${result.screenshot}" alt="Screenshot" />
                            \`;
                        } else {
                            throw new Error(result.error || result.details || 'Failed to generate screenshot');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        errorContainer.innerHTML = \`
                            <div class="error">
                                <strong>Error:</strong> \${error.message}
                            </div>
                        \`;
                        screenshotContainer.innerHTML = \`
                            <div class="placeholder">Failed to generate screenshot. Please try again.</div>
                        \`;
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Generate Screenshot';
                    }
                });
                
                // Initialize custom size visibility
                deviceSelect.dispatchEvent(new Event('change'));
            </script>
        </body>
        </html>
    `);
});

app.post('/screenshot', async (req, res) => {
    // 0. Security Check
    if (API_SECRET) {
        // req.get() is case-insensitive
        const clientSecret = req.get('X-API-Secret');
        if (clientSecret !== API_SECRET) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or missing API secret' });
        }
    }

    const {
        url,
        width,
        height,
        device,
        fullPage,
        darkMode,
        delay,
        waitForSelector
    } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let browser;
    try {
        console.log(`Connecting to browser at ${BROWSER_WS_ENDPOINT}...`);
        browser = await puppeteer.connect({
            browserWSEndpoint: BROWSER_WS_ENDPOINT,
        });

        const page = await browser.newPage();

        // 1. Device Emulation or Manual Viewport
        if (device && KnownDevices[device]) {
            console.log(`Emulating device: ${device}`);
            await page.emulate(KnownDevices[device]);
        } else {
            const viewport = {
                width: parseInt(width) || 1280,
                height: parseInt(height) || 800
            };
            await page.setViewport(viewport);
        }

        // 2. Dark Mode
        if (darkMode) {
            console.log('Enabling Dark Mode');
            await page.emulateMediaFeatures([
                { name: 'prefers-color-scheme', value: 'dark' }
            ]);
        }

        console.log(`Navigating to ${url}...`);
        await page.goto(url, {
            waitUntil: 'networkidle0',
            timeout: 30000
        });

        // 3. Post-load Waits
        if (waitForSelector) {
            console.log(`Waiting for selector: ${waitForSelector}`);
            try {
                await page.waitForSelector(waitForSelector, { timeout: 10000 });
            } catch (e) {
                console.warn(`Timeout waiting for selector: ${waitForSelector}`);
            }
        }

        if (delay) {
            console.log(`Waiting for ${delay}ms delay...`);
            await new Promise(r => setTimeout(r, parseInt(delay)));
        }

        console.log('Taking screenshot...');
        const screenshot = await page.screenshot({
            encoding: 'base64',
            fullPage: !!fullPage
        });

        await page.close();

        res.json({
            success: true,
            screenshot: screenshot
        });

    } catch (error) {
        console.error('Error taking screenshot:', error);
        res.status(500).json({
            error: 'Failed to take screenshot',
            details: error.message
        });
    } finally {
        if (browser) {
            browser.disconnect();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Screenshot API listening on port ${PORT}`);
});
