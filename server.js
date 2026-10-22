const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const QRCode = require('qrcode');
const cors = require('cors');
const { STAGES, AVATARS } = require('./data/gameData');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'group1';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Trạng thái Server & Game
let gameState = 'LOBBY'; // 'LOBBY' | 'PLAYING' | 'FINISHED'
let gameDuration = 300; // 5 phút = 300s
let timeRemaining = gameDuration;
let timerInterval = null;
let publicTunnelUrl = null;
let lanUrl = null;
let qrCodeBase64 = null;
let activeTunnel = null;

// Quản lý người chơi: map clientId -> Player Object
const players = new Map();
const socketToPlayer = new Map();

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLanIp();
lanUrl = `http://${localIp}:${PORT}`;

async function updateQrCode(url) {
  try {
    qrCodeBase64 = await QRCode.toDataURL(url, {
      width: 400,
      margin: 2,
      color: {
        dark: '#003B8E',
        light: '#FFFFFF'
      }
    });
    return qrCodeBase64;
  } catch (err) {
    console.error('Lỗi sinh QR:', err);
    return null;
  }
}

async function setupTunnel() {
  try {
    console.log('[TUNNEL] Đang khởi tạo Cloudflare Quick Tunnel...');
    const { startTunnel } = await import('untun');
    activeTunnel = await startTunnel({ port: PORT });
    publicTunnelUrl = await activeTunnel.getURL();
    console.log(`[TUNNEL THÀNH CÔNG] Public URL: ${publicTunnelUrl}`);
    await updateQrCode(publicTunnelUrl);
    io.emit('server:network_update', {
      publicUrl: publicTunnelUrl,
      lanUrl: lanUrl,
      qrCode: qrCodeBase64
    });
  } catch (err) {
    console.warn('[TUNNEL CẢNH BÁO] Không thể tạo Public Tunnel tự động:', err.message);
    console.log(`[LAN FALLBACK] Sử dụng mạng LAN nội bộ: ${lanUrl}`);
    await updateQrCode(lanUrl);
  }
}

// Chuẩn hóa dữ liệu màn chơi gửi về client (ẩn đáp án đúng)
function getClientStages() {
  return STAGES.map(s => ({
    id: s.id,
    title: s.title,
    subtitle: s.subtitle,
    slideRef: s.slideRef,
    bossName: s.bossName,
    bossIcon: s.bossIcon,
    bossColor: s.bossColor,
    hazardDesc: s.hazardDesc,
    waveConfig: s.waveConfig,
    questions: s.questions.map(q => ({
      id: q.id,
      timeLimit: q.timeLimit || 12,
      question: q.question,
      options: q.options
    }))
  }));
}

function getLeaderboard() {
  const list = Array.from(players.values()).map(p => ({
    id: p.id,
    nickname: p.nickname,
    avatar: p.avatar,
    stage: p.stage,
    score: p.score,
    hp: p.hp,
    streak: p.streak,
    maxStreak: p.maxStreak,
    answersCorrect: p.answersCorrect,
    totalAnswered: p.totalAnswered,
    burnoutCount: p.burnoutCount || 0,
    bossesDefeated: p.bossesDefeated || 0,
    completedAt: p.completedAt,
    isFinished: p.isFinished,
    connected: p.connected
  }));

  list.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.isFinished && !b.isFinished) return -1;
    if (!a.isFinished && b.isFinished) return 1;
    if (a.completedAt && b.completedAt) return a.completedAt - b.completedAt;
    if (b.stage !== a.stage) return b.stage - a.stage;
    return b.answersCorrect - a.answersCorrect;
  });

  return list;
}

function getStageStats() {
  const stats = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, finished: 0, total: players.size };
  for (const p of players.values()) {
    if (p.isFinished) {
      stats.finished++;
    } else if (stats[p.stage] !== undefined) {
      stats[p.stage]++;
    }
  }
  return stats;
}

function startGameTimer(duration = 300) {
  if (timerInterval) clearInterval(timerInterval);
  gameDuration = duration;
  timeRemaining = duration;
  gameState = 'PLAYING';

  io.emit('game:started', {
    duration: gameDuration,
    timeRemaining: timeRemaining
  });

  timerInterval = setInterval(() => {
    timeRemaining--;
    io.emit('timer:tick', { timeRemaining });

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      finishGame();
    }
  }, 1000);
}

