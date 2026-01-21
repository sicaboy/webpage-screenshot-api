const express = require('express');
const puppeteer = require('puppeteer-core');
const { KnownDevices } = require('puppeteer-core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT || 'ws://browser:3000';
const API_SECRET = process.env.API_SECRET;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Webpage Screenshot API</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background-color: #0f172a;
                    color: #f8fafc;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .container {
                    padding: 2rem;
                    max-width: 600px;
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    background: linear-gradient(to right, #60a5fa, #a855f7);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                p {
                    font-size: 1.1rem;
                    color: #94a3b8;
                    margin-bottom: 2rem;
                    line-height: 1.6;
                }
                .btn {
                    display: inline-block;
                    padding: 0.75rem 1.5rem;
                    background-color: #3b82f6;
                    color: white;
                    text-decoration: none;
                    border-radius: 9999px;
                    font-weight: 600;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .btn:hover {
                    background-color: #2563eb;
                    transform: translateY(-1px);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Webpage Screenshot API</h1>
                <p>
                    A high-performance microservice for generating pixel-perfect screenshots of any webpage.
                    Powered by generic headless browsers and orchestrated via Docker.
                </p>
                <a href="https://github.com/sicaboy/webpage-screenshot-api" class="btn">View Documentation & Usage</a>
            </div>
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
