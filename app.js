import { NOI_DUNG } from './noi-dung.js';
import { tachCau } from './js/tach-cau.js';
import { taoKho } from './js/kho.js';
import { trangThaiDuyet, datDuyet, demDuyet } from './js/duyet.js';
import { khoiDongGiong, coDocDuoc, giongHienTai, tenGiong, noi, dungDoc } from './js/giong.js';
import { batDauThu, dungThu, dangThu } from './js/micro.js';
import { veHoiDap, huyHoiDap, dongThongKeTuan } from './man-hoi-dap.js';
import { veCungMe, huyCungMe, dongBuoiTruoc } from './man-cung-me.js';

const APP_PHIEN_BAN = '0.4.0';
const THU_TOI_DA_GIAY = 15;

const { tu: TU, tinh_huong: TH } = NOI_DUNG;
const manHinh = document.getElementById('manHinh');
const theTu = document.getElementById('theTu');
const loa = new Audio();   // phát lại bản thu của anh

function boNhoMay() { try { return window.localStorage; } catch { return null; } }
const khoMay = taoKho(boNhoMay());
let duLieu = khoMay.doc();

let thHienTai = null;      // tình huống đang mở
let dangMo = null;         // id câu đang mở phần luyện
const banThu = new Map();  // id câu → url bản thu (chỉ trong lúc app mở)
let luotDoc = 0;           // tăng mỗi lần bắt đầu/dừng đọc cả hội thoại, để ngắt vòng đọc cũ
let demThu = null;

// Chữ từ dữ liệu luôn đi qua hàm này trước khi vào innerHTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nghi = ms => new Promise(r => setTimeout(r, ms));
const timCau = id => thHienTai?.cau.find(c => c.id === id) || thHienTai?.cuu_ho.find(c => c.id === id);

// ——— Trang chính ———
function veTrangChinh() {
  document.title = 'Phản xạ · luyện nói tiếng Trung';
  manHinh.innerHTML = `
    <h1>Phản xạ</h1>
    <p class="phu">Luyện nói tiếng Trung để gặp đối tác, ngồi bàn tiệc.</p>
    <p class="chi">👉 Chọn một tình huống để nghe mẫu, nói theo và cho mẹ nghe duyệt.</p>
    ${khoMay.hong ? `<p class="chi loi">Dữ liệu tiến độ lưu trên máy bị hỏng nên app bắt đầu lại từ đầu. Các câu mẹ đã duyệt cần duyệt lại.</p>` : ''}

    <h2>Tình huống</h2>
    <div class="ds">
      ${TH.map(th => `
        <a class="o" href="#/th/${esc(th.id)}">
          <b>${esc(th.ten)}</b>
          <span class="phu">${esc(th.muc_tieu)}</span>
          <span class="phu">${th.cau.length} câu · ${th.tu_moi.length} từ mới · mẹ đã duyệt ${demDuyet(duLieu, th.cau.map(c => c.id), giongHienTai()?.voiceURI)}/${th.cau.length}</span>
        </a>`).join('')}
    </div>

    <h2>⏱ Hỏi–đáp có đồng hồ</h2>
    <p class="phu">Máy hỏi, anh trả lời trong 5 → 3 → 2 giây; máy đo anh mở miệng sau bao lâu. ${esc(dongThongKeTuan(duLieu))}</p>
    <div class="ds">
      ${TH.map(th => `
        <a class="o" href="#/hd/${esc(th.id)}"><b>${esc(th.ten)}</b><span class="phu">${th.hoi_dap.length} câu hỏi</span></a>`).join('')}
    </div>

    <h2>👩 Cùng mẹ</h2>
    <p class="phu">Mẹ đọc thẻ gợi ý tiếng Việt, hỏi bằng lời của mẹ, rồi bấm Hiểu / Chưa hiểu.</p>
    <div class="ds">
      ${TH.map(th => `
        <a class="o" href="#/me/${esc(th.id)}"><b>${esc(th.ten)}</b><span class="phu">${th.the_me.length} thẻ · ${esc(dongBuoiTruoc(duLieu, th.id))}</span></a>`).join('')}
    </div>

    <h2>Sắp có</h2>
    <div class="ds">
      ${[
        ['⌨️ Đánh máy', 'Cấp thấp chép câu mẫu, cấp cao gõ câu trả lời'],
        ['📅 Ôn hôm nay', 'Ôn riêng nghe hiểu, nhắc lại, tự nói, đánh máy'],
      ].map(([ten, mo]) => `<div class="o sap"><b>${ten}</b> <span class="nhan">bản sau</span><span class="phu">${mo}</span></div>`).join('')}
    </div>

    <footer class="phu">App ${APP_PHIEN_BAN} · nội dung ${esc(NOI_DUNG.phien_ban)} · Câu mẫu là giọng máy, chỉ tin câu mẹ đã nghe duyệt.</footer>`;
}

