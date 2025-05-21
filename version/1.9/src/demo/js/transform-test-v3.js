import { html, LiveVar, clamp } from "../../../";

function getSliderStyle(value, min, max) {
    const percent = getSliderPercentage(value, min, max);
    return `--slider-value: ${percent}%;`;
}

// function to set the slider bar to the correct position
function getSliderPercentage(value, min, max) {
    const percent = ((value - min) / (max - min)) * 100;
    return percent;
}

class TransformControl {
    constructor(key, LiveVar, limit) {
        this.key = key;
        this.LiveVar = LiveVar;
        this.limit = limit;

        html`
            <div class="control-group">
                <div class="main-controls">
                    <h3>
                        ${this.key} <span class="value-separator">|</span>
                        <span class="value-display">${this.LiveVar.interp()}</span>
                    </h3>
                    <div class="slider-container">
                        <input
                            type="range"
                            min=${this.limit.min.interp()}
                            max=${this.limit.max.interp()}
                            step=${this.limit.step.interp()}
                            value=${this.LiveVar.interp()}
                            zyx-input=${this.handleSliderChange.bind(this)}
                            zyx-change=${this.updateSliderBar.bind(this)}
                        />
                        <div
                            this="slider_bar"
                            class="slider-bar"
                            style="${getSliderStyle(this.LiveVar.value, this.limit.min.value, this.limit.max.value)}"
                        ></div>
                    </div>
                </div>
                <div class="slider-settings">
                    <div class="setting-group">
                        <label for="min">Min</label>
                        <input
                            type="number"
                            value=${this.limit.min.interp()}
                            zyx-input=${(z) => this.limit.min.set(parseFloat(z.e.target.value))}
                        />
                    </div>
                    <div class="setting-group">
                        <label for="max">Max</label>
                        <input
                            type="number"
                            value=${this.limit.max.interp()}
                            zyx-input=${(z) => this.limit.max.set(parseFloat(z.e.target.value))}
                        />
                    </div>
                    <div class="setting-group">
                        <label for="step">Step</label>
                        <input
                            type="number"
                            value=${this.limit.step.interp()}
                            zyx-input=${(z) => this.limit.step.set(parseFloat(z.e.target.value))}
                        />
                    </div>
                </div>
            </div>
        `.bind(this);
    }

    updateSliderBar() {
        const percent = clamp(
            getSliderPercentage(this.LiveVar.value, this.limit.min.value, this.limit.max.value),
            0,
            100
        );
        this.slider_bar.style.setProperty("--slider-value", `${percent}%`);
    }

    handleSliderChange(z) {
        this.LiveVar.set(parseFloat(z.e.target.value));
        this.updateSliderBar();
    }

    reset() {
        this.LiveVar.reset();
    }
}

class TransformControls {
    constructor() {
        this.dynamicVars = {
            scale: new LiveVar(1.2),
            rotateX: new LiveVar(15),
            rotateY: new LiveVar(30),
            rotateZ: new LiveVar(-20),
            translateX: new LiveVar(1),
            translateY: new LiveVar(1),
            translateZ: new LiveVar(1),
            originX: new LiveVar(50),
            originY: new LiveVar(50),
        };

        this.limits = {
            scale: { min: new LiveVar(0.5), max: new LiveVar(4), step: new LiveVar(0.01) },
            rotateX: { min: new LiveVar(-180), max: new LiveVar(180), step: new LiveVar(1) },
            rotateY: { min: new LiveVar(-180), max: new LiveVar(180), step: new LiveVar(1) },
            rotateZ: { min: new LiveVar(-180), max: new LiveVar(180), step: new LiveVar(1) },
            translateX: { min: new LiveVar(-100), max: new LiveVar(100), step: new LiveVar(1) },
            translateY: { min: new LiveVar(-100), max: new LiveVar(100), step: new LiveVar(1) },
            translateZ: { min: new LiveVar(-200), max: new LiveVar(200), step: new LiveVar(1) },
            originX: { min: new LiveVar(0), max: new LiveVar(100), step: new LiveVar(1) },
            originY: { min: new LiveVar(0), max: new LiveVar(100), step: new LiveVar(1) },
        };

        /**
         * @type {TransformControl[]}
         */
        this.controls = [];

        html`
            <div class="transform-controls">
                <div
                    this="menu"
                    class="control-group"
                    zyx-insert-entries=${[
                        this.dynamicVars,
                        (z, key, LiveVar) => {
                            return new TransformControl(key, LiveVar, this.limits[key]);
                        },
                        this.controls,
                    ]}
                ></div>
            </div>
        `.bind(this);

        console.log(this.controls);
    }

    resetTransforms() {
        for (const control of Object.values(this.controls)) control.reset();
    }
}

class TransformDemo {
    constructor() {
        this.transformControls = new TransformControls();

        html`
            <div class="transform-demo">
                <div class="transform-controls">
                    ${this.transformControls}
                    <div class="button-group">
                        <button class="button" zyx-click=${() => this.transformControls.resetTransforms()}>
                            Reset
                        </button>
                    </div>
                </div>

                <div class="transform-display">
                    <div
                        this="transformBox"
                        class="transform-box"
                        zyx-transform=${{ map: this.transformControls.dynamicVars }}
                    >
                        <div class="transform-content">
                            <h2>Transform Demo</h2>
                            <p>Drag the sliders to see the transforms in action!</p>
                        </div>
                        <div class="transform-box-outline"></div>
                    </div>
                </div>
            </div>
        `
            .bind(this)
            .place(document.getElementById("app"));
    }
}

window.transformDemo = new TransformDemo();
