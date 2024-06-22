import zyX, { html, css } from 'zyX';




function sineWave(x) {
    return Math.sin(2 * Math.PI * x);
}

export default class P4rtic13 {
    startFps() {
        this.animating = true;
        const interv = setInterval(() => {
            if (!this.__frame__()) return clearInterval(interv);
        }, 1000 / this.fps);
    }

    start() {
        if (this.debug) console.log("nParticles started")
        this.animating = true;
        const __frame__ = () => this.__frame__() && window.requestAnimationFrame(_ => __frame__());
        __frame__();
    }

    pause() {
        this.paused = true
        this.last_frame === null
        this.container.classList.add("paused")
        if (this.debug) console.log("nParticles paused")
    }

    stop() {
        this.animating = false;
        if (this.debug) console.log("nParticles stopped")

    }

    resume() {
        this.paused = false
        this.container.classList.remove("paused")
        if (this.debug) console.log("nParticles resumed")
    }

    constructor({
        paused = false,
        fps = 60,
        maxSide = 1200,
        debug = false,
        render_debug = false,
        maxParticles = 90,
        particlesStartCount,
        render_options = false,
        shadow_disabled = false,
        shadow_increments = 6,
        shadow_max = 100,
        shadow_increment_px = 100 / 6,
        shadow_alpha = .3,
        avoidCursor = -1,
        particlePreset
    } = {}) {

        this.fps = fps;
        this.debug = debug;
        this.render_debug = render_debug;
        this.render_options = render_options
        this.frameTime = 0;
        this.framePs = 0;
        this.paused = paused;

        this.maxParticles = maxParticles;
        this.particlesStartCount = particlesStartCount || maxParticles;

        this.nearLines = 0.11;
        this.nearLinesDisabled = false;

        this.particlePreset = { ...DEFAULT_PARTICLE, ...particlePreset }

        this.maxSide = maxSide

        this.avoidCursor = avoidCursor;

        this.shadow = {
            shadow_disabled,
            shadow_increment_px,
            shadow_increments,
            shadow_max,
            shadow_alpha,
            rotateRange: 6,
            rotate: 0
        }

        html`
            <div class="ParticlesOne" this=container>
                <canvas this=canvas></canvas>
                ${_ => this.render_debug && html`<div this=info class=canvasInfo>
                        <span pr0x=frametime>0 ms</span>
                        <span pr0x=frame_ps>0 fps</span>
                        <span><span pr0x=particles></span> particles</span> 
                        <span>canvas size: <span pr0x=canvas_size></span></span>
                    </div>`}
                ${_ => this.render_options && html`
                    <div class=ParticlesOptions>
                        <div class=Option this=toggle_shadow_overdraw>toggle shadow overdraw</div>
                        <div class=Option this=toggle_near_lines>toggle near lines</div>
                    </div>`.pass(this.setup_options.bind(this))}
            </div>
        `.bind(this)


        this.update_particles_count = () => this.render_debug && (this.proxy.particles = this.particles.length);

        this.cursor = { x: -2000, y: -2000, pointerDown: false };

        this.offScreenCanvas = document.createElement("canvas");

        this.ctx2 = this.offScreenCanvas.getContext("2d");

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.animating = false;

        this.particles = [];

        this.resizeCanvas();

        this.resizeObserver = new ResizeObserver(() => {
            this.resizeCanvas();
        });
        this.resizeObserver.observe(this.container);

        this.particlesPerX = .2;

        this.createParticles();

        this.lastSecond = {
            frames: 0,
        }

        setInterval(() => {
            this.render_debug && (this.proxy.frame_ps = `${this.lastSecond.frames} fps`);
            this.lastSecond.frames = 0;
        }, 1000);

        this.tick_length = 1 / 500;
        this.last_frame = 0;

        this.tick_lifetime = 0;
        this.delta_lifetime = 0;
        this.second_lifetime = 0;

        this.frametime_avg_frames = this.fps / 2;
        this.frametime_avg = 0;
        this.frametime_avg_index = 0;

        this.canvas_rotate_origin = [.5, .5];


    }

    __framedelta__() {
        const now = performance.now();
        if (this.last_frame === null) {
            this.last_frame = now;
            return 0;
        }
        const delta = now - this.last_frame;
        this.delta_lifetime += delta;
        this.second_lifetime = this.delta_lifetime / 1000;
        this.last_frame = now;
        const tick = delta * this.tick_length;
        this.tick_lifetime = (this.tick_lifetime % 100) + tick
        return tick;
    }

