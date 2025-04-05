import { dynamicVar } from "./html/dynamicVariable.js";

/**
 * zyxTransform - A utility for managing CSS transforms on DOM elements
 * @version 1.4
 * @author twitter.com/wumbl3
 * 
 * @typedef {Object} TransformObject
 * @property {string|number|dynamicVar} [scale] - Scale transform value
 * @property {string|number|dynamicVar} [rotateX] - X rotation transform value
 * @property {string|number|dynamicVar} [rotateY] - Y rotation transform value
 * @property {string|number|dynamicVar} [rotateZ] - Z rotation transform value
 * @property {string|number|dynamicVar} [translateX] - X translation transform value
 * @property {string|number|dynamicVar} [translateY] - Y translation transform value
 * @property {string|number|dynamicVar} [translateZ] - Z translation transform value
 * @property {string|number|dynamicVar} [originX] - Transform origin X value (percentage)
 * @property {string|number|dynamicVar} [originY] - Transform origin Y value (percentage)
 * @property {Object} [transformMap] - Map of transform properties to apply at once
 * @property {Object} [map] - Map of transform properties to apply at once      
 */

/**
 * Helper function to add units to values while maintaining reactivity
 * @param {number|dynamicVar} value - The value to add units to
 * @param {string} unit - The unit to add (e.g. 'px', 'deg', '%')
 * @returns {dynamicVar} A new dynamicVar that adds the unit to the value
 */
export function withUnits(value, unit) {
    // If it's not a dynamicVar, just add the unit as a string
    if (!(typeof value === 'object' && 'subscribe' in value)) {
        return value + unit;
    }

    // Create a new dynamicVar that adds the unit
    const result = dynamicVar(value.value + unit);

    // Subscribe to changes in the original value
    value.subscribe(newValue => {
        result.set(newValue + unit);
    });

    // Add unsubscribe method to clean up
    result.unsubscribe = () => {
        if (value.subscribers) {
            value.subscribers.delete(result.set);
        }
    };

    return result;
}

/**
 * Default units for transform properties if no unit is specified
 */
const defaultUnits = {
    scale: '',         // Scale is unitless
    rotateX: 'deg',
    rotateY: 'deg',
    rotateZ: 'deg',
    translateX: 'px',
    translateY: 'px',
    translateZ: 'px',
    originX: '%',
    originY: '%'
};

/**
 * Creates a transform manager for a DOM element
 * @param {HTMLElement} element - The DOM element to manage transforms for
 * @param {Object} [mappedKeys] - Optional object with transform keys to use as reference
 * @throws {Error} If element is not a valid HTMLElement
 * @returns {Object} The transform manager object
 */
