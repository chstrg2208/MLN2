/**
 * ARENA GRAPHICS ENGINE — đồ họa 2D nâng cao cho Canvas
 * - Nền theo chủ đề từng tầng (render 1 lần, cache offscreen)
 * - Glow bằng sprite + chế độ trộn 'lighter' (nhẹ cho điện thoại)
 * - Vệt đạn, vệt lướt, hạt, sóng xung kích, boss nhiều lớp, laser/hố đen/xe buýt…
 * - Canvas sắc nét theo devicePixelRatio, giữ đúng tỉ lệ (letterbox) — không méo hình
 */
(function () {
  const TAU = Math.PI * 2;

  // Chủ đề thị giác theo từng tầng
  const THEMES = [
    { name: 'office',  top: '#0B1B3D', bottom: '#050912', accent: '#38BDF8', accent2: '#FFE600' },
    { name: 'gears',   top: '#2A1A06', bottom: '#0A0705', accent: '#F59E0B', accent2: '#FDE68A' },
    { name: 'circuit', top: '#1A0F3A', bottom: '#07040F', accent: '#A855F7', accent2: '#67E8F9' },
    { name: 'inferno', top: '#2B0A0E', bottom: '#0B0305', accent: '#EF4444', accent2: '#FB923C' },
    { name: 'pantheon',top: '#1B1740', bottom: '#06050F', accent: '#FFE600', accent2: '#F8FAFC' }
  ];

  const glowCache = {};
  const bgCache = {};
  const stars = [];
  for (let i = 0; i < 46; i++) {
    stars.push({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9, tw: Math.random() * TAU });
  }
  let trail = [];
  let lastHeroHp = 100;
  let hurtFlash = 0;
  let t0 = performance.now();

  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function glowSprite(color) {
    if (glowCache[color]) return glowCache[color];
    const s = 128;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    const [r, gg, b] = hexToRgb(color);
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, `rgba(${r},${gg},${b},0.95)`);
    grad.addColorStop(0.25, `rgba(${r},${gg},${b},0.45)`);
    grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    glowCache[color] = c;
    return c;
  }

  function glow(ctx, x, y, radius, color, alpha = 1) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha;
    ctx.drawImage(glowSprite(color), x - radius, y - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  // ------------------------------------------------------------------ background
  function buildBackground(idx, W, H) {
    const th = THEMES[idx % THEMES.length];
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, th.top);
    bg.addColorStop(1, th.bottom);
    g.fillStyle = bg;
    g.fillRect(0, 0, W, H);

    // Sàn lát gạch phối cảnh nhẹ
    const [ar, ag, ab] = hexToRgb(th.accent);
    g.strokeStyle = `rgba(${ar},${ag},${ab},0.10)`;
    g.lineWidth = 1;
    for (let y = 60; y < H; y += 50) {
      g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
    }
    for (let x = 0; x <= W; x += 50) {
      g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
    }

    // Vầng sáng trung tâm
    const rg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, 280);
    rg.addColorStop(0, `rgba(${ar},${ag},${ab},0.16)`);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, W, H);

    // Huy hiệu sàn trung tâm
    g.save();
    g.translate(W / 2, H / 2);
    g.strokeStyle = `rgba(${ar},${ag},${ab},0.22)`;
    g.lineWidth = 1.5;
    [60, 100, 140].forEach(r => { g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      g.beginPath();
      g.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
      g.lineTo(Math.cos(a) * 140, Math.sin(a) * 140);
      g.stroke();
    }
    g.restore();

    // Họa tiết đặc trưng từng tầng
    g.save();
    g.globalAlpha = 0.9;
    if (th.name === 'office') {
      // Đường chân trời tòa nhà văn phòng
      for (let i = 0; i < 16; i++) {
        const bw = 26 + (i * 17) % 22;
        const bh = 40 + ((i * 53) % 90);
        const bx = i * 40 - 6;
        g.fillStyle = 'rgba(56,189,248,0.07)';
        g.fillRect(bx, H - bh, bw, bh);
        g.fillStyle = 'rgba(255,230,0,0.18)';
        for (let wy = H - bh + 8; wy < H - 8; wy += 14) {
          for (let wx = bx + 5; wx < bx + bw - 5; wx += 8) {
            if (((wx * 7 + wy * 3) | 0) % 5 < 2) g.fillRect(wx, wy, 3, 5);
          }
        }
      }
    } else if (th.name === 'gears') {
      const gear = (cx, cy, r, teeth) => {
        g.beginPath();
        for (let i = 0; i < teeth * 2; i++) {
          const a = (i / (teeth * 2)) * TAU;
          const rr = i % 2 ? r * 0.82 : r;
          g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.closePath();
        g.strokeStyle = 'rgba(245,158,11,0.22)';
        g.lineWidth = 2;
        g.stroke();
        g.beginPath(); g.arc(cx, cy, r * 0.3, 0, TAU); g.stroke();
      };
      gear(70, 70, 56, 12); gear(W - 60, 90, 44, 10); gear(90, H - 60, 48, 11); gear(W - 80, H - 70, 62, 14);
    } else if (th.name === 'circuit') {
      g.strokeStyle = 'rgba(168,85,247,0.28)';
      g.lineWidth = 1.5;
      for (let i = 0; i < 9; i++) {
        const y = 30 + i * 48;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(60 + (i * 37) % 90, y);
        g.lineTo(80 + (i * 37) % 90, y + 18);
        g.lineTo(150 + (i * 23) % 60, y + 18);
        g.stroke();
        g.beginPath();
        g.moveTo(W, y + 12);
        g.lineTo(W - 70 - (i * 29) % 80, y + 12);
        g.lineTo(W - 90 - (i * 29) % 80, y - 6);
        g.lineTo(W - 150 - (i * 19) % 60, y - 6);
        g.stroke();
        g.fillStyle = 'rgba(103,232,249,0.5)';
        g.beginPath(); g.arc(150 + (i * 23) % 60, y + 18, 3, 0, TAU); g.fill();
        g.beginPath(); g.arc(W - 150 - (i * 19) % 60, y - 6, 3, 0, TAU); g.fill();
      }
    } else if (th.name === 'inferno') {
      // Đồng hồ khổng lồ mờ + sọc hiểm họa hai bên
      g.strokeStyle = 'rgba(239,68,68,0.2)';
      g.lineWidth = 3;
      g.beginPath(); g.arc(W / 2, H / 2, 200, 0, TAU); g.stroke();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        g.beginPath();
        g.moveTo(W / 2 + Math.cos(a) * 184, H / 2 + Math.sin(a) * 184);
        g.lineTo(W / 2 + Math.cos(a) * 200, H / 2 + Math.sin(a) * 200);
        g.stroke();
      }
      g.fillStyle = 'rgba(239,68,68,0.08)';
      for (let y = -H; y < H * 2; y += 36) {
        g.beginPath();
        g.moveTo(0, y); g.lineTo(18, y - 18); g.lineTo(18, y + 8); g.lineTo(0, y + 26);
        g.fill();
        g.beginPath();
        g.moveTo(W, y); g.lineTo(W - 18, y - 18); g.lineTo(W - 18, y + 8); g.lineTo(W, y + 26);
        g.fill();
      }
    } else {
      // Đền Pantheon: hai hàng cột Hy Lạp
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < 4; i++) {
          const x = side ? W - 34 - i * 4 : 18 + i * 4;
          const y = 40 + i * 100;
          g.fillStyle = 'rgba(255,230,0,0.10)';
          g.fillRect(x - 11, y, 22, 74);
          g.fillStyle = 'rgba(255,230,0,0.2)';
          g.fillRect(x - 15, y - 6, 30, 7);
          g.fillRect(x - 15, y + 73, 30, 7);
          g.strokeStyle = 'rgba(255,230,0,0.15)';
          g.lineWidth = 1;
          for (let f = -6; f <= 6; f += 6) {
            g.beginPath(); g.moveTo(x + f, y); g.lineTo(x + f, y + 74); g.stroke();
          }
        }
      }
    }
    g.restore();

    bgCache[idx] = c;
    return c;
  }

  // ------------------------------------------------------------------ helpers
  function polygon(ctx, x, y, r, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function spiky(ctx, x, y, r, spikes, rot) {
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const a = rot + (i / (spikes * 2)) * TAU;
      const rr = i % 2 ? r * 0.62 : r;
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.closePath();
  }

  function roundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // ------------------------------------------------------------------ hazards
  function drawHazards(ctx, S, time) {
    const type = S.stage && S.stage.waveConfig.specialHazard;
    const hz = S.hazardState;
    const W = S.W, H = S.H;

    if (type === 'shuttle_charge' && hz.shuttleWarningY !== null) {
      const y = hz.shuttleWarningY;
      const pulse = 0.5 + 0.5 * Math.sin(time * 18);
      ctx.save();
      ctx.fillStyle = `rgba(239,68,68,${0.14 + pulse * 0.14})`;
      ctx.fillRect(0, y - 18, W, 36);
      // Sọc hiểm họa
      ctx.beginPath();
      ctx.rect(0, y - 18, W, 36);
      ctx.clip();
      ctx.strokeStyle = 'rgba(250,204,21,0.28)';
      ctx.lineWidth = 8;
      for (let x = -60 + ((time * 80) % 28); x < W + 60; x += 28) {
        ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + 36, y - 18); ctx.stroke();
      }
      ctx.restore();
      ctx.save();
      ctx.font = '800 11px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#FEE2E2';
      ctx.textAlign = 'center';
      ctx.fillText('XE SHUTTLE LAO TỚI — LƯỚT NÉ!', W / 2, y + 4);
      ctx.restore();
    }

    if (type === 'moving_safe_zone' && S.combatPhase === 'WAVE') {
      const { safeZoneX: x, safeZoneY: y, safeZoneRadius: r } = hz;
      ctx.save();
      const grad = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
      grad.addColorStop(0, 'rgba(56,189,248,0.02)');
      grad.addColorStop(1, 'rgba(56,189,248,0.18)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(103,232,249,0.9)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -time * 40;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '700 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#A5F3FC';
      ctx.textAlign = 'center';
      ctx.fillText('VÙNG AN TOÀN  v', x, y - r + 16);
      ctx.restore();
      glow(ctx, x, y, r * 1.2, '#38BDF8', 0.18);
    }

    if (type === 'shrinking_walls' && hz.wallInset > 0) {
      const w = hz.wallInset;
      ctx.save();
      [[0, w], [W - w, W]].forEach(([x0, x1], side) => {
        const grad = ctx.createLinearGradient(side ? W : 0, 0, side ? W - w : w, 0);
        grad.addColorStop(0, 'rgba(239,68,68,0.5)');
        grad.addColorStop(1, 'rgba(239,68,68,0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(x0, 0, x1 - x0, H);
      });
      // Hàng rào năng lượng
      ctx.strokeStyle = '#FCA5A5';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w, 0); ctx.lineTo(w, H);
      ctx.moveTo(W - w, 0); ctx.lineTo(W - w, H);
      ctx.stroke();
      ctx.restore();
      for (let y = 20; y < H; y += 60) {
        glow(ctx, w, y + ((time * 60) % 60), 22, '#EF4444', 0.55);
        glow(ctx, W - w, y + (60 - ((time * 60) % 60)), 22, '#EF4444', 0.55);
      }
      ctx.save();
      ctx.font = '800 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#FEE2E2';
      ctx.textAlign = 'center';
      ctx.fillText('t ĐANG BỊ NÉN', W / 2, 18);
      ctx.restore();
    }

    if (type === 'gravity_vortex') {
      const cx = W / 2, cy = H / 2;
      ctx.save();
      ctx.translate(cx, cy);
      // Xoắn ốc hút
      for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        for (let i = 0; i < 60; i++) {
          const p = i / 60;
          const a = time * 1.6 + arm * (TAU / 4) + p * 5;
          const rr = 8 + p * 70;
          const px = Math.cos(a) * rr;
          const py = Math.sin(a) * rr;
          i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        }
        ctx.strokeStyle = `rgba(192,132,252,${0.55 - arm * 0.08})`;
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      core.addColorStop(0, '#000000');
      core.addColorStop(0.7, 'rgba(0,0,0,0.9)');
      core.addColorStop(1, 'rgba(168,85,247,0)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
      ctx.restore();
      glow(ctx, cx, cy, 90, '#A855F7', 0.35);
      ctx.save();
      ctx.font = '800 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#E9D5FF';
      ctx.textAlign = 'center';
      ctx.fillText('HỐ ĐEN OT 24/7', cx, cy + 56);
      ctx.restore();
    }

    if (type === 'laser_sweep') {
      const cx = W / 2, cy = H / 2;
      const a = hz.laserAngle;
      const lx = cx + Math.cos(a) * 300;
      const ly = cy + Math.sin(a) * 300;
      ctx.save();
      ctx.lineCap = 'round';
      [[16, 'rgba(239,68,68,0.18)'], [9, 'rgba(248,113,113,0.5)'], [3.5, '#FFFFFF']].forEach(([w, c]) => {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(lx, ly); ctx.stroke();
      });
      ctx.restore();
      // Trụ phát laser
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.fillStyle = '#1E293B';
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 2;
      polygon(ctx, 0, 0, 16, 6, 0);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      glow(ctx, cx, cy, 52, '#EF4444', 0.7);
    }
  }

  // ------------------------------------------------------------------ main render
  function render(ctx, S) {
    const canvas = ctx.canvas;
    const { W, H } = S;
    const time = (performance.now() - t0) / 1000;

    // Sắc nét theo DPR + giữ tỉ lệ (letterbox)
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cw = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const ch = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }
    const scale = Math.min(cw / W, ch / H);
    const ox = (cw - W * scale) / 2;
    const oy = (ch - H * scale) / 2;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#04060D';
    ctx.fillRect(0, 0, cw, ch);
    ctx.setTransform(scale, 0, 0, scale, ox, oy);

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    ctx.clip();

    if (S.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * S.screenShake, (Math.random() - 0.5) * S.screenShake);
    }

    const stageIdx = S.stageIndex || 0;
    const theme = THEMES[stageIdx % THEMES.length];
    ctx.drawImage(bgCache[stageIdx] || buildBackground(stageIdx, W, H), 0, 0);

    // Sao/bụi trôi (parallax)
    for (const s of stars) {
      const y = ((s.y * H + time * 14 * s.z) % H);
      const tw = 0.5 + 0.5 * Math.sin(time * 2 + s.tw);
      ctx.globalAlpha = 0.25 + 0.5 * tw * s.z;
      ctx.fillStyle = theme.accent2;
      ctx.fillRect(s.x * W, y, 1.6 * s.z, 1.6 * s.z);
    }
    ctx.globalAlpha = 1;

    drawHazards(ctx, S, time);

    // Shockwave EMP
    S.shockwaves.forEach(sw => {
      ctx.save();
      const g = ctx.createRadialGradient(sw.x, sw.y, Math.max(0, sw.r - 26), sw.x, sw.y, sw.r);
      g.addColorStop(0, 'rgba(168,85,247,0)');
      g.addColorStop(1, `rgba(192,132,252,${sw.alpha * 0.55})`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(233,213,255,${sw.alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sw.x, sw.y, sw.r, 0, TAU); ctx.stroke();
      ctx.restore();
    });

    // Ngọc năng lượng
    S.orbs.forEach(o => {
      const pulse = 1 + 0.2 * Math.sin(time * 8 + o.x);
      glow(ctx, o.x, o.y, 22 * pulse, '#38BDF8', 0.85);
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(time * 2 + o.y);
      ctx.fillStyle = '#A5F3FC';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.4;
      polygon(ctx, 0, 0, 7 * pulse, 4, 0);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    });

    // Vệt lướt (afterimage)
    S.hero.afterimages.forEach(a => {
      glow(ctx, a.x, a.y, 30, '#38BDF8', a.alpha * 0.6);
    });

    // ----- Boss
    if (S.boss.active) drawBoss(ctx, S, time);

    // ----- Quái
    S.enemies.forEach(en => {
      const rot = time * 2.4 + en.x * 0.05;
      glow(ctx, en.x, en.y, en.r * 2.6, '#EF4444', 0.55);
      ctx.save();
      spiky(ctx, en.x, en.y, en.r + 3, 7, rot);
      const g = ctx.createRadialGradient(en.x, en.y, 2, en.x, en.y, en.r + 3);
      g.addColorStop(0, '#7F1D1D');
      g.addColorStop(1, '#1F0A0E');
      ctx.fillStyle = g;
      ctx.strokeStyle = '#F87171';
      ctx.lineWidth = 1.8;
      ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(en.x, en.y, en.r * 0.62, 0, TAU);
      ctx.fillStyle = '#FCA5A5';
      ctx.globalAlpha = 0.18;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '800 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#FEE2E2';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(en.label || 'm', en.x, en.y + 1);
      ctx.restore();
    });

    // ----- Hero (vệt + thân)
    drawHero(ctx, S, time);

    // ----- Đạn người chơi (vệt sáng)
    S.playerBullets.forEach(b => {
      const len = Math.hypot(b.vx, b.vy);
      const nx = b.vx / len, ny = b.vy / len;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const grad = ctx.createLinearGradient(b.x, b.y, b.x - nx * 22, b.y - ny * 22);
      grad.addColorStop(0, b.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      ctx.lineWidth = b.r * 1.7;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - nx * 22, b.y - ny * 22); ctx.stroke();
      ctx.restore();
      glow(ctx, b.x, b.y, b.r * 3.2, b.color, 0.9);
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.55, 0, TAU); ctx.fill();
    });

    // ----- Đạn địch
    S.enemyBullets.forEach(b => {
      if (b.isShuttle) { drawShuttle(ctx, b); return; }
      glow(ctx, b.x, b.y, b.r * 3.4, b.color, 0.85);
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 0.5, 0, TAU); ctx.fill();
    });

    // ----- Hạt
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    S.particles.forEach(p => {
      const a = Math.max(0, Math.min(1, p.life / 0.4));
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      const sz = 1.5 + a * 3;
      ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
    });
    ctx.restore();

    // ----- Chữ nổi
    S.floatingTexts.forEach(ft => {
      const a = Math.max(0, Math.min(1, ft.life / 0.5));
      const pop = 1 + Math.max(0, ft.life - 0.7) * 1.4;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(ft.x, ft.y);
      ctx.scale(pop, pop);
      ctx.font = '900 12px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = 'rgba(4,6,13,0.9)';
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);
      ctx.restore();
    });

    // ----- Vignette + cảnh báo máu thấp / đau
    const hpRatio = S.hero.hp / S.hero.maxHp;
    if (S.hero.hp < lastHeroHp - 0.5) hurtFlash = 1;
    lastHeroHp = S.hero.hp;
    hurtFlash = Math.max(0, hurtFlash - 0.045);

    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    const danger = Math.max(hurtFlash * 0.55, hpRatio < 0.3 ? 0.18 + 0.12 * Math.sin(time * 7) : 0);
    const enrage = S.combatPhase === 'BOSS_ENRAGE' ? 0.22 + 0.1 * Math.sin(time * 9) : 0;
    const redA = Math.max(danger, enrage);
    if (redA > 0) {
      const rg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.8);
      rg.addColorStop(0, 'rgba(239,68,68,0)');
      rg.addColorStop(1, `rgba(239,68,68,${redA})`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    // Choáng (burnout)
    if (S.hero.stunTimer > 0) {
      ctx.fillStyle = 'rgba(15,23,42,0.35)';
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  function drawShuttle(ctx, b) {
    glow(ctx, b.x + 10, b.y, 40, '#FACC15', 0.5);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#7C2D12';
    ctx.lineWidth = 2;
    roundedRect(ctx, -22, -11, 44, 22, 6);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#0B1B3D';
    for (let i = 0; i < 3; i++) ctx.fillRect(-16 + i * 11, -6, 8, 7);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(18, -3, 4, 6); // đèn pha
    ctx.restore();
    glow(ctx, b.x + 24, b.y, 20, '#FFFFFF', 0.8);
  }

  function drawHero(ctx, S, time) {
    const h = S.hero;
    const color = h.weaponColor || '#FFE600';
    const od = h.overdriveActiveTimer > 0;

    // Vệt đuôi
    trail.push({ x: h.x, y: h.y });
    if (trail.length > 10) trail.shift();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    trail.forEach((p, i) => {
      const k = i / trail.length;
      ctx.globalAlpha = k * 0.35;
      ctx.fillStyle = od ? '#FFE600' : '#38BDF8';
      ctx.beginPath(); ctx.arc(p.x, p.y, h.radius * (0.35 + k * 0.5), 0, TAU); ctx.fill();
    });
    ctx.restore();

    glow(ctx, h.x, h.y, 54, od ? '#FFE600' : '#38BDF8', od ? 0.8 : 0.55);

    ctx.save();
    if (h.invulnTimer > 0 && Math.floor(time * 18) % 2 === 0) ctx.globalAlpha = 0.5;

    // Vòng HP
    const r = h.radius;
    const ratio = Math.max(0, h.hp / h.maxHp);
    ctx.lineCap = 'round';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath(); ctx.arc(h.x, h.y, r + 6, 0, TAU); ctx.stroke();
    ctx.strokeStyle = ratio > 0.35 ? '#34D399' : '#EF4444';
    ctx.beginPath();
    ctx.arc(h.x, h.y, r + 6, -Math.PI / 2, -Math.PI / 2 + TAU * ratio);
    ctx.stroke();

    // Vòng khiên quay khi lướt
    if (h.dashActiveTimer > 0 || h.invulnTimer > 0.3) {
      ctx.strokeStyle = 'rgba(165,243,252,0.9)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -time * 60;
      ctx.beginPath(); ctx.arc(h.x, h.y, r + 11, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cánh/hướng bắn
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.aimAngle);
    ctx.fillStyle = od ? '#FFE600' : color;
    ctx.beginPath();
    ctx.moveTo(r + 10, 0);
    ctx.lineTo(r - 3, -8);
    ctx.lineTo(r + 1, 0);
    ctx.lineTo(r - 3, 8);
    ctx.closePath();
    ctx.fill();
    // Hai súng bên
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(r - 4, -12, 9, 3);
    ctx.fillRect(r - 4, 9, 9, 3);
    ctx.restore();

    // Thân
    const body = ctx.createRadialGradient(h.x - 5, h.y - 6, 2, h.x, h.y, r);
    body.addColorStop(0, od ? '#FEF08A' : '#60A5FA');
    body.addColorStop(1, od ? '#CA8A04' : '#0B3A9E');
    ctx.fillStyle = body;
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(h.x, h.y, r, 0, TAU); ctx.fill(); ctx.stroke();

    // Lõi năng lượng quay
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(time * 3);
    ctx.fillStyle = od ? '#0B1220' : color;
    polygon(ctx, 0, 0, 7, 4, 0);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  function drawBoss(ctx, S, time) {
    const b = S.boss;
    const enraged = S.combatPhase === 'BOSS_ENRAGE';
    const main = enraged ? '#EF4444' : b.color;
    const pulse = 1 + 0.06 * Math.sin(time * (enraged ? 14 : 4));

    glow(ctx, b.x, b.y, 130 * pulse, main, enraged ? 0.75 : 0.5);

    ctx.save();
    ctx.translate(b.x, b.y);

    // Các vòng khiên (hexagon quay, đứt đoạn)
    for (let s = 0; s < b.shields; s++) {
      const rr = b.radius + 12 + s * 9;
      ctx.save();
      ctx.rotate(time * (s % 2 ? -0.9 : 0.9) * (enraged ? 2.2 : 1));
      ctx.strokeStyle = enraged ? '#FCA5A5' : '#7DD3FC';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([22, 10]);
      polygon(ctx, 0, 0, rr, 6, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Răng cưa ngoài
    ctx.save();
    ctx.rotate(time * (enraged ? 1.6 : 0.5));
    spiky(ctx, 0, 0, b.radius + 8, 10, 0);
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = main;
    ctx.lineWidth = 2.5;
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // Thân
    const body = ctx.createRadialGradient(-8, -10, 4, 0, 0, b.radius);
    body.addColorStop(0, enraged ? '#B91C1C' : '#1E3A8A');
    body.addColorStop(1, '#0B1020');
    ctx.fillStyle = body;
    ctx.strokeStyle = main;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.arc(0, 0, b.radius, 0, TAU); ctx.fill(); ctx.stroke();

    // Mắt/lõi
    ctx.save();
    ctx.rotate(time * 1.2);
    ctx.fillStyle = main;
    polygon(ctx, 0, 0, 17 * pulse, 6, 0);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(0, 0, 6 * pulse, 0, TAU); ctx.fill();
    ctx.fillStyle = '#04060D';
    ctx.beginPath(); ctx.arc(Math.cos(time) * 2, Math.sin(time) * 2, 3, 0, TAU); ctx.fill();

    ctx.restore();

    if (S.combatPhase === 'BOSS_FINISH') {
      ctx.save();
      ctx.font = '900 11px "Be Vietnam Pro", sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(4,6,13,0.9)';
      ctx.strokeText('VỠ GIÁP — BẮN KẾT LIỄU!', b.x, b.y - b.radius - 22);
      ctx.fillStyle = '#FFE600';
      ctx.fillText('VỠ GIÁP — BẮN KẾT LIỄU!', b.x, b.y - b.radius - 22);
      ctx.restore();
    }
  }

  window.ArenaGfx = { render, resetTrail: () => { trail = []; } };
})();