    __frame__() {
        if (!this.animating) return false;
        const start = performance.now();

        this.lastSecond.frames++;
        if (this.canvas.height < 1 || this.canvas.width < 1 || this.paused) return !(this.last_frame = null);

        this.__clear__();

        // this.rotateCanvasFromCenter((delta / 2) % 360, this.canvas_rotate_origin[0], this.canvas_rotate_origin[1])

        const frame_context = { delta: this.__framedelta__() }

        for (let i = this.particles.length - 1; i >= 0; i--) this.particles[i].frame(frame_context);

        if (!this.shadow.shadow_disabled && this.shadow.shadow_increment_px > 0)
            this.drawShadowSelf()

        this.frametime_avg += performance.now() - start;
        this.frametime_avg_index++
        if (this.frametime_avg_index >= this.frametime_avg_frames) this.updateFrametimeAvg();

        return true;
    }

    __clear__() {
        this.ctx.save();

        //reset the canvas transform
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Remove from last frame. 
        this.ctx2.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx2.drawImage(this.canvas, 0, 0);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = .2;
        this.ctx.drawImage(this.offScreenCanvas, 0, 0);

        // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.restore();
    }

    updateFrametimeAvg() {
        const frametime_avg = this.frametime_avg / this.frametime_avg_frames;
        this.render_debug && (this.proxy.frametime = `${(frametime_avg * 1000).toFixed().padStart(5, "0")} ns`);
        this.frametime_avg_index = 0;
        this.frametime_avg = 0;
    }


    drawShadowSelf() {
        // get canvas, and draw it back on the itself bigger (from the center) by overDraw, and opaque
        /** @type {CanvasRenderingContext2D} */ const ctx = this.ctx;
        /** @type {HTMLCanvasElement} */ const canvas = this.canvas;
        const { shadow_increments: incrs, shadow_increment_px: inc, shadow_max: max, shadow_alpha: alpha } = this.shadow;
        this.ctx.save();
        ctx.globalAlpha = alpha;

        const rotate = this.shadow.rotateRange * sineWave(this.tick_lifetime / 100);

        for (let i = 0; i < incrs; i++) {
            const offset = i * inc;
            ctx.save();
            this.rotateCanvasFromCenter(i * rotate, this.canvas_rotate_origin[0], this.canvas_rotate_origin[1])
            ctx.drawImage(canvas, -offset, -offset, canvas.width + (offset * 2), canvas.height + (offset * 2));
            ctx.restore();
        }

        this.ctx.restore();
    }

    // origin = 0 - 1
    rotateCanvasFromCenter(deg, originX, originY) {
        /** @type {CanvasRenderingContext2D} */ const ctx = this.ctx;
        const canvas = this.canvas;
        ctx.translate(canvas.width * originX, canvas.height * originY);
        ctx.rotate(deg * Math.PI / 180);
        ctx.translate(-canvas.width * originX, -canvas.height * originY);
    }

    mousePixelThreshold = () => window.innerWidth / 20

    resizeCanvas() {
        const { offsetWidth: container_w, offsetHeight: container_h } = this.container;
        const aspect_ratio = container_w / container_h;
        let canvas_w, canvas_h;
        if (aspect_ratio > 1) {
            canvas_w = this.maxSide;
            canvas_h = canvas_w / aspect_ratio;
        } else {
            canvas_h = this.maxSide;
            canvas_w = canvas_h * aspect_ratio;
        }
        this.canvas.width = canvas_w;
        this.canvas.height = canvas_h;
        this.offScreenCanvas.width = canvas_w;
        this.offScreenCanvas.height = canvas_h;
        this.render_debug && (this.proxy.canvas_size = `${canvas_w.toFixed()}x${canvas_h.toFixed()}`);
        zyX(this).delay("resize", 50, () => this.adjustParticles());
    }

    adjustParticles() {
        const particle_count = Math.min(this.particlesStartCount, this.canvas.width / this.particlesPerX);
        if (particle_count < this.particles.length) {
            this.particles.splice(particle_count, this.particles.length - particle_count);
        } else if (particle_count > this.particles.length) {
            for (let i = this.particles.length; i < particle_count; i++) {
                this.particles.push(this.randomParticle());
            }
        }
    }

    newParticle() {
        return new Particle(this, this.particlePreset);
    }

    randomParticle(args) {
        return this.newParticle(this.particlePreset.randomize(args))
    }

    addRandomParticle() {
        this.addParticle(this.randomParticle());
    }

    createParticleAtPoint(x, y) {
        this.addParticle(this.randomParticle({ x, y }))
    }

    addParticle(particle_data) {
        this.particles.push(particle_data);
        if (this.particles.length > this.maxParticles) {
            this.particles.shift();
        }
        this.update_particles_count();
    }

    createParticles() {
        for (let i = 0; i < this.particlesStartCount; i++) {
            this.addRandomParticle();
        }
    }

