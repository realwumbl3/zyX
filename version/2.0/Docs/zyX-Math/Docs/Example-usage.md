# zyX-Math Usage Examples

This document provides examples of how to use the various mathematical functions in the zyX-Math module.

```javascript
import { clamp, lerp, mapRange } from "./zyX-Math";

// Clamp a value between min and max
console.log(clamp(15, 0, 10)); // 10
console.log(clamp(5, 0, 10)); // 5
console.log(clamp(-5, 0, 10)); // 0

// Linear interpolation
console.log(lerp(0, 10, 0.5)); // 5
console.log(lerp(0, 10, 0.2)); // 2

// Map a value from one range to another
console.log(mapRange(5, 0, 10, 0, 100)); // 50
```

## Rounding Functions

```javascript
import { roundTo, roundToDecimals } from "./zyX-Math";

// Round to nearest multiple
console.log(roundTo(7, 5)); // 5
console.log(roundTo(8, 5)); // 10

// Round to specific decimal places
console.log(roundToDecimals(3.14159, 2)); // 3.14
console.log(roundToDecimals(2.71828, 1)); // 2.7
```

## Random Number Generation

```javascript
import { random, randomInt, randomFloat } from "./zyX-Math";

// Generate random number between 0 and 1
console.log(random()); // 0.123...

// Generate random integer in range
console.log(randomInt(1, 10)); // 7

// Generate random float in range
console.log(randomFloat(0, 1, 2)); // 0.45
```

## Number Validation

```javascript
import { isEven, isOdd, isInteger, isFloat } from "./zyX-Math";

// Check number properties
console.log(isEven(4)); // true
console.log(isOdd(7)); // true
console.log(isInteger(5)); // true
console.log(isFloat(3.14)); // true
```

## Offset Functions

```javascript
import { scaleFromOffset, scaleToOffset } from "./zyX-Math";

//// scaleFromOffset(ie: .5)
///input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
//output: 0.............0  .2 .4 .6 .8 1
// Scale a value from an offset to a value between 0 and 1
console.log(scaleFromOffset(0.8, 0.2)); // 0.75
console.log(scaleFromOffset(0.5, 0.3)); // 0.29

//// scaleToOffset(ie: .5)
///input: 0 .1 .2 .3 .4 .5 .6 .7 .8 .9 1
//output: 0 .2 .4 .6 .8 1..............1
// Scale a value to an offset between 0 and 1
console.log(scaleToOffset(0.8, 0.2)); // 1
console.log(scaleToOffset(0.5, 0.3)); // 1.67
```
