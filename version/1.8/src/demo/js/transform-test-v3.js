import { html, dynamicVar } from "../../../";

function getSliderStyle(value, min, max) {
  const percent = getSliderPercentage(value, min, max);
  return `--slider-value: ${percent}%;`;
}

// function to set the slider bar to the correct position
function getSliderPercentage(value, min, max) {
  const percent = (value - min) / (max - min) * 100;
  return percent;
}

class TransformControlsMenuItem {
  constructor(key, dynamicVar, limit) {
    this.key = key;
    this.dynamicVar = dynamicVar;
    this.limit = limit;

    html`
      <div class="control-group">
          <div class="main-controls">
            <h3>
              ${this.key} <span class="value-separator">|</span> <span class="value-display">${this.dynamicVar}</span>
            </h3>
            <div class="slider-container">
              <input
                type="range"
                min=${this.limit.min}
                max=${this.limit.max}
                step=${this.limit.step}
                value=${this.dynamicVar}
                zyx-input=${this.handleSliderChange.bind(this)}
                />
                <div this=slider_bar class="slider-bar"
                  style="${getSliderStyle(this.dynamicVar.value, this.limit.min.value, this.limit.max.value)}"
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
    const percent = getSliderPercentage(this.dynamicVar.value, this.limit.min.value, this.limit.max.value);
    this.slider_bar.style.setProperty("--slider-value", `${percent}%`);
  }

  handleSliderChange(z) {
    this.dynamicVar.set(parseFloat(z.e.target.value));
    this.updateSliderBar();
  }
}

class TransformControls {
  constructor() {
    this.dynamicVars = {
      scale: dynamicVar(1.2),
      rotateX: dynamicVar(15),
      rotateY: dynamicVar(30),
      rotateZ: dynamicVar(-20),
      translateX: dynamicVar(1),
      translateY: dynamicVar(1),
      translateZ: dynamicVar(1),
      originX: dynamicVar(50),
      originY: dynamicVar(50),
    };

    this.limits = {
      scale: { min: dynamicVar(0.5), max: dynamicVar(4), step: dynamicVar(0.01) },
      rotateX: { min: dynamicVar(-180), max: dynamicVar(180), step: dynamicVar(1) },
      rotateY: { min: dynamicVar(-180), max: dynamicVar(180), step: dynamicVar(1) },
      rotateZ: { min: dynamicVar(-180), max: dynamicVar(180), step: dynamicVar(1) },
      translateX: { min: dynamicVar(-100), max: dynamicVar(100), step: dynamicVar(1) },
      translateY: { min: dynamicVar(-100), max: dynamicVar(100), step: dynamicVar(1) },
      translateZ: { min: dynamicVar(-200), max: dynamicVar(200), step: dynamicVar(1) },
      originX: { min: dynamicVar(0), max: dynamicVar(100), step: dynamicVar(1) },
      originY: { min: dynamicVar(0), max: dynamicVar(100), step: dynamicVar(1) },
    };

    html`
      <div class="transform-controls">
        <div this=menu class="control-group" ></div>
        </div>
      </div>
    `.bind(this);

    this.buildMenu();
  }

  buildMenu() {
    for (const [key, dynamicVar] of Object.entries(this.dynamicVars)) {
      const { min, max, step } = this.limits[key];
      const menuItem = new TransformControlsMenuItem(key, dynamicVar, { min, max, step });
      menuItem.appendTo(this.menu);
    }
  }

  resetTransforms() {
    for (const [key, dynamicVar] of Object.entries(this.dynamicVars)) {
      dynamicVar.reset();
    }
  }
}

new (class TransformDemo {
  constructor() {
    // Create dynamic values for transform controls
    this.transformControls = new TransformControls();

    html`
      <div class="transform-demo">
        <div class="transform-controls">
          ${this.transformControls}
          <div class="button-group">
            <button class="button" zyx-click=${() => this.transformBox.zyxTrans.resetTransforms()}>Reset</button>
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

    window.transformDemo = this;

  }
})()