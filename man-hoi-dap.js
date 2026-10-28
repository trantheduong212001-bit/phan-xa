// Màn hỏi–đáp có đồng hồ (vé V04, tầng 4 của kế hoạch 0.4).
import { timDiemMoMieng, tinhNguong } from './js/do-tre.js';
import { xaoTron, danhGia, tongKetLuot, ghiLuot, thongKeTuan } from './js/hoi-dap.js';
import { moMicDo, tatMicDo, mau } from './js/nghe-mic.js';
import { noi, dungDoc, giongHienTai } from './js/giong.js';

const GIOI_HAN = [5, 3, 2];
const CHO_TOI_DA_MS = 10000;

let ctx = null;     // { manHinh, esc, layDuLieu, luuDuLieu }
let phien = null;   // { th, gioiHan, ds, i, kq: Map(id → ms|null), thuTu: [id], luot }

const nghi = ms => new Promise(r => setTimeout(r, ms));
export const giay = ms => (ms / 1000).toFixed(1).replace('.', ',');
const $ = id => document.getElementById(id);

export function dongThongKeTuan(duLieu) {
  const tk = thongKeTuan(duLieu, new Date());
  if (!tk.so) return 'Tuần này chưa luyện câu nào.';
  return `Tuần này: ${tk.so} câu · kịp ${Math.round(tk.kip / tk.so * 100)}% · trung bình mở miệng sau ${tk.tbMs == null ? '—' : giay(tk.tbMs)} giây.`;
}

function gioiHanDaChon() {
  const g = ctx.layDuLieu().cai_dat?.gioi_han;
  return GIOI_HAN.includes(g) ? g : 5;
}

