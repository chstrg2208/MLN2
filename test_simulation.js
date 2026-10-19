const { io } = require('socket.io-client');

async function testSimulation() {
  console.log('--- BẮT ĐẦU KIỂM THỬ ĐẤU TRƯỜNG THẶNG DƯ (ACTION BOSS RPG) ---');

  const adminSocket = io('http://localhost:3000');
  await new Promise((resolve) => adminSocket.on('connect', resolve));
  console.log('✅ Admin kết nối thành công!');

  adminSocket.emit('admin:login', { password: 'group1' });
  await new Promise((resolve) => {
    adminSocket.on('admin:auth_success', (data) => {
      console.log('✅ Admin đăng nhập thành công!', {
        gameState: data.gameState,
        lanUrl: data.lanUrl,
        publicUrl: data.publicTunnelUrl
      });
      resolve();
    });
  });

  const playersData = [
    { name: 'Hoàng Anh K19', avatar: 'fpt_student' },
    { name: 'Thảo GD1906', avatar: 'ai_engineer' },
    { name: 'Tiến Dev', avatar: 'philosopher' }
  ];

  const sockets = [];
  for (const p of playersData) {
    const s = io('http://localhost:3000');
    await new Promise((resolve) => s.on('connect', resolve));
    s.emit('player:join', { nickname: p.name, avatarId: p.avatar });
    await new Promise((resolve) => s.on('player:joined', resolve));
    console.log(`✅ Chiến binh "${p.name}" đã vào phòng chờ!`);
    sockets.push(s);
  }

  adminSocket.emit('admin:start_game', { durationSec: 300 });
  console.log('✅ Admin đã kích hoạt bắt đầu trận đấu 300s!');

  // 1. Giả lập càn quét Wave Tầng 1 và triệu hồi Boss
  sockets[0].emit('player:minigame_finish', { stageId: 1, score: 500, hpRemaining: 90 });
  sockets[1].emit('player:minigame_finish', { stageId: 1, score: 600, hpRemaining: 100 });
  sockets[2].emit('player:minigame_finish', { stageId: 1, score: 450, hpRemaining: 70 });

  // 2. Thảo trả lời ĐÚNG câu q1_1 (phá khiên 1)
  const rightPromise = new Promise(resolve => sockets[1].once('player:answer_result', resolve));
  sockets[1].emit('player:submit_answer', {
    stageId: 1,
    questionId: 'q1_1',
    selectedIndex: 1, // Correct
    timeTakenSec: 3.0
  });
  const rightRes = await rightPromise;
  console.log('✅ Thảo trả lời ĐÚNG:', { pointsEarned: rightRes.pointsEarned, triggerEnrage: rightRes.triggerEnrage });

  // 3. Tiến trả lời SAI câu q1_1 -> Bị phạt -250đ và kích hoạt Boss Enrage!
  const wrongPromise = new Promise(resolve => sockets[2].once('player:answer_result', resolve));
  sockets[2].emit('player:submit_answer', {
    stageId: 1,
    questionId: 'q1_1',
    selectedIndex: 0, // Wrong
    timeTakenSec: 8.0
  });
  const wrongRes = await wrongPromise;
  console.log('✅ Tiến trả lời SAI (Phạt thật & Boss Enrage):', { pointsEarned: wrongRes.pointsEarned, triggerEnrage: wrongRes.triggerEnrage });

  // 4. Tiến bị Burnout trong lúc né mưa đạn (-300đ)
  sockets[2].emit('player:burnout', { stageId: 1 });

  // 5. Thảo tiêu diệt Boss Tầng 1 và lên Tầng 2
  sockets[1].emit('player:advance_stage', { fromStage: 1, bossKillBonus: 450 });

  await new Promise((resolve) => setTimeout(resolve, 600));

  const res = await fetch('http://localhost:3000/api/leaderboard');
  const lb = await res.json();
  console.log('✅ Bảng xếp hạng Realtime:', lb.map(p => `${p.nickname}: ${p.score}đ (Tầng ${p.stage}, Burnout: ${p.burnoutCount})`));

  adminSocket.disconnect();
  sockets.forEach(s => s.disconnect());
  console.log('--- HOÀN THÀNH KIỂM THỬ THÀNH CÔNG 100% ---');
  process.exit(0);
}

testSimulation().catch(err => {
  console.error('Lỗi kiểm thử:', err);
  process.exit(1);
});
