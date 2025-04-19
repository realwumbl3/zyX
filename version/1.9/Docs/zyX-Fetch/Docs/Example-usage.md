# zyX-Fetch Module Documentation

## Overview
The zyX-Fetch module provides a comprehensive set of utility functions for handling HTTP requests, file operations, and data transformations in web applications.

## Exported Functions

### HTTP Requests
- `getData(url)`: Send GET request
- `postData(url, data)`: Send POST request with JSON data
- `putData(url, data)`: Send PUT request with JSON data
- `deleteData(url)`: Send DELETE request
- `postForm(url, data)`: Send POST request with form data
- `fetchJSON(url, options)`: Fetch and parse JSON response
- `fetchWithTimeout(url, options, timeout)`: Fetch with timeout
- `tryFetch(url, options, retries, delay)`: Fetch with retry logic

### File Operations
- `grabBlob(url)`: Fetch and create blob from URL
- `downloadFile(url, filename)`: Download file from URL
- `dataToBlob(data, type)`: Convert data to blob
- `blobToBase64(blob)`: Convert blob to base64
- `canvasToBlob(canvas, type, quality)`: Convert canvas to blob

### Resource Loading
- `injectCSS(url)`: Load and inject CSS file
- `injectScript(url)`: Load and inject JavaScript file
- `preloadImage(url)`: Preload image from URL

### Image Processing
- `shrinkImage(url, maxSide)`: Resize image while maintaining aspect ratio
- `splitFilename(url)`: Split URL into filename and extension

### Advanced Features
- `uploadProgress(url, data, onProgress)`: Upload with progress tracking
- `cancelableFetch(url, options)`: Create cancelable fetch request
- `fetchMultiple(requests)`: Fetch multiple URLs concurrently
- `createWebSocketConnection(url, protocols)`: Create WebSocket connection

## Usage Examples

See `Example.js` for working code examples of each function. 