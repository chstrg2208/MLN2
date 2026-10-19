/**
 * ADMIN & PROJECTOR DASHBOARD CONTROLLER
 * MLN122 - Group 1 (GD1906)
 */

(function () {
  const socket = io();

  // State
  let isAuthenticated = false;
  let currentLeaderboard = [];
  let currentQrData = '';
  let activePublicUrl = '';

  // DOM Elements
  const loginOverlay = document.getElementById('admin-login-overlay');
  const adminPassInput = document.getElementById('admin-pass');
  const btnAdminLogin = document.getElementById('btn-admin-login');
  const adminDashboard = document.getElementById('admin-dashboard');

  const adminGameStatus = document.getElementById('admin-game-status');
  const adminTimer = document.getElementById('admin-timer');
  const btnStartGame = document.getElementById('btn-start-game');
  const btnAddTime = document.getElementById('btn-add-time');
  const btnFinishGame = document.getElementById('btn-finish-game');
  const btnResetGame = document.getElementById('btn-reset-game');
  const btnExportCsv = document.getElementById('btn-export-csv');

  const adminQrBox = document.getElementById('admin-qr-box');
  const adminQrImg = document.getElementById('admin-qr-img');
  const adminJoinLink = document.getElementById('admin-join-link');
  const adminPublicUrl = document.getElementById('admin-public-url');
  const adminLanUrl = document.getElementById('admin-lan-url');
  const adminPlayerCounter = document.getElementById('admin-player-counter');
  const adminLiveFeed = document.getElementById('admin-live-feed');

  // Race Track columns
  const raceStageColumns = {
    1: document.getElementById('players-stage-1'),
    2: document.getElementById('players-stage-2'),
    3: document.getElementById('players-stage-3'),
    4: document.getElementById('players-stage-4'),
    5: document.getElementById('players-stage-5'),
    finished: document.getElementById('players-stage-finished')
  };

  const raceStageCounts = {
    1: document.getElementById('count-stage-1'),
    2: document.getElementById('count-stage-2'),
    3: document.getElementById('count-stage-3'),
    4: document.getElementById('count-stage-4'),
    5: document.getElementById('count-stage-5'),
    finished: document.getElementById('count-stage-finished')
  };

  const adminLeaderboardTbody = document.getElementById('admin-leaderboard-tbody');

  // Fullscreen QR Modal
  const btnToggleFullscreenQr = document.getElementById('btn-toggle-fullscreen-qr');
  const fullscreenQrModal = document.getElementById('fullscreen-qr-modal');
  const fullscreenQrImg = document.getElementById('fullscreen-qr-img');
  const fullscreenQrUrl = document.getElementById('fullscreen-qr-url');
  const btnCloseFullscreenQr = document.getElementById('btn-close-fullscreen-qr');

  // Podium Modal
  const podiumModal = document.getElementById('podium-modal');
  const btnClosePodium = document.getElementById('btn-close-podium');
  const btnPodiumReset = document.getElementById('btn-podium-reset');
  const confettiCanvas = document.getElementById('confetti-canvas');

  // Login click
  btnAdminLogin.addEventListener('click', () => {
    window.soundFx.click();
    const pass = adminPassInput.value.trim();
    socket.emit('admin:login', { password: pass });
  });

  adminPassInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') btnAdminLogin.click();
  });

  // Socket: Admin Auth Success
  socket.on('admin:auth_success', (data) => {
    isAuthenticated = true;
    loginOverlay.style.display = 'none';
    adminDashboard.style.display = 'block';

    updateNetworkInfo(data);
    updateGameState(data.gameState);
    updateTimerDisplay(data.timeRemaining);
    renderLeaderboard(data.leaderboard);
  });

  socket.on('admin:auth_error', ({ message }) => {
    alert(message || 'Mật khẩu sai!');
  });

  // Socket: Network URL & QR Code Update
  socket.on('server:network_update', (data) => {
    updateNetworkInfo(data);
  });

  function updateNetworkInfo(data) {
    if (data.qrCode) {
      currentQrData = data.qrCode;
      adminQrImg.src = data.qrCode;
      fullscreenQrImg.src = data.qrCode;
    }
    if (data.lanUrl) adminLanUrl.textContent = data.lanUrl;
    if (data.publicUrl) {
      activePublicUrl = data.publicUrl;
      adminPublicUrl.textContent = data.publicUrl;
      adminJoinLink.textContent = data.publicUrl;
      adminJoinLink.href = data.publicUrl;
      fullscreenQrUrl.textContent = data.publicUrl;
    } else if (data.lanUrl) {
      activePublicUrl = data.lanUrl;
      adminPublicUrl.textContent = 'Mạng LAN nội bộ';
      adminJoinLink.textContent = data.lanUrl;
      adminJoinLink.href = data.lanUrl;
      fullscreenQrUrl.textContent = data.lanUrl;
    }
  }

  // Socket: Lobby player count update
  socket.on('lobby:update', ({ playerCount }) => {
    adminPlayerCounter.textContent = playerCount;
  });

  // Socket: Timer tick
  socket.on('timer:tick', ({ timeRemaining }) => {
    updateTimerDisplay(timeRemaining);
  });

  function updateTimerDisplay(secs) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    adminTimer.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // Socket: Game started
  socket.on('game:started', () => {
    updateGameState('PLAYING');
    addLiveFeed('🚀 Admin đã bấm BẮT ĐẦU trận đấu 5 phút! Chúc cả lớp may mắn!');
  });

  // Socket: Game finished
  socket.on('game:finished', ({ leaderboard, top3 }) => {
    updateGameState('FINISHED');
    currentLeaderboard = leaderboard;
    openPodiumCeremony(leaderboard, top3);
  });

  // Socket: Game reset
  socket.on('game:reset', () => {
    updateGameState('LOBBY');
    updateTimerDisplay(300);
    currentLeaderboard = [];
    renderLeaderboard([]);
    addLiveFeed('🔄 Phòng chơi đã được reset về trạng thái ban đầu.');
  });

  // Socket: Realtime Leaderboard & Live Race Track update
  socket.on('leaderboard:update', ({ leaderboard, stageStats, feedEvent }) => {
    currentLeaderboard = leaderboard;
    renderLeaderboard(leaderboard);
    renderRaceTrack(leaderboard);
    if (feedEvent) {
      addLiveFeed(feedEvent);
    }
  });

  function updateGameState(state) {
    if (state === 'PLAYING') {
      adminGameStatus.textContent = '⚡ ĐANG THI ĐẤU (5 PHÚT)';
      adminGameStatus.style.color = '#10B981';
      btnStartGame.style.display = 'none';
      btnAddTime.style.display = 'inline-flex';
      btnFinishGame.style.display = 'inline-flex';
    } else if (state === 'FINISHED') {
      adminGameStatus.textContent = '🏆 ĐÃ KẾT THÚC';
      adminGameStatus.style.color = '#EF4444';
      btnStartGame.style.display = 'none';
      btnAddTime.style.display = 'none';
    } else {
      adminGameStatus.textContent = 'PHÒNG CHỜ (LOBBY)';
      adminGameStatus.style.color = '#FFEA00';
      btnStartGame.style.display = 'inline-flex';
      btnAddTime.style.display = 'none';
      btnFinishGame.style.display = 'none';
    }
  }

  // Render Live Race Track
  function renderRaceTrack(players) {
    // Clear old lists
    Object.values(raceStageColumns).forEach(col => { col.innerHTML = ''; });
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, finished: 0 };

    players.forEach(p => {
      const chip = document.createElement('div');
      chip.className = `race-player-chip ${p.isFinished ? 'finished' : ''}`;
      chip.innerHTML = `
        <span>${p.avatar.icon}</span>
        <span style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.nickname}</span>
        <span style="color: var(--accent-gold-bright); font-size: 0.72rem;">${p.score}đ</span>
      `;

      if (p.isFinished) {
        raceStageColumns.finished.appendChild(chip);
        counts.finished++;
      } else if (raceStageColumns[p.stage]) {
        raceStageColumns[p.stage].appendChild(chip);
        counts[p.stage]++;
      }
    });

    Object.keys(counts).forEach(k => {
      if (raceStageCounts[k]) raceStageCounts[k].textContent = counts[k];
    });
  }

  // Render Leaderboard Table
  function renderLeaderboard(players) {
    adminLeaderboardTbody.innerHTML = '';
    if (!players || players.length === 0) {
      adminLeaderboardTbody.innerHTML = `
        <tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">Chưa có người chơi nào vào phòng.</td></tr>
      `;
      return;
    }

    players.forEach((p, idx) => {
      const rank = idx + 1;
      let badgeClass = '';
      if (rank === 1) badgeClass = 'rank-1';
      else if (rank === 2) badgeClass = 'rank-2';
      else if (rank === 3) badgeClass = 'rank-3';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="rank-badge ${badgeClass}">${rank}</span></td>
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2rem;">${p.avatar.icon}</span>
            <div>
              <div style="font-weight: 800; color: #FFFFFF;">${p.nickname}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${p.answersCorrect || 0}/15 khiên • 🔥x${p.streak || 0} ${p.burnoutCount ? `• 💀${p.burnoutCount}` : ''}</div>
            </div>
          </div>
        </td>
        <td>
          <span style="font-size: 0.8rem; font-weight: 700; color: ${p.isFinished ? '#10B981' : '#60A5FA'};">
            ${p.isFinished ? '🏆 Phá đảo' : `⚔️ Tầng ${p.stage}`}
          </span>
        </td>
        <td style="text-align: right; font-weight: 900; color: var(--accent-gold-bright);">
          ${p.score.toLocaleString()}đ
        </td>
        <td style="text-align: center;">
          <button class="btn btn-secondary btn-kick" data-id="${p.id}" style="padding: 4px 8px; font-size: 0.7rem; width: auto; border-radius: 6px;" title="Xóa người chơi">
            ❌
          </button>
        </td>
      `;

      tr.querySelector('.btn-kick').addEventListener('click', () => {
        if (confirm(`Bạn có chắc muốn mời "${p.nickname}" ra khỏi phòng?`)) {
          socket.emit('admin:kick_player', { playerId: p.id });
        }
      });

      adminLeaderboardTbody.appendChild(tr);
    });
  }

  function addLiveFeed(text) {
    const item = document.createElement('div');
    item.style.padding = '8px 10px';
    item.style.background = 'rgba(255, 255, 255, 0.03)';
    item.style.borderRadius = '8px';
    item.style.border = '1px solid rgba(255, 230, 0, 0.25)';
    item.textContent = text;

    adminLiveFeed.prepend(item);
    if (adminLiveFeed.children.length > 20) {
      adminLiveFeed.lastChild.remove();
    }
  }

  // Fullscreen QR Toggle
  btnToggleFullscreenQr.addEventListener('click', () => {
    fullscreenQrModal.style.display = 'flex';
  });
  adminQrBox.addEventListener('click', () => {
    fullscreenQrModal.style.display = 'flex';
  });
  btnCloseFullscreenQr.addEventListener('click', () => {
    fullscreenQrModal.style.display = 'none';
  });

  // Admin Actions
  btnStartGame.addEventListener('click', () => {
    window.soundFx.click();
    socket.emit('admin:start_game', { durationSec: 300 });
  });

  btnAddTime.addEventListener('click', () => {
    window.soundFx.click();
    socket.emit('admin:add_time', { seconds: 30 });
    addLiveFeed('⏱️ Admin đã cộng thêm +30 giây vào đồng hồ thi đấu!');
  });

  btnFinishGame.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn kết thúc trận đấu và mở Lễ trao thưởng Top 1-2-3 ngay bây giờ?')) {
      window.soundFx.click();
      socket.emit('admin:finish_game');
    }
  });

  btnResetGame.addEventListener('click', () => {
    if (confirm('Bạn có muốn reset toàn bộ phòng chơi về trạng thái ban đầu?')) {
      window.soundFx.click();
      socket.emit('admin:reset_game');
    }
  });

  // Xuất file CSV bảng điểm
  btnExportCsv.addEventListener('click', () => {
    if (currentLeaderboard.length === 0) {
      alert('Chưa có dữ liệu bảng điểm để xuất!');
      return;
    }

    let csvContent = '\uFEFFHạng,Biệt danh,Hình đại diện,Màn đạt được,Số câu đúng,Tổng điểm,Trạng thái\n';
    currentLeaderboard.forEach((p, idx) => {
      csvContent += `${idx + 1},"${p.nickname}","${p.avatar.name}",${p.stage},${p.answersCorrect || 0}/15,${p.score},"${p.isFinished ? 'Đã về đích' : 'Đang chơi'}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `BangDiem_MLN122_Group1_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });

  // ==================== PODIUM CEREMONY & CONFETTI ====================
  function openPodiumCeremony(leaderboard, top3) {
    podiumModal.style.display = 'flex';
    window.soundFx.victoryFanfare();
    startConfetti();

    // Populate Top 1
    const p1 = leaderboard[0];
    if (p1) {
      document.getElementById('podium-avatar-1').textContent = p1.avatar.icon;
      document.getElementById('podium-name-1').textContent = p1.nickname;
      document.getElementById('podium-score-1').textContent = `${p1.score.toLocaleString()}đ`;
      document.getElementById('podium-sub-1').textContent = `🏆 TOP 1 (${p1.answersCorrect || 0}/15 câu đúng)`;
    } else {
      document.getElementById('podium-name-1').textContent = 'Chưa có';
    }

    // Populate Top 2
    const p2 = leaderboard[1];
    if (p2) {
      document.getElementById('podium-avatar-2').textContent = p2.avatar.icon;
      document.getElementById('podium-name-2').textContent = p2.nickname;
      document.getElementById('podium-score-2').textContent = `${p2.score.toLocaleString()}đ`;
      document.getElementById('podium-sub-2').textContent = `🥈 TOP 2 (${p2.answersCorrect || 0}/15 câu đúng)`;
    } else {
      document.getElementById('podium-name-2').textContent = '-';
    }

    // Populate Top 3
    const p3 = leaderboard[2];
    if (p3) {
      document.getElementById('podium-avatar-3').textContent = p3.avatar.icon;
      document.getElementById('podium-name-3').textContent = p3.nickname;
      document.getElementById('podium-score-3').textContent = `${p3.score.toLocaleString()}đ`;
      document.getElementById('podium-sub-3').textContent = `🥉 TOP 3 (${p3.answersCorrect || 0}/15 câu đúng)`;
    } else {
      document.getElementById('podium-name-3').textContent = '-';
    }

    // Top 4 - 10
    const honorList = document.getElementById('podium-honor-list');
    honorList.innerHTML = '';
    const top4to10 = leaderboard.slice(3, 10);
    if (top4to10.length === 0) {
      honorList.innerHTML = '<div style="color: var(--text-muted);">Không có thêm người chơi khác.</div>';
    } else {
      top4to10.forEach((p, idx) => {
        const item = document.createElement('div');
        item.style.padding = '4px 8px';
        item.style.background = 'rgba(255,255,255,0.04)';
        item.style.borderRadius = '6px';
        item.innerHTML = `<b>#${idx + 4}</b> ${p.avatar.icon} <b>${p.nickname}</b>: <span style="color:var(--accent-gold);">${p.score.toLocaleString()}đ</span>`;
        honorList.appendChild(item);
      });
    }
  }

  btnClosePodium.addEventListener('click', () => {
    podiumModal.style.display = 'none';
    stopConfetti();
  });

  btnPodiumReset.addEventListener('click', () => {
    podiumModal.style.display = 'none';
    stopConfetti();
    socket.emit('admin:reset_game');
  });

  // Confetti Engine
  let confettiAnimId = null;
  function startConfetti() {
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#FFD700', '#FFEA00', '#0056D2', '#10B981', '#EF4444', '#FFFFFF'];

    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 10 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: Math.random() * 4 - 2,
        speedY: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 8 - 4
      });
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();

        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.rotationSpeed;

        if (p.y > canvas.height) {
          p.y = -20;
          p.x = Math.random() * canvas.width;
        }
      });
      confettiAnimId = requestAnimationFrame(render);
    }
    render();
  }

  function stopConfetti() {
    if (confettiAnimId) {
      cancelAnimationFrame(confettiAnimId);
      confettiAnimId = null;
    }
    const canvas = confettiCanvas;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Tự động thử đăng nhập bằng mật khẩu mặc định
  setTimeout(() => {
    btnAdminLogin.click();
  }, 500);

})();
