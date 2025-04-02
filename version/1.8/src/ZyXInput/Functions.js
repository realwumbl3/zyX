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

/**
 * Xbox controller button mapping
 * @type {Object.<number, string>}
 */
export const XboxControllerMap = {
    1: "x-uppad",
    2: "x-downpad",
    3: "x-leftpad",
    4: "x-rightpad",
    5: "x-menu",
    6: "x-start",
    7: "x-rightjoy",
    8: "x-leftjoy",
    9: "x-leftbumper",
    10: "x-rightbumper",
    13: "x-A",
    14: "x-X",
    15: "x-B",
    16: "x-Y",
};
