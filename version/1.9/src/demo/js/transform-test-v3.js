import { html, LiveVar, clamp } from "../../../";

function getSliderStyle(value, min, max) {
  const percent = getSliderPercentage(value, min, max);
  return `--slider-value: ${percent}%;`;
}

// function to set the slider bar to the correct position
function getSliderPercentage(value, min, max) {
  const percent = (value - min) / (max - min) * 100;
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
              ${this.key} <span class="value-separator">|</span> <span class="value-display">${this.LiveVar}</span>
            </h3>
            <div class="slider-container">
              <input
                type="range"
                min=${this.limit.min}
                max=${this.limit.max}
                step=${this.limit.step}
                value=${this.LiveVar}
                zyx-input=${this.handleSliderChange.bind(this)}
                zyx-change=${this.updateSliderBar.bind(this)}
                />
                <div this=slider_bar class="slider-bar"
                  style="${getSliderStyle(this.LiveVar.value, this.limit.min.value, this.limit.max.value)}"
                ></div>
            </div>
          </div>
          <div class="slider-settings">
            <div class="setting-group">
              <label for="min">Min</label>
              <input
                type="number"
                value=${this.limit.min}
                zyx-input=${(z) => this.limit.min.set(parseFloat(z.e.target.value))}
              />
            </div>
            <div class="setting-group">
              <label for="max">Max</label>
              <input
                type="number"
                value=${this.limit.max}
                zyx-input=${(z) => this.limit.max.set(parseFloat(z.e.target.value))}
              />
            </div>
            <div class="setting-group">
              <label for="step">Step</label>
              <input
                type="number"
                value=${this.limit.step}
                zyx-input=${(z) => this.limit.step.set(parseFloat(z.e.target.value))}
              />
            </div>
          </div>
        </div>
    `.bind(this);
  }

  updateSliderBar() {
    const percent = clamp(getSliderPercentage(this.LiveVar.value, this.limit.min.value, this.limit.max.value), 0, 100);
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
      scale: LiveVar(1.2),
      rotateX: LiveVar(15),
      rotateY: LiveVar(30),
      rotateZ: LiveVar(-20),
      translateX: LiveVar(1),
      translateY: LiveVar(1),
      translateZ: LiveVar(1),
      originX: LiveVar(50),
      originY: LiveVar(50),
    };

    this.limits = {
      scale: { min: LiveVar(0.5), max: LiveVar(4), step: LiveVar(0.01) },
      rotateX: { min: LiveVar(-180), max: LiveVar(180), step: LiveVar(1) },
      rotateY: { min: LiveVar(-180), max: LiveVar(180), step: LiveVar(1) },
      rotateZ: { min: LiveVar(-180), max: LiveVar(180), step: LiveVar(1) },
      translateX: { min: LiveVar(-100), max: LiveVar(100), step: LiveVar(1) },
      translateY: { min: LiveVar(-100), max: LiveVar(100), step: LiveVar(1) },
      translateZ: { min: LiveVar(-200), max: LiveVar(200), step: LiveVar(1) },
      originX: { min: LiveVar(0), max: LiveVar(100), step: LiveVar(1) },
      originY: { min: LiveVar(0), max: LiveVar(100), step: LiveVar(1) },
    };

    /**
     * @type {TransformControl[]}
     */
    this.controls = [];

    html`
      <div class="transform-controls">
        <div this=menu class="control-group" 
        zyx-insert-entries=${[this.dynamicVars, (z, key, LiveVar) => {
        return new TransformControl(key, LiveVar, this.limits[key]);
      }, this.controls]}></div>
      </div>
    `.bind(this);

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
            <button class="button" zyx-click=${() => this.transformControls.resetTransforms()}>Reset</button>
          </div>
        </div>

        <div class="transform-display">
          <div this="transformBox" class="transform-box" zyx-transform=${{ map: this.transformControls.dynamicVars }}>   
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