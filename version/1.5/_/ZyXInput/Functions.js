// #region [Imports] Copyright wumbl3 ©️ 2023 - No copying / redistribution / modification unless strictly allowed.
// #endregion
/*

\           up            /
    \                 /   
        315      45
            -0-      
left    270  X   90     right
            180
        225     135
    /                 \
/           down          \

0 = up
90 = right
180 = down
270 = left

*/

export function rotateDegrees(input, degrees) {
    const output = (input + degrees) % 360;
    return output;
}

//  output: "left", "up", "right", "down" based on 45 degree increments
export function angleToDirection(angle) {
    const directions = ["up", "right", "down", "left"];
    const index = Math.round(angle / 90) % 4;
    const dir = directions[index];
    return dir;
}

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

// snap angles -45 to 45 degrees as 0, 45 to 135 as 90, 135 to 225 as 180, 225 to 315 as 270, 315 to 405 as 0
export function calculateFourAngleSnap(angle) {
    const snapAngles = [0, 90, 180, 270, 0]
    const index = Math.round(angle / 90) % 4;
    const snapAngle = snapAngles[index];
    return snapAngle;
}

export function angleDistanceToTranslate(angle, distance) {
    angle = rotateDegrees(angle, -90);
    const rad = angle * Math.PI / 180;
    const x = distance * Math.cos(rad);
    const y = distance * Math.sin(rad);
    return 'translate(' + x + 'px, ' + y + 'px)';;
}

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
