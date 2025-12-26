import {
    add, subtract, multiply, divide,
    clamp, lerp, mapRange,
    offset, offsetLimit,
    roundTo, roundToDecimals,
    random, randomInt, randomFloat,
    isEven, isOdd, isInteger, isFloat
} from '../../src/zyX-Math.js';

// Basic arithmetic examples
console.log('Basic Arithmetic:');
console.log('add(5, 3) =', add(5, 3));
console.log('subtract(10, 4) =', subtract(10, 4));
console.log('multiply(2, 6) =', multiply(2, 6));
console.log('divide(15, 3) =', divide(15, 3));

// Value manipulation examples
console.log('\nValue Manipulation:');
console.log('clamp(15, 0, 10) =', clamp(15, 0, 10));
console.log('lerp(0, 10, 0.5) =', lerp(0, 10, 0.5));
console.log('mapRange(5, 0, 10, 0, 100) =', mapRange(5, 0, 10, 0, 100));

// Offset examples
console.log('\nOffset Functions:');
console.log('offset(0.7, 0.5) =', offset(0.7, 0.5));
console.log('offsetLimit(0.7, 0.5) =', offsetLimit(0.7, 0.5));

// Rounding examples
console.log('\nRounding Functions:');
console.log('roundTo(7, 5) =', roundTo(7, 5));
console.log('roundToDecimals(3.14159, 2) =', roundToDecimals(3.14159, 2));

// Random number examples
console.log('\nRandom Number Generation:');
console.log('random() =', random());
console.log('randomInt(1, 10) =', randomInt(1, 10));
console.log('randomFloat(0, 1, 2) =', randomFloat(0, 1, 2));

// Number validation examples
console.log('\nNumber Validation:');
console.log('isEven(4) =', isEven(4));
console.log('isOdd(7) =', isOdd(7));
console.log('isInteger(5) =', isInteger(5));
console.log('isFloat(3.14) =', isFloat(3.14)); 