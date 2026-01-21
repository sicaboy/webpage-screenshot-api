const express = require('express');
const puppeteer = require('puppeteer-core');
const { KnownDevices } = require('puppeteer-core');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BROWSER_WS_ENDPOINT = process.env.BROWSER_WS_ENDPOINT || 'ws://browser:3000';

app.post('/screenshot', async (req, res) => {
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
