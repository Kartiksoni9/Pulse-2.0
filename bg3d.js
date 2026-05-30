/* ══════════════════════════════════════════════
   PULSE CHAT — bg3d.js
   Layers: matrix rain · magnetic field lines
           ripple rings · grid lines
           floating shapes · particles
══════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        initRain();
    }
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    function rand(min, max) { return min + Math.random() * (max - min); }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    const PALETTE = ['#5c4ef0','#8b6ff7','#b48eff','#4f46e5','#7c3aed','#00d4aa','#fd79a8'];

    /* ════════════════════════════════
       MATRIX RAIN
       Purple cyberpunk falling streaks
    ════════════════════════════════ */
    const FONT_SIZE  = 14;
    const CHARS      = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01アイウエオカキ10ﾊﾐﾋｰｳｼﾅﾓｻﾆｦｱｸﾘﾗﾈｳSURGEPULSE*+=-<>|░▒▓';
    let   columns    = [];
    let   drops      = [];

    function initRain() {
        const cols = Math.floor(W() / FONT_SIZE);
        columns    = cols;
        drops      = [];
        for (let i = 0; i < cols; i++) {
            drops.push({
                y:       rand(-H(), 0) / FONT_SIZE,   // stagger starts
                speed:   rand(0.18, 0.55),
                len:     Math.floor(rand(8, 28)),       // trail length
                bright:  rand(0.5, 1.0),               // head brightness
                color:   Math.random() > 0.92
                             ? '#00d4aa'               // rare teal accent
                             : (Math.random() > 0.85 ? '#fd79a8' : '#8b6ff7'), // rare pink
                active:  Math.random() > 0.35,         // some columns dormant
                dormantT: rand(60, 300),                // frames to wait if dormant
                dormantC: 0,
            });
        }
    }

    function drawRain() {
        /* fade trail — semi-transparent black rectangle each frame */
        ctx.fillStyle = 'rgba(6,6,15,0.18)';
        ctx.fillRect(0, 0, W(), H());

        ctx.font = `${FONT_SIZE}px monospace`;

        for (let i = 0; i < columns; i++) {
            const d = drops[i];
            if (!d) continue;

            /* dormant columns pause then restart */
            if (!d.active) {
                d.dormantC++;
                if (d.dormantC >= d.dormantT) {
                    d.active   = true;
                    d.dormantC = 0;
                    d.y        = -d.len;
                }
                continue;
            }

            const headY = Math.floor(d.y);

            /* draw trail characters */
            for (let t = 0; t < d.len; t++) {
                const cy    = headY - t;
                if (cy < 0) continue;

                const fade  = 1 - t / d.len;          // 1 at head → 0 at tail
                const ch    = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x     = i * FONT_SIZE;
                const y     = cy * FONT_SIZE;

                if (t === 0) {
                    /* head — bright white/light purple */
                    ctx.globalAlpha = d.bright;
                    ctx.fillStyle   = '#ffffff';
                    ctx.shadowBlur  = 10;
                    ctx.shadowColor = d.color;
                } else {
                    /* body — column color fading */
                    ctx.globalAlpha = fade * 0.85 * d.bright;
                    ctx.fillStyle   = d.color;
                    ctx.shadowBlur  = t < 3 ? 6 : 0;
                    ctx.shadowColor = d.color;
                }

                ctx.fillText(ch, x, y);
            }

            ctx.shadowBlur  = 0;
            ctx.globalAlpha = 1;

            d.y += d.speed;

            /* reset when trail fully off screen */
            if (d.y * FONT_SIZE > H() + d.len * FONT_SIZE) {
                d.y        = -d.len;
                d.speed    = rand(0.18, 0.55);
                d.len      = Math.floor(rand(8, 28));
                d.bright   = rand(0.5, 1.0);
                d.active   = Math.random() > 0.2;
                d.dormantT = rand(60, 300);
                d.dormantC = 0;
            }
        }
    }


    /* ════════════════════════════════
       MAGNETIC FIELD LINES
       Curved arcs between drifting poles
    ════════════════════════════════ */
    class Pole {
        constructor() { this.reset(); }
        reset() {
            this.x  = rand(0.1, 0.9);
            this.y  = rand(0.1, 0.9);
            this.vx = rand(-0.0003, 0.0003);
            this.vy = rand(-0.0002, 0.0002);
            this.charge = Math.random() > 0.5 ? 1 : -1;
        }
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x < 0.05 || this.x > 0.95) this.vx *= -1;
            if (this.y < 0.05 || this.y > 0.95) this.vy *= -1;
        }
    }

    class FieldLine {
        constructor(pole1, pole2, t) {
            this.p1    = pole1;
            this.p2    = pole2;
            this.t     = t;          // 0-1 offset along the pole pair
            this.phase = rand(0, Math.PI * 2);
            this.speed = rand(0.003, 0.008);
            this.color = PALETTE[Math.floor(Math.random() * 5)];
        }

        draw() {
            const w  = W(), h = H();
            const x1 = this.p1.x * w;
            const y1 = this.p1.y * h;
            const x2 = this.p2.x * w;
            const y2 = this.p2.y * h;

            /* perpendicular offset for the curve bulge */
            const dx  = x2 - x1;
            const dy  = y2 - y1;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len < 20) return;

            this.phase += this.speed;
            const bulge = Math.sin(this.phase) * len * (0.3 + this.t * 0.5);

            /* perpendicular unit vector */
            const px  = -dy / len;
            const py  =  dx / len;

            const cx  = (x1 + x2) / 2 + px * bulge;
            const cy  = (y1 + y2) / 2 + py * bulge;

            const dist01 = len / Math.min(w, h);
            const alpha  = Math.max(0, 0.55 - dist01 * 0.6);
            if (alpha <= 0) return;

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 0.9;
            ctx.shadowBlur  = 8;
            ctx.shadowColor = this.color;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.stroke();

            /* animated dot travelling the field line */
            const progress = (Date.now() * 0.0004 * (1 + this.t) + this.t) % 1;
            const tx = (1-progress)*(1-progress)*x1 + 2*(1-progress)*progress*cx + progress*progress*x2;
            const ty = (1-progress)*(1-progress)*y1 + 2*(1-progress)*progress*cy + progress*progress*y2;

            ctx.globalAlpha = alpha * 0.9;
            ctx.fillStyle   = '#ffffff';
            ctx.shadowBlur  = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(tx, ty, 1.8, 0, Math.PI*2);
            ctx.fill();

            ctx.shadowBlur  = 0;
        }
    }

    /* create poles + field lines between them */
    const poles = Array.from({length: 5}, () => new Pole());

    const fieldLines = [];
    for (let i = 0; i < poles.length; i++) {
        for (let j = i+1; j < poles.length; j++) {
            if (poles[i].charge !== poles[j].charge) {   // only opposite charges connect
                const count = Math.floor(rand(2, 5));
                for (let k = 0; k < count; k++) {
                    fieldLines.push(new FieldLine(poles[i], poles[j], k / count));
                }
            }
        }
    }

    /* if no opposite-charge pairs happened, force a few */
    if (fieldLines.length === 0) {
        poles[0].charge =  1;
        poles[1].charge = -1;
        for (let k = 0; k < 3; k++) {
            fieldLines.push(new FieldLine(poles[0], poles[1], k / 3));
        }
    }


    /* ════════════════════
       RIPPLE RINGS
       Click / tap anywhere
    ════════════════════ */
    const ripples = [];

    class Ripple {
        constructor(x, y) {
            this.x     = x;
            this.y     = y;
            this.r     = 0;
            this.maxR  = rand(120, 260);
            this.speed = rand(2.5, 4.5);
            this.alpha = 0.75;
            this.color = PALETTE[Math.floor(Math.random() * 5)];
            this.rings = Math.floor(rand(2, 4));
            this.dead  = false;
        }

        update() {
            this.r    += this.speed;
            this.alpha = 0.75 * (1 - this.r / this.maxR);
            if (this.r >= this.maxR) this.dead = true;
        }

        draw() {
            for (let k = 0; k < this.rings; k++) {
                const rr = this.r - k * 18;
                if (rr <= 0) continue;
                const a = this.alpha * (1 - k * 0.28);
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth   = 1.5 - k * 0.4;
                ctx.shadowBlur  = 14;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, rr, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;

            if (this.r < 30) {
                const fl = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 30);
                fl.addColorStop(0, hexToRgba(this.color, 0.35));
                fl.addColorStop(1, hexToRgba(this.color, 0));
                ctx.globalAlpha = (1 - this.r / 30) * 0.5;
                ctx.fillStyle   = fl;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 30, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function spawnRipple(x, y) {
        if (ripples.length < 12) ripples.push(new Ripple(x, y));
    }

    window.addEventListener('click',      e => spawnRipple(e.clientX, e.clientY));
    window.addEventListener('touchstart', e => {
        if (e.touches.length > 0) spawnRipple(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });


    /* ════════════════════
       FLOATING SHAPES
    ════════════════════ */
    class FloatingShape {
        constructor() { this.reset(true); }
        reset(init) {
            this.x        = rand(0, W());
            this.y        = init ? rand(0, H()) : H() + rand(20, 80);
            this.z        = rand(0.12, 0.40);
            this.size     = rand(16, 60) * this.z;
            this.speedY   = rand(0.06, 0.28) * this.z;
            this.speedX   = rand(-0.07, 0.07);
            this.rot      = rand(0, Math.PI * 2);
            this.rotSpeed = rand(-0.003, 0.003);
            this.type     = Math.floor(Math.random() * 3);
            this.color    = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha    = rand(0.04, 0.12) * this.z;
        }
        update() {
            this.x   += this.speedX;
            this.y   += this.speedY;
            this.rot += this.rotSpeed;
            if (this.y < -(this.size*2)) this.reset(false);
            if (this.speedY < 0 && this.y > H() + this.size*2) this.reset(false);
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 0.8;
            const s = this.size;
            ctx.beginPath();
            if (this.type === 0) {
                for (let i = 0; i < 6; i++) {
                    const a = (i/6)*Math.PI*2 - Math.PI/6;
                    i===0 ? ctx.moveTo(Math.cos(a)*s, Math.sin(a)*s)
                          : ctx.lineTo(Math.cos(a)*s, Math.sin(a)*s);
                }
                ctx.closePath();
            } else if (this.type === 1) {
                ctx.rect(-s/2, -s/2, s, s);
            } else {
                ctx.moveTo(0,-s);
                ctx.lineTo(s*0.866, s*0.5);
                ctx.lineTo(-s*0.866, s*0.5);
                ctx.closePath();
            }
            ctx.stroke();
            ctx.restore();
        }
    }


    /* ════════════════════
       PARTICLE FIELD
    ════════════════════ */
    class Particle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x            = rand(0, W());
            this.y            = init ? rand(0, H()) : H() + rand(5, 20);
            this.z            = rand(0.2, 1.0);
            this.r            = rand(0.6, 2.2) * this.z;
            this.speedY       = rand(-0.2, -0.7) * this.z;
            this.speedX       = rand(-0.1, 0.1);
            this.color        = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha        = rand(0.2, 0.65) * this.z;
            this.twinkle      = rand(0, Math.PI*2);
            this.twinkleSpeed = rand(0.01, 0.04);
        }
        update() {
            this.x       += this.speedX;
            this.y       += this.speedY;
            this.twinkle += this.twinkleSpeed;
            if (this.y < -6) this.reset(false);
        }
        draw() {
            const a = this.alpha * (0.55 + 0.45 * Math.sin(this.twinkle));
            ctx.globalAlpha = a;
            ctx.fillStyle   = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
            ctx.fill();
        }
    }


    /* ── Instantiate ── */
    const shapes    = Array.from({length: 12},  () => new FloatingShape());
    const particles = Array.from({length: 80},  () => new Particle());


    /* ════════════════════
       RENDER LOOP
       Matrix rain handles its own
       bg fade — other layers draw on top
    ════════════════════ */
    function frame() {
        /* matrix rain + its own fade pass */
        drawRain();

        /* field lines on top of rain */
        poles.forEach(p => p.update());
        fieldLines.forEach(fl => fl.draw());

        /* shapes */
        shapes.forEach(s => { s.update(); s.draw(); });

        /* ripples */
        for (let i = ripples.length-1; i >= 0; i--) {
            ripples[i].update();
            ripples[i].draw();
            if (ripples[i].dead) ripples.splice(i, 1);
        }

        /* particles */
        particles.forEach(p => { p.update(); p.draw(); });

        ctx.globalAlpha = 1;
        requestAnimationFrame(frame);
    }

    frame();
})();