export function veHoiDap(th, c) {
  ctx = c;
  huyHoiDap();
  const { esc, manHinh } = ctx;
  const g = gioiHanDaChon();
  document.title = `Hỏi–đáp · ${th.ten} · Phản xạ`;
  manHinh.innerHTML = `
    <a class="nut lui" href="#/th/${esc(th.id)}">← Về tình huống</a>
    <h1>⏱ Hỏi–đáp · ${esc(th.ten)}</h1>
    <p class="chi">👉 Máy đọc câu hỏi. Nghe xong trả lời ngay bằng thông tin thật của anh. Đừng nhìn màn hình khi trả lời.</p>

    <h2>Giới hạn trả lời</h2>
    <div class="hang">${GIOI_HAN.map(s => `<button data-gioi-han="${s}" aria-pressed="${s === g}">${s} giây</button>`).join('')}</div>
    <p class="phu">Mới học: 5 giây. Quen rồi: 3 giây. Thành thạo: 2 giây.</p>

    <p>${th.hoi_dap.length} câu hỏi, mỗi lượt xáo thứ tự khác nhau.</p>
    <button class="chinh lon" id="batDauHD">▶ Bắt đầu</button>
    <p class="bao" id="baoHD"></p>
    <p class="phu">Cần cho phép micro, ngồi chỗ yên tĩnh. Máy chỉ đo anh <b>mở miệng sau bao lâu</b>, không chấm đúng sai, không chấm phát âm.</p>

    <h2>Tuần này</h2>
    <p>${esc(dongThongKeTuan(ctx.layDuLieu()))}</p>`;

  manHinh.querySelectorAll('[data-gioi-han]').forEach(b => b.onclick = () => {
    const s = +b.dataset.gioiHan;
    const d = ctx.layDuLieu();
    const r = ctx.luuDuLieu({ ...d, cai_dat: { ...(d.cai_dat || {}), gioi_han: s } });
    manHinh.querySelectorAll('[data-gioi-han]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    if (!r.ok) baoHD(r.loi, 'loi');
  });
  $('batDauHD').onclick = () => batDau(th);
}

function baoHD(chu, kieu = '') { const el = $('baoHD'); if (el) { el.textContent = chu; el.className = `bao ${kieu}`; } }

async function batDau(th) {
  if (!giongHienTai()) { baoHD('Máy chưa có giọng tiếng Trung nên chưa hỏi được. Xem hướng dẫn cài giọng ở trang tình huống.', 'loi'); return; }
  baoHD('Đang bật micro…');
  const r = await moMicDo();
  if (!r.ok) { baoHD(r.loi, 'loi'); return; }
  phien = { th, gioiHan: gioiHanDaChon(), ds: xaoTron(th.hoi_dap), i: 0, kq: new Map(), thuTu: [], luot: 0 };
  chayCau();
}

function veKhungCau() {
  const { esc } = ctx;
  const { ds, i, gioiHan, th } = phien;
  ctx.manHinh.innerHTML = `
    <h1>⏱ ${esc(th.ten)}</h1>
    <p class="phu">Câu ${i + 1}/${ds.length} · giới hạn ${gioiHan} giây</p>
    <div class="o-hd" id="trangThaiHD"></div>
    <div class="dong-ho"><div id="kimHD"></div></div>
    <div id="sauCau"></div>
    <div class="hang" id="nutHD"><button id="dungHD">⏹ Dừng lượt</button></div>`;
  $('dungHD').onclick = ketThuc;
}

function trangThai(chu, kieu = '') { const el = $('trangThaiHD'); if (el) { el.textContent = chu; el.className = `o-hd ${kieu}`; } }

async function chayCau() {
  const luot = ++phien.luot;   // đổi khi dừng / hỏi lại → vòng cũ tự thoát
  const conChay = () => phien && phien.luot === luot;
  const q = phien.ds[phien.i];
  veKhungCau();

  trangThai('🤫 Yên lặng một chút…');
  const moc = performance.now();
  await nghi(600);
  if (!conChay()) return;
  const nguong = tinhNguong(mau.filter(m => m.t >= moc));

  trangThai('🔈 Máy đang hỏi…');
  await noi(q.zh);
  if (!conChay()) return;
  const xong = performance.now();

  trangThai('🎤 Trả lời ngay!', 'dang-nghe');
  const kim = $('kimHD');
  kim.style.transition = 'none'; kim.style.width = '100%'; kim.offsetWidth;
  kim.style.transition = `width ${phien.gioiHan}s linear`; kim.style.width = '0%';

  let ms = null;
  while (performance.now() - xong < CHO_TOI_DA_MS) {
    await nghi(50);
    if (!conChay()) return;
    ms = timDiemMoMieng(mau, { batDau: xong, nguong });
    if (ms != null) break;
  }
  kim.style.transition = 'none';
  if (!phien.kq.has(q.id)) phien.thuTu.push(q.id);
  phien.kq.set(q.id, ms);
  veKetQuaCau(q, ms);
}

function veKetQuaCau(q, ms) {
  const { esc } = ctx;
  const { gioiHan, i, ds } = phien;
  const loai = danhGia(ms, gioiHan);
  trangThai({
    kip: `✅ Kịp · ${giay(ms ?? 0)} giây`,
    cham: `⏰ Chậm · ${giay(ms ?? 0)} giây (giới hạn ${gioiHan} giây)`,
    im: '🤐 Không nghe thấy anh trả lời',
  }[loai], loai);
  $('sauCau').innerHTML = `
    <div class="cau">
      <div class="vai">Câu hỏi</div>
      <div class="zh" lang="zh-CN">${esc(q.zh)}</div>
      <div class="py">${esc(q.py)}</div>
      <div class="vi">${esc(q.vi)}</div>
      ${q.chi_nghe ? '<div class="phu">Câu này chỉ cần nghe hiểu, chưa cần tự nói giống hệt.</div>' : ''}
      <div class="vai" style="margin-top:10px">Gợi ý trả lời (một cách đúng, không phải cách duy nhất)</div>
      <div class="zh" lang="zh-CN">${esc(q.goi_y)}</div>
      <div class="hang"><button id="ngheGoiY">▶ Nghe gợi ý</button></div>
    </div>`;
  const cuoi = i === ds.length - 1;
  $('nutHD').innerHTML = `
    <button class="chinh" id="tiepHD">${cuoi ? '📊 Xem kết quả' : '▶ Câu tiếp'}</button>
    <button id="hoiLaiHD">🔁 Hỏi lại câu này</button>
    <button id="dungHD">⏹ Dừng lượt</button>`;
  $('ngheGoiY').onclick = () => noi(q.goi_y);
  $('hoiLaiHD').onclick = () => chayCau();
  $('dungHD').onclick = ketThuc;
  $('tiepHD').onclick = () => { if (cuoi) ketThuc(); else { phien.i++; chayCau(); } };
}

// Lưu các câu đã trả lời (nếu có). Trả về { ok, loi } của lần ghi, hoặc null nếu không có gì để lưu.
function luuPhien() {
  if (!phien?.thuTu.length) return null;
  const cau = phien.thuTu.map(id => ({ id, ms: phien.kq.get(id) }));
  return ctx.luuDuLieu(ghiLuot(ctx.layDuLieu(), { th: phien.th.id, gioi_han: phien.gioiHan, luc: new Date().toISOString(), cau }));
}

function ketThuc() {
  const p = phien;
  const r = luuPhien();
  tatMicDo(); dungDoc();
  phien = null;
  if (p) veTongKet(p, r);
}

// Rời màn giữa chừng: dừng micro, giọng đọc; vẫn lưu các câu đã trả lời
export function huyHoiDap() {
  if (!phien) { tatMicDo(); return; }
  luuPhien();
  tatMicDo(); dungDoc();
  phien = null;
}

function veTongKet(p, ghi) {
  const { esc, manHinh } = ctx;
  const cau = p.thuTu.map(id => ({ id, ms: p.kq.get(id) }));
  const tk = tongKetLuot(cau, p.gioiHan);
  const theoId = Object.fromEntries(p.th.hoi_dap.map(q => [q.id, q]));
  const nhan = { kip: '✅', cham: '⏰', im: '🤐' };
  manHinh.innerHTML = `
    <h1>📊 Kết quả lượt</h1>
    <p class="phu">${esc(p.th.ten)} · giới hạn ${p.gioiHan} giây</p>
    ${tk.so ? `
      <p class="so-lon">✅ ${tk.kip}/${tk.so} câu kịp</p>
      <p>Trung bình mở miệng sau <b>${tk.tbMs == null ? '—' : giay(tk.tbMs)} giây</b>. Chậm: ${tk.cham} · không trả lời: ${tk.im}.</p>
      ${ghi && !ghi.ok ? `<p class="chi loi">${esc(ghi.loi)}</p>` : ''}
      <div class="hoi-thoai">${cau.map(c => {
        const q = theoId[c.id];
        const l = danhGia(c.ms, p.gioiHan);
        return `<div class="cau"><b>${nhan[l]} ${c.ms == null ? 'không trả lời' : giay(c.ms) + ' giây'}</b>
          <div class="zh" lang="zh-CN">${esc(q.zh)}</div><div class="vi">${esc(q.vi)}</div></div>`;
      }).join('')}</div>
      ${tk.kip < tk.so ? `<p class="chi">👉 Câu chậm: vào tình huống, bấm 🎤 Luyện câu này để nói theo vài lần, rồi làm lượt mới.</p>` : ''}`
    : '<p>Lượt này chưa trả lời câu nào nên không lưu.</p>'}
    <p>${esc(dongThongKeTuan(ctx.layDuLieu()))}</p>
    <div class="hang">
      <a class="nut chinh-nut" href="#/hd/${esc(p.th.id)}" id="luotMoi">🔁 Lượt mới</a>
      <a class="nut" href="#/th/${esc(p.th.id)}">← Về tình huống</a>
      <a class="nut" href="#/">Trang chính</a>
    </div>`;
  // Đang ở #/hd/… thì bấm "Lượt mới" không đổi hash → vẽ lại màn cài đặt trực tiếp
  $('luotMoi').onclick = e => { if (location.hash === `#/hd/${p.th.id}`) { e.preventDefault(); veHoiDap(p.th, ctx); } };
}