// ——— Màn tình huống ———
function nhanDuyet(id) {
  const tt = trangThaiDuyet(duLieu, id, giongHienTai()?.voiceURI);
  return {
    chua: ['', '🔈 Giọng máy · mẹ chưa nghe duyệt'],
    doi_giong: ['', '🔈 Giọng máy · đã đổi giọng, mẹ cần nghe lại'],
    tu_nhien: ['tot', '✅ Mẹ nghe: tự nhiên'],
    la: ['loi', '⚠️ Mẹ nghe: lạ. Đừng bắt chước câu này, báo em sửa'],
  }[tt];
}

function veCau(th, c) {
  const ids = [...th.tu_moi, ...th.ten_rieng];
  const khuc = tachCau(c.zh, TU, ids).map(k => k.id
    ? `<button class="tu-moi" data-tu="${esc(k.id)}">${esc(k.chu)}</button>`
    : esc(k.chu)).join('');
  const [kieu, chu] = nhanDuyet(c.id);
  return `
    <div class="cau ${esc(c.vai)}" id="cau-${esc(c.id)}">
      <div class="vai">${esc(th.vai[c.vai])}</div>
      <div class="zh" lang="zh-CN">${khuc}</div>
      <div class="py">${esc(c.py)}</div>
      <div class="vi">${esc(c.vi)}</div>
      ${c.sua_04 ? `<div class="sua">Đã sửa theo kế hoạch 0.4 · câu cũ: <span lang="zh-CN">${esc(c.sua_04)}</span></div>` : ''}
      <div class="nhan-duyet ${kieu}" id="duyet-${esc(c.id)}">${chu}</div>
      <div class="hang">
        <button data-nghe="${esc(c.id)}">▶ Nghe</button>
        <button data-luyen="${esc(c.id)}" aria-expanded="false">🎤 Luyện câu này ▾</button>
      </div>
      <div class="luyen" id="luyen-${esc(c.id)}" hidden></div>
    </div>`;
}

