import { dynamicVar } from "./html/dynamicVariable.js";

/**
 * zyxTransform - A utility for managing CSS transforms on DOM elements
 * @version 1.3
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
 */

/**
 * Helper function to add units to values while maintaining reactivity
 * @param {number|dynamicVar} value - The value to add units to
 * @param {string} unit - The unit to add (e.g. 'px', 'deg', '%')
 * @returns {dynamicVar} A new dynamicVar that adds the unit to the value
 */
export function withUnits(value, unit) {
    if (typeof value === 'object' && 'subscribe' in value) {
        // Create a new dynamicVar that adds the unit
        const result = dynamicVar(value.value + unit);
        
        // Subscribe to changes in the original value
        value.subscribe(newValue => {
            result.set(newValue + unit);
        });

        // Add unsubscribe method to clean up
        result.unsubscribe = () => {
            value.subscribers.delete(result.set);
        };

        return result;
    }
    return value + unit;
}

/**
 * Creates a transform manager for a DOM element
 * @param {HTMLElement} element - The DOM element to manage transforms for
 * @throws {Error} If element is not a valid HTMLElement
 * @returns {Object} The transform manager object
 */
export default function zyxTransform(element) {
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
     * Updates the element's transforms
     * @param {TransformObject|null} transforms_obj - The transforms to apply, or null to clear all
     * @returns {void}
     */
    function set(transforms_obj) {
        if (transforms_obj === null) {
            transforms = {};
            element.style.transformOrigin = '50% 50%'; // Reset to default
        } else {
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

    // Expose methods to the element
    Object.assign(element, { set, snapshot, restore });

    return {
        set,
        snapshot,
        restore
    };
}


