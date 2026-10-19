/**
 * DỮ LIỆU GAME ACTION RPG / BULLET HELL: "ĐẤU TRƯỜNG THẶNG DƯ (SURPLUS SURVIVOR)"
 * Nhóm 1 - Lớp GD1906 - Môn MLN122 (Kinh tế Chính trị Mác - Lênin) - Đại học FPT
 * Nội dung bám sát 100% 18 slide thuyết trình: "Vốn nhân lực hay Giá trị thặng dư tinh vi?"
 */

const STAGES = [
  {
    id: 1,
    title: "Tầng 1: Mê Cung Phúc Lợi Big Tech",
    subtitle: "Nghịch Lý Quản Trị & People Operations",
    slideRef: "Slide 02 - 04",
    bossName: "AI QUẢN TRỊ PEOPLE ANALYTICS",
    bossIcon: "👁️",
    bossColor: "#3B82F6",
    hazardDesc: "Né xe Google Shuttle phóng ngang tốc độ cao & bắn hạ các Ma Sát Sinh Hoạt để nạp đầy năng lượng triệu hồi Boss!",
    waveConfig: {
      quota: 100, // Năng lượng cần thu thập để gọi Boss
      enemySpeed: 1.7,
      bulletSpeed: 3.2,
      spawnRateMs: 950,
      specialHazard: "shuttle_charge", // Xe buýt lao ngang có vạch cảnh báo đỏ
      enemyIcons: ["🍔", "🚌", "📊", "⏳"]
    },
    questions: [
      {
        id: "q1_1",
        timeLimit: 12,
        question: "[Tình huống - Slide 02] Một tập đoàn tuyên bố không gọi nhân viên là 'Nguồn nhân lực' (chi phí cần tối thiểu hóa) mà tôn vinh là 'Vốn nhân lực' (Human Capital). Dưới góc nhìn Kinh tế chính trị, mục đích cốt lõi của sự chuyển dịch khái niệm này là gì?",
        options: [
          "Xóa bỏ hoàn toàn quan hệ mua bán sức lao động trong doanh nghiệp",
          "Khẳng định đầu tư vào con người là yếu tố quyết định trực tiếp đến khả năng sinh lời và tạo thặng dư",
          "Chuyển toàn bộ quyền sở hữu tư liệu sản xuất của công ty cho người lao động",
          "Giảm bớt yêu cầu về năng suất và KPI đối với nhân sự"
        ],
        correct: 1,
        explanation: "Slide 02/18: Chuyển dịch từ 'Nguồn nhân lực' sang 'Vốn nhân lực' vì con người là yếu tố quyết định lợi nhuận, nâng cấp phương pháp tạo thặng dư tinh vi hơn."
      },
      {
        id: "q1_2",
        timeLimit: 12,
        question: "[Phân tích dữ liệu - Slide 03 & 04] Tại Google (Alphabet), mạng lưới 'g2g' chiếm hơn 80% hoạt động đào tạo nội bộ kết hợp với hệ thống 'People Analytics'. Sự kết hợp này mang lại lợi thế kinh tế nào cho nhà tư bản?",
        options: [
          "Dùng dữ liệu lớn đo lường hành vi để tối ưu hiệu suất cá nhân và tiết kiệm tối đa chi phí thuê chuyên gia đào tạo bên ngoài",
          "Cho phép nhân viên tự do nghỉ làm 80% thời gian trong tuần mà vẫn hưởng nguyên lương",
          "Thay thế hoàn toàn đội ngũ kỹ sư phần mềm bằng nhân sự hành chính",
          "Tách biệt các phòng ban để tránh nhân viên trao đổi công việc khi ăn trưa"
        ],
        correct: 0,
        explanation: "Slide 03 & 04/18: People Analytics dùng Big Data tối ưu hiệu suất từng cá nhân, còn mạng lưới g2g giúp nhân viên tự đào tạo lẫn nhau (>80%) và tạo hiệu ứng mạng lưới ngay cả khi xếp hàng ăn trưa."
      },
      {
        id: "q1_3",
        timeLimit: 12,
        question: "[Bẫy tư duy - Slide 04] Theo biểu đồ tác động của Vốn nhân lực tại Slide 04, vì sao 'Phúc lợi tại văn phòng (3 bữa ăn miễn phí, Shuttle, Gym)' lại chuyển hóa trực tiếp thành tốc độ xử lý công việc?",
        options: [
          "Vì nhân viên bị trừ 50% lương nếu không sử dụng phòng Gym mỗi ngày",
          "Vì nó triệt tiêu 'ma sát sinh hoạt' (lo lịch tàu xe, ra ngoài ăn trưa) và biến cả thời gian nghỉ ngơi thành không gian thảo luận công việc",
          "Vì luật pháp bắt buộc mọi công ty công nghệ phải xây dựng khu giải trí",
          "Vì phúc lợi văn phòng có chỉ số tác động cao hơn cả Quản trị OKRs/Dữ liệu"
        ],
        correct: 1,
        explanation: "Slide 04/18: Giảm ma sát sinh hoạt + Hiệu ứng mạng lưới (thảo luận việc ngay khi xếp hàng lấy đồ ăn) -> Tối ưu hóa toàn cục thành tốc độ xử lý công việc."
      }
    ]
  },
  {
    id: 2,
    title: "Tầng 2: Cối Xay Tư Bản C. Mác",
    subtitle: "Giải Phẫu Ngày Lao Động & Tỷ Suất m'",
    slideRef: "Slide 05 - 06",
    bossName: "CỖ MÁY KHAI THÁC THẶNG DƯ (M)",
    bossIcon: "⚙️",
    bossColor: "#F59E0B",
    hazardDesc: "Vùng an toàn Tư Bản Khả Biến (v) di chuyển liên tục! Đứng ngoài vòng bo sẽ bị rút máu! Hãy vừa giữ vị trí vừa bắn hạ mục tiêu!",
    waveConfig: {
      quota: 100,
      enemySpeed: 2.0,
      bulletSpeed: 3.6,
      spawnRateMs: 850,
      specialHazard: "moving_safe_zone", // Vòng bo v di chuyển, ở ngoài bị mất máu
      enemyIcons: ["💰", "⚖️", "📈", "⛓️"]
    },
    questions: [
      {
        id: "q2_1",
        timeLimit: 12,
        question: "[Tính toán nhanh - Slide 05 & 06] Một kỹ sư làm việc 8 giờ/ngày. Trong đó Thời gian lao động tất yếu (t) để tạo ra giá trị ngang bằng tiền công (v) là 2 giờ; 6 giờ còn lại là Thời gian lao động thặng dư (t'). Tỷ suất giá trị thặng dư (m') là bao nhiêu?",
        options: [
          "m' = 75%",
          "m' = 133%",
          "m' = 300%",
          "m' = 400%"
        ],
        correct: 2,
        explanation: "Slide 05 & 06/18: Áp dụng công thức m' = (t' / t) × 100% = (6 / 2) × 100% = 300%."
      },
      {
        id: "q2_2",
        timeLimit: 12,
        question: "[Bản chất lý luận - Slide 06] Dưới lớp vỏ ngôn từ nhân văn ('cộng sự', 'tài sản quý giá nhất', thưởng ESOP), C. Mác chỉ ra bản chất kinh tế thực sự của việc chi trả cho 'Vốn nhân lực' là gì?",
        options: [
          "Là khoản đầu tư vào Tư bản bất biến (c) để nâng cấp cơ sở hạ tầng",
          "Là đầu tư vào Tư bản khả biến (v) nhằm tái sản xuất sức lao động (thể lực & trí lực) để khai thác lượng giá trị thặng dư (m) gấp bội",
          "Là sự phân chia đồng đều khối lượng giá trị thặng dư (M) giữa chủ và thợ",
          "Là việc xóa bỏ tính chất hàng hóa của sức lao động trong nền kinh tế số"
        ],
        correct: 1,
        explanation: "Slide 06/18: Vốn nhân lực thực chất là đầu tư vào tư bản khả biến (v) — bồi dưỡng thể lực và trí lực để phóng đại tỷ suất m' và tổng khối lượng thặng dư M = m' × V."
      },
      {
        id: "q2_3",
        timeLimit: 12,
        question: "[Công thức nâng cao - Slide 06] Trong công thức Khối lượng giá trị thặng dư M = m' × V, nếu doanh nghiệp vừa nâng cao trình độ bóc lột (tăng m') vừa mở rộng quy mô quỹ lương tuyển dụng nhân tài (tăng tổng tư bản khả biến V) thì điều gì xảy ra?",
        options: [
          "Khối lượng giá trị thặng dư (M) tăng lên theo cấp số nhân",
          "Khối lượng giá trị thặng dư (M) giảm xuống do chi phí lương V tăng",
          "Thời gian lao động tất yếu (t) sẽ kéo dài ra chiếm hết ngày lao động",
          "Tỷ suất m' sẽ tự động giảm về 0%"
        ],
        correct: 0,
        explanation: "Slide 06/18: Đầu tư vào vốn nhân lực (V) chỉ là phương tiện để đồng thời phóng đại tỷ suất m' và tổng khối lượng M (M = m' × V)."
      }
    ]
  },
  {
    id: 3,
    title: "Tầng 3: Lõi Độc Quyền Big Tech",
    subtitle: "GTTD Tương Đối, Siêu Ngạch & 20% Time",
    slideRef: "Slide 07 - 09",
    bossName: "LÕI THUẬT TOÁN ĐỘC QUYỀN 20%",
    bossIcon: "🤖",
    bossColor: "#8B5CF6",
    hazardDesc: "4 bức tường Thời Gian Tất Yếu (t) đang ép hẹp không gian đứng (từ 4.0h xuống 1.2h) kèm tên lửa đuổi! Dùng nút LƯỚT (DASH) để thoát góc chết!",
    waveConfig: {
      quota: 100,
      enemySpeed: 2.3,
      bulletSpeed: 4.0,
      spawnRateMs: 780,
      specialHazard: "shrinking_walls", // Bức tường ép diện tích giống nén thời gian t
      enemyIcons: ["🧠", "☁️", "📧", "💎"]
    },
    questions: [
      {
        id: "q3_1",
        timeLimit: 12,
        question: "[So sánh số liệu - Slide 07] Theo biểu đồ Slide 07, trong ngày làm việc 8 giờ: Lao động truyền thống có t = 4.0h, t' = 4.0h (m' = 100%). Khi Big Tech trang bị Trợ lý AI & Cloud, thời gian tất yếu (t) rút ngắn xuống 1.2h và t' mở rộng lên 6.8h. Đây là phương pháp nào và tỷ suất m' mới đạt xấp xỉ bao nhiêu?",
        options: [
          "Giá trị thặng dư tuyệt đối — m' ≈ 200%",
          "Giá trị thặng dư tương đối — m' = (6.8 / 1.2) × 100% ≈ 566.7%",
          "Giá trị thặng dư tương đối — m' = (1.2 / 6.8) × 100% ≈ 17.6%",
          "Tái sản xuất giản đơn — m' giữ nguyên 100%"
        ],
        correct: 1,
        explanation: "Slide 07/18: Sản xuất GTTD tương đối giữ nguyên ngày lao động 8h nhưng dùng AI/đào tạo rút ngắn t từ 4.0h xuống 1.2h, mở rộng t' lên 6.8h -> m' tăng vọt lên ~566.7%!"
      },
      {
        id: "q3_2",
        timeLimit: 12,
        question: "[Bản chất Siêu ngạch - Slide 08] Hai yếu tố cốt lõi nào giúp các tập đoàn Big Tech (như Google) thu được 'Giá trị thặng dư siêu ngạch' độc quyền vượt xa doanh nghiệp trung bình (78% so với 25%)?",
        options: [
          "Sử dụng lao động giản đơn giá rẻ và tăng giá bán sản phẩm mỗi ngày",
          "Tập hợp 'Lao động phức tạp' (1 giờ của kỹ sư AI bằng bội số giờ lao động giản đơn) kết hợp sản phẩm phần mềm có 'Chi phí biên bằng 0'",
          "Kéo dài ngày làm việc tại nhà máy lắp ráp phần cứng lên 16 giờ/ngày",
          "Nhờ nhà nước bù lỗ toàn bộ chi phí nghiên cứu và phát triển (R&D)"
        ],
        correct: 1,
        explanation: "Slide 08/18: Lao động phức tạp giúp năng suất cá biệt vượt xa năng suất xã hội, cộng thêm thuật toán viết 1 lần phục vụ hàng tỷ người (chi phí biên = 0)."
      },
      {
        id: "q3_3",
        timeLimit: 12,
        question: "[Giải mã 20% Time - Slide 09] Gmail (Paul Buchheit), Google AdSense và Google News (Krishna Bharat) đều ra đời từ chính sách '20% Time'. Dưới lăng kính KTCT Mác - Lênin, bản chất thực sự của cơ chế này là gì?",
        options: [
          "Trao toàn bộ bản quyền sáng chế cho cá nhân kỹ sư để họ tự lập công ty riêng",
          "Chiếm đoạt kết quả lao động sáng tạo ngoài nhiệm vụ chính và thâu tóm bản quyền sở hữu trí tuệ tỷ đô với chi phí R&D tối thiểu",
          "Giảm 20% khối lượng công việc chính thức mà không yêu cầu kết quả đầu ra",
          "Hoạt động phúc lợi thuần túy không mang lại giá trị kinh tế cho tập đoàn"
        ],
        correct: 1,
        explanation: "Slide 09/18: Góc nhìn QTNS là trao quyền tự chủ, nhưng bản chất KTCT là chiếm đoạt kết quả lao động sáng tạo ngoài nhiệm vụ chính và sở hữu toàn bộ SHTT với chi phí R&D tối thiểu."
      }
    ]
  },
  {
    id: 4,
    title: "Tầng 4: Địa Ngục Hustle Culture & Bẫy Giá Rẻ",
    subtitle: "GTTD Tuyệt Đối Mới & Biện Chứng Lao Động Trẻ",
    slideRef: "Slide 10 - 13",
    bossName: "CHúa TỂ BURNOUT & OT 24/7",
    bossIcon: "🔥",
    bossColor: "#EF4444",
    hazardDesc: "CẢNH BÁO ĐỘ KHÓ CAO! Hố đen OT Không Lương hút người chơi vào giữa + Mưa đạn Email 0h Đêm! Sử dụng KHIÊN EMP và DASH hợp lý!",
    waveConfig: {
      quota: 100,
      enemySpeed: 2.5,
      bulletSpeed: 4.3,
      spawnRateMs: 700,
      specialHazard: "gravity_vortex", // Lực hút OT vào tâm + đạn tỏa tròn
      enemyIcons: ["📧", "⏰", "🏷️", "💸"]
    },
    questions: [
      {
        id: "q4_1",
        timeLimit: 12,
        question: "[Nhận diện tinh vi - Slide 10 & 11] Khác với việc cưỡng bức tăng giờ làm thô bạo ở thế kỷ XIX, 'Phương pháp sản xuất giá trị thặng dư tuyệt đối mới' trong kỷ nguyên số vận hành qua 3 công cụ nào?",
        options: [
          "Khóa cửa văn phòng, tịch thu điện thoại và phạt tiền mặt trực tiếp",
          "Tiện ích khép kín giữ chân ở lại muộn + Kết nối đám mây/email kéo dài việc về nhà 24/7 + Áp lực OKRs tự thân khiến nhân viên tự nguyện vắt sức",
          "Cắt giảm toàn bộ hệ thống AI để buộc nhân viên làm thủ công lâu hơn",
          "Tuyển dụng 100% lao động thời vụ không cần ký hợp đồng"
        ],
        correct: 1,
        explanation: "Slide 10 & 11/18: GTTD tuyệt đối mới thao túng thời gian qua: Xóa nhòa ranh giới (văn phòng tiện nghi), Lao động không ngắt quãng (đám mây/email 24/7) và Áp lực OKRs tự thân."
      },
      {
        id: "q4_2",
        timeLimit: 12,
        question: "[Phân tích biểu đồ v & m - Slide 12 & 13] Theo biểu đồ cấu trúc phân chia giá trị mới tại Slide 13, ở nhóm 'Thực tập sinh bị lạm dụng (gắn mác học việc nhưng giao việc như Junior)', tỷ lệ phần thù lao nhận về (v) so với phần thặng dư doanh nghiệp thu (m) là bao nhiêu?",
        options: [
          "v = 50% và m = 50% (Đãi ngộ chuẩn)",
          "v = 30% và m = 70% (Fresher làm OT không lương)",
          "v = 15% và m = 85% (Khoảng cách bóc lột cực đại kèm chiêu bài danh xưng ảo)",
          "v = 85% và m = 15%"
        ],
        correct: 2,
        explanation: "Slide 13/18: Biểu đồ chỉ rõ: Thực tập sinh bị lạm dụng chỉ nhận v = 15% trong khi doanh nghiệp thu m = 85% (Fresher OT không lương là 30%/70%; Kỹ sư chuẩn là 50%/50%)."
      },
      {
        id: "q4_3",
        timeLimit: 12,
        question: "[Tư duy biện chứng - Slide 12 & 13] Khi đánh giá về thị trường lao động trẻ (Fresher/OJT, Startup, Gig Economy), đâu là thái độ đúng đắn theo phép biện chứng duy vật?",
        options: [
          "Phủ định sạch trơn: Coi mọi chương trình OJT/Fresher đều là bóc lột nên từ chối đi thực tập",
          "Tuyệt đối hóa mặt tích cực: Chấp nhận làm OT không lương vô điều kiện vì tin vào văn hóa 'Hustle Culture cống hiến tuổi trẻ'",
          "Nhìn nhận toàn diện hai mặt: Tận dụng mặt tích cực (đào tạo thực chiến FPT Software Academy, Mentor nâng tầm lao động phức tạp) đồng thời tỉnh táo trước mặt trái (thực tập giá rẻ, danh xưng Leader/Specialist ảo gây Burnout)",
          "Chỉ chọn làm công việc tự do (Gig Economy) vì không bao giờ bị bóc lột thặng dư"
        ],
        correct: 2,
        explanation: "Slide 12 & 13/18: Góc nhìn biện chứng đòi hỏi thấy rõ cả Mặt tích cực (phát triển năng lực, OJT, Mentor) lẫn Mặt trái (thực tập giá rẻ, Hustle Culture, Gig cắt giảm bảo hiểm, danh xưng ảo)."
      }
    ]
  },
  {
    id: 5,
    title: "Tầng 5: Đấu Trường Công Dân Toàn Cầu",
    subtitle: "Lộ Trình 4 Bước Làm Chủ & Mục Tiêu SDG 8",
    slideRef: "Slide 14 - 16",
    bossName: "ĐẠI ĐẾ TƯ BẢN TOÀN CẦU",
    bossIcon: "👑",
    bossColor: "#FFD700",
    hazardDesc: "TẦNG CUỐI CÙNG! Tia Laser Quét Xoay Tròn 360° + Mưa Đạn Thất Nghiệp 12.4%! Hãy dùng DASH lướt xuyên tia laser và phá vỡ 3 khiên cuối cùng!",
    waveConfig: {
      quota: 100,
      enemySpeed: 2.7,
      bulletSpeed: 4.6,
      spawnRateMs: 620,
      specialHazard: "laser_sweep", // Tia laser xoay tròn quanh tâm đấu trường
      enemyIcons: ["🌐", "⚡", "🛡️", "🎓"]
    },
    questions: [
      {
        id: "q5_1",
        timeLimit: 12,
        question: "[Số liệu vĩ mô & Bản chất Win-Win - Slide 14] Trước áp lực tỷ lệ thất nghiệp thanh niên toàn cầu ở mức 12,4% (cao gấp hơn 3 lần người lớn - 3,7%) và lao động phi chính thức chiếm 57,8%, 'chìa khóa tự bảo vệ' cốt lõi của sinh viên là gì?",
        options: [
          "Đòi doanh nghiệp xóa bỏ hoàn toàn giá trị thặng dư (m = 0) trước khi nhận việc",
          "Nhận thức tạo ra thặng dư (m) là điều kiện để doanh nghiệp tồn tại trả lương (v), từ đó rèn luyện năng lực chuyên môn hiếm (lao động phức tạp) để có vị thế đàm phán Win-Win",
          "Chấp nhận hạ mức lương (v) xuống thấp nhất để cạnh tranh bằng giá rẻ",
          "Tránh xa các ngành công nghệ có ứng dụng AI để không bị thay thế"
        ],
        correct: 1,
        explanation: "Slide 14/18: Bản chất Win-Win là tạo ra m để doanh nghiệp tồn tại và trả lương v; sở hữu năng lực chuyên môn hiếm giúp sinh viên có quyền đàm phán đãi ngộ trước áp lực thất nghiệp 12,4%."
      },
      {
        id: "q5_2",
        timeLimit: 12,
        question: "[Lộ trình hành động - Slide 15] Một sinh viên FPT muốn chuyển hóa vị thế cá nhân theo đúng 'Lộ trình 4 bước hành động' tại Slide 15. Thứ tự chiến lược nào sau đây là chuẩn xác nhất?",
        options: [
          "(I) Lao động phức tạp (Làm chủ AI, ngoại ngữ, chuyên môn sâu) ➔ (II) Chọn đúng bệ phóng (Ưu tiên Mentor/OJT thực chất, tránh việc giản đơn lặp lại) ➔ (III) Đàm phán công bằng (Định giá đúng v, minh bạch KPI) ➔ (IV) Bảo vệ pháp lý & Quản trị năng lượng",
          "(I) Đàm phán lương cao ➔ (II) Chọn công ty có danh tiếng ảo ➔ (III) Làm việc giản đơn ➔ (IV) Cống hiến OT 24/7",
          "(I) Bảo vệ pháp lý ➔ (II) Từ chối dùng AI ➔ (III) Nhận danh xưng Leader ➔ (IV) Nhảy việc liên tục",
          "(I) Chọn việc nhẹ lương cao ➔ (II) Tránh các bài toán khó ➔ (III) Bỏ qua hợp đồng thử việc ➔ (IV) Tự do tài chính"
        ],
        correct: 0,
        explanation: "Slide 15/18: 4 bước chuẩn: Bước I (Lao động phức tạp: AI, ngoại ngữ, chuyên môn sâu) -> Bước II (Chọn đúng bệ phóng: Mentor/OJT) -> Bước III (Đàm phán công bằng: Định giá v, minh bạch KPI) -> Bước IV (Bảo vệ pháp lý & Quản trị năng lượng)."
      },
      {
        id: "q5_3",
        timeLimit: 12,
        question: "[Kết nối Công dân Toàn cầu - Slide 16] Thông điệp kết luận của nhóm gắn liền với Mục tiêu Phát triển Bền vững nào của Liên Hợp Quốc (UN) và đặt ra chuẩn mực đạo đức gì cho các nhà sáng lập tương lai?",
        options: [
          "SDG 4 (Giáo dục chất lượng) — Tập trung mở thêm trường đại học tư thục",
          "SDG 8 (Target 8.2 & 8.5) — Đổi mới công nghệ nâng cao năng suất phải đi đôi với Việc làm thỏa đáng (Decent Work), kết hợp hiệu quả kinh tế với tôn trọng phẩm giá con người",
          "SDG 9 (Công nghiệp & Đổi mới) — Tự động hóa 100% để thay thế hoàn toàn con người",
          "SDG 10 (Giảm bất bình đẳng) — Cào bằng mức lương của mọi vị trí trong xã hội"
        ],
        correct: 1,
        explanation: "Slide 16/18: SDG 8 (Target 8.2 & 8.5): Hài hòa tăng trưởng với việc làm thỏa đáng (Decent Work), tư duy phản biện (EGC) và đạo đức nhà sáng lập tôn trọng phẩm giá con người."
      }
    ]
  }
];

const AVATARS = [
  { id: "fpt_student", name: "Chiến Binh FPT", icon: "🎓", desc: "Lao động phức tạp tương lai", weaponColor: "#FF6B00" },
  { id: "intern_fresher", name: "Fresher Thực Chiến", icon: "⚔️", desc: "Vượt qua OJT & bẫy giá rẻ", weaponColor: "#38BDF8" },
  { id: "ai_engineer", name: "Kỹ Sư AI Siêu Ngạch", icon: "🤖", desc: "Nén thời gian t xuống 1.2h", weaponColor: "#A855F7" },
  { id: "philosopher", name: "Nhà Lý Luận C. Mác", icon: "🏛️", desc: "Bóc trần bản chất m' = t'/t", weaponColor: "#FACC15" },
  { id: "startup_founder", name: "Founder Nhân Văn", icon: "🚀", desc: "Kiến tạo chuẩn mực SDG 8", weaponColor: "#10B981" },
  { id: "global_citizen", name: "Công Dân Toàn Cầu", icon: "🌐", desc: "Tư duy phản biện EGC sắc bén", weaponColor: "#EC4899" }
];

module.exports = {
  STAGES,
  AVATARS
};
