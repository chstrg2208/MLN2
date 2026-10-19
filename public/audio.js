/**
 * AUDIO ENGINE — Procedural Music Sequencer + Synth SFX (Web Audio API)
 * Không cần file MP3 ngoài. Nhạc nền thay đổi theo ngữ cảnh:
 *   lobby · wave (theo tầng) · boss · quiz · enrage · victory
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.muted = localStorage.getItem('mln_muted') === '1';
    this.lastShootTime = 0;

    // Music state
    this.mode = null;
    this.stageIdx = 0;
    this.step = 0;
    this.bar = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.noiseBuf = null;
  }

  // ---------------------------------------------------------------- setup
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 5;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 1.0;
      this.sfxBus.connect(this.master);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.5;
      this.musicBus.connect(this.master);

      // Echo send cho nhạc (tạo không gian)
      this.echo = this.ctx.createDelay(1.0);
      this.echo.delayTime.value = 0.3;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.32;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2600;
      this.echo.connect(lp);
      lp.connect(fb);
      fb.connect(this.echo);
      const echoOut = this.ctx.createGain();
      echoOut.gain.value = 0.35;
      lp.connect(echoOut);
      echoOut.connect(this.musicBus);

      // Noise buffer dùng chung
      const len = this.ctx.sampleRate * 1.2;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.init();
    this.muted = !this.muted;
    localStorage.setItem('mln_muted', this.muted ? '1' : '0');
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.linearRampToValueAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime + 0.1);
    }
    return this.muted;
  }

  isMuted() { return this.muted; }

  // ---------------------------------------------------------------- primitives
  _mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  _tone({ freq, type = 'sine', dur = 0.1, vol = 0.15, slide = null, delay = 0, bus = null, echoSend = 0, filter = null, attack = 0.005 }) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    let node = osc;
    if (filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filter;
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(bus || this.sfxBus);
    if (echoSend > 0 && this.echo) {
      const s = this.ctx.createGain();
      s.gain.value = echoSend;
      g.connect(s);
      s.connect(this.echo);
    }
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  _noise({ dur = 0.15, vol = 0.2, type = 'highpass', freq = 4000, freqEnd = null, delay = 0, bus = null, q = 0.7 }) {
    if (!this.ctx || !this.noiseBuf) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bus || this.sfxBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // ---------------------------------------------------------------- SFX
  click() {
    this.init();
    this._tone({ freq: 640, type: 'triangle', dur: 0.06, vol: 0.12, slide: 900 });
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShootTime < 85) return;
    this.lastShootTime = now;
    this.init();
    this._tone({ freq: 880 + Math.random() * 120, type: 'square', dur: 0.07, vol: 0.035, slide: 260, filter: 3200 });
  }

  dash() {
    this.init();
    this._noise({ dur: 0.28, vol: 0.22, type: 'bandpass', freq: 500, freqEnd: 3800, q: 1.2 });
    this._tone({ freq: 280, type: 'sine', dur: 0.2, vol: 0.14, slide: 900 });
  }

  emp() {
    this.init();
    this._tone({ freq: 90, type: 'sawtooth', dur: 0.55, vol: 0.22, slide: 40, filter: 900 });
    this._tone({ freq: 440, type: 'triangle', dur: 0.4, vol: 0.18, slide: 1760, delay: 0.02 });
    this._noise({ dur: 0.5, vol: 0.18, type: 'lowpass', freq: 3000, freqEnd: 200 });
  }

  pickup(combo = 0) {
    this.init();
    const base = 880 * Math.pow(1.0595, Math.min(combo, 12));
    this._tone({ freq: base, type: 'sine', dur: 0.09, vol: 0.13 });
    this._tone({ freq: base * 1.5, type: 'sine', dur: 0.13, vol: 0.11, delay: 0.05 });
  }

  catchItem() { this.pickup(0); }

  explode() {
    this.init();
    this._noise({ dur: 0.22, vol: 0.2, type: 'lowpass', freq: 2400, freqEnd: 200 });
    this._tone({ freq: 160, type: 'sine', dur: 0.18, vol: 0.18, slide: 50 });
  }

  hitTrap() {
    this.init();
    this._tone({ freq: 190, type: 'sawtooth', dur: 0.18, vol: 0.2, slide: 70, filter: 1400 });
    this._noise({ dur: 0.12, vol: 0.18, type: 'lowpass', freq: 1800, freqEnd: 300 });
  }

  bossSpawn() {
    this.init();
    this._tone({ freq: 70, type: 'sawtooth', dur: 1.1, vol: 0.26, slide: 38, filter: 500 });
    this._tone({ freq: 140, type: 'square', dur: 0.9, vol: 0.12, slide: 60, filter: 700, delay: 0.1 });
    this._noise({ dur: 1.0, vol: 0.16, type: 'lowpass', freq: 600, freqEnd: 80 });
    [0, 0.25, 0.5].forEach(d => this._tone({ freq: 55, type: 'sine', dur: 0.2, vol: 0.3, slide: 30, delay: d }));
  }

  bossEnrage() {
    this.init();
    [0, 0.2, 0.4].forEach(d => {
      this._tone({ freq: 760, type: 'sawtooth', dur: 0.18, vol: 0.2, slide: 320, delay: d, filter: 3000 });
      this._tone({ freq: 380, type: 'square', dur: 0.18, vol: 0.1, slide: 160, delay: d });
    });
  }

  shieldBreak() {
    this.init();
    // Tiếng kính vỡ + chuỗi ngân vang
    this._noise({ dur: 0.35, vol: 0.22, type: 'highpass', freq: 5000, freqEnd: 9000 });
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this._tone({ freq: f, type: 'triangle', dur: 0.28, vol: 0.2, delay: i * 0.05, echoSend: 0.3 })
    );
  }

  burnout() {
    this.init();
    this._tone({ freq: 420, type: 'sawtooth', dur: 0.8, vol: 0.26, slide: 55, filter: 1200 });
    this._noise({ dur: 0.7, vol: 0.2, type: 'lowpass', freq: 2000, freqEnd: 100 });
  }

  correct() { this.shieldBreak(); }
  wrong() { this.bossEnrage(); }

  stageClear() {
    this.init();
    [440, 554.37, 659.25, 880, 1108.7].forEach((f, i) =>
      this._tone({ freq: f, type: 'triangle', dur: 0.3, vol: 0.22, delay: i * 0.08, echoSend: 0.35 })
    );
  }

  streak() {
    this.init();
    [700, 950, 1350].forEach((f, i) =>
      this._tone({ freq: f, type: 'triangle', dur: 0.14, vol: 0.2, delay: i * 0.07 })
    );
  }

  countdownBeep() {
    this.init();
    this._tone({ freq: 880, type: 'sine', dur: 0.08, vol: 0.16 });
  }

  finishWhistle() {
    this.init();
    this._tone({ freq: 1000, type: 'sawtooth', dur: 0.35, vol: 0.22, filter: 3000 });
    this._tone({ freq: 750, type: 'sawtooth', dur: 0.45, vol: 0.22, delay: 0.22, filter: 3000 });
  }

  victoryFanfare() {
    this.init();
    const notes = [
      [523, 0.0, 0.14], [523, 0.15, 0.14], [523, 0.30, 0.14], [659, 0.45, 0.36],
      [587, 0.85, 0.18], [659, 1.05, 0.18], [784, 1.25, 0.7], [1047, 1.25, 0.7]
    ];
    notes.forEach(([f, d, du]) => this._tone({ freq: f, type: 'triangle', dur: du, vol: 0.26, delay: d, echoSend: 0.3 }));
  }

  // ---------------------------------------------------------------- MUSIC
  /**
   * Chuyển nhạc nền. mode: 'lobby' | 'wave' | 'boss' | 'quiz' | 'enrage' | 'victory'
   * stageIdx: 0..4 — đổi giọng/tempo theo tầng.
   */
  setMusic(mode, stageIdx = 0) {
    this.init();
    if (!this.ctx) return;
    if (this.mode === mode && this.stageIdx === stageIdx && this.schedulerTimer) return;

    this.mode = mode;
    this.stageIdx = stageIdx;
    this.step = 0;
    this.bar = 0;

    // duck ngắn để chuyển cảnh mượt
    const t = this.ctx.currentTime;
    this.musicBus.gain.cancelScheduledValues(t);
    this.musicBus.gain.setValueAtTime(0.12, t);
    this.musicBus.gain.linearRampToValueAtTime(this._busLevel(mode), t + 0.35);

    this.nextNoteTime = t + 0.06;
    if (!this.schedulerTimer) {
      this.schedulerTimer = setInterval(() => this._scheduler(), 25);
    }
  }

  stopMusic() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.mode = null;
  }

  _busLevel(mode) {
    return { lobby: 0.38, wave: 0.5, boss: 0.6, quiz: 0.42, enrage: 0.66, victory: 0.55 }[mode] || 0.5;
  }

  _tempo() {
    const s = this.stageIdx;
    switch (this.mode) {
      case 'lobby': return 84;
      case 'wave': return 118 + s * 5;
      case 'boss': return 138 + s * 3;
      case 'quiz': return 96;
      case 'enrage': return 172;
      case 'victory': return 112;
      default: return 110;
    }
  }

  _scheduler() {
    if (!this.ctx || !this.mode) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.14) {
      this._scheduleStep(this.step, this.nextNoteTime);
      this.nextNoteTime += 60 / this._tempo() / 4;
      this.step++;
      if (this.step % 16 === 0) this.bar++;
    }
  }

  // Âm giai: gốc mỗi tầng (MIDI) — Am, Dm, Em, Cm(thấp), Gm
  _root() { return [45, 50, 52, 48, 43][this.stageIdx % 5]; }

  _scheduleStep(step, time) {
    const s16 = step % 16;
    const bar = this.bar % 4;
    const isMajorMode = this.mode === 'victory';

    // Tiến trình hợp âm i – VI – III – VII (hoặc I – V – vi – IV cho victory)
    const prog = isMajorMode ? [0, 7, 9, 5] : [0, -4, 3, -2];
    const chordRoot = this._root() + prog[bar];
    const triad = isMajorMode ? (bar === 2 ? [0, 3, 7] : [0, 4, 7]) : (bar === 0 ? [0, 3, 7] : [0, 4, 7]);
    const pent = isMajorMode ? [0, 2, 4, 7, 9, 12, 14] : [0, 3, 5, 7, 10, 12, 15];

    const m = (note, dur, o) => this._musNote(note, time, dur, o);

    switch (this.mode) {
      case 'lobby': {
        if (s16 === 0) triad.forEach(iv => m(chordRoot + 12 + iv, 2.6, { type: 'sine', vol: 0.09, attack: 0.4, echo: 0.5 }));
        if (s16 % 2 === 0) {
          const idx = [0, 2, 4, 2, 5, 4, 2, 1][(s16 / 2) % 8];
          m(chordRoot + 24 + pent[idx], 0.5, { type: 'triangle', vol: 0.07, echo: 0.6 });
        }
        if (s16 === 0) m(chordRoot - 12, 1.8, { type: 'sine', vol: 0.18 });
        break;
      }

      case 'wave': {
        // Kick 4-on-floor, hat lệch nhịp
        if (s16 % 4 === 0) this._kick(time, 0.5);
        if (s16 % 4 === 2) this._hat(time, 0.06);
        if (s16 === 4 || s16 === 12) this._snare(time, 0.22);
        // Bass 8th
        if (s16 % 2 === 0) {
          const off = [0, 0, 12, 0, 0, 0, 12, 10][(s16 / 2) % 8];
          m(chordRoot - 12 + off, 0.18, { type: 'sawtooth', vol: 0.15, filter: 600 + this.stageIdx * 80 });
        }
        // Arp 16th
        const arpPat = [0, -1, 2, -1, 4, -1, 2, -1, 3, -1, 2, -1, 1, -1, 2, 4];
        const ai = arpPat[s16];
        if (ai >= 0) m(chordRoot + 12 + pent[ai], 0.13, { type: 'square', vol: 0.05, filter: 2400, echo: 0.4 });
        if (s16 === 0) triad.forEach(iv => m(chordRoot + iv, 1.6, { type: 'triangle', vol: 0.05, attack: 0.1 }));
        break;
      }

      case 'boss': {
        if ([0, 3, 6, 8, 10, 12].includes(s16)) this._kick(time, 0.6);
        if (s16 === 4 || s16 === 12) this._snare(time, 0.3);
        if (s16 % 2 === 0) this._hat(time, 0.07);
        // Bass nặng, bước nửa cung (căng thẳng)
        const bOff = [0, -1, 0, -1, 0, -1, 1, -1, 0, -1, 0, 3, -1, 0, -1, -2][s16];
        if (bOff !== -1 || [0, 2, 4, 6, 8, 10, 12, 14].includes(s16)) {
          const note = chordRoot - 12 + (bOff === -1 ? 0 : bOff);
          m(note, 0.2, { type: 'sawtooth', vol: 0.18, filter: 520 });
        }
        // Lead dồn dập
        const lead = [4, -1, 5, -1, 4, 3, -1, 2, 4, -1, 6, -1, 5, 4, 3, -1][s16];
        if (lead >= 0) m(chordRoot + 24 + pent[lead % pent.length] - 12, 0.14, { type: 'sawtooth', vol: 0.06, filter: 2800, echo: 0.35 });
        if (s16 === 0) triad.forEach(iv => m(chordRoot + 12 + iv, 2.0, { type: 'sawtooth', vol: 0.04, filter: 900, attack: 0.15 }));
        break;
      }

      case 'quiz': {
        // Căng thẳng: tim đập + tích tắc + pad treo
        if (s16 === 0 || s16 === 6) this._kick(time, 0.38);
        if (s16 % 2 === 0) this._hat(time, 0.04);
        if (s16 % 8 === 0) m(chordRoot - 12, 1.4, { type: 'sine', vol: 0.2 });
        if (s16 === 0) {
          m(chordRoot + 12, 3.2, { type: 'sawtooth', vol: 0.035, filter: 700, attack: 0.9 });
          m(chordRoot + 12 + 6, 3.2, { type: 'sawtooth', vol: 0.03, filter: 700, attack: 0.9 }); // tritone
        }
        if (s16 % 4 === 2) m(chordRoot + 36, 0.05, { type: 'sine', vol: 0.06, echo: 0.3 });
        break;
      }

      case 'enrage': {
        if (s16 % 4 === 0 || s16 === 14) this._kick(time, 0.62);
        if (s16 === 4 || s16 === 12) this._snare(time, 0.34);
        this._hat(time, s16 % 2 ? 0.05 : 0.09);
        // Bass 16th điên cuồng
        const off = [0, 0, 12, 0, 1, 0, 12, 0][s16 % 8];
        m(chordRoot - 12 + off, 0.1, { type: 'sawtooth', vol: 0.17, filter: 780 });
        const hi = [5, 4, 3, 4, 6, 5, 4, 3][s16 % 8];
        m(chordRoot + 24 + pent[hi % pent.length], 0.09, { type: 'square', vol: 0.05, filter: 3400, echo: 0.3 });
        break;
      }

      case 'victory': {
        if (s16 % 4 === 0) this._kick(time, 0.38);
        if (s16 === 4 || s16 === 12) this._snare(time, 0.2);
        if (s16 % 2 === 0) this._hat(time, 0.05);
        if (s16 % 4 === 0) m(chordRoot - 12, 0.3, { type: 'triangle', vol: 0.2 });
        const mel = [0, -1, 2, 4, -1, 5, 4, -1, 2, -1, 4, 5, 6, -1, 5, 4][s16];
        if (mel >= 0) m(chordRoot + 24 + pent[mel % pent.length], 0.22, { type: 'triangle', vol: 0.11, echo: 0.5 });
        if (s16 === 0) triad.forEach(iv => m(chordRoot + 12 + iv, 1.8, { type: 'sine', vol: 0.07, attack: 0.1 }));
        break;
      }
    }
  }

  _musNote(midi, time, dur, o = {}) {
    if (!this.ctx) return;
    const { type = 'sine', vol = 0.1, filter = null, attack = 0.006, echo = 0 } = o;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = this._mtof(midi);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(vol, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

    let node = osc;
    if (filter) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(filter, time);
      f.frequency.exponentialRampToValueAtTime(Math.max(120, filter * 0.35), time + dur);
      osc.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(this.musicBus);
    if (echo > 0) {
      const s = this.ctx.createGain();
      s.gain.value = echo;
      g.connect(s);
      s.connect(this.echo);
    }
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  _kick(time, vol = 0.5) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(155, time);
    osc.frequency.exponentialRampToValueAtTime(42, time + 0.14);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    osc.connect(g);
    g.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + 0.25);
  }

  _snare(time, vol = 0.25) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1900;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.17);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(time, Math.random() * 0.5);
    src.stop(time + 0.2);

    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.1);
    og.gain.setValueAtTime(vol * 0.5, time);
    og.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
    osc.connect(og); og.connect(this.musicBus);
    osc.start(time);
    osc.stop(time + 0.14);
  }

  _hat(time, vol = 0.06) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7200;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start(time, Math.random() * 0.5);
    src.stop(time + 0.07);
  }
}

window.soundFx = new SoundEffects();

// Mở khóa âm thanh ở lần chạm đầu tiên (chính sách autoplay của trình duyệt)
['pointerdown', 'touchstart', 'keydown'].forEach(evt =>
  window.addEventListener(evt, () => window.soundFx.init(), { once: true, passive: true })
);

// Nút bật/tắt âm thanh (nếu trang có)
(function wireMuteButton() {
  const btn = document.getElementById('btn-mute');
  if (!btn) return;
  const ON = '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';
  const OFF = '<svg class="icon-svg" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"></polygon><line x1="22" y1="9" x2="16" y2="15"></line><line x1="16" y1="9" x2="22" y2="15"></line></svg>';
  const paint = () => {
    btn.innerHTML = window.soundFx.isMuted() ? OFF : ON;
    btn.setAttribute('aria-label', window.soundFx.isMuted() ? 'Bật âm thanh' : 'Tắt âm thanh');
    btn.classList.toggle('muted', window.soundFx.isMuted());
  };
  btn.addEventListener('click', () => { window.soundFx.toggleMute(); paint(); });
  paint();
})();
