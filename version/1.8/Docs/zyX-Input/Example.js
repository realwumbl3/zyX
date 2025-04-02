import { ZyXInput } from 'zyX';

// Create a demo container
const container = document.createElement('div');
container.style.cssText = `
    width: 400px;
    height: 300px;
    border: 2px solid #ccc;
    margin: 20px auto;
    position: relative;
    overflow: hidden;
`;
document.body.appendChild(container);

// Create a draggable element
const draggable = document.createElement('div');
draggable.style.cssText = `
    width: 50px;
    height: 50px;
    background-color: #4CAF50;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    cursor: move;
    border-radius: 4px;
`;
container.appendChild(draggable);

// Initialize input handler
const input = new ZyXInput({
    onKeyPress: (event) => {
        console.log('Key pressed:', event.key);
    }
});

// Track pointer position
let pointerX = 0;
let pointerY = 0;

// Handle pointer events
input.on(draggable)
    .pointerdown((event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        console.log('Pointer down at:', pointerX, pointerY);
    })
    .pointermove((event) => {
        const deltaX = event.clientX - pointerX;
        const deltaY = event.clientY - pointerY;
        
        // Update draggable position
        const currentLeft = parseFloat(draggable.style.left);
        const currentTop = parseFloat(draggable.style.top);
        
        draggable.style.left = `${currentLeft + deltaX}px`;
        draggable.style.top = `${currentTop + deltaY}px`;
        
        pointerX = event.clientX;
        pointerY = event.clientY;
        
        console.log('Pointer moved:', deltaX, deltaY);
    });

// Handle keyboard events
input.on(document)
    .keydown((event) => {
        const step = 10;
        const currentLeft = parseFloat(draggable.style.left);
        const currentTop = parseFloat(draggable.style.top);
        
        switch(event.key) {
            case 'ArrowLeft':
                draggable.style.left = `${currentLeft - step}px`;
                break;
            case 'ArrowRight':
                draggable.style.left = `${currentLeft + step}px`;
                break;
            case 'ArrowUp':
                draggable.style.top = `${currentTop - step}px`;
                break;
            case 'ArrowDown':
                draggable.style.top = `${currentTop + step}px`;
                break;
        }
    });

// Set up momentum scrolling
input.on(container).momentumScroll({
    sensitivity: 0.5,
    decay: 0.95
});

// Handle back button
input.on(window).back(() => {
    console.log('Back button pressed');
    // Reset draggable position
    draggable.style.left = '50%';
    draggable.style.top = '50%';
});

// Set up move detection
input.on(draggable).move({
    deadzone: 5,
    onMove: (event) => {
        console.log('Significant movement detected');
        draggable.style.backgroundColor = '#FF5722'; // Change color on significant movement
        setTimeout(() => {
            draggable.style.backgroundColor = '#4CAF50';
        }, 500);
    }
});

// Add some instructions
const instructions = document.createElement('div');
instructions.style.cssText = `
    text-align: center;
    margin: 20px;
    font-family: Arial, sans-serif;
`;
instructions.innerHTML = `
    <h3>zyX-Input Demo</h3>
    <p>Try the following:</p>
    <ul style="text-align: left; display: inline-block;">
        <li>Drag the green square with mouse/touch</li>
        <li>Use arrow keys to move the square</li>
        <li>Scroll the container with momentum</li>
        <li>Press browser back button to reset position</li>
        <li>Make significant movements to see color change</li>
    </ul>
`;
document.body.insertBefore(instructions, container); 