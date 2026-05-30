/* ══════════════════════════════════════════════
   PULSE CHAT — bg3d.js
   Matrix rain · Magnetic field lines
   Ripple rings · Floating shapes · Particles
══════════════════════════════════════════════ */

(function () {
    'use strict';

    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* ── Resize ── */
    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        /* fill black on resize so no white flash */
        ctx.fillStyle = '#06060f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        initRain();
    }
    resize();
    window.addEventListener('resize', resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    function rand(min, max) { return min + Math.random() * (max - min); }
    function hexToRgba(hex, a) {
        const r = parseInt(hex.slice(1,3),16);
        const g = parseInt(hex.slice(3,5),16);
        const b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
    }

    const PALETTE = ['#5c4ef0','#8b6ff7','#b48eff','#4f46e5','#7c3aed','#00d4aa','#fd79a8'];

    /* ═══════════════════════════════
       MATRIX RAIN
    ═══════════════════════════════ */
    const FONT_SIZE = 14;
    const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01ﾊﾐﾋｰｳｼﾅﾓｻﾆｦｱｸﾘﾗﾈｳPULSECHAT*+=-<>|░▒▓';
    let drops = [];

    function initRain() {
        const cols = Math.floor(W() / FONT_SIZE);
        drops = [];
        for (let i = 0; i < cols; i++) {
            drops.push({
                y:        rand(-H(), 0) / FONT_SIZE,
                speed:    rand(0.20, 0.60),
                len:      Math.floor(rand(10, 30)),
                bright:   rand(0.55, 1.0),
                color:    Math.random() > 0.90 ? '#00d4aa'
                        : Math.random() > 0.82 ? '#fd79a8'
                        : '#8b6ff7',
                active:   Math.random() > 0.30,
                dormantT: rand(60, 280),
                dormantC: 0,
            });
        }
    }

    function drawRain() {
        /* semi-transparent fill = trail fade effect */
        ctx.globalAlpha = 1;
        ctx.fillStyle   = 'rgba(6, 6, 15, 0.20)';
        ctx.fillRect(0, 0, W(), H());

        ctx.font = FONT_SIZE + 'px monospace';

        const cols = drops.length;
        for (let i = 0; i < cols; i++) {
            const d = drops[i];

            if (!d.active) {
                d.dormantC++;
                if (d.dormantC >= d.dormantT) {
                    d.active   = true;
                    d.dormantC = 0;
                    d.y        = -d.len - rand(0, 20);
                }
                continue;
            }

            const headY = Math.floor(d.y);

            for (let t = 0; t < d.len; t++) {
                const cy = headY - t;
                if (cy < 0) continue;

                const fade = 1 - t / d.len;
                const ch   = CHARS[Math.floor(Math.random() * CHARS.length)];
                const x    = i * FONT_SIZE;
                const y    = cy * FONT_SIZE;

                if (t === 0) {
                    ctx.globalAlpha = d.bright;
                    ctx.fillStyle   = '#ffffff';
                    ctx.shadowBlur  = 12;
                    ctx.shadowColor = d.color;
                } else {
                    ctx.globalAlpha = fade * 0.90 * d.bright;
                    ctx.fillStyle   = d.color;
                    ctx.shadowBlur  = t < 4 ? 7 : 0;
                    ctx.shadowColor = d.color;
                }
                ctx.fillText(ch, x, y);
            }

            ctx.shadowBlur  = 0;
            ctx.globalAlpha = 1;
            d.y += d.speed;

            if (d.y * FONT_SIZE > H() + d.len * FONT_SIZE) {
                d.y        = -d.len - rand(0, 30);
                d.speed    = rand(0.20, 0.60);
                d.len      = Math.floor(rand(10, 30));
                d.bright   = rand(0.55, 1.0);
                d.color    = Math.random() > 0.90 ? '#00d4aa'
                           : Math.random() > 0.82 ? '#fd79a8'
                           : '#8b6ff7';
                d.active   = Math.random() > 0.20;
                d.dormantT = rand(60, 280);
                d.dormantC = 0;
            }
        }
    }

    /* ═══════════════════════════════
       MAGNETIC FIELD LINES
    ═══════════════════════════════ */
    class Pole {
        constructor() {
            this.x      = rand(0.1, 0.9);
            this.y      = rand(0.1, 0.9);
            this.vx     = rand(-0.0003, 0.0003);
            this.vy     = rand(-0.0002, 0.0002);
            this.charge = Math.random() > 0.5 ? 1 : -1;
        }
        update() {
            this.x += this.vx; this.y += this.vy;
            if (this.x < 0.05 || this.x > 0.95) this.vx *= -1;
            if (this.y < 0.05 || this.y > 0.95) this.vy *= -1;
        }
    }

    class FieldLine {
        constructor(p1, p2, t) {
            this.p1    = p1; this.p2 = p2; this.t = t;
            this.phase = rand(0, Math.PI * 2);
            this.speed = rand(0.003, 0.009);
            this.color = PALETTE[Math.floor(Math.random() * 5)];
        }
        draw() {
            const w = W(), h = H();
            const x1 = this.p1.x * w, y1 = this.p1.y * h;
            const x2 = this.p2.x * w, y2 = this.p2.y * h;
            const dx = x2-x1, dy = y2-y1;
            const len = Math.sqrt(dx*dx + dy*dy);
            if (len < 20) return;

            this.phase += this.speed;
            const bulge = Math.sin(this.phase) * len * (0.28 + this.t * 0.45);
            const px = -dy/len, py = dx/len;
            const cx = (x1+x2)/2 + px*bulge;
            const cy = (y1+y2)/2 + py*bulge;

            const dist01 = len / Math.min(w, h);
            const alpha  = Math.max(0, 0.60 - dist01 * 0.55);
            if (alpha <= 0) return;

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 1.0;
            ctx.shadowBlur  = 10;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.stroke();

            /* travelling dot */
            const prog = (Date.now() * 0.00045 * (1 + this.t) + this.t) % 1;
            const tx = (1-prog)*(1-prog)*x1 + 2*(1-prog)*prog*cx + prog*prog*x2;
            const ty = (1-prog)*(1-prog)*y1 + 2*(1-prog)*prog*cy + prog*prog*y2;
            ctx.globalAlpha = alpha;
            ctx.fillStyle   = '#fff';
            ctx.shadowBlur  = 12;
            ctx.shadowColor = this.color;
            ctx.beginPath();
            ctx.arc(tx, ty, 2.0, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    const poles = [];
    /* guarantee at least one opposite-charge pair */
    for (let i = 0; i < 6; i++) {
        const p = new Pole();
        p.charge = i % 2 === 0 ? 1 : -1;
        poles.push(p);
    }

    const fieldLines = [];
    for (let i = 0; i < poles.length; i++) {
        for (let j = i+1; j < poles.length; j++) {
            if (poles[i].charge !== poles[j].charge) {
                const count = Math.floor(rand(2, 5));
                for (let k = 0; k < count; k++) {
                    fieldLines.push(new FieldLine(poles[i], poles[j], k/count));
                }
            }
        }
    }

    /* ═══════════════════════════════
       RIPPLE RINGS — click / tap
    ═══════════════════════════════ */
    const ripples = [];

    class Ripple {
        constructor(x, y) {
            this.x = x; this.y = y;
            this.r    = 0;
            this.maxR = rand(100, 240);
            this.speed = rand(2.8, 5.0);
            this.alpha = 0.80;
            this.color = PALETTE[Math.floor(Math.random() * 5)];
            this.rings = Math.floor(rand(2, 4));
            this.dead  = false;
        }
        update() {
            this.r    += this.speed;
            this.alpha = 0.80 * (1 - this.r / this.maxR);
            if (this.r >= this.maxR) this.dead = true;
        }
        draw() {
            for (let k = 0; k < this.rings; k++) {
                const rr = this.r - k * 20;
                if (rr <= 0) continue;
                const a = this.alpha * (1 - k * 0.30);
                ctx.globalAlpha = a;
                ctx.strokeStyle = this.color;
                ctx.lineWidth   = 1.6 - k * 0.4;
                ctx.shadowBlur  = 16;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, rr, 0, Math.PI*2);
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
            if (this.r < 35) {
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 35);
                g.addColorStop(0, hexToRgba(this.color, 0.30));
                g.addColorStop(1, hexToRgba(this.color, 0));
                ctx.globalAlpha = (1 - this.r/35) * 0.45;
                ctx.fillStyle   = g;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 35, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    function spawnRipple(x, y) {
        if (ripples.length < 14) ripples.push(new Ripple(x, y));
    }

    /* listen on document so clicks through the UI card also work */
    document.addEventListener('click',      e => spawnRipple(e.clientX, e.clientY));
    document.addEventListener('touchstart', e => {
        if (e.touches.length > 0) spawnRipple(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    /* ═══════════════════════════════
       FLOATING SHAPES
    ═══════════════════════════════ */
    class FloatingShape {
        constructor() { this.reset(true); }
        reset(init) {
            this.x        = rand(0, W());
            this.y        = init ? rand(0, H()) : H() + rand(20, 80);
            this.z        = rand(0.10, 0.38);
            this.size     = rand(14, 58) * this.z;
            this.speedY   = rand(0.05, 0.25) * this.z;
            this.speedX   = rand(-0.06, 0.06);
            this.rot      = rand(0, Math.PI*2);
            this.rotSpeed = rand(-0.003, 0.003);
            this.type     = Math.floor(Math.random() * 3);
            this.color    = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha    = rand(0.035, 0.10) * this.z;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY; this.rot += this.rotSpeed;
            if (this.y < -(this.size*2)) this.reset(false);
            if (this.speedY < 0 && this.y > H() + this.size*2) this.reset(false);
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            ctx.globalAlpha = this.alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth   = 0.7;
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
                ctx.moveTo(0,-s); ctx.lineTo(s*0.866,s*0.5); ctx.lineTo(-s*0.866,s*0.5);
                ctx.closePath();
            }
            ctx.stroke();
            ctx.restore();
        }
    }

    /* ═══════════════════════════════
       PARTICLES
    ═══════════════════════════════ */
    class Particle {
        constructor() { this.reset(true); }
        reset(init) {
            this.x = rand(0, W());
            this.y = init ? rand(0, H()) : H() + rand(5,20);
            this.z = rand(0.2, 1.0);
            this.r = rand(0.5, 2.0) * this.z;
            this.speedY = rand(-0.18, -0.65) * this.z;
            this.speedX = rand(-0.09, 0.09);
            this.color  = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            this.alpha  = rand(0.18, 0.60) * this.z;
            this.tw     = rand(0, Math.PI*2);
            this.twSpd  = rand(0.01, 0.04);
        }
        update() {
            this.x += this.speedX; this.y += this.speedY; this.tw += this.twSpd;
            if (this.y < -6) this.reset(false);
        }
        draw() {
            ctx.globalAlpha = this.alpha * (0.55 + 0.45*Math.sin(this.tw));
            ctx.fillStyle   = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
            ctx.fill();
        }
    }

    /* ── Instantiate ── */
    const shapes    = Array.from({length: 12}, () => new FloatingShape());
    const particles = Array.from({length: 75}, () => new Particle());

    /* ═══════════════════════════════
       RENDER LOOP
    ═══════════════════════════════ */
    function frame() {
        /* rain draws its own bg fade — must be first */
        drawRain();

        /* field lines */
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
