# Webpage Screenshot API

A lightweight microservice to generate screenshots of webpages using a headless Chrome browser. Built with Node.js, Express, and Puppeteer, orchestrated via Docker Compose.

## Features

- **Simple API**: RESTful endpoint to request screenshots.
- **Dockerized**: specific containers for the API and the headless browser.
- **Network Aware**: Configured to run on an external `caddy` network for easy integration with other services.

## Prerequisites

- Docker
- Docker Compose

## Installation & Running

1. **Clone the repository** (if you haven't already):
    ```bash
    git clone https://github.com/sicaboy/webpage-screenshot-api.git
    cd webpage-screenshot-api
    ```

2. **Configure Environment**:
    copy `.env.example` to `.env` and set your `API_SECRET`.
    ```bash
    cp .env.example .env
    ```

3. **Start the services**:
    ```bash
    docker compose up --build -d
    ```

This will start two containers:
- `screenshot-api`: The API service listening on port `8080`.
- `screenshot-browser`: The headless Chromium instance.

## API Documentation

### Authentication

Secure the API by setting an `API_SECRET` environment variable in your `.env` file. When set, all requests must include the `X-API-Secret` header.

### Take a Screenshot
**Endpoint**: `POST /screenshot`

**Request Headers**:
- `Content-Type: application/json`
- `X-API-Secret: <your_api_secret>` (Required if `API_SECRET` env var is set)

**Request Body**:

| Field             | Type    | Description                                                                 | Required |
|-------------------|---------|-----------------------------------------------------------------------------|----------|
| `url`             | String  | The full URL of the webpage to capture.                                     | Yes      |
| `device`          | String  | Device name to emulate (e.g., "iPhone 13", "iPad Pro"). Overrides width/height.| No    |
| `width`           | Number  | Viewport width in pixels (default: 1280). Ignored if `device` is set.       | No       |
| `height`          | Number  | Viewport height in pixels (default: 800). Ignored if `device` is set.       | No       |
| `fullPage`        | Boolean | If true, captures the full scrollable page.                                 | No       |
| `darkMode`        | Boolean | If true, forces the browser into dark mode.                                 | No       |
| `delay`           | Number  | Wait time in milliseconds after load before capturing.                      | No       |
| `waitForSelector` | String  | CSS selector to wait for before capturing (max 10s timeout).                | No       |

**Response**:
Returns a JSON object containing the Base64 encoded screenshot.

```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Usage Examples

#### 1. Simple Example (Desktop default)
```bash
curl -X POST http://localhost:8080/screenshot \
     -H "Content-Type: application/json" \
     -H "X-API-Secret: my_secure_secret_123" \
     -d '{"url": "https://google.com"}'
```

#### 2. Advanced Example (Mobile, Dark Mode, Full Page)
```bash
curl -X POST http://localhost:8080/screenshot \
     -H "Content-Type: application/json" \
     -H "X-API-Secret: my_secure_secret_123" \
     -d '{
           "url": "https://news.ycombinator.com", 
           "device": "iPhone 13 Pro",
           "fullPage": true,
           "darkMode": true,
           "delay": 1000
         }'
```

The response `screenshot` field contains the Base64 image data, which you can decode and save as a `.png` file or display directly in a frontend application (e.g., `<img src="data:image/png;base64,..." />`).