function finishGame() {
  gameState = 'FINISHED';
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  const leaderboard = getLeaderboard();
  io.emit('game:finished', {
    leaderboard: leaderboard,
    top3: leaderboard.slice(0, 3),
    top10: leaderboard.slice(0, 10)
  });
}

function resetGame() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState = 'LOBBY';
  timeRemaining = gameDuration;
  players.clear();
  socketToPlayer.clear();

  io.emit('game:reset', {
    status: gameState,
    timeRemaining: timeRemaining
  });
}

// REST API
app.get('/api/status', (req, res) => {
  res.json({
    gameState,
    timeRemaining,
    gameDuration,
    playerCount: players.size,
    lanUrl,
    publicTunnelUrl,
    activeUrl: publicTunnelUrl || lanUrl,
    qrCode: qrCodeBase64
  });
});

app.get('/api/stages', (req, res) => {
  res.json(getClientStages());
});

app.get('/api/avatars', (req, res) => {
  res.json(AVATARS);
});

app.get('/api/leaderboard', (req, res) => {
  res.json(getLeaderboard());
});

// Socket.io Event Handling
io.on('connection', (socket) => {
  socket.on('player:join', ({ clientId, nickname, avatarId }) => {
    if (!nickname || !nickname.trim()) {
      return socket.emit('player:error', { message: 'Vui lòng nhập tên của bạn!' });
    }

    const id = clientId || socket.id;
    let player = players.get(id);

    if (!player) {
      const chosenAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0];
      player = {
        id: id,
        socketId: socket.id,
        nickname: nickname.trim().substring(0, 25),
        avatar: chosenAvatar,
        stage: 1,
        score: 0,
        hp: 100,
        streak: 0,
        maxStreak: 0,
        answersCorrect: 0,
        totalAnswered: 0,
        burnoutCount: 0,
        bossesDefeated: 0,
        isFinished: false,
        completedAt: null,
        joinedAt: Date.now(),
        connected: true,
        answeredQuestions: {}
      };
      players.set(id, player);
    } else {
      player.socketId = socket.id;
      player.connected = true;
      if (nickname) player.nickname = nickname.trim().substring(0, 25);
    }

    socketToPlayer.set(socket.id, id);

    socket.emit('player:joined', {
      player: player,
      gameState: gameState,
      timeRemaining: timeRemaining,
      stages: getClientStages()
    });

    io.emit('lobby:update', {
      playerCount: players.size,
      players: Array.from(players.values()).map(p => ({
        id: p.id,
        nickname: p.nickname,
        avatar: p.avatar,
        score: p.score,
        stage: p.stage
      }))
    });

    io.emit('leaderboard:update', {
      leaderboard: getLeaderboard(),
      stageStats: getStageStats()
    });
  });

  // Hoàn thành Wave diệt quái / kết liễu Boss của 1 tầng
  socket.on('player:minigame_finish', ({ stageId, score, hpRemaining, clientId }) => {
    let playerId = socketToPlayer.get(socket.id) || clientId;
    let player = players.get(playerId);
    if (!player) return;
    if (clientId && !socketToPlayer.has(socket.id)) socketToPlayer.set(socket.id, clientId);
    if (gameState !== 'PLAYING') return;

    const validScore = Math.max(0, Math.min(score || 0, 800));
    player.score += validScore;
    if (typeof hpRemaining === 'number') {
      player.hp = Math.max(10, Math.min(100, Math.round(hpRemaining)));
    }

    socket.emit('player:score_updated', {
      score: player.score,
      added: validScore,
      reason: `Vượt ải chiến đấu Tầng ${stageId}`
    });

    io.emit('leaderboard:update', {
      leaderboard: getLeaderboard(),
      stageStats: getStageStats(),
      feedEvent: `⚔️ ${player.nickname} đã càn quét quái Tầng ${stageId} (+${validScore}đ) và đối mặt BOSS!`
    });
  });

  // Người chơi bị BURNOUT (HP về 0 do trúng mưa đạn)
  socket.on('player:burnout', ({ stageId, clientId }) => {
    let playerId = socketToPlayer.get(socket.id) || clientId;
    let player = players.get(playerId);
    if (!player) return;
    if (clientId && !socketToPlayer.has(socket.id)) socketToPlayer.set(socket.id, clientId);
    if (gameState !== 'PLAYING') return;

    const penalty = 300;
    player.score = Math.max(0, player.score - penalty);
    player.streak = 0;
    player.burnoutCount = (player.burnoutCount || 0) + 1;
    player.hp = 100;

    socket.emit('player:score_updated', {
      score: player.score,
      added: -penalty,
      reason: 'BURNOUT KIỆT SỨC!'
    });

    io.emit('leaderboard:update', {
      leaderboard: getLeaderboard(),
      stageStats: getStageStats(),
      feedEvent: `💀 ${player.nickname} vừa bị BURNOUT kiệt sức trước mưa đạn tại Tầng ${stageId} (-${penalty}đ)!`
    });
  });

  // Trả lời câu hỏi phá Khiên Boss (Có phạt thật khi trả lời SAI hoặc Hết giờ!)
  socket.on('player:submit_answer', ({ stageId, questionId, selectedIndex, timeTakenSec, clientId }) => {
    let playerId = socketToPlayer.get(socket.id) || clientId;
    let player = players.get(playerId);
    if (!player) return;
    if (clientId && !socketToPlayer.has(socket.id)) socketToPlayer.set(socket.id, clientId);

    if (gameState !== 'PLAYING') {
      return socket.emit('game:finished', {
        leaderboard: getLeaderboard()
      });
    }

    const stage = STAGES.find(s => s.id === stageId);
    if (!stage) return;
    const question = stage.questions.find(q => q.id === questionId);
    if (!question) return;

    if (player.answeredQuestions[questionId]) {
      const prev = player.answeredQuestions[questionId];
      return socket.emit('player:answer_result', {
        questionId,
        alreadyAnswered: true,
        isCorrect: prev.isCorrect,
        correctIndex: question.correct,
        explanation: question.explanation,
        pointsEarned: prev.pointsEarned || 0,
        currentScore: player.score,
        streak: player.streak,
        triggerEnrage: false
      });
    }

    const isCorrect = (selectedIndex === question.correct);
    let pointsDelta = 0;
    let feedEvent = null;

    if (isCorrect) {
      player.streak++;
      if (player.streak > player.maxStreak) player.maxStreak = player.streak;
      player.answersCorrect++;

      const timeLimit = question.timeLimit || 12;
      const speedBonus = Math.max(0, Math.round(300 * (1 - Math.min(timeTakenSec || 6, timeLimit) / timeLimit)));
      const streakBonus = Math.min((player.streak - 1) * 100, 400);

      pointsDelta = 600 + speedBonus + streakBonus;
      player.score += pointsDelta;

      if (player.streak >= 3) {
        feedEvent = `🔥 ${player.nickname} phá khiên Boss với chuỗi COMBO x${player.streak} (+${pointsDelta}đ)!`;
      }
    } else {
      // PHẠT THẬT: Trừ 250 điểm, mất sạch chuỗi Combo, kích hoạt Cơn Thịnh Nộ của Boss!
      player.streak = 0;
      pointsDelta = -250;
      player.score = Math.max(0, player.score + pointsDelta);
      feedEvent = `👹 ${player.nickname} trả lời SAI tại Tầng ${stageId} (-250đ) -> Kích hoạt CƠN THỊNH NỘ CỦA BOSS!`;
    }

    player.totalAnswered++;
    player.answeredQuestions[questionId] = {
      isCorrect,
      pointsEarned: pointsDelta,
      selectedIndex
    };

    socket.emit('player:answer_result', {
      questionId,
      isCorrect,
      correctIndex: question.correct,
      explanation: question.explanation,
      pointsEarned: pointsDelta,
      currentScore: player.score,
      streak: player.streak,
      triggerEnrage: !isCorrect
    });

    io.emit('leaderboard:update', {
      leaderboard: getLeaderboard(),
      stageStats: getStageStats(),
      feedEvent
    });
  });

  // Qua tầng kế tiếp sau khi tiêu diệt Boss
  socket.on('player:advance_stage', ({ fromStage, bossKillBonus, clientId }) => {
    let playerId = socketToPlayer.get(socket.id) || clientId;
    let player = players.get(playerId);
    if (!player) return;
    if (clientId && !socketToPlayer.has(socket.id)) socketToPlayer.set(socket.id, clientId);

    const bonus = Math.max(0, Math.min(bossKillBonus || 300, 500));
    player.score += bonus;
    player.bossesDefeated = Math.max(player.bossesDefeated || 0, fromStage);

    if (fromStage >= 5) {
      player.isFinished = true;
      if (!player.completedAt) {
        player.completedAt = Date.now();
        // Thưởng về đích dựa trên tốc độ còn lại của đồng hồ
        const timeBonus = Math.max(500, timeRemaining * 5);
        player.score += timeBonus;
      }
      socket.emit('player:game_completed', {
        player,
        leaderboard: getLeaderboard()
      });

      io.emit('leaderboard:update', {
        leaderboard: getLeaderboard(),
        stageStats: getStageStats(),
        feedEvent: `🏆 ${player.nickname} ĐÃ TIÊU DIỆT ĐẠI ĐẾ TƯ BẢN TẦNG 5 VÀ VỀ ĐÍCH VỚI ${player.score.toLocaleString()} ĐIỂM!`
      });
    } else {
      player.stage = fromStage + 1;
      socket.emit('player:stage_advanced', {
        newStage: player.stage,
        newScore: player.score
      });

      io.emit('leaderboard:update', {
        leaderboard: getLeaderboard(),
        stageStats: getStageStats(),
        feedEvent: `💥 ${player.nickname} đã hạ gục Boss Tầng ${fromStage} và tiến vào Tầng ${player.stage}!`
      });
    }
  });

  // Admin Login
  socket.on('admin:login', ({ password }) => {
    if (password === ADMIN_PASSWORD) {
      socket.emit('admin:auth_success', {
        authenticated: true,
        gameState,
        timeRemaining,
        gameDuration,
        lanUrl,
        publicTunnelUrl,
        qrCode: qrCodeBase64,
        leaderboard: getLeaderboard(),
        stageStats: getStageStats()
      });
    } else {
      socket.emit('admin:auth_error', { message: 'Mật khẩu quản trị không chính xác!' });
    }
  });

  socket.on('admin:start_game', ({ durationSec }) => {
    const duration = durationSec || 300;
    startGameTimer(duration);
  });

  socket.on('admin:add_time', ({ seconds }) => {
    if (gameState === 'PLAYING') {
      timeRemaining += seconds || 30;
      io.emit('timer:tick', { timeRemaining });
    }
  });

  socket.on('admin:finish_game', () => {
    finishGame();
  });

  socket.on('admin:reset_game', () => {
    resetGame();
  });

  socket.on('admin:kick_player', ({ playerId }) => {
    if (players.has(playerId)) {
      const p = players.get(playerId);
      players.delete(playerId);
      io.to(p.socketId).emit('player:kicked', { message: 'Bạn đã bị quản trị viên mời ra khỏi phòng.' });
      io.emit('leaderboard:update', {
        leaderboard: getLeaderboard(),
        stageStats: getStageStats()
      });
      io.emit('lobby:update', {
        playerCount: players.size,
        players: Array.from(players.values())
      });
    }
  });

  socket.on('admin:set_custom_url', async ({ customUrl }) => {
    if (customUrl && customUrl.trim()) {
      publicTunnelUrl = customUrl.trim();
      await updateQrCode(publicTunnelUrl);
      io.emit('server:network_update', {
        publicUrl: publicTunnelUrl,
        lanUrl: lanUrl,
        qrCode: qrCodeBase64
      });
    }
  });

  socket.on('disconnect', () => {
    const playerId = socketToPlayer.get(socket.id);
    if (playerId && players.has(playerId)) {
      const player = players.get(playerId);
      player.connected = false;
      io.emit('leaderboard:update', {
        leaderboard: getLeaderboard(),
        stageStats: getStageStats()
      });
    }
    socketToPlayer.delete(socket.id);
  });
});

server.listen(PORT, async () => {
  console.log('================================================================');
  console.log('⚔️ GAME MLN122: "ĐẤU TRƯỜNG THẶNG DƯ (SURPLUS SURVIVOR)" ĐÃ SẴN SÀNG!');
  console.log('🎯 Nhóm 1 - Lớp GD1906 - ĐH FPT');
  console.log(`🌐 Mạng LAN nội bộ: ${lanUrl}`);
  console.log(`🔑 Trang Quản trị (Admin): ${lanUrl}/admin.html`);
  console.log(`🔑 Mật khẩu Admin mặc định: ${ADMIN_PASSWORD}`);
  console.log('================================================================');

  await updateQrCode(lanUrl);
  setupTunnel();
});