    removeParticle(particle) {
        const index = this.particles.indexOf(particle);
        if (index === -1) return;
        this.particles.splice(index, 1);
        this.update_particles_count();
    }

    resetParticles() {
        this.particles.splice(0, this.particles.length);
        this.update_particles_count();
    }

    setupMouse(container) {
        let pixels_travelled = 0;
        container.addEventListener("pointermove", (e) => {
            // this.canvas_rotate_origin[0] = e.clientX / this.container.offsetWidth;
            // this.canvas_rotate_origin[1] = e.clientY / this.container.offsetHeight;
            if (this.cursor.pointerDown) {
                this.cursor.x = e.clientX / this.container.offsetWidth;
                this.cursor.y = e.clientY / this.container.offsetHeight;
                pixels_travelled += Math.hypot(e.movementX, e.movementY);
                if (pixels_travelled < this.mousePixelThreshold()) return;
                this.createParticleAtPoint(this.cursor.x, this.cursor.y)
                pixels_travelled = 0;
            }
        }, { capture: false, passive: true });
        container.addEventListener("pointerout", (e) => {
            this.cursor.x = -2000;
            this.cursor.y = -2000;
        });
        container.addEventListener("pointerdown", (e) => {
            this.cursor.pointerDown = true;
            if (e.button === 2)
                this.resetParticles();
        });
        container.addEventListener("pointerup", (e) => {
            this.cursor.pointerDown = false;
        })
    }

    setup_options(options_mod) {
        const {
            toggle_shadow_overdraw,
            toggle_near_lines
        } = options_mod.proxy;

        toggle_shadow_overdraw.addEventListener("click", () => {
            this.shadow.shadow_disabled = !this.shadow.shadow_disabled;
            console.log({ msg: `Shadow overdraw ${this.shadow.shadow_disabled ? "disabled" : "enabled"}`, name: "shadow_overdraw" })
        })

        toggle_near_lines.addEventListener("click", () => {
            this.nearLinesDisabled = !this.nearLinesDisabled;
            console.log({ msg: `Near lines ${this.nearLinesDisabled ? "disabled" : "enabled"}`, name: "near_lines" })
        })
    }

}

/**
 * @typedef {Object} ParticlePreset
    * @property {Number} do - dot opacity
    * @property {Number} r - dot radius
    * @property {Number} max_r - max dot radius
    * @property {Number} min_r - min dot radius
    * @property {Number} min_v - minimum velocity
    * @property {Number} var_v - variation of velocity
    * @property {Number} v - velocity
    * @property {Object} spaceWarpOrigin - origin of the space warp
    * @property {Number} spaceWarpSpeed - speed of the space warp
*/


const DEFAULT_PARTICLE = {
    max_r: .005,
    min_r: .001,
    min_v: .5,
    var_v: .5,
    spaceWarpOrigin: [.5, .5],
    randomize(args) {
        const far = Math.max(0.2, Math.random());
        this.x = Math.random();
        this.y = Math.random();
        this.r = this.min_r + ((this.max_r - this.min_r) * far);
        this.v = this.min_v + this.var_v * far;
        args && Object.assign(this, args);
        return this
    }
}

class Particle {

    constructor(
        /** @type {P4rtic13} */ particles,
        /** @type {ParticlePreset} */ particle_preset) {
        this.particles = particles;
        this.particlePreset = particle_preset;
        // this.getColor = () => "white"
        this.getColor = () => this.gradientA();

        this.c = false; // dot color (false = random)
        this.o = 0; // master opacity
        this.r = 0; // dot radius
        this.v = 0; // velocity
        this.a = 0; // acceleration
        this.pos = new Float32Array([0, 0]); // position
        if (particle_preset) {
            Object.assign(this, particle_preset);
            this.pos[0] = this.x;
            this.pos[1] = this.y;
        }
    }

    frame(frm_ctx) {
        this.o = Math.min(1, (this.o + frm_ctx.delta / 100));

        this.a += frm_ctx.delta / 200;

        this.v += this.a * frm_ctx.delta;

        const [distance, angle] = this.spacewarpOriginContext()

        this.SPACEWARP(frm_ctx.delta, distance, angle);

        // this.particles.ctx.save();
        // set canvas filter blur based on velocity
        // this.particles.ctx.filter = `blur(${Math.min(1, Math.pow(distance, 4)) * 20}px)`;

        this.drawLinesToNearby();
        this.drawCircle();

        // this.particles.ctx.restore();
    }

    SPACEWARP(delta, distance, angle) {
        // move the particle away from the canvas center by the velocity,
        const new_distance = distance + (this.v * delta) / 100;
        this.pos[0] = this.spaceWarpOrigin[0] + (new_distance * Math.cos(angle));;
        this.pos[1] = this.spaceWarpOrigin[1] + (new_distance * Math.sin(angle));;
        const outside = this.overboundsByPercentage();
        if (outside[0] > .1 || outside[1] > .1) this.fuzzyRecenter(.01);
    }

