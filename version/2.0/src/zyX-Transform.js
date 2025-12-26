import { LiveVar } from "./zyX-LiveTypes.js";

/**
 * zyxTransform - A utility for managing CSS transforms on DOM elements
 * @version 1.4
 * @author twitter.com/wumbl3
 *
 * @typedef {Object} TransformObject
 * @property {string|number|LiveVar} [scale] - Scale transform value
 * @property {string|number|LiveVar} [rotateX] - X rotation transform value
 * @property {string|number|LiveVar} [rotateY] - Y rotation transform value
 * @property {string|number|LiveVar} [rotateZ] - Z rotation transform value
 * @property {string|number|LiveVar} [translateX] - X translation transform value
 * @property {string|number|LiveVar} [translateY] - Y translation transform value
 * @property {string|number|LiveVar} [translateZ] - Z translation transform value
 * @property {string|number|LiveVar} [originX] - Transform origin X value (percentage)
 * @property {string|number|LiveVar} [originY] - Transform origin Y value (percentage)
 * @property {Object} [transformMap] - Map of transform properties to apply at once
 * @property {Object} [map] - Map of transform properties to apply at once
 */

/**
 * Helper function to add units to values while maintaining reactivity
 * @param {number|LiveVar} value - The value to add units to
 * @param {string} unit - The unit to add (e.g. 'px', 'deg', '%')
 * @returns {LiveVar} A new LiveVar that adds the unit to the value
 */
export function withUnits(value, unit) {
    // If it's not a LiveVar, just add the unit as a string
    if (!(typeof value === "object" && "subscribe" in value)) {
        return value + unit;
    }

    // Create a new LiveVar that adds the unit
    const result = new LiveVar(value.value + unit);

    // Subscribe to changes in the original value
    value.subscribe((newValue) => {
        result.set(newValue + unit);
    }, value);

    return result;
}

/**
 * Default units for transform properties if no unit is specified
 */
const defaultUnits = {
    scale: "", // Scale is unitless
    rotateX: "deg",
    rotateY: "deg",
    rotateZ: "deg",
    translateX: "px",
    translateY: "px",
    translateZ: "px",
    originX: "%",
    originY: "%",
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
        throw new Error("zyxTransform requires a valid HTMLElement");
    }

    /** @type {Object.<string, TransformObject>} */
    const snapshots = {};

    /** @type {TransformObject} */
    let transforms = {};

    /** @type {string} */
    let cachedTransformString = "";

    /**
     * Saves the current transform state with a given name
     * @param {string} name - The name to save the snapshot under
     * @returns {void}
     */
    function snapshot(name) {
        if (!name || typeof name !== "string") {
            throw new Error("Snapshot name must be a non-empty string");
        }
        snapshots[name] = { ...transforms };
    }

    function set(newTransforms) {
        transforms = newTransforms;
        updateTransformOrigin();
        updateTransformString();
    }

    /**
     * Restores a previously saved transform state
     * @param {string} name - The name of the snapshot to restore
     * @returns {boolean} Whether the restore was successful
     */
    function restore(name) {
        if (!name || typeof name !== "string") {
            throw new Error("Restore name must be a non-empty string");
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
     * Processes the mapped keys object when it's provided
     * @private
     */
    function processMappedKeys() {
        if (!mappedKeys) return;
        // Set up dynamic property tracking with appropriate units
        // Process all transform properties
        const propertiesToProcess = [
            { key: "scale", unit: "" },
            { key: "rotateX", unit: "deg" },
            { key: "rotateY", unit: "deg" },
            { key: "rotateZ", unit: "deg" },
            { key: "translateX", unit: "px" },
            { key: "translateY", unit: "px" },
            { key: "translateZ", unit: "px" },
            { key: "originX", unit: "%" },
            { key: "originY", unit: "%" },
        ];

        // Process each property if it exists in mappedKeys
        for (const { key, unit } of propertiesToProcess) {
            if (key in mappedKeys) {
                const value = mappedKeys[key];

                // Check if it's a LiveVar
                if (typeof value === "object" && "subscribe" in value) {
                    // For scale which has no unit
                    if (key === "scale") {
                        transforms[key] = value;
                    } else {
                        transforms[key] = withUnits(value, unit);
                    }

                    // Add subscriber to update transform when the value changes
                    if (key === "originX" || key === "originY") {
                        value.subscribe(updateTransformOrigin, element);
                    } else {
                        value.subscribe(updateTransformString, element);
                    }
                } else {
                    // Handle static values
                    transforms[key] = key === "scale" ? value : value + unit;
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
     * Resets all transforms to their default values
     * @returns {void}
     */
    function resetTransforms() {
        // Instead of clearing all transforms (which breaks references),
        // we'll reset each LiveVar to its default value
        if (mappedKeys) {
            // Reset mapped dynamic variables to their default values
            for (const key in mappedKeys) {
                const value = mappedKeys[key];
                if (typeof value === "object" && "reset" in value) {
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
            element.style.transformOrigin = "50% 50%";
            element.style.transform = "";
        }
    }

    /**
     * Updates the transform origin string and applies it to the element
     * @private
     */
    function updateTransformOrigin() {
        const x =
            typeof transforms.originX === "object" && "subscribe" in transforms.originX
                ? transforms.originX.value
                : transforms.originX || "50%";
        const y =
            typeof transforms.originY === "object" && "subscribe" in transforms.originY
                ? transforms.originY.value
                : transforms.originY || "50%";
        element.style.transformOrigin = `${x} ${y}`;
    }

    /**
     * Updates the transform string and applies it to the element
     * @private
     */
    function updateTransformString() {
        const transformParts = [];

        for (const [key, value] of Object.entries(transforms)) {
            if (value && key !== "originX" && key !== "originY") {
                const val = typeof value === "object" && "subscribe" in value ? value.value : value;
                transformParts.push(`${key}(${val})`);
            }
        }

        cachedTransformString = transformParts.join(" ");
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
        resetTransforms,
    });

    return {
        set,
        snapshot,
        restore,
        resetTransforms,
    };
}
