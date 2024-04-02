export default async function ScrollTo(container, { top, left } = {}) {
    const any_active = active.has(container);

    if (any_active) {
        const active_animation = active.get(container)
        // Update target scroll position if an existing animation is running
        active_animation.update_target({ top, left })
    } else {
        // Initialize a new animation object and associate it with the container.
        const animation = new Animation(container, top, left)
        active.set(container, animation);
        return new Promise((resolve) => {
            animation.onend = resolve
            animation.start()
        });
    }
}

const active = new WeakMap()

class Animation {
    constructor(container, top, left) {
        this.container = container;
        this.target = { top, left }
        this.startContext = { startTop: container.scrollTop, startLeft: container.scrollLeft }
        this.startTime = performance.now()
        this.onend = null
        this.duration = 200
    }


    update_target({ top, left }) {
        if (top !== undefined) this.target.top = top
        if (left !== undefined) this.target.left = left
        this.startContext = { startTop: this.container.scrollTop, startLeft: this.container.scrollLeft }
        this.startTime = performance.now()
    }

    frame() {
        const elapsed = performance.now() - this.startTime
        const { top, left } = this.target
        const { startTop, startLeft } = this.startContext
        const easing = 'easeInOutQuad'
        if (elapsed < this.duration) {
            this.container.scrollTop = easingFunctions[easing](elapsed, startTop, top - startTop, this.duration)
            this.container.scrollLeft = easingFunctions[easing](elapsed, startLeft, left - startLeft, this.duration)
            requestAnimationFrame(this.frame.bind(this))
        } else {
            this.container.scrollTop = top
            this.container.scrollLeft = left
            active.delete(this.container)
            this.onend()
        }
    }

    start() {
        requestAnimationFrame(this.frame.bind(this))
    }

}

const easingFunctions = {
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) { return c / 2 * t * t + b; }
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },
    easeInQuad(t, b, c, d) {
        t /= d;
        return c * (t * t) + b;
    }, easeOutQuad(t, b, c, d) {
        t /= d;
        return -c * (t * t * (t(t - 2)) + 1) + b;
    }, easeBounce(t, b, c, d) {
        if (t < d / 2.75) {
            return c * (7.5625 * t * t) / (d * d) + b;
        } else if (t < d / 2) {
            return c * (7.5625 * (t - d / 3) * (t - d / 3)) / (d * d) + b;
        } else if (t < d - d / 29) {
            return c * (7.5625 * (t - d / 2.75) * (t - d / 2.75)) / (d * d) + b;
        } else {
            return c * (7.5625 * (t - d) * (t - d)) / (d * d) + b;
        }
    }
}