function veLuyen(id) {
  const coBan = banThu.has(id);
  const tt = trangThaiDuyet(duLieu, id, giongHienTai()?.voiceURI);
  const nutDuyet = (gt, chu) => `<button data-duyet="${esc(id)}" data-tt="${gt}" aria-pressed="${tt === gt}">${chu}</button>`;
  return `
    <div class="buoc-luyen"><b>1 · Nghe mẫu</b>
      <div class="hang"><button data-nghe="${esc(id)}">▶ Nghe</button><button data-cham="${esc(id)}">🐢 Nghe chậm</button></div>
    </div>
    <div class="buoc-luyen"><b>2 · Nói theo</b> <span class="phu">thu giọng anh rồi so với mẫu</span>
      <div class="hang">
        ${dangThu()
          ? `<button class="chinh" data-dung-thu="${esc(id)}">⏹ Dừng thu</button>`
          : `<button class="chinh" data-thu="${esc(id)}">⏺ ${coBan ? 'Thu lại' : 'Thu giọng tôi'}</button>`}
        ${coBan && !dangThu() ? `<button data-nghe-lai="${esc(id)}">▶ Nghe lại tôi</button><button data-mau-roi-toi="${esc(id)}">🔁 Mẫu rồi tôi</button>` : ''}
      </div>
    </div>
    <div class="buoc-luyen"><b>3 · Mẹ nghe câu mẫu thấy thế nào?</b>
      <div class="hang">${nutDuyet('tu_nhien', '✅ Tự nhiên')}${nutDuyet('la', '⚠️ Nghe lạ')}${tt === 'chua' ? '' : nutDuyet('chua', '↩ Bỏ duyệt')}</div>
    </div>
    <p class="bao" id="bao-${esc(id)}"></p>`;
}

function capNhatCau(id) {
  const o = document.getElementById(`duyet-${id}`);
  if (o) { const [kieu, chu] = nhanDuyet(id); o.className = `nhan-duyet ${kieu}`; o.textContent = chu; }
  const p = document.getElementById(`luyen-${id}`);
  if (p && !p.hidden) p.innerHTML = veLuyen(id);
  capNhatDauTrang();
}

function baoCau(id, chu, kieu = '') {
  const el = document.getElementById(`bao-${id}`);
  if (el) { el.textContent = chu; el.className = `bao ${kieu}`; }
}

function dauTrang() {
  if (!coDocDuoc()) return `<p class="chi loi">Trình duyệt này không có giọng đọc. Hãy mở bằng Safari trên iPhone.</p>`;
  if (!giongHienTai()) return `<p class="chi loi">Máy chưa có giọng tiếng Trung. Vào <b>Cài đặt → Trợ năng → Nội dung được đọc → Giọng nói → Tiếng Trung (Trung Quốc đại lục)</b>, tải giọng <b>Tingting</b>, rồi mở lại app.</p>`;
  const th = thHienTai;
  return `<p class="phu">🔈 Giọng mẫu: <b>${esc(tenGiong())}</b> (giọng máy). Mẹ đã nghe duyệt <b>${demDuyet(duLieu, th.cau.map(c => c.id), giongHienTai().voiceURI)}/${th.cau.length}</b> câu.</p>`;
}
function capNhatDauTrang() {
  const el = document.getElementById('dauTrang');
  if (el) el.innerHTML = dauTrang();
}

