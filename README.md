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

2. **Start the services**:
    ```bash
    docker compose up --build -d
    ```

This will start two containers:
- `screenshot-api`: The API service listening on port `8080`.
- `screenshot-browser`: The headless Chromium instance.

## API Documentation

### Take a Screenshot

**Endpoint**: `POST /screenshot`

**Request Headers**:
- `Content-Type: application/json`

**Request Body**:
| Field | Type   | Description                                      | Required |
|-------|--------|--------------------------------------------------|----------|
| `url` | String | The full URL of the webpage to capture.          | Yes      |

**Response**:
Returns a JSON object containing the Base64 encoded screenshot.

```json
{
  "success": true,
  "screenshot": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Usage Example

You can test the API using `curl`:

```bash
curl -X POST http://localhost:8080/screenshot \
     -H "Content-Type: application/json" \
     -d '{"url": "https://example.com"}'
```

The response `screenshot` field contains the Base64 image data, which you can decode and save as a `.png` file or display directly in a frontend application (e.g., `<img src="data:image/png;base64,..." />`).
