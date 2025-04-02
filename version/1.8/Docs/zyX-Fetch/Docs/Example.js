// Example usage of zyX-Fetch functions

// Example 1: Basic HTTP requests
async function basicRequests() {
    // GET request
    const data = await getData('/api/data');
    
    // POST request
    const response = await postData('/api/create', {
        name: 'John',
        age: 30
    });
    
    // PUT request
    await putData('/api/update/1', {
        name: 'John Updated'
    });
    
    // DELETE request
    await deleteData('/api/delete/1');
}

// Example 2: Form data submission
async function submitForm() {
    const formData = {
        username: 'john',
        password: 'secret',
        file: fileInput.files[0]
    };
    await postForm('/api/login', formData);
}

// Example 3: File operations
async function handleFiles() {
    // Download file
    await downloadFile('/files/document.pdf', 'document.pdf');
    
    // Convert data to blob
    const { blob, objectURL } = await dataToBlob('Hello World');
    
    // Convert blob to base64
    const base64 = await blobToBase64(blob);
}

// Example 4: Image processing
async function processImage() {
    // Shrink image
    const canvas = await shrinkImage('/images/large.jpg', 800);
    
    // Convert canvas to blob
    const { blob, objectURL } = await canvasToBlob(canvas, 'image/jpeg', 0.8);
}

// Example 5: Resource loading
async function loadResources() {
    // Load CSS
    await injectCSS('/styles/custom.css');
    
    // Load JavaScript
    await injectScript('/scripts/custom.js');
    
    // Preload image
    await preloadImage('/images/hero.jpg');
}

// Example 6: Advanced features
async function advancedFeatures() {
    // Fetch with timeout
    const response = await fetchWithTimeout('/api/data', {}, 5000);
    
    // Fetch with retry
    const data = await tryFetch('/api/unstable', {}, 3, 1000);
    
    // Upload with progress
    await uploadProgress('/api/upload', formData, (percent, event) => {
        console.log(`Upload progress: ${percent}%`);
    });
    
    // Fetch multiple URLs
    const results = await fetchMultiple([
        '/api/data1',
        '/api/data2',
        '/api/data3'
    ]);
    
    // Create WebSocket connection
    const ws = createWebSocketConnection('ws://example.com');
} 