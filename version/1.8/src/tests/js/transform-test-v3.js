import { html, dynamicVar } from "../../../";

function updateSliderBar(z, min, max) {
  const percent = getSliderPercentage(z.e.target.value, min.value, max.value);
  z.slider_bar.style.setProperty("--slider-value", `${percent}%`);
}

function getSliderStyle(value, min, max) {
  const percent = getSliderPercentage(value, min, max);
  return `--slider-value: ${percent}%;`;
}

// function to set the slider bar to the correct position
function getSliderPercentage(value, min, max) {
  const percent = (value - min) / (max - min) * 100;
  return percent;
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
      const handleSliderChange = (z, min, max) => {
        dynamicVar.set(parseFloat(z.e.target.value));
        updateSliderBar(z, min, max);
      }
      html`
        <div class="control-group">
          <div class="main-controls">
            <h3>
              ${key} <span class="value-separator">|</span> <span class="value-display">${dynamicVar}</span>
            </h3>
            <div class="slider-container">
              ${html`<input
                type="range"
                min=${min}
                max=${max}
                step=${step}
                value=${dynamicVar}
                zyx-input=${_ => { handleSliderChange(_, min, max) }}
                zyx-connected=${_ => { console.log("zyx-connected", _) }}
                />
                <div this=slider_bar class="slider-bar"
                style="${getSliderStyle(dynamicVar.value, min.value, max.value)}"
                ></div>
                `}
            </div>
          </div>
          <div class="slider-settings">
            <div class="setting-group">
              <label for="min">Min</label>
              <input
                type="number"
                id="min"
                value=${min}
                zyx-input=${(z) => min.set(parseFloat(z.e.target.value))}
              />
            </div>
            <div class="setting-group">
              <label for="max">Max</label>
              <input
                type="number"
                id="max"
                value=${max}
                zyx-input=${(z) => max.set(parseFloat(z.e.target.value))}
              />
            </div>
            <div class="setting-group">
              <label for="step">Step</label>
              <input
                type="number"
                id="step"
                value=${step}
                zyx-input=${(z) => step.set(parseFloat(z.e.target.value))}
              />
            </div>
          </div>
        </div>
      `.appendTo(this.menu);

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