export default function zyxTransform(element, mappedKeys) {
    if (!(element instanceof HTMLElement)) {
        throw new Error('zyxTransform requires a valid HTMLElement');
    }

    /** @type {Object.<string, TransformObject>} */
    const snapshots = {};

    /** @type {TransformObject} */
    let transforms = {};

    /** @type {string} */
    let cachedTransformString = '';

    /**
     * Saves the current transform state with a given name
     * @param {string} name - The name to save the snapshot under
     * @returns {void}
     */
    function snapshot(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Snapshot name must be a non-empty string');
        }
        snapshots[name] = { ...transforms };
    }

    /**
     * Restores a previously saved transform state
     * @param {string} name - The name of the snapshot to restore
     * @returns {boolean} Whether the restore was successful
     */
    function restore(name) {
        if (!name || typeof name !== 'string') {
            throw new Error('Restore name must be a non-empty string');
        }
        if (!(name in snapshots)) {
            console.warn(`No snapshot found with name: ${name}`);
            return false;
        }
        set(null);
        set(snapshots[name]);
        return true;
    }

    /**
     * Logs the current state of all transforms for debugging
     * @private
     */
    function logTransformState() {
        console.log("Current transform state:", {
            transforms: Object.fromEntries(
                Object.entries(transforms).map(([key, value]) => [
                    key,
                    typeof value === 'object' && 'value' in value ?
                        { type: 'dynamicVar', value: value.value } :
                        value
                ])
            ),
            mappedKeys: mappedKeys ? Object.fromEntries(
                Object.entries(mappedKeys).map(([key, value]) => [
                    key,
                    typeof value === 'object' && 'value' in value ?
                        { type: 'dynamicVar', value: value.value } :
                        value
                ])
            ) : null
        });
    }

    /**
     * Processes the mapped keys object when it's provided
     * @private
     */
    function processMappedKeys() {
        if (!mappedKeys) return;
        // Set up dynamic property tracking with appropriate units
        // Process all transform properties
        const propertiesToProcess = [
            { key: 'scale', unit: '' },
            { key: 'rotateX', unit: 'deg' },
            { key: 'rotateY', unit: 'deg' },
            { key: 'rotateZ', unit: 'deg' },
            { key: 'translateX', unit: 'px' },
            { key: 'translateY', unit: 'px' },
            { key: 'translateZ', unit: 'px' },
            { key: 'originX', unit: '%' },
            { key: 'originY', unit: '%' }
        ];

        // Process each property if it exists in mappedKeys
        for (const { key, unit } of propertiesToProcess) {
            if (key in mappedKeys) {
                const value = mappedKeys[key];

                // Check if it's a dynamicVar
                if (typeof value === 'object' && 'subscribe' in value) {
                    // For scale which has no unit
                    if (key === 'scale') {
                        transforms[key] = value;
                    } else {
                        transforms[key] = withUnits(value, unit);
                    }

                    // Add subscriber to update transform when the value changes
                    value.subscribe(() => {
                        if (key === 'originX' || key === 'originY') {
                            updateTransformOrigin();
                        }
                        updateTransformString();
                    });
                } else {
                    // Handle static values
                    transforms[key] = key === 'scale' ? value : value + unit;
                }
            }
        }

        // // Log the transforms after mapping
        // logTransformState();

        // Apply initial transforms
        updateTransformOrigin();
        updateTransformString();
    }

    /**
     * Processes a transform value to ensure it has the correct unit
     * @private
     * @param {string|number|dynamicVar} value - The value to process
     * @param {string} key - The transform property key
     * @returns {string|dynamicVar} The processed value with units
     */
    function processValueWithUnits(value, key) {
        if (value === null) return null;

        // Skip if the value already has a unit
        if (typeof value === 'string' &&
            (value.endsWith('px') || value.endsWith('%') || value.endsWith('deg') ||
                value.endsWith('rad') || value.endsWith('turn') || value.endsWith('grad'))) {
            return value;
        }

        // Add default unit if needed
        const unit = defaultUnits[key] || '';
        return withUnits(value, unit);
    }

    /**
     * Handles the transformMap object and processes each property within it
     * @private
     * @param {Object} transformMap - Object containing transform properties and values
     * @returns {Object} Processed transform object
     */
    function processTransformMap(transformMap) {
        if (!transformMap || typeof transformMap !== 'object') return {};

        const processedMap = {};
        for (const [key, value] of Object.entries(transformMap)) {
            if (key in defaultUnits) {
                processedMap[key] = processValueWithUnits(value, key);
            }
        }
        return processedMap;
    }

    /**
     * Updates the element's transforms
     * @param {TransformObject|null} transforms_obj - The transforms to apply, or null to clear all
     * @returns {void}
     */
    function set(transforms_obj) {
        if (transforms_obj === null) {
            transforms = {};
            element.style.transformOrigin = '50% 50%'; // Reset to default
        } else {
            // Handle transformMap if present
            if ('transformMap' in transforms_obj && transforms_obj.transformMap) {
                const processedMap = processTransformMap(transforms_obj.transformMap);
                set({ ...processedMap, ...transforms_obj });
                return;
            }

            // Handle transform origin separately
            if ('originX' in transforms_obj || 'originY' in transforms_obj) {
                const x = transforms_obj.originX || transforms.originX || '50%';
                const y = transforms_obj.originY || transforms.originY || '50%';

                // Handle dynamicVar values for origin
                if (typeof x === 'object' && 'subscribe' in x) {
                    if (transforms.originX?.unsubscribe) {
                        transforms.originX.unsubscribe();
                    }
                    transforms.originX = x;
                    x.subscribe(() => updateTransformOrigin());
                } else {
                    transforms.originX = x;
                }

                if (typeof y === 'object' && 'subscribe' in y) {
                    if (transforms.originY?.unsubscribe) {
                        transforms.originY.unsubscribe();
                    }
                    transforms.originY = y;
                    y.subscribe(() => updateTransformOrigin());
                } else {
                    transforms.originY = y;
                }

                updateTransformOrigin();
                delete transforms_obj.originX;
                delete transforms_obj.originY;
            }

            // Process each transform property
            for (const [key, value] of Object.entries(transforms_obj)) {
                if (key === 'transformMap') continue; // Skip transformMap as it's already processed

                if (value === null) {
                    delete transforms[key];
                    continue;
                }

                // Handle dynamicVar values
                if (typeof value === 'object' && 'subscribe' in value) {
                    // Remove any existing listener for this property
                    if (transforms[key]?.unsubscribe) {
                        transforms[key].unsubscribe();
                    }

                    // Use the dynamicVar directly and subscribe to its changes
                    transforms[key] = value;
                    value.subscribe(() => {
                        updateTransformString();
                    });
                } else {
                    transforms[key] = value;
                }
            }
        }

        updateTransformString();
    }

    /**
     * Resets all transforms to their default values
     * @returns {void}
     */
    function resetTransforms() {
        // Instead of clearing all transforms (which breaks references),
        // we'll reset each dynamicVar to its default value
        if (mappedKeys) {
            // Reset mapped dynamic variables to their default values
            for (const key in mappedKeys) {
                const value = mappedKeys[key];
                if (typeof value === 'object' && 'reset' in value) {
                    // Call the reset method if available
                    value.reset();
                }
            }

            // Update the transform visuals
            updateTransformOrigin();
            updateTransformString();
        } else {
            // If no mappedKeys, clear transforms and reset to default
            transforms = {};
            element.style.transformOrigin = '50% 50%';
            element.style.transform = '';
        }
    }

    /**
     * Updates the transform origin string and applies it to the element
     * @private
     */
    function updateTransformOrigin() {
        const x = typeof transforms.originX === 'object' && 'subscribe' in transforms.originX
            ? transforms.originX.value
            : transforms.originX || '50%';
        const y = typeof transforms.originY === 'object' && 'subscribe' in transforms.originY
            ? transforms.originY.value
            : transforms.originY || '50%';
        element.style.transformOrigin = `${x} ${y}`;
    }

    /**
     * Updates the transform string and applies it to the element
     * @private
     */
    function updateTransformString() {
        const transformParts = [];

        for (const [key, value] of Object.entries(transforms)) {
            if (value && key !== 'originX' && key !== 'originY') {
                const val = typeof value === 'object' && 'subscribe' in value ? value.value : value;
                transformParts.push(`${key}(${val})`);
            }
        }

        cachedTransformString = transformParts.join(' ');
        element.style.transform = cachedTransformString;
    }

    // Process mapped keys if provided
    if (mappedKeys) {
        processMappedKeys();
    }

    // Expose methods to the element
    Object.assign(element, {
        set,
        snapshot,
        restore,
        resetTransforms
    });

    return {
        set,
        snapshot,
        restore,
        resetTransforms
    };
}


