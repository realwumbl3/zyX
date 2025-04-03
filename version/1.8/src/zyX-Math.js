
/**
 * Clamps a value between min and max
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} The clamped value
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Interpolation factor (0 to 1)
 * @returns {number} The interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Maps a value from one range to another
 * @param {number} value - The value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} The mapped value
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Offset functions
 */

/**
 * Scales a value from an offset to a value between 0 and 1
 * Example usage:
 * scaleFromOffset(ie: .5)
 * input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
 * output: 0.............0  .2 .4 .6 .8 1

 * @param {number} int - Input value (0 to 1)
 * @param {number} offset - Offset value (0 to 1)
 * @returns {number} The scaled value
 */
export function scaleFromOffset(int, offset) {
    return Math.max(0, (-offset + int) / (1 - offset));
}

/**
 * Scales a value to an offset between 0 and 1
 * Example usage:
 * scaleToOffset(ie: .5)
 * input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
 * output: 0 .2 .4 .6 .8 1..............1
 * 
 * @param {number} int - Input value (0 to 1)
 * @param {number} offset - Offset value (0 to 1)
 * @returns {number} The scaled value
 */
export function scaleToOffset(int, offset) {
    return Math.min(1, int / offset);
}

/**
 * Rounding functions
 */

/**
 * Rounds a number to the nearest multiple
 * @param {number} value - The value to round
 * @param {number} multiple - The multiple to round to
 * @returns {number} The rounded value
 */
export function roundTo(value, multiple) {
    return Math.round(value / multiple) * multiple;
}

/**
 * Rounds a number to a specific number of decimal places
 * @param {number} value - The value to round
 * @param {number} decimals - Number of decimal places
 * @returns {number} The rounded value
 */
export function roundToDecimals(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
}

/**
 * Generates a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random float between min and max with specified decimals
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Number of decimal places
 * @returns {number} Random float between min and max
 */
export function randomFloat(min, max, decimals) {
    const value = Math.random() * (max - min) + min;
    return roundToDecimals(value, decimals);
}

/**
 * Number validation
 */

/**
 * Checks if a number is even
 * @param {number} value - The value to check
 * @returns {boolean} True if the number is even
 */
export function isEven(value) {
    return value % 2 === 0;
}

/**
 * Checks if a number is odd
 * @param {number} value - The value to check
 * @returns {boolean} True if the number is odd
 */
export function isOdd(value) {
    return value % 2 !== 0;
}

/**
 * Checks if a number is an integer
 * @param {number} value - The value to check
 * @returns {boolean} True if the number is an integer
 */
export function isInteger(value) {
    return Number.isInteger(value);
}

/**
 * Checks if a number is a float
 * @param {number} value - The value to check
 * @returns {boolean} True if the number is a float
 */
export function isFloat(value) {
    return !Number.isInteger(value);
}

/**
 * Input utility functions for handling angles, directions, and controller mappings
 * @module ZyXInput/Functions
 */

/**
 * Rotate an angle by a given number of degrees
 * @param {number} input - The input angle in degrees
 * @param {number} degrees - The number of degrees to rotate by
 * @returns {number} The rotated angle (0-359 degrees)
 */
export function rotateDegrees(input, degrees) {
    return (input + degrees) % 360;
}

/**
 * Convert an angle to a cardinal direction
 * @param {number} angle - The angle in degrees (0-359)
 * @returns {string} The cardinal direction ("up", "right", "down", or "left")
 */
export function angleToDirection(angle) {
    const directions = ["up", "right", "down", "left"];
    const index = Math.round(angle / 90) % 4;
    return directions[index];
}

/**
 * Calculate the angle between two points
 * @param {number} x1 - First point's x coordinate
 * @param {number} y1 - First point's y coordinate
 * @param {number} x2 - Second point's x coordinate
 * @param {number} y2 - Second point's y coordinate
 * @returns {number} The angle in degrees (0-359)
 */
export function calculateAngle(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Convert angle to positive range (0 to 360 degrees)
    if (angle < 0) {
        angle += 360;
    }

    // Adjust angle to start from 0 degrees as "up"
    angle += 90;
    if (angle >= 360) {
        angle -= 360;
    }

    return angle;
}

/**
 * Snap an angle to the nearest 90-degree increment
 * @param {number} angle - The input angle in degrees
 * @returns {number} The snapped angle (0, 90, 180, or 270 degrees)
 */
export function calculateFourAngleSnap(angle) {
    const snapAngles = [0, 90, 180, 270, 0];
    const index = Math.round(angle / 90) % 4;
    return snapAngles[index];
}

/**
 * Calculate a CSS transform translation based on angle and distance
 * @param {number} angle - The angle in degrees
 * @param {number} distance - The distance to translate
 * @returns {string} The CSS transform translation string
 */
export function angleDistanceToTranslate(angle, distance) {
    angle = rotateDegrees(angle, -90);
    const rad = angle * Math.PI / 180;
    const x = distance * Math.cos(rad);
    const y = distance * Math.sin(rad);
    return `translate(${x}px, ${y}px)`;
}
