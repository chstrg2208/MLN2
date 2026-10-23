/**
 * 60FPS TOP-DOWN ACTION ARENA & BOSS BATTLE ENGINE (MOBILE-FIRST EDITION)
 * MLN122 • Đấu Trường Giải Mã Thặng Dư • Group 1 (GD1906)
 */

(function () {
  const socket = io();

  // Custom crisp SVG emblems for classes (no raw emoji in UI chrome)
  const CLASS_SVGS = {
    fpt_student: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#FF6B00"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    intern_fresher: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#38BDF8"><polygon points="14.5 2 19 6.5 8.5 17 4 17 4 12.5 14.5 2"/><line x1="3" y1="21" x2="21" y2="21"/></svg>`,
    ai_engineer: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#C084FC"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>`,
    philosopher: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#FFE600"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>`,
    startup_founder: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#34D399"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`,
    global_citizen: `<svg class="icon-svg" viewBox="0 0 24 24" style="color:#F472B6"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  };

  // ==================== GLOBAL STATE ====================
  let stagesData = [];
  let avatarsData = [];
  let selectedAvatarId = 'fpt_student';
  let myPlayer = null;
  let currentStageIndex = 0; // 0..4 (Tầng 1..5)
  let currentQuestionIndex = 0; // 0..2 (3 Khiên Boss / tầng)
  let gameStartTime = 0;

  let questionStartTime = 0;
  let questionTimerInterval = null;
  let hasAnsweredCurrentQuestion = false;

  // ==================== DOM ELEMENTS ====================
  const screens = {
    join: document.getElementById('screen-join'),
    lobby: document.getElementById('screen-lobby'),
    game: document.getElementById('screen-game'),
    finish: document.getElementById('screen-finish')
  };

  const nicknameInput = document.getElementById('player-nickname');
  const avatarGrid = document.getElementById('avatar-grid');
  const btnJoin = document.getElementById('btn-join');

  const lobbyPlayerAvatar = document.getElementById('lobby-player-avatar');
  const lobbyPlayerName = document.getElementById('lobby-player-name');
  const lobbyPlayerCount = document.getElementById('lobby-player-count');

  const gameScore = document.getElementById('game-score');
  const gameTimer = document.getElementById('game-timer');
  const gameTimerBox = document.getElementById('game-timer-box');
  const gameStreak = document.getElementById('game-streak');
  const stagePills = document.getElementById('stage-pills');

  const hudHpText = document.getElementById('hud-hp-text');
  const hudHpFill = document.getElementById('hud-hp-fill');
  const hudBossLabel = document.getElementById('hud-boss-label');
  const hudBossFill = document.getElementById('hud-boss-fill');
  const hudShieldGems = document.getElementById('hud-shield-gems');

  const arenaWrapper = document.getElementById('arena-wrapper');
  const canvas = document.getElementById('arena-canvas');
  const ctx = canvas.getContext('2d');
  const enrageBanner = document.getElementById('enrage-banner');
  const enrageTimerNum = document.getElementById('enrage-timer-num');

  const stageBriefingOverlay = document.getElementById('stage-briefing-overlay');
  const briefStageTag = document.getElementById('brief-stage-tag');
  const briefBossIcon = document.getElementById('brief-boss-icon');
  const briefStageTitle = document.getElementById('brief-stage-title');
  const briefBossName = document.getElementById('brief-boss-name');
  const briefHazardDesc = document.getElementById('brief-hazard-desc');
  const btnEnterStage = document.getElementById('btn-enter-stage');

  const joystickZone = document.getElementById('joystick-zone');
  const joystickBase = document.getElementById('joystick-base');
  const joystickStick = document.getElementById('joystick-stick');
  const btnSkillDash = document.getElementById('btn-skill-dash');
  const btnSkillOverdrive = document.getElementById('btn-skill-overdrive');
  const btnSkillEmp = document.getElementById('btn-skill-emp');
  const cdDash = document.getElementById('cd-dash');
  const cdOverdrive = document.getElementById('cd-overdrive');
  const cdEmp = document.getElementById('cd-emp');

  const bossQuizOverlay = document.getElementById('boss-quiz-overlay');
  const quizBadge = document.getElementById('quiz-badge');
  const quizSlideRef = document.getElementById('quiz-slide-ref');
  const quizCountdownBadge = document.getElementById('quiz-countdown-badge');
  const qTimerFill = document.getElementById('q-timer-fill');
  const quizQuestionText = document.getElementById('quiz-question-text');
  const quizOptionsList = document.getElementById('quiz-options-list');
  const quizExplanationBox = document.getElementById('quiz-explanation-box');
  const btnNextQuestion = document.getElementById('btn-next-question');

  const finishScore = document.getElementById('finish-score');
  const finishCorrect = document.getElementById('finish-correct');
  const finishStreak = document.getElementById('finish-streak');
  const finishTime = document.getElementById('finish-time');

  // ==================== 60FPS ARENA ENGINE STATE ====================
  const W = 600;
  const H = 450;
  let animFrameId = null;
  let lastFrameTime = performance.now();

  let combatPhase = 'BRIEFING';
  let waveEnergy = 0;
  let waveScoreEarned = 0;
  let enrageTimeLeft = 0;
  let enrageEndsAt = 0;
  let screenShake = 0;

  const hero = {
    x: W / 2,
    y: H - 80,
    vx: 0,
    vy: 0,
    aimAngle: -Math.PI / 2,
    radius: 18,
    speed: 225,
    hp: 100,
    maxHp: 100,
    weaponColor: '#FFE600',
    invulnTimer: 0,
    stunTimer: 0,
    shootCooldown: 0,
    dashCd: 0,
    dashMaxCd: 2.2,
    dashActiveTimer: 0,
    overdriveCd: 0,
    overdriveMaxCd: 6.5,
    overdriveActiveTimer: 0,
    empCd: 0,
    empMaxCd: 8.0,
    afterimages: []
  };

  const boss = {
    active: false,
    x: W / 2,
    y: 92,
    vx: 98,
    radius: 36,
    hp: 100,
    maxHp: 100,
    shields: 3,
    name: '',
    color: '#3B82F6',
    attackTimer: 0,
    spiralAngle: 0
  };

  let enemies = [];
  let playerBullets = [];
  let enemyBullets = [];
  let orbs = [];
  let particles = [];
  let floatingTexts = [];
  let shockwaves = [];

  let spawnTimer = 0;
  let hazardState = {
    shuttleTimer: 0,
    shuttleWarningY: null,
    shuttleWarningTimer: 0,
    safeZoneX: W / 2,
    safeZoneY: H / 2,
    safeZoneVx: 65,
    safeZoneVy: 50,
    safeZoneRadius: 118,
    wallInset: 0,
    laserAngle: 0
  };

  const keys = {};
  let joyVec = { x: 0, y: 0 };
  let isDraggingJoystick = false;
  let arenaTouchOrigin = null;

  function haptic(ms = 12) {
    try {
      if (navigator.vibrate) navigator.vibrate(ms);
    } catch (e) {}
  }

  // ==================== INITIALIZATION ====================
  async function init() {
    try {
      const [stagesRes, avatarsRes] = await Promise.all([
        fetch('/api/stages').then(r => r.json()),
        fetch('/api/avatars').then(r => r.json())
      ]);
      stagesData = stagesRes;
      avatarsData = avatarsRes;
      renderAvatars();
    } catch (e) {
      console.error('Lỗi tải dữ liệu:', e);
    }

    const savedName = localStorage.getItem('mln_player_name');
    if (savedName) nicknameInput.value = savedName;

    setupControls();
  }

  function renderAvatars() {
    avatarGrid.innerHTML = avatarsData.map(a => `
      <div class="avatar-card ${a.id === selectedAvatarId ? 'active' : ''}" data-id="${a.id}">
        <div class="avatar-svg-wrap">${CLASS_SVGS[a.id] || CLASS_SVGS.fpt_student}</div>
        <span class="name">${a.name}</span>
      </div>
    `).join('');

    avatarGrid.querySelectorAll('.avatar-card').forEach(card => {
      card.addEventListener('click', () => {
        window.soundFx.click();
        haptic(8);
        avatarGrid.querySelectorAll('.avatar-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedAvatarId = card.getAttribute('data-id');
      });
    });
  }

  function showScreen(name) {
    if (name === 'game') {
      document.body.classList.add('in-game-mode');
    } else {
      document.body.classList.remove('in-game-mode');
    }

    Object.keys(screens).forEach(k => {
      if (k === name) {
        screens[k].style.display = (k === 'game') ? 'flex' : 'block';
      } else {
        screens[k].style.display = 'none';
      }
    });
  }

  // ==================== JOIN & SOCKET EVENTS ====================
  btnJoin.addEventListener('click', () => {
    window.soundFx.click();
    haptic(15);
    const name = nicknameInput.value.trim();
    if (!name) {
      nicknameInput.focus();
      return;
    }

    localStorage.setItem('mln_player_name', name);
    let clientId = localStorage.getItem('mln_client_id');
    if (!clientId) {
      clientId = 'p_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('mln_client_id', clientId);
    }

    socket.emit('player:join', {
      clientId,
      nickname: name,
      avatarId: selectedAvatarId
    });
  });

  socket.on('connect', () => {
    const savedName = localStorage.getItem('mln_player_name');
    const savedClientId = localStorage.getItem('mln_client_id');
    if (savedName && savedClientId && myPlayer) {
      socket.emit('player:join', {
        clientId: savedClientId,
        nickname: savedName,
        avatarId: (myPlayer.avatar && myPlayer.avatar.id) ? myPlayer.avatar.id : selectedAvatarId
      });
    }
  });

  socket.on('player:joined', ({ player, gameState, stages }) => {
    myPlayer = player;
    stagesData = stages;
    hero.weaponColor = player.avatar.weaponColor || '#FFE600';
    updateTopBar();

    lobbyPlayerAvatar.innerHTML = CLASS_SVGS[player.avatar.id] || CLASS_SVGS.fpt_student;
    lobbyPlayerName.textContent = player.nickname;

    if (gameState === 'PLAYING') {
      // Reconnect giữa trận: giữ nguyên tiến trình đang chơi, không reset màn
      if (!animFrameId) startPlaying();
    } else if (gameState === 'FINISHED') {
      showFinishScreen();
    } else {
      showScreen('lobby');
      window.soundFx.setMusic('lobby');
    }
  });

  socket.on('lobby:update', ({ playerCount }) => {
    lobbyPlayerCount.textContent = `${playerCount} chiến binh trong phòng`;
  });

  socket.on('game:started', () => {
    startPlaying();
  });

  socket.on('timer:tick', ({ timeRemaining }) => {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    gameTimer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    if (timeRemaining <= 30) {
      gameTimerBox.classList.add('urgent');
      if (timeRemaining <= 5 && timeRemaining > 0) {
        window.soundFx.countdownBeep();
      }
    } else {
      gameTimerBox.classList.remove('urgent');
    }
  });

  socket.on('game:finished', () => {
    stopArenaLoop();
    clearQuestionTimer();
    bossQuizOverlay.style.display = 'none';
    window.soundFx.stopMusic();
    window.soundFx.finishWhistle();
    showFinishScreen();
  });

  socket.on('game:reset', () => {
    location.reload();
  });

  socket.on('player:kicked', ({ message }) => {
    alert(message || 'Bạn đã bị mời ra khỏi phòng.');
    location.reload();
  });

  socket.on('player:score_updated', ({ score }) => {
    if (myPlayer) myPlayer.score = score;
    updateTopBar();
  });

  // ==================== INPUT & MULTI-TOUCH CONTROLS ====================
  function setupControls() {
    window.addEventListener('keydown', (e) => {
      keys[e.code] = true;
      if (combatPhase === 'WAVE' || combatPhase === 'BOSS_ENRAGE' || combatPhase === 'BOSS_FINISH') {
        if (e.code === 'Space') {
          e.preventDefault();
          triggerDash();
        } else if (e.code === 'KeyJ') {
          triggerOverdrive();
        } else if (e.code === 'KeyK') {
          triggerEmp();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.code] = false;
    });

    const maxRadius = 34;
    const handleJoystickMove = (clientX, clientY) => {
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      let dx = clientX - centerX;
      let dy = clientY - centerY;
      const dist = Math.hypot(dx, dy);

      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }

      joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
      joyVec.x = dx / maxRadius;
      joyVec.y = dy / maxRadius;
    };

    const resetJoystick = () => {
      isDraggingJoystick = false;
      arenaTouchOrigin = null;
      joystickStick.style.transform = 'translate(0px, 0px)';
      joyVec.x = 0;
      joyVec.y = 0;
    };

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDraggingJoystick = true;
      const touch = e.targetTouches[0];
      if (touch) handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!isDraggingJoystick) return;
      const touch = e.targetTouches[0];
      if (touch) handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    joystickZone.addEventListener('touchend', resetJoystick);
    joystickZone.addEventListener('touchcancel', resetJoystick);

    // Floating touch steering directly on the Arena canvas for mobile comfort!
    canvas.addEventListener('touchstart', (e) => {
      if (combatPhase === 'BRIEFING' || combatPhase === 'BOSS_QUIZ') return;
      e.preventDefault();
      const touch = e.targetTouches[0];
      if (touch) {
        arenaTouchOrigin = { x: touch.clientX, y: touch.clientY };
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      if (!arenaTouchOrigin) return;
      e.preventDefault();
      const touch = e.targetTouches[0];
      if (!touch) return;
      let dx = touch.clientX - arenaTouchOrigin.x;
      let dy = touch.clientY - arenaTouchOrigin.y;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
      joyVec.x = dx / maxRadius;
      joyVec.y = dy / maxRadius;
    }, { passive: false });

    canvas.addEventListener('touchend', resetJoystick);
    canvas.addEventListener('touchcancel', resetJoystick);

    // Mouse support on joystick for desktop testing
    joystickZone.addEventListener('mousedown', (e) => {
      isDraggingJoystick = true;
      handleJoystickMove(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDraggingJoystick) handleJoystickMove(e.clientX, e.clientY);
    });
    window.addEventListener('mouseup', () => {
      if (isDraggingJoystick) resetJoystick();
    });

    const bindSkillBtn = (btn, fn) => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        fn();
      }, { passive: false });
      btn.addEventListener('click', fn);
    };

    bindSkillBtn(btnSkillDash, triggerDash);
    bindSkillBtn(btnSkillOverdrive, triggerOverdrive);
    bindSkillBtn(btnSkillEmp, triggerEmp);
  }

  function triggerDash() {
    if (hero.dashCd > 0 || hero.stunTimer > 0) return;
    window.soundFx.dash();
    haptic(18);
    hero.dashCd = hero.dashMaxCd;
    hero.dashActiveTimer = 0.24;
    hero.invulnTimer = Math.max(hero.invulnTimer, 0.45);

    let dx = hero.vx;
    let dy = hero.vy;
    if (Math.hypot(dx, dy) < 0.1) {
      dx = Math.cos(hero.aimAngle);
      dy = Math.sin(hero.aimAngle);
    } else {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
    }
    hero.vx = dx * 630;
    hero.vy = dy * 630;
    addFloatingText(hero.x, hero.y - 20, 'LƯỚT BẤT TỬ!', '#38BDF8');
  }

  function triggerOverdrive() {
    if (hero.overdriveCd > 0 || hero.stunTimer > 0) return;
    window.soundFx.streak();
    haptic(22);
    hero.overdriveCd = hero.overdriveMaxCd;
    hero.overdriveActiveTimer = 3.6;
    addFloatingText(hero.x, hero.y - 24, 'ĐẠN CHÙM X3!', '#FFE600');
  }

  function triggerEmp() {
    if (hero.empCd > 0 || hero.stunTimer > 0) return;
    window.soundFx.emp();
    haptic(30);
    hero.empCd = hero.empMaxCd;

    shockwaves.push({
      x: hero.x,
      y: hero.y,
      r: 12,
      maxR: 250,
      alpha: 1
    });

    let cleared = 0;
    enemyBullets = enemyBullets.filter(b => {
      const d = Math.hypot(b.x - hero.x, b.y - hero.y);
      if (d <= 250) {
        cleared++;
        spawnParticles(b.x, b.y, '#A855F7', 3);
        return false;
      }
      return true;
    });

    enemies.forEach(en => {
      const d = Math.hypot(en.x - hero.x, en.y - hero.y);
      if (d < 240 && d > 1) {
        en.hp -= 35;
        en.x += ((en.x - hero.x) / d) * 60;
        en.y += ((en.y - hero.y) / d) * 60;
      }
    });

    hero.hp = Math.min(hero.maxHp, hero.hp + 12);
    addFloatingText(hero.x, hero.y - 26, `PHÁ ${cleared} ĐẠN (+12 HP)`, '#C084FC');
    updateCombatHud();
  }

  // ==================== STAGE FLOW ====================
  function startPlaying() {
    gameStartTime = Date.now();
    showScreen('game');
    currentStageIndex = myPlayer && myPlayer.stage ? (myPlayer.stage - 1) : 0;
    prepareStage(currentStageIndex);

    if (!animFrameId) {
      lastFrameTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  function stopArenaLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  function updateTopBar() {
    if (!myPlayer) return;
    const score = (typeof myPlayer.score === 'number') ? myPlayer.score : 0;
    gameScore.textContent = score.toLocaleString();
    const streak = (typeof myPlayer.streak === 'number') ? myPlayer.streak : 0;
    gameStreak.textContent = `x${streak}`;
    gameStreak.style.color = streak >= 2 ? '#FFE600' : '#FACC15';

    const pills = stagePills.querySelectorAll('.stage-pill');
    pills.forEach((p, idx) => {
      p.className = 'stage-pill';
      if (idx < currentStageIndex) p.classList.add('done');
      else if (idx === currentStageIndex) p.classList.add('active');
    });
  }

  function updateCombatHud() {
    const hp = (typeof hero.hp === 'number') ? hero.hp : 100;
    const maxHp = hero.maxHp || 100;
    const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    hudHpText.textContent = `${Math.ceil(hp)}/${maxHp}`;
    hudHpFill.style.width = `${hpPct}%`;
    if (hpPct <= 35) hudHpFill.classList.add('low');
    else hudHpFill.classList.remove('low');

    const stage = stagesData[currentStageIndex];
    if (!stage) return;

    if (!boss.active) {
      hudBossLabel.textContent = `TRIỆU HỒI BOSS TẦNG ${stage.id}`;
      hudBossFill.style.width = `${Math.min(100, waveEnergy)}%`;
    } else {
      hudBossLabel.textContent = stage.bossName;
      const bHp = (typeof boss.hp === 'number') ? boss.hp : 100;
      const bMax = boss.maxHp || 100;
      const bossPct = Math.max(0, Math.min(100, (bHp / bMax) * 100));
      hudBossFill.style.width = `${bossPct}%`;
    }

    const gems = hudShieldGems.querySelectorAll('.shield-gem');
    gems.forEach((g, idx) => {
      if (idx < boss.shields) g.classList.remove('broken');
      else g.classList.add('broken');
    });
  }

  function prepareStage(stageIdx) {
    const stage = stagesData[stageIdx];
    if (!stage) return;

    combatPhase = 'BRIEFING';
    waveEnergy = 0;
    waveScoreEarned = 0;
    currentQuestionIndex = 0;

    hero.x = W / 2;
    hero.y = H - 80;
    hero.hp = 100;
    hero.invulnTimer = 1.0;
    hero.stunTimer = 0;

    boss.active = false;
    boss.shields = 3;
    boss.hp = 100;
    boss.maxHp = 100;
    boss.name = stage.bossName;
    boss.color = stage.bossColor;

    enemies = [];
    playerBullets = [];
    enemyBullets = [];
    orbs = [];
    particles = [];
    floatingTexts = [];
    shockwaves = [];

    hazardState.shuttleTimer = 2.5;
    hazardState.shuttleWarningY = null;
    hazardState.safeZoneX = W / 2;
    hazardState.safeZoneY = H / 2;
    hazardState.wallInset = 0;
    hazardState.laserAngle = 0;

    arenaWrapper.classList.remove('enrage-border');
    enrageBanner.style.display = 'none';

    updateTopBar();
    updateCombatHud();

    briefStageTag.textContent = `Tầng ${stage.id} / 5 • ${stage.slideRef}`;
    briefBossIcon.innerHTML = `<svg class="icon-svg" style="width:28px;height:28px;color:${stage.bossColor}" viewBox="0 0 24 24"><path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"/><circle cx="12" cy="12" r="3"/></svg>`;
    briefStageTitle.textContent = stage.title;
    briefBossName.textContent = `BOSS: ${stage.bossName}`;
    briefHazardDesc.textContent = stage.hazardDesc;
    btnEnterStage.querySelector('span').textContent = `XÔNG VÀO TẦNG ${stage.id}`;
    stageBriefingOverlay.style.display = 'flex';

    btnEnterStage.onclick = () => {
      window.soundFx.click();
      haptic(15);
      stageBriefingOverlay.style.display = 'none';
      combatPhase = 'WAVE';
      window.soundFx.setMusic('wave', currentStageIndex);
      if (window.ArenaGfx) window.ArenaGfx.resetTrail();
    };
  }

  // ==================== 60FPS MAIN GAME LOOP ====================
  let lastLoopTick = Date.now();
  function gameLoop(now) {
    // Luôn đặt lịch frame kế tiếp TRƯỚC để 1 lỗi bất kỳ không làm đông cứng game
    animFrameId = requestAnimationFrame(gameLoop);
    lastLoopTick = Date.now();
    const dt = Math.max(0, Math.min(0.05, (now - lastFrameTime) / 1000));
    lastFrameTime = now;

    try { updateArena(dt); } catch (err) { console.error('[updateArena]', err); }
    try { renderArena(); } catch (err) { console.error('[renderArena]', err); }
  }

  // Watchdog: vòng lặp bị dừng (lỗi / trình duyệt in-app TikTok, Zalo tạm dừng) -> tự khởi động lại
  setInterval(() => {
    if (!animFrameId || document.hidden) return;
    if (Date.now() - lastLoopTick > 1500) {
      try { cancelAnimationFrame(animFrameId); } catch (e) {}
      lastFrameTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }
    // Enrage quá hạn theo đồng hồ thực -> ép kết thúc
    if (combatPhase === 'BOSS_ENRAGE' && enrageEndsAt && Date.now() > enrageEndsAt + 800) {
      try { resolveEnrage(); } catch (e) { console.error(e); }
    }
  }, 1000);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    if (!socket.connected) socket.connect();
    if (animFrameId) {
      try { cancelAnimationFrame(animFrameId); } catch (e) {}
      lastFrameTime = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }
  });

  function updateArena(dt) {
    if (hero.dashCd > 0) hero.dashCd = Math.max(0, hero.dashCd - dt);
    if (hero.overdriveCd > 0) hero.overdriveCd = Math.max(0, hero.overdriveCd - dt);
    if (hero.empCd > 0) hero.empCd = Math.max(0, hero.empCd - dt);
    if (hero.invulnTimer > 0) hero.invulnTimer = Math.max(0, hero.invulnTimer - dt);
    if (hero.stunTimer > 0) hero.stunTimer = Math.max(0, hero.stunTimer - dt);
    if (hero.overdriveActiveTimer > 0) hero.overdriveActiveTimer = Math.max(0, hero.overdriveActiveTimer - dt);
    if (screenShake > 0) screenShake = Math.max(0, screenShake - dt * 25);

    cdDash.style.height = `${(hero.dashCd / hero.dashMaxCd) * 100}%`;
    cdOverdrive.style.height = `${(hero.overdriveCd / hero.overdriveMaxCd) * 100}%`;
    cdEmp.style.height = `${(hero.empCd / hero.empMaxCd) * 100}%`;

    if (combatPhase === 'BRIEFING' || combatPhase === 'BOSS_QUIZ') {
      return;
    }

    const stage = stagesData[currentStageIndex];
    if (!stage) return;

    // 1. Update Hero Movement
    if (hero.stunTimer <= 0) {
      if (hero.dashActiveTimer > 0) {
        hero.dashActiveTimer -= dt;
        hero.afterimages.push({ x: hero.x, y: hero.y, alpha: 0.65 });
      } else {
        let mx = joyVec.x;
        let my = joyVec.y;
        if (keys['KeyW'] || keys['ArrowUp']) my -= 1;
        if (keys['KeyS'] || keys['ArrowDown']) my += 1;
        if (keys['KeyA'] || keys['ArrowLeft']) mx -= 1;
        if (keys['KeyD'] || keys['ArrowRight']) mx += 1;

        const len = Math.hypot(mx, my);
        if (len > 1) {
          mx /= len;
          my /= len;
        }
        hero.vx = mx * hero.speed;
        hero.vy = my * hero.speed;
      }

      hero.x += hero.vx * dt;
      hero.y += hero.vy * dt;
    }

    const minX = 22 + hazardState.wallInset;
    const maxX = W - 22 - hazardState.wallInset;
    hero.x = Math.max(minX, Math.min(maxX, hero.x));
    hero.y = Math.max(24, Math.min(H - 24, hero.y));

    hero.afterimages.forEach(a => { a.alpha -= dt * 3; });
    hero.afterimages = hero.afterimages.filter(a => a.alpha > 0);

    // 2. Hero Auto-Fire
    hero.shootCooldown -= dt;
    if (hero.shootCooldown <= 0 && hero.stunTimer <= 0) {
      const isOverdrive = hero.overdriveActiveTimer > 0;
      hero.shootCooldown = isOverdrive ? 0.11 : 0.22;
      firePlayerWeapon(isOverdrive);
    }

    // 3. Stage-Specific Hazards
    updateStageHazards(stage, dt);

    // 4. Phase Logic
    if (combatPhase === 'WAVE') {
      spawnTimer -= dt * 1000;
      if (spawnTimer <= 0 && enemies.length < 14) {
        spawnTimer = stage.waveConfig.spawnRateMs;
        spawnWaveEnemy(stage);
      }
    } else if (combatPhase === 'BOSS_ENRAGE') {
      // Tính theo đồng hồ thực -> máy lag vẫn kết thúc đúng 6 giây
      enrageTimeLeft = Math.max(0, (enrageEndsAt - Date.now()) / 1000);
      enrageTimerNum.textContent = enrageTimeLeft.toFixed(1);
      updateBossBehavior(stage, dt, true);

      if (enrageTimeLeft <= 0) {
        resolveEnrage();
      }
    } else if (combatPhase === 'BOSS_FINISH') {
      updateBossBehavior(stage, dt, false);
    }

    // 5. Update Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const en = enemies[i];
      const angle = Math.atan2(hero.y - en.y, hero.x - en.x);
      en.x += Math.cos(angle) * en.speed * dt;
      en.y += Math.sin(angle) * en.speed * dt;

      en.shootTimer -= dt;
      if (en.shootTimer <= 0) {
        en.shootTimer = 2.2 + Math.random() * 1.2;
        const bSpeed = (stage.waveConfig.bulletSpeed || 3.5) * 55;
        enemyBullets.push({
          x: en.x,
          y: en.y,
          vx: Math.cos(angle) * bSpeed,
          vy: Math.sin(angle) * bSpeed,
          r: 6,
          color: '#EF4444'
        });
      }

      const distToHero = Math.hypot(en.x - hero.x, en.y - hero.y);
      if (distToHero < en.r + hero.radius) {
        if (hero.dashActiveTimer > 0) {
          en.hp -= 50;
        } else {
          damageHero(14);
          en.hp = 0;
        }
      }

      if (en.hp <= 0) {
        spawnParticles(en.x, en.y, '#FFE600', 12);
        window.soundFx.explode();
        orbs.push({
          x: en.x,
          y: en.y,
          r: 7,
          energy: 14,
          score: 45
        });
        enemies.splice(i, 1);
      }
    }

    // 6. Update Player Bullets
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) {
        playerBullets.splice(i, 1);
        continue;
      }

      let hit = false;
      for (let j = enemies.length - 1; j >= 0; j--) {
        const en = enemies[j];
        if (Math.hypot(b.x - en.x, b.y - en.y) < en.r + b.r) {
          en.hp -= b.dmg;
          spawnParticles(b.x, b.y, b.color, 3);
          hit = true;
          break;
        }
      }

      if (!hit && boss.active && Math.hypot(b.x - boss.x, b.y - boss.y) < boss.radius + b.r) {
        if (combatPhase === 'BOSS_FINISH') {
          boss.hp -= b.dmg * 0.45;
          spawnParticles(b.x, b.y, '#FFE600', 4);
          updateCombatHud();
          if (boss.hp <= 0) {
            completeCurrentStage();
            return;
          }
        } else {
          spawnParticles(b.x, b.y, '#38BDF8', 2);
        }
        hit = true;
      }

      if (hit) {
        playerBullets.splice(i, 1);
      }
    }

    // 7. Update Enemy Bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30) {
        enemyBullets.splice(i, 1);
        continue;
      }

      if (Math.hypot(b.x - hero.x, b.y - hero.y) < b.r + hero.radius - 3) {
        damageHero(b.dmg || 14);
        spawnParticles(b.x, b.y, '#EF4444', 5);
        enemyBullets.splice(i, 1);
      }
    }

    // 8. Update Energy Orbs
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      const dist = Math.hypot(hero.x - o.x, hero.y - o.y);
      if (dist < 160) {
        const angle = Math.atan2(hero.y - o.y, hero.x - o.x);
        o.x += Math.cos(angle) * 340 * dt;
        o.y += Math.sin(angle) * 340 * dt;
      }

      if (dist < hero.radius + o.r + 6) {
        window.soundFx.pickup(Math.floor(waveEnergy / 8));
        waveEnergy = Math.min(100, waveEnergy + o.energy);
        waveScoreEarned += o.score;
        addFloatingText(o.x, o.y, `+${o.score}đ`, '#FFE600');
        orbs.splice(i, 1);
        updateCombatHud();

        if (combatPhase === 'WAVE' && waveEnergy >= 100) {
          spawnStageBoss();
          return;
        }
      }
    }

    // 9. Update Shockwaves, Particles & Texts
    shockwaves.forEach(sw => {
      sw.r += 540 * dt;
      sw.alpha = Math.max(0, 1 - sw.r / sw.maxR);
    });
    shockwaves = shockwaves.filter(sw => sw.r < sw.maxR);

    particles.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });
    particles = particles.filter(p => p.life > 0);

    floatingTexts.forEach(ft => {
      ft.y -= 35 * dt;
      ft.life -= dt;
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
  }

  // ==================== WEAPONS, HAZARDS & BOSS AI ====================
  function firePlayerWeapon(isOverdrive) {
    let targetX = hero.x;
    let targetY = hero.y - 200;
    let minDist = Infinity;

    enemies.forEach(en => {
      const d = Math.hypot(en.x - hero.x, en.y - hero.y);
      if (d < minDist) {
        minDist = d;
        targetX = en.x;
        targetY = en.y;
      }
    });

    if (boss.active && enemies.length === 0) {
      targetX = boss.x;
      targetY = boss.y;
    } else if (enemies.length === 0 && (Math.abs(hero.vx) > 5 || Math.abs(hero.vy) > 5)) {
      targetX = hero.x + hero.vx;
      targetY = hero.y + hero.vy;
    }

    const baseAngle = Math.atan2(targetY - hero.y, targetX - hero.x);
    hero.aimAngle = baseAngle;
    const speed = 540;
    const angles = isOverdrive ? [baseAngle - 0.18, baseAngle, baseAngle + 0.18] : [baseAngle];

    window.soundFx.shoot();
    angles.forEach(a => {
      playerBullets.push({
        x: hero.x + Math.cos(a) * 16,
        y: hero.y + Math.sin(a) * 16,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        r: isOverdrive ? 6 : 5,
        dmg: isOverdrive ? 22 : 18,
        color: isOverdrive ? '#FFE600' : hero.weaponColor
      });
    });
  }

  function spawnWaveEnemy(stage) {
    const side = Math.floor(Math.random() * 3);
    let x = Math.random() * (W - 80) + 40;
    let y = 30;
    if (side === 1) { x = 30 + hazardState.wallInset; y = Math.random() * (H - 120) + 40; }
    if (side === 2) { x = W - 30 - hazardState.wallInset; y = Math.random() * (H - 120) + 40; }

    const labels = ['v', 'm', 'OT', 'AI', 'KPI'];
    enemies.push({
      x,
      y,
      r: 16,
      hp: 32 + stage.id * 8,
      speed: (stage.waveConfig.enemySpeed || 2.0) * 42,
      label: labels[(stage.id + enemies.length) % labels.length],
      shootTimer: 1.0 + Math.random() * 1.5
    });
  }

  function updateStageHazards(stage, dt) {
    const type = stage.waveConfig.specialHazard;

    if (type === 'shuttle_charge') {
      hazardState.shuttleTimer -= dt;
      if (hazardState.shuttleTimer <= 0 && hazardState.shuttleWarningY === null) {
        hazardState.shuttleWarningY = Math.max(70, Math.min(H - 60, hero.y));
        hazardState.shuttleWarningTimer = 0.85;
      }

      if (hazardState.shuttleWarningY !== null) {
        hazardState.shuttleWarningTimer -= dt;
        if (hazardState.shuttleWarningTimer <= 0) {
          const sy = hazardState.shuttleWarningY;
          for (let k = 0; k < 4; k++) {
            enemyBullets.push({
              x: -k * 38,
              y: sy,
              vx: 460,
              vy: 0,
              r: 13,
              dmg: 20,
              color: '#FACC15',
              isShuttle: true
            });
          }
          hazardState.shuttleWarningY = null;
          hazardState.shuttleTimer = 3.2;
        }
      }
    } else if (type === 'moving_safe_zone' && combatPhase === 'WAVE') {
      hazardState.safeZoneX += hazardState.safeZoneVx * dt;
      hazardState.safeZoneY += hazardState.safeZoneVy * dt;
      if (hazardState.safeZoneX < 110 || hazardState.safeZoneX > W - 110) hazardState.safeZoneVx *= -1;
      if (hazardState.safeZoneY < 110 || hazardState.safeZoneY > H - 110) hazardState.safeZoneVy *= -1;

      const d = Math.hypot(hero.x - hazardState.safeZoneX, hero.y - hazardState.safeZoneY);
      if (d > hazardState.safeZoneRadius && hero.invulnTimer <= 0) {
        hero.hp -= 5.5 * dt;
        updateCombatHud();
        if (hero.hp <= 0) handleBurnout();
      }
    } else if (type === 'shrinking_walls' && combatPhase === 'WAVE') {
      hazardState.wallInset = Math.min(115, hazardState.wallInset + 7 * dt);
    } else if (type === 'gravity_vortex') {
      const cx = W / 2;
      const cy = H / 2;
      const dist = Math.hypot(cx - hero.x, cy - hero.y);
      if (dist > 25 && hero.dashActiveTimer <= 0) {
        hero.x += ((cx - hero.x) / dist) * 42 * dt;
        hero.y += ((cy - hero.y) / dist) * 42 * dt;
      }
    } else if (type === 'laser_sweep') {
      hazardState.laserAngle += 1.15 * dt;
      const cx = W / 2;
      const cy = H / 2;
      const lx = cx + Math.cos(hazardState.laserAngle) * 260;
      const ly = cy + Math.sin(hazardState.laserAngle) * 260;
      const distToBeam = pointToSegmentDistance(hero.x, hero.y, cx, cy, lx, ly);
      if (distToBeam < hero.radius - 2) {
        damageHero(16);
      }
    }
  }

  function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    return Math.hypot(px - xx, py - yy);
  }

  function spawnStageBoss() {
    combatPhase = 'BOSS_INTRO';
    window.soundFx.bossSpawn();
    window.soundFx.setMusic('boss', currentStageIndex);
    haptic(35);
    enemies = [];
    enemyBullets = [];
    orbs = [];
    hazardState.wallInset = 0;

    boss.active = true;
    boss.x = W / 2;
    boss.y = 90;
    boss.hp = 100;
    boss.maxHp = 100;
    boss.shields = 3;
    updateCombatHud();

    const stage = stagesData[currentStageIndex];
    const myClientId = localStorage.getItem('mln_client_id');
    socket.emit('player:minigame_finish', {
      clientId: myClientId,
      stageId: stage ? stage.id : 1,
      score: Math.min(600, waveScoreEarned + Math.round(hero.hp * 2)),
      hpRemaining: hero.hp
    });

    addFloatingText(W / 2, H / 2, `BOSS XUẤT HIỆN: ${stage ? stage.bossName : 'BOSS'}!`, '#FFE600');

    setTimeout(() => {
      currentQuestionIndex = 0;
      openBossQuizModal();
    }, 850);
  }

  function updateBossBehavior(stage, dt, isEnraged) {
    boss.x += boss.vx * (isEnraged ? 1.6 : 1.0) * dt;
    if (boss.x < 90 || boss.x > W - 90) boss.vx *= -1;

    boss.attackTimer -= dt;
    const interval = isEnraged ? 0.28 : 0.65;
    if (boss.attackTimer <= 0) {
      boss.attackTimer = interval;
      boss.spiralAngle += 0.45;

      const count = isEnraged ? 6 : 4;
      const bSpeed = isEnraged ? 240 : 185;
      for (let i = 0; i < count; i++) {
        const a = boss.spiralAngle + (i * Math.PI * 2) / count;
        enemyBullets.push({
          x: boss.x,
          y: boss.y,
          vx: Math.cos(a) * bSpeed,
          vy: Math.sin(a) * bSpeed,
          r: 7,
          dmg: 15,
          color: isEnraged ? '#EF4444' : boss.color
        });
      }

      const aimAngle = Math.atan2(hero.y - boss.y, hero.x - boss.x);
      enemyBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(aimAngle) * (bSpeed + 45),
        vy: Math.sin(aimAngle) * (bSpeed + 45),
        r: 8,
        dmg: 16,
        color: '#FFE600'
      });
    }
  }

  function damageHero(amount) {
    if (hero.invulnTimer > 0 || hero.stunTimer > 0) return;
    window.soundFx.hitTrap();
    haptic(25);
    hero.hp = Math.max(0, hero.hp - amount);
    hero.invulnTimer = 0.55;
    screenShake = 8;
    addFloatingText(hero.x, hero.y - 18, `-${amount} HP`, '#EF4444');
    updateCombatHud();

    if (hero.hp <= 0) {
      handleBurnout();
    }
  }

  function handleBurnout() {
    window.soundFx.burnout();
    haptic(60);
    const stage = stagesData[currentStageIndex];
    const myClientId = localStorage.getItem('mln_client_id');
    socket.emit('player:burnout', { clientId: myClientId, stageId: stage ? stage.id : 1 });

    hero.hp = 100;
    hero.stunTimer = 1.6;
    hero.invulnTimer = 2.8;
    enemyBullets = [];
    screenShake = 16;
    addFloatingText(W / 2, H / 2, 'BURNOUT KIỆT SỨC! (-300 ĐIỂM)', '#EF4444');
    updateCombatHud();
  }

  // ==================== BOSS SHIELD QUIZ & ENRAGE PENALTY ====================
  function openBossQuizModal() {
    const stage = stagesData[currentStageIndex];
    if (!stage) return;
    const question = stage.questions[currentQuestionIndex];
    if (!question) return;

    combatPhase = 'BOSS_QUIZ';
    window.soundFx.setMusic('quiz', currentStageIndex);
    hasAnsweredCurrentQuestion = false;
    questionStartTime = Date.now();

    const activeStageId = stage.id;
    const activeQuestionId = question.id;

    quizBadge.textContent = `PHÁ LỚP KHIÊN BOSS ${currentQuestionIndex + 1} / 3 (TẦNG ${stage.id})`;
    quizSlideRef.textContent = stage.slideRef;
    quizQuestionText.textContent = question.question;
    quizExplanationBox.style.display = 'none';
    btnNextQuestion.style.display = 'none';
    bossQuizOverlay.style.display = 'flex';

    const badges = ['A', 'B', 'C', 'D'];
    quizOptionsList.innerHTML = question.options.map((opt, idx) => `
      <button class="option-btn" type="button" data-index="${idx}">
        <span class="opt-badge">${badges[idx]}</span>
        <span class="opt-text">${opt}</span>
      </button>
    `).join('');

    quizOptionsList.querySelectorAll('.option-btn').forEach(btn => {
      const handleSelect = (e) => {
        if (e && e.type === 'touchstart') e.preventDefault();
        if (hasAnsweredCurrentQuestion) return;
        haptic(12);

        btn.classList.add('selected');
        quizOptionsList.querySelectorAll('.option-btn').forEach(b => {
          if (b !== btn) b.classList.add('dimmed');
        });

        submitQuizAnswer(parseInt(btn.getAttribute('data-index'), 10), btn, activeStageId, activeQuestionId);
      };

      btn.addEventListener('click', handleSelect);
      btn.addEventListener('touchstart', handleSelect, { passive: false });
    });

    startQuestionTimer(question.timeLimit || 12, activeStageId, activeQuestionId);
  }

  function startQuestionTimer(limitSec, stageId, questionId) {
    clearQuestionTimer();
    let remainingMs = limitSec * 1000;
    const totalMs = remainingMs;

    qTimerFill.style.width = '100%';
    quizCountdownBadge.textContent = `${limitSec}s`;

    questionTimerInterval = setInterval(() => {
      remainingMs -= 100;
      const pct = Math.max(0, (remainingMs / totalMs) * 100);
      qTimerFill.style.width = `${pct}%`;
      quizCountdownBadge.textContent = `${Math.ceil(remainingMs / 1000)}s`;

      if (remainingMs <= 3000 && remainingMs % 1000 === 0) {
        window.soundFx.countdownBeep();
      }

      if (remainingMs <= 0) {
        clearQuestionTimer();
        if (!hasAnsweredCurrentQuestion) {
          submitQuizAnswer(-1, null, stageId, questionId);
        }
      }
    }, 100);
  }

  function clearQuestionTimer() {
    if (questionTimerInterval) {
      clearInterval(questionTimerInterval);
      questionTimerInterval = null;
    }
  }

  function submitQuizAnswer(selectedIndex, clickedBtn, stageId, questionId) {
    hasAnsweredCurrentQuestion = true;
    clearQuestionTimer();

    const stage = stagesData[currentStageIndex];
    const effectiveStageId = stageId || (stage ? stage.id : 1);
    const effectiveQuestionId = questionId || (stage && stage.questions[currentQuestionIndex] ? stage.questions[currentQuestionIndex].id : 'q1_1');
    const timeTaken = (Date.now() - questionStartTime) / 1000;

    if (clickedBtn) {
      clickedBtn.dataset.chosen = 'true';
    }

    const myClientId = localStorage.getItem('mln_client_id');

    socket.emit('player:submit_answer', {
      clientId: myClientId,
      stageId: effectiveStageId,
      questionId: effectiveQuestionId,
      selectedIndex,
      timeTakenSec: timeTaken
    });
  }

  socket.on('player:answer_result', ({ isCorrect, correctIndex, explanation, pointsEarned, currentScore, streak, alreadyAnswered }) => {
    if (myPlayer) {
      if (typeof currentScore === 'number') myPlayer.score = currentScore;
      if (typeof streak === 'number') myPlayer.streak = streak;
      if (isCorrect) myPlayer.answersCorrect = (myPlayer.answersCorrect || 0) + 1;
      if (typeof streak === 'number' && streak > (myPlayer.maxStreak || 0)) myPlayer.maxStreak = streak;
    }
    updateTopBar();

    const buttons = quizOptionsList.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      btn.classList.remove('selected', 'dimmed');
      if (idx === correctIndex) {
        btn.classList.add('correct');
      } else if (btn.dataset.chosen === 'true') {
        btn.classList.add('wrong');
      }
    });

    if (isCorrect) {
      window.soundFx.shieldBreak();
      haptic(20);
      boss.shields = Math.max(0, boss.shields - 1);
      boss.hp = Math.max(35, boss.hp - 22);
      hero.hp = Math.min(hero.maxHp, hero.hp + 20);
      updateCombatHud();

      quizExplanationBox.innerHTML = `
        <div style="font-weight: 800; color: #34D399; margin-bottom: 4px;">
          PHÁ VỠ LỚP KHIÊN BOSS! (+${pointsEarned || 0} điểm • Hồi +20 HP)
        </div>
        <div>${explanation || ''}</div>
      `;
      quizExplanationBox.style.display = 'block';

      btnNextQuestion.textContent = (currentQuestionIndex >= 2)
        ? 'KẾT LIỄU BOSS (XẢ ĐẠN CUỐI) ➔'
        : 'PHÁ LỚP KHIÊN TIẾP THEO ➔';
      btnNextQuestion.className = 'btn btn-primary';
      btnNextQuestion.style.display = 'inline-flex';

      btnNextQuestion.onclick = () => {
        window.soundFx.click();
        bossQuizOverlay.style.display = 'none';
        if (currentQuestionIndex >= 2) {
          startBossFinishPhase();
        } else {
          currentQuestionIndex++;
          openBossQuizModal();
        }
      };
    } else {
      window.soundFx.bossEnrage();
      haptic(50);
      const safeBadge = ['A', 'B', 'C', 'D'][correctIndex] || 'Đáp án';
      quizExplanationBox.innerHTML = `
        <div style="font-weight: 800; color: #F87171; margin-bottom: 4px;">
          TRẢ LỜI SAI! BỊ PHẠT ${pointsEarned || -250} ĐIỂM &amp; MẤT COMBO!
        </div>
        <div style="margin-bottom: 6px;"><b>Đáp án đúng là ${safeBadge}:</b> ${explanation || ''}</div>
        <div style="color: #FFE600; font-weight: 700;">
          CẢNH BÁO: Boss đang nổi giận! Hãy chuẩn bị LƯỚT NÉ mưa đạn trong 6 giây!
        </div>
      `;
      quizExplanationBox.style.display = 'block';

      btnNextQuestion.textContent = 'VÀO NÉ MƯA ĐẠN CỦA BOSS (6 GIÂY)';
      btnNextQuestion.className = 'btn btn-danger';
      btnNextQuestion.style.display = 'inline-flex';

      btnNextQuestion.onclick = () => {
        btnNextQuestion.className = 'btn btn-primary';
        bossQuizOverlay.style.display = 'none';
        startBossEnragePhase();
      };
    }

    try {
      btnNextQuestion.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) {}
  });

  function resolveEnrage() {
    if (combatPhase !== 'BOSS_ENRAGE') return;
    combatPhase = 'BOSS_ENRAGE_RESOLVED';
    enrageEndsAt = 0;
    enrageBanner.style.display = 'none';
    arenaWrapper.classList.remove('enrage-border');
    enemyBullets = [];
    boss.shields = Math.max(0, boss.shields - 1);
    boss.hp = Math.max(35, boss.hp - 20);
    try { window.soundFx.shieldBreak(); } catch (e) {}
    addFloatingText(boss.x, boss.y, 'SỐNG SÓT! KHIÊN NỨT VỠ!', '#34D399');
    updateCombatHud();

    if (currentQuestionIndex >= 2) {
      startBossFinishPhase();
    } else {
      currentQuestionIndex++;
      setTimeout(() => openBossQuizModal(), 650);
    }
  }

  function startBossEnragePhase() {
    combatPhase = 'BOSS_ENRAGE';
    try { window.soundFx.setMusic('enrage', currentStageIndex); } catch (e) {}
    enrageTimeLeft = 6.0;
    enrageEndsAt = Date.now() + 6000;
    enrageBanner.style.display = 'block';
    arenaWrapper.classList.add('enrage-border');
    hero.invulnTimer = 0.8;
    window.soundFx.bossEnrage();
  }

  function startBossFinishPhase() {
    combatPhase = 'BOSS_FINISH';
    window.soundFx.setMusic('boss', currentStageIndex);
    boss.shields = 0;
    boss.hp = 35;
    updateCombatHud();
    addFloatingText(boss.x, boss.y + 40, 'VỠ GIÁP! XẢ ĐẠN KẾT LIỄU BOSS!', '#FFE600');
  }

  function completeCurrentStage() {
    window.soundFx.stageClear();
    haptic(30);
    spawnParticles(boss.x, boss.y, '#FFE600', 30);
    boss.active = false;
    enemyBullets = [];
    combatPhase = 'BRIEFING';

    const stage = stagesData[currentStageIndex];
    const myClientId = localStorage.getItem('mln_client_id');
    socket.emit('player:advance_stage', {
      clientId: myClientId,
      fromStage: stage.id,
      bossKillBonus: 350 + Math.round(hero.hp * 1.5)
    });
  }

  socket.on('player:stage_advanced', ({ newStage, newScore }) => {
    if (myPlayer && typeof newScore === 'number') myPlayer.score = newScore;
    currentStageIndex = newStage - 1;
    prepareStage(currentStageIndex);
  });

  socket.on('player:game_completed', ({ player }) => {
    if (player) myPlayer = player;
    stopArenaLoop();
    window.soundFx.stopMusic();
    window.soundFx.victoryFanfare();
    setTimeout(() => window.soundFx.setMusic('victory', 4), 2200);
    showFinishScreen();
  });

  function showFinishScreen() {
    showScreen('finish');
    if (!myPlayer) return;
    finishScore.textContent = myPlayer.score.toLocaleString();
    finishCorrect.textContent = `${myPlayer.answersCorrect || 0} / 15`;
    finishStreak.textContent = `x${myPlayer.maxStreak || myPlayer.streak || 0}`;

    const elapsedMs = Date.now() - (gameStartTime || Date.now());
    const m = Math.floor(elapsedMs / 60000);
    const s = Math.floor((elapsedMs % 60000) / 1000);
    finishTime.textContent = `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  // ==================== VISUAL EFFECTS & VECTOR CANVAS RENDERER ====================
  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = Math.random() * 140 + 40;
      particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        color,
        life: 0.35 + Math.random() * 0.25
      });
    }
  }

  function addFloatingText(x, y, text, color) {
    floatingTexts.push({
      x: Math.max(60, Math.min(W - 60, x)),
      y: Math.max(30, Math.min(H - 30, y)),
      text,
      color,
      life: 0.95
    });
  }

  function renderArena() {
    if (enemyBullets.length > 160) enemyBullets.splice(0, enemyBullets.length - 160);
    if (particles.length > 220) particles.splice(0, particles.length - 220);
    if (floatingTexts.length > 12) floatingTexts.splice(0, floatingTexts.length - 12);
    if (window.ArenaGfx) {
      window.ArenaGfx.render(ctx, {
        W, H, hero, boss, enemies, playerBullets, enemyBullets, orbs, particles,
        floatingTexts, shockwaves, hazardState, combatPhase, screenShake,
        stage: stagesData[currentStageIndex], stageIndex: currentStageIndex
      });
      return;
    }
    renderArenaLegacy();
  }

  function renderArenaLegacy() {
    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
    }

    // 1. Greco-Roman Pantheon Floor Medallion & Architectural Lines
    ctx.fillStyle = '#060913';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 50; x < W; x += 50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 50; y < H; y += 50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Center Pantheon Rings
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 130, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 230, 0, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const stage = stagesData[currentStageIndex];
    if (stage) {
      renderStageHazards(stage);
    }

    // 2. Shockwaves (EMP)
    shockwaves.forEach(sw => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(168, 85, 247, ${sw.alpha})`;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    });

    // 3. Energy Orbs (Diamond crystals)
    orbs.forEach(o => {
      ctx.save();
      ctx.translate(o.x, o.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-6, -6, 12, 12);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-6, -6, 12, 12);
      ctx.restore();
    });

    // 4. Dash Afterimages
    hero.afterimages.forEach(a => {
      ctx.save();
      ctx.globalAlpha = a.alpha * 0.45;
      ctx.beginPath();
      ctx.arc(a.x, a.y, hero.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#38BDF8';
      ctx.fill();
      ctx.restore();
    });

    // 5. Vector Hero Ship / Avatar Core + Integrated HP Ring
    ctx.save();
    if (hero.invulnTimer > 0 && Math.floor(performance.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }

    // Integrated HP Arc around Hero
    const hpRatio = Math.max(0, hero.hp / hero.maxHp);
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, hero.radius + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * hpRatio);
    ctx.strokeStyle = hpRatio > 0.35 ? '#34D399' : '#EF4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Directional Pointer
    ctx.save();
    ctx.translate(hero.x, hero.y);
    ctx.rotate(hero.aimAngle);
    ctx.beginPath();
    ctx.moveTo(hero.radius + 7, 0);
    ctx.lineTo(hero.radius - 2, -6);
    ctx.lineTo(hero.radius - 2, 6);
    ctx.closePath();
    ctx.fillStyle = '#FFE600';
    ctx.fill();
    ctx.restore();

    // Core Body
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, hero.radius, 0, Math.PI * 2);
    ctx.fillStyle = hero.overdriveActiveTimer > 0 ? '#FFE600' : '#0056D2';
    ctx.strokeStyle = '#F8FAFC';
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    // Inner Core Dot
    ctx.beginPath();
    ctx.arc(hero.x, hero.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = hero.overdriveActiveTimer > 0 ? '#060913' : '#FFE600';
    ctx.fill();
    ctx.restore();

    // 6. Vector Enemies
    enemies.forEach(en => {
      ctx.save();
      ctx.translate(en.x, en.y);
      ctx.beginPath();
      ctx.arc(0, 0, en.r, 0, Math.PI * 2);
      ctx.fillStyle = '#182544';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.font = '800 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#FCA5A5';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(en.label || 'm', 0, 1);
      ctx.restore();
    });

    // 7. Vector Boss Entity
    if (boss.active) {
      ctx.save();
      for (let s = 0; s < boss.shields; s++) {
        ctx.beginPath();
        ctx.arc(boss.x, boss.y, boss.radius + 8 + s * 6, 0, Math.PI * 2);
        ctx.strokeStyle = combatPhase === 'BOSS_ENRAGE' ? '#EF4444' : '#38BDF8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
      ctx.fillStyle = combatPhase === 'BOSS_ENRAGE' ? '#7F1D1D' : '#111A30';
      ctx.strokeStyle = boss.color;
      ctx.lineWidth = 3.5;
      ctx.fill();
      ctx.stroke();

      // Geometric Boss Core
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = boss.color;
      ctx.fill();

      ctx.font = '900 11px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#060913';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BOSS', boss.x, boss.y + 1);

      if (combatPhase === 'BOSS_FINISH') {
        ctx.font = '800 11px "Be Vietnam Pro", sans-serif';
        ctx.fillStyle = '#FFE600';
        ctx.fillText('VỠ GIÁP - BẮN KẾT LIỄU!', boss.x, boss.y - boss.radius - 12);
      }
      ctx.restore();
    }

    // 8. Player Bullets
    playerBullets.forEach(b => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.restore();
    });

    // 9. Enemy Bullets
    enemyBullets.forEach(b => {
      ctx.save();
      if (b.isShuttle) {
        ctx.fillStyle = '#FFE600';
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.fillRect(b.x - 16, b.y - 9, 32, 18);
        ctx.strokeRect(b.x - 16, b.y - 9, 32, 18);
      } else {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // 10. Particles & Floating Text
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    });

    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.font = '800 12px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function renderStageHazards(stage) {
    const type = stage.waveConfig.specialHazard;

    if (type === 'shuttle_charge' && hazardState.shuttleWarningY !== null) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.24)';
      ctx.fillRect(0, hazardState.shuttleWarningY - 16, W, 32);
      ctx.font = '800 11px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#FCA5A5';
      ctx.textAlign = 'center';
      ctx.fillText('CẢNH BÁO XE SHUTTLE LAO NGANG! HÃY LƯỚT NÉ!', W / 2, hazardState.shuttleWarningY + 4);
      ctx.restore();
    } else if (type === 'moving_safe_zone' && combatPhase === 'WAVE') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(hazardState.safeZoneX, hazardState.safeZoneY, hazardState.safeZoneRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.07)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      ctx.font = '700 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#38BDF8';
      ctx.textAlign = 'center';
      ctx.fillText('VÙNG AN TOÀN TƯ BẢN KHẢ BIẾN (v)', hazardState.safeZoneX, hazardState.safeZoneY - hazardState.safeZoneRadius + 15);
      ctx.restore();
    } else if (type === 'shrinking_walls' && hazardState.wallInset > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(0, 0, hazardState.wallInset, H);
      ctx.fillRect(W - hazardState.wallInset, 0, hazardState.wallInset, H);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hazardState.wallInset, 0); ctx.lineTo(hazardState.wallInset, H);
      ctx.moveTo(W - hazardState.wallInset, 0); ctx.lineTo(W - hazardState.wallInset, H);
      ctx.stroke();
      ctx.restore();
    } else if (type === 'gravity_vortex') {
      ctx.save();
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.strokeStyle = '#A855F7';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.font = '700 10px "Be Vietnam Pro", sans-serif';
      ctx.fillStyle = '#D8B4FE';
      ctx.textAlign = 'center';
      ctx.fillText('HỐ ĐEN OT 24/7', W / 2, H / 2 + 4);
      ctx.restore();
    } else if (type === 'laser_sweep') {
      const cx = W / 2;
      const cy = H / 2;
      const lx = cx + Math.cos(hazardState.laserAngle) * 260;
      const ly = cy + Math.sin(hazardState.laserAngle) * 260;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();
    }
  }

  init();
})();