    spacewarpOriginContext() {
        const [c_x, c_y] = this.spaceWarpOrigin;
        return [Math.hypot(this.pos[0] - c_x, this.pos[1] - c_y), Math.atan2(this.pos[1] - c_y, this.pos[0] - c_x)]
    }

    fuzzyRecenter(offset) {
        offset = offset || .1;
        Object.assign(this, this.particlePreset);
        this.pos[0] = .5 + (Math.random() * offset * 2) - offset;
        this.pos[1] = .5 + (Math.random() * offset * 2) - offset;
        this.o = 0;
        this.a = 0;
    }

    gradientA() {
        const p_hypo = Math.hypot(this.pos[0], this.pos[1])
        const del = this.particles.second_lifetime * 10
        const hue_rot = ((180 + p_hypo * 160) + del) % 360
        return `hsl(${hue_rot} 100% 50%)`;
    }

    xyCanvas() {
        return [this.xCanvas(this.pos[0]), this.yCanvas(this.pos[1])]
    }

    xCanvas(x) {
        return x * this.particles.canvas.width;
    }

    yCanvas(y) {
        return y * this.particles.canvas.height;
    }

    drawLinesToNearby() {
        const x = this.pos[0];
        const y = this.pos[1];
        if (this.particles.nearLines <= 0 || this.particles.nearLinesDisabled) return;
        this.c = this.getColor();
        const max_dist = this.particles.nearLines;
        const ctx = this.particles.ctx;
        ctx.save();
        for (const sib of this.particles.particles) {
            if (this === sib) continue;
            const [sx, sy] = sib.pos;
            const sib_dist = Math.hypot(x - sx, y - sy);
            if (sib_dist > max_dist) continue;
            const nearness = (max_dist - sib_dist) / max_dist;
            ctx.globalAlpha = (nearness * this.o)
            ctx.beginPath();
            ctx.moveTo(this.xCanvas(x), this.yCanvas(y));
            ctx.lineTo(this.xCanvas(sx), this.yCanvas(sy));
            ctx.strokeStyle = this.c;
            ctx.lineWidth = this.lw;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawCircle() {
        const ctx = this.particles.ctx;
        ctx.save();
        ctx.beginPath();
        ctx.c = this.getColor();
        ctx.fillStyle = this.c;
        ctx.globalAlpha = this.o;
        const [x, y] = this.xyCanvas();
        ctx.arc(x, y, this.particles.canvas.height * this.r, 0, 5 * Math.PI);
        ctx.fill();
        ctx.restore();
    }

    overboundsByPercentage() {
        const x = this.pos[0];
        const y = this.pos[1];
        const x_oob = Math.abs(x < 0 ? x : x > 1 ? x - 1 : 0);
        const y_oob = Math.abs(y < 0 ? y : y > 1 ? y - 1 : 0);
        return [x_oob, y_oob]
    }

}


css`
.ParticlesOne {
	position: absolute;
	inset: 0;
	pointer-events: none;
	transition: opacity 0.5s;
	opacity: 1;
	/* contain: strict; */
}

.ParticlesOne.paused {
	opacity: 0;
}

.ParticlesOne canvas {
	position: absolute;
	width: 100%;
	height: 100%;
	image-rendering: pixelated;
}

.canvasInfo {
	position: absolute;
	bottom: 0;
	display: grid;
	grid-auto-flow: column;
	grid-auto-columns: max-content;
	align-items: end;
	width: 100%;
	background-image: linear-gradient(0deg, #000000bb, transparent);
	background-size: 100% 100%;
	height: 2em;
	z-index: 10000;
	justify-content: space-around;
}

.canvasInfo > span {
	font-size: 0.4em;
}

.canvasInfo span {
	color: #fff;
	font-family: "Archivo Narrow";
}

.ParticlesOne .ParticlesOptions {
	font-family: "Archivo Narrow";
	font-size: 0.5em;
	position: absolute;
	bottom: 2em;
	left: 0.5em;
	padding: 0.2em;
	background-color: #000000;
	color: #fff;
	pointer-events: all;
	z-index: 100000;
}

/* put white corner psuedo element */
.ParticlesOne .ParticlesOptions::before {
	content: "";
	position: absolute;
	top: 0;
	left: 0;
	width: 0.5em;
	height: 0.5em;
	background-color: #fff;
	--corner-mask: linear-gradient(-45deg, transparent 50%, #000000 50%);
	-webkit-mask-image: var(--corner-mask);
	mask-image: var(--corner-mask);
}

`;