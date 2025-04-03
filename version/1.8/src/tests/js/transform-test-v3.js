import { html, dynamicVar } from "../../../";
import zyxTransform, { withUnits } from "../../zyX-Transform.js";

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
      console.log("building menu", { key, dynamicVar, min, max, step });
      html`
        <div class="control-group">
          <div class="main-controls">
            <h3>
              ${key} <span class="value-separator">|</span> <span class="value-display">${dynamicVar}</span>
            </h3>
            <div class="slider-container">
              <input
                type="range"
                min=${min}
                max=${max}
                step=${step}
                value=${dynamicVar}
                zyx-input=${(z) => dynamicVar.set(parseFloat(z.e.target.value))}
              />
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

class TransformDemo {
  constructor() {
    // Create dynamic values for transform controls
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
          <div this="transformBox" class="transform-box">
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

    // Initialize transform manager
    this.transformManager = zyxTransform(this.transformBox);

    // Set up transform updates
    this.transformManager.set({
      scale: this.transformControls.dynamicVars.scale,
      rotateX: withUnits(this.transformControls.dynamicVars.rotateX, "deg"),
      rotateY: withUnits(this.transformControls.dynamicVars.rotateY, "deg"),
      rotateZ: withUnits(this.transformControls.dynamicVars.rotateZ, "deg"),
      translateX: withUnits(this.transformControls.dynamicVars.translateX, "px"),
      translateY: withUnits(this.transformControls.dynamicVars.translateY, "px"),
      translateZ: withUnits(this.transformControls.dynamicVars.translateZ, "px"),
      originX: withUnits(this.transformControls.dynamicVars.originX, "%"),
      originY: withUnits(this.transformControls.dynamicVars.originY, "%"),
    });
  }


}

const demo = new TransformDemo();