function veTinhHuong(id) {
  const th = TH.find(t => t.id === id);
  thHienTai = th || null;
  dangMo = null;
  if (!th) {
    manHinh.innerHTML = `<p class="chi">Không tìm thấy tình huống này.</p><a class="nut" href="#/">← Về trang chính</a>`;
    return;
  }
  document.title = `${th.ten} · Phản xạ`;
  manHinh.innerHTML = `
    <a class="nut lui" href="#/">← Về trang chính</a>
    <h1>${esc(th.ten)}</h1>
    <p><b>Mục tiêu:</b> ${esc(th.muc_tieu)}</p>
    <p class="phu">${esc(th.boi_canh)}</p>
    <div id="dauTrang">${dauTrang()}</div>
    <p class="chi">👉 Nghe cả hội thoại vài lượt trước khi xem nghĩa. Rồi bấm <b>🎤 Luyện câu này</b> ở từng câu để nói theo.</p>
    <div class="hang">
      <a class="nut" href="#/hd/${esc(th.id)}">⏱ Hỏi–đáp có đồng hồ (${th.hoi_dap.length} câu)</a>
      <a class="nut" href="#/me/${esc(th.id)}">👩 Cùng mẹ (${th.the_me.length} thẻ)</a>
    </div>

    <h2>Hội thoại</h2>
    <div class="hang" id="nutHoiThoai">${nutHoiThoai(false)}</div>
    <button id="cheNghia" aria-pressed="false">🙈 Che nghĩa tiếng Việt để tự đoán</button>
    <p class="phu">Chữ tô màu là từ mới: chạm vào để xem pinyin, nghĩa, cách dùng.</p>
    <div class="hoi-thoai" id="hoiThoai">${th.cau.map(c => veCau(th, c)).join('')}</div>

    <h2>Từ mới (${th.tu_moi.length})</h2>
    <div class="bang-tu">${th.tu_moi.map(veTheTuNho).join('')}</div>
    ${th.ten_rieng.length ? `
      <h2>Tên riêng</h2>
      <div class="bang-tu">${th.ten_rieng.map(veTheTuNho).join('')}</div>` : ''}

    <h2>Ghi nhớ khi dùng</h2>
    <ul class="ghi">${th.ghi_nho.map(g => `<li>${esc(g)}</li>`).join('')}</ul>

    ${th.cuu_ho.length ? `
      <h2>Câu cứu hộ — khi không nghe kịp</h2>
      <div class="hoi-thoai">${th.cuu_ho.map(c => `
        <div class="cau">
          <div class="zh" lang="zh-CN">${esc(c.zh)}</div><div class="py">${esc(c.py)}</div><div class="vi">${esc(c.vi)}</div>
          <div class="hang"><button data-nghe="${esc(c.id)}">▶ Nghe</button><button data-cham="${esc(c.id)}">🐢 Chậm</button></div>
        </div>`).join('')}
      </div>` : ''}

    <h2>Thay thế nhanh</h2>
    <p class="phu">Chạm một gợi ý để nghe cả câu, rồi tự nói trọn câu trong 3 giây.</p>
    <div class="hoi-thoai">${th.thay_the.map(s => `
      <div class="cau">
        <div class="khung" lang="zh-CN">${esc(s.khung)}</div>
        <div class="vi">${esc(s.vi)}</div>
        <div class="goi-y">${s.goi_y.map(g => `
          <button data-noi-chu="${esc(s.khung.replace('___', g.zh))}" lang="zh-CN">${esc(g.zh)} <small>${esc(g.py)}${g.vi ? ' · ' + esc(g.vi) : ''}</small></button>`).join('')}
        </div>
      </div>`).join('')}
    </div>

    <p style="margin-top:24px"><a class="nut" href="#/">← Về trang chính</a></p>`;

  document.getElementById('cheNghia').onclick = e => {
    const bat = document.getElementById('hoiThoai').classList.toggle('che-nghia');
    e.currentTarget.setAttribute('aria-pressed', String(bat));
    e.currentTarget.textContent = bat ? '👁 Hiện lại nghĩa tiếng Việt' : '🙈 Che nghĩa tiếng Việt để tự đoán';
  };
}

function veTheTuNho(id) {
  const w = TU[id];
  return `
    <button class="o" data-tu="${esc(id)}">
      <span class="zh" lang="zh-CN">${esc(w.zh)}</span>
      <span class="py">${esc(w.py)}</span> — <b>${esc(w.vi)}</b>
      <span class="phu">${esc(w.cach_dung)}</span>
    </button>`;
}

// ——— Nghe ———
async function truocKhiPhat() {
  // Phát mẫu luôn phát khi micro tắt (kết quả thử V01: micro bật làm tiếng kém rõ hơn)
  if (dangThu()) await dungThuCau(dangMo);
  loa.pause();
}

async function ngheCau(id, toc) {
  const c = timCau(id);
  if (!c) return;
  await truocKhiPhat();
  dungDocHoiThoai();
  const ok = (await noi(c.zh, toc)).ok;
  if (!ok && !giongHienTai()) baoCau(id, 'Máy chưa có giọng tiếng Trung: xem hướng dẫn ở đầu trang.', 'loi');
}

function nutHoiThoai(dangDoc) {
  return dangDoc
    ? `<button class="chinh" id="dungHet">⏹ Dừng đọc</button>`
    : `<button class="chinh" id="ngheHet">▶ Nghe cả hội thoại</button><button id="ngheHetCham">🐢 Chậm</button>`;
}

async function docHoiThoai(toc) {
  await truocKhiPhat();
  const luot = ++luotDoc;
  document.getElementById('nutHoiThoai').innerHTML = nutHoiThoai(true);
  for (const c of thHienTai.cau) {
    if (luot !== luotDoc) return;
    const o = document.getElementById(`cau-${c.id}`);
    o?.classList.add('dang-doc');
    o?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    await noi(c.zh, toc);
    o?.classList.remove('dang-doc');
    if (luot !== luotDoc) return;
    await nghi(500);
  }
  if (luot === luotDoc) dungDocHoiThoai();
}

function dungDocHoiThoai() {
  luotDoc++;
  dungDoc();
  document.querySelectorAll('.dang-doc').forEach(o => o.classList.remove('dang-doc'));
  const nut = document.getElementById('nutHoiThoai');
  if (nut) nut.innerHTML = nutHoiThoai(false);
}

// ——— Thu giọng ———
async function thuCau(id) {
  dungDocHoiThoai();
  loa.pause();
  baoCau(id, 'Đang bật micro…');
  const r = await batDauThu();
  if (!r.ok) { baoCau(id, r.loi, 'loi'); return; }
  capNhatCau(id);
  let con = THU_TOI_DA_GIAY;
  baoCau(id, `🎤 Đang thu… nói câu này rồi bấm Dừng thu (tự dừng sau ${con} giây).`);
  clearInterval(demThu);
  demThu = setInterval(() => {
    con--;
    if (con <= 0) dungThuCau(id);
  }, 1000);
}

async function dungThuCau(id) {
  clearInterval(demThu); demThu = null;
  const url = await dungThu();
  if (url) {
    if (banThu.has(id)) URL.revokeObjectURL(banThu.get(id));
    banThu.set(id, url);
  }
  capNhatCau(id);
  if (url) baoCau(id, 'Thu xong. Bấm 🔁 Mẫu rồi tôi để so.', 'tot');
  else baoCau(id, 'Không thu được tiếng nào. Thử lại, nói to hơn.', 'loi');
}

async function ngheLaiToi(id) {
  dungDocHoiThoai();
  loa.src = banThu.get(id);
  try { await loa.play(); } catch { baoCau(id, 'Máy không phát được bản thu. Thử thu lại.', 'loi'); }
}

async function mauRoiToi(id) {
  dungDocHoiThoai();
  const c = timCau(id);
  // Bấm phát (tắt tiếng) ngay trong lúc chạm để Safari cho phép phát lại sau khi máy đọc xong
  loa.src = banThu.get(id);
  loa.muted = true;
  loa.play().catch(() => {});
  await noi(c.zh);
  loa.pause();
  loa.currentTime = 0;
  loa.muted = false;
  await nghi(300);
  try { await loa.play(); } catch { baoCau(id, 'Máy không tự phát bản thu. Bấm ▶ Nghe lại tôi.', 'loi'); }
}

// ——— Mẹ duyệt bằng tai ———
function duyetCau(id, tt) {
  const g = giongHienTai();
  if (!g) { baoCau(id, 'Chưa có giọng tiếng Trung nên chưa duyệt được.', 'loi'); return; }
  duLieu = datDuyet(duLieu, id, tt, g.voiceURI, new Date().toISOString());
  const r = khoMay.ghi(duLieu);
  capNhatCau(id);
  if (!r.ok) baoCau(id, r.loi, 'loi');
}

// ——— Thẻ từ ———
function moTheTu(id) {
  const w = TU[id];
  if (!w) return;
  const chuDoc = w.khop?.[0] || w.zh;
  theTu.innerHTML = `
    <div class="zh" lang="zh-CN">${esc(w.zh)}</div>
    <div class="py" style="font-size:20px">${esc(w.py)}</div>
    <button data-noi-chu="${esc(chuDoc)}">▶ Nghe${w.khop ? ` (${esc(chuDoc)})` : ''}</button>
    <p><b>${esc(w.vi)}</b></p>
    <p><b>Cách dùng:</b> ${esc(w.cach_dung)}</p>
    ${w.phat_am ? `<p><b>Phát âm:</b> ${esc(w.phat_am)}</p>` : ''}
    <button class="chinh" id="dongTheTu">Đóng</button>`;
  theTu.hidden = false;
  document.getElementById('dongTheTu').onclick = dongTheTu;
}
function dongTheTu() { theTu.hidden = true; }

// ——— Bấm ———
document.addEventListener('click', async e => {
  const n = e.target.closest('button, [data-tu]');
  if (!n) return;
  const d = n.dataset;
  if (d.tu) moTheTu(d.tu);
  else if (d.nghe) ngheCau(d.nghe, 1);
  else if (d.cham) ngheCau(d.cham, 0.6);
  else if (d.noiChu) { await truocKhiPhat(); dungDocHoiThoai(); noi(d.noiChu); }
  else if (d.luyen) moLuyen(d.luyen);
  else if (d.thu) thuCau(d.thu);
  else if (d.dungThu) dungThuCau(d.dungThu);
  else if (d.ngheLai) ngheLaiToi(d.ngheLai);
  else if (d.mauRoiToi) mauRoiToi(d.mauRoiToi);
  else if (d.duyet) duyetCau(d.duyet, d.tt);
  else if (n.id === 'ngheHet') docHoiThoai(1);
  else if (n.id === 'ngheHetCham') docHoiThoai(0.6);
  else if (n.id === 'dungHet') dungDocHoiThoai();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') dongTheTu(); });

async function moLuyen(id) {
  if (dangThu()) await dungThuCau(dangMo);
  const cu = dangMo;
  if (cu) {
    document.getElementById(`luyen-${cu}`).hidden = true;
    document.querySelector(`[data-luyen="${cu}"]`).setAttribute('aria-expanded', 'false');
  }
  dangMo = cu === id ? null : id;
  if (!dangMo) return;
  const p = document.getElementById(`luyen-${id}`);
  p.innerHTML = veLuyen(id);
  p.hidden = false;
  document.querySelector(`[data-luyen="${id}"]`).setAttribute('aria-expanded', 'true');
}

// Bối cảnh chung cho các màn tách riêng (hỏi–đáp, cùng mẹ)
const ctxMan = {
  manHinh, esc,
  layDuLieu: () => duLieu,
  luuDuLieu: d => { duLieu = d; return khoMay.ghi(d); },
};
const MAN_RIENG = { hd: veHoiDap, me: veCungMe };

async function dinhTuyen() {
  dongTheTu();
  dungDocHoiThoai();
  huyHoiDap();
  huyCungMe();
  if (dangThu()) await dungThuCau(dangMo);
  const [, loai, id] = location.hash.match(/^#\/(th|hd|me)\/(.+)$/) || [];
  const th = id && TH.find(t => t.id === decodeURIComponent(id));
  if (loai === 'th') veTinhHuong(decodeURIComponent(id));
  else if (th) { thHienTai = null; MAN_RIENG[loai](th, ctxMan); }
  else { thHienTai = null; veTrangChinh(); }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', dinhTuyen);

// Safari nạp giọng không đồng bộ: nạp xong thì vẽ lại phần phụ thuộc giọng
khoiDongGiong(() => {
  if (thHienTai) { capNhatDauTrang(); thHienTai.cau.forEach(c => capNhatCau(c.id)); }
  else if (!location.hash || location.hash === '#/') veTrangChinh();
});
dinhTuyen();
