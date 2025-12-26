/**
 * @param {HTMLElement} element
 * @param {string} animationName
 * @param {string} animationArgs
 * @param {string} targetDisplay
 * @param {Function} callback
 */
export default function displayAnimation(element, animationName, animationArgs, targetDisplay, callback) {
    const onEnd = (e) => {
        if (e.animationName === animationName) {
            if (targetDisplay === "none") {
                element.style.display = targetDisplay;
            }
            element.removeEventListener("animationend", onEnd);
            callback && callback();
        }
    };

    if (targetDisplay !== "none") {
        element.style.display = targetDisplay;
    }
    element.style.animation = `${animationName} ${animationArgs}`;
    element.addEventListener("animationend", onEnd);
}
