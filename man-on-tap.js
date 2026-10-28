// Màn "Ôn hôm nay" (vé V07): ôn cách quãng riêng 4 kỹ năng.
import { NOI_DUNG } from './noi-dung.js';
import { KY_NANG, KY_NANG_GT, TEN_KY_NANG, ngayDiaPhuong, congNgay, danhSachMuc, lapHangDoi, ghiOn, khoa, mucTuKho } from './js/on-tap.js';
import { taiGiaoTrinh } from './js/giao-trinh.js';
import { chonPhuongAn } from './js/trac-nghiem-tu.js';
import { lamMotBaiTap } from './man-giao-trinh.js';
import { timDiemMoMieng, tinhNguong } from './js/do-tre.js';
import { danhGia as loaiDoTre } from './js/hoi-dap.js';
import { soChu } from './js/danh-may.js';
import { moMicDo, tatMicDo, mau } from './js/nghe-mic.js';
import { noi, dungDoc, giongHienTai } from './js/giong.js';
import { giay } from './man-hoi-dap.js';

const TH = NOI_DUNG.tinh_huong;
const DS_MUC = danhSachMuc(TH);
const SO_THE_NGAY_BAN = 5;
// Giáo trình nhịp B đẩy khoảng 60–120 thẻ/ngày; giới hạn 20 của bộ giáo trình sẽ dồn ứ → nâng 60 (chốt 28/10/2026)
const TOI_DA_ON = 60;
let G = null;   // giáo trình, chỉ tải khi hàng đợi có thẻ giáo trình

const dsMuc = duLieu => [...DS_MUC, ...mucTuKho(duLieu)];
const CHO_TOI_DA_MS = 10000;

// id → { noi_dung, th } cho câu hội thoại, câu hỏi, câu chép
const TRA = {};
for (const th of TH) {
  for (const c of th.cau) TRA[c.id] = { c, th };
  for (const q of th.hoi_dap) TRA[q.id] = { c: q, th };
  for (const g of th.danh_may_thap) TRA[g.id] = { c: g, th };
}

let ctx = null;     // { manHinh, esc, layDuLieu, luuDuLieu }
let phien = null;   // { ds: [muc], i, dem: {nho,kho,sai}, theoKN: {kn: {nho,kho,sai}}, loiLuu, luot }

const $ = id => document.getElementById(id);
const nghi = ms => new Promise(r => setTimeout(r, ms));

export function hangDoiHomNay(duLieu) {
  return lapHangDoi(duLieu, dsMuc(duLieu), ngayDiaPhuong(), { toiDaOn: TOI_DA_ON });
}

export function demTheoKyNang(ds) {
  const tatCa = [...KY_NANG, ...KY_NANG_GT];
  const dem = Object.fromEntries(tatCa.map(k => [k, 0]));
  for (const m of ds) dem[m.ky_nang]++;
  return tatCa.filter(k => dem[k]).map(k => `${TEN_KY_NANG[k]} ${dem[k]}`).join(' · ');
}

function gioiHan() {
  const g = ctx.layDuLieu().cai_dat?.gioi_han;
  return [5, 3, 2].includes(g) ? g : 5;
}

export async function veOnTap(c) {
  ctx = c;
  huyOnTap();
  const { manHinh } = ctx;
  const h = hangDoiHomNay(ctx.layDuLieu());
  const tong = h.on.length + h.moi.length;
  if ([...h.on, ...h.moi].some(m => m.th === 'GT') && !G) {
    manHinh.innerHTML = '<p class="phu">⏳ Đang tải giáo trình…</p>';
    try { G = await taiGiaoTrinh(); } catch {
      manHinh.innerHTML = '<p class="chi loi">Chưa tải được giáo trình nên chưa ôn được thẻ từ. Mở app một lần khi có mạng rồi thử lại.</p><a class="nut" href="#/">← Về trang chính</a>';
      return;
    }
  }
  document.title = 'Ôn hôm nay · Phản xạ';
  manHinh.innerHTML = `
    <a class="nut lui" href="#/">← Về trang chính</a>
    <h1>📅 Ôn hôm nay</h1>
    ${tong ? `
      <p class="chi">👉 Bấm <b>Ôn đủ buổi</b>. Mỗi thẻ làm xong tự sang thẻ sau. Bận thì chọn <b>Ngày bận</b>.</p>
      <p><b>Đến hạn:</b> ${h.on.length} thẻ${h.on.length ? ` (${demTheoKyNang(h.on)})` : ''}</p>
      <p><b>Thẻ mới:</b> ${h.moi.length} thẻ${h.moi.length ? ` (${demTheoKyNang(h.moi)})` : ''}</p>
      ${h.conLai ? `<p class="phu">Còn ${h.conLai} thẻ quá hạn chưa xếp vào buổi này, giữ nguyên hạn, để buổi sau.</p>` : ''}
      <button class="chinh lon" id="onDu">▶ Ôn đủ buổi (${tong} thẻ)</button>
      <button class="lon" id="onBan">⏱ Ngày bận: ${Math.min(SO_THE_NGAY_BAN, tong)} thẻ</button>
      <p class="phu">Thẻ <b>Tự nói</b> cần micro, ngồi chỗ yên tĩnh. Thẻ <b>Đánh máy</b> cần bàn phím Bính âm.</p>`
    : `<p class="chi">✅ Hôm nay ôn xong rồi. Mai có ${lapHangDoi(ctx.layDuLieu(), dsMuc(ctx.layDuLieu()), congNgay(ngayDiaPhuong(), 1), { toiDaOn: 999 }).on.length} thẻ đến hạn.</p>
       <a class="nut" href="#/">← Về trang chính</a>`}`;
  if (!tong) return;
  const batDau = ds => {
    phien = { ds, i: 0, dem: { nho: 0, kho: 0, sai: 0 }, theoKN: {}, loiLuu: null, luot: 0, moi: new Set(h.moi.map(m => khoa(m.ky_nang, m.id))) };
    veThe();
  };
  $('onDu').onclick = () => batDau([...h.on, ...h.moi]);
  $('onBan').onclick = () => batDau([...h.on, ...h.moi].slice(0, SO_THE_NGAY_BAN));
}

function khungThe(noiDung) {
  const { esc, manHinh } = ctx;
  const m = phien.ds[phien.i];
  const nguon = m.th === 'GT'
    ? `Giáo trình · ${m.ky_nang === 'bai_tap' ? G.bt.get(m.id).lesson_id : G.tu.get(m.id).first_lesson_id}`
    : TRA[m.id].th.ten;
  manHinh.innerHTML = `
    <p class="phu">Thẻ ${phien.i + 1}/${phien.ds.length} · <b>${TEN_KY_NANG[m.ky_nang]}</b> · ${esc(nguon)}
      ${phien.moi.has(khoa(m.ky_nang, m.id)) ? '<span class="nhan">mới</span>' : ''}</p>
    ${noiDung}
    <div class="hang"><button id="dungOn">⏹ Dừng buổi ôn</button></div>`;
  $('dungOn').onclick = ketThuc;
}

function nutDanhGia(nhan) {
  return `<div class="ba-nut">
    <button class="nut-hieu" data-dg="nho">✅ ${nhan[0]}</button>
    <button data-dg="kho">🤏 ${nhan[1]}</button>
    <button class="nut-chua" data-dg="sai">❌ ${nhan[2]}</button>
  </div>`;
}
function ganDanhGia() {
  ctx.manHinh.querySelectorAll('[data-dg]').forEach(b => b.onclick = () => chamThe(b.dataset.dg));
}

function veThe() {
  const m = phien.ds[phien.i];
  if (m.th === 'GT') {
    ({ nhan_chu: theNhanChu, nghe_tu: theNgheTu, nho_tu: theNhoTu, bai_tap: theBaiTap })[m.ky_nang](m.id);
    return;
  }
  ({ nghe_hieu: theNgheHieu, nhac_lai: theNhacLai, tu_noi: theTuNoi, danh_may: theDanhMay })[m.ky_nang](TRA[m.id].c);
}

// ——— Thẻ từ giáo trình ———
function dapAnTu(v) {
  const { esc } = ctx;
  return `<div class="cau"><span class="zh" lang="zh-CN">${esc(v.hanzi)}</span> <span class="py">${esc(v.pinyin)}</span> — <b>${esc(v.meaning_vi)}</b>
    <div class="hang"><button data-noi-chu="${esc(v.hanzi)}">▶ Nghe</button></div></div>`;
}

// Trắc nghiệm 4 phương án, chấm tự động: đúng → nhớ, sai → sai
function theTracNghiem(tuId, kieu, deBai) {
  const { esc } = ctx;
  const v = G.tu.get(tuId);
  const tn = chonPhuongAn(G, tuId, kieu);
  khungThe(`${deBai}
    <div class="ba-nut" id="cacPA">${tn.cacPhuongAn.map((p, k) => `<button data-pa="${k}" ${kieu === 'chu' ? 'class="the-chu" lang="zh-CN"' : ''}>${esc(p)}</button>`).join('')}</div>
    <div id="sauTN"></div>`);
  ctx.manHinh.querySelectorAll('[data-pa]').forEach(b => b.onclick = () => {
    const dung = +b.dataset.pa === tn.viTriDung;
    ctx.manHinh.querySelectorAll('[data-pa]').forEach(x => { x.disabled = true; if (+x.dataset.pa === tn.viTriDung) x.classList.add('nut-hieu'); });
    $('sauTN').innerHTML = `<div class="o-hd ${dung ? 'kip' : 'cham'}">${dung ? '✅ Đúng' : '❌ Chưa đúng'}</div>${dapAnTu(v)}
      <button class="chinh lon" id="tiepTN">▶ Thẻ tiếp</button>`;
    $('tiepTN').onclick = () => chamThe(dung ? 'nho' : 'sai');
  });
}

function theNhanChu(tuId) {
  const v = G.tu.get(tuId);
  theTracNghiem(tuId, 'nghia', `<p class="chi">👉 Từ này nghĩa là gì?</p><div class="chu-mau" lang="zh-CN">${ctx.esc(v.hanzi)}</div>`);
}

function theNgheTu(tuId) {
  const v = G.tu.get(tuId);
  theTracNghiem(tuId, 'chu', `<p class="chi">👉 Nghe rồi chọn đúng chữ.</p>
    <div class="hang"><button class="chinh" id="ngheTu">▶ Nghe lại</button><button id="ngheCham">🐢 Chậm</button></div>`);
  $('ngheTu').onclick = () => noi(v.hanzi);
  $('ngheCham').onclick = () => noi(v.hanzi, 0.6);
  noi(v.hanzi);
}

function theNhoTu(tuId) {
  const { esc } = ctx;
  const v = G.tu.get(tuId);
  khungThe(`
    <p class="chi">👉 Nói to từ tiếng Trung có nghĩa này, rồi mới bấm Xem đáp án.</p>
    <div class="the-me">${esc(v.meaning_vi)}</div>
    <button class="chinh lon" id="xemDA">👁 Xem đáp án</button>
    <div id="sauNho" hidden>${dapAnTu(v)}${nutDanhGia(['Nói đúng', 'Nhớ chậm / sai thanh', 'Không nhớ'])}</div>`);
  $('xemDA').onclick = () => { $('xemDA').hidden = true; $('sauNho').hidden = false; noi(v.hanzi); ganDanhGia(); };
}

function theBaiTap(btId) {
  khungThe('<p class="chi">👉 Câu này lần trước làm chưa đúng. Làm lại nhé.</p><div id="vungBtOn"></div>');
  lamMotBaiTap(ctx, G, btId, $('vungBtOn'), dung => chamThe(dung === true ? 'nho' : 'sai'));
}

function chuCau(c) {
  const { esc } = ctx;
  return `<div class="zh" lang="zh-CN">${esc(c.zh)}</div><div class="py">${esc(c.py)}</div><div class="vi">${esc(c.vi)}</div>`;
}

function theNgheHieu(c) {
  khungThe(`
    <p class="chi">👉 Nghe, chưa nhìn chữ. Anh hiểu được bao nhiêu?</p>
    <div class="hang"><button class="chinh" id="nghe">▶ Nghe</button><button id="cham">🐢 Chậm</button><button id="hienChu">👁 Hiện chữ</button></div>
    <div class="cau" id="chuAn" hidden>${chuCau(c)}</div>
    ${nutDanhGia(['Hiểu hết', 'Hiểu một phần', 'Không hiểu'])}`);
  $('nghe').onclick = () => noi(c.zh);
  $('cham').onclick = () => noi(c.zh, 0.6);
  $('hienChu').onclick = () => { $('chuAn').hidden = false; };
  ganDanhGia();
  noi(c.zh);
}

function theNhacLai(c) {
  khungThe(`
    <p class="chi">👉 Nghe mẫu rồi nói to theo 2–3 lần, bắt chước cả thanh điệu.</p>
    <div class="cau">${chuCau(c)}</div>
    <div class="hang"><button class="chinh" id="nghe">▶ Nghe mẫu</button><button id="cham">🐢 Chậm</button></div>
    ${nutDanhGia(['Nói theo trôi chảy', 'Còn vấp', 'Chưa nói được'])}`);
  $('nghe').onclick = () => noi(c.zh);
  $('cham').onclick = () => noi(c.zh, 0.6);
  ganDanhGia();
  noi(c.zh);
}

function theTuNoi(q) {
  const g = gioiHan();
  khungThe(`
    <p class="chi">👉 Máy hỏi, anh trả lời ngay trong ${g} giây, không nhìn màn hình.</p>
    <div class="o-hd" id="trangThaiHD">Sẵn sàng</div>
    <div class="dong-ho"><div id="kimHD"></div></div>
    <div id="sauCau"></div>
    <div class="hang" id="nutTN"><button class="chinh lon" id="hoi">▶ Bắt đầu hỏi</button></div>`);
  $('hoi').onclick = () => hoiCau(q, g);
}

function trangThai(chu, kieu = '') { const el = $('trangThaiHD'); if (el) { el.textContent = chu; el.className = `o-hd ${kieu}`; } }

async function hoiCau(q, g) {
  const { esc } = ctx;
  const luot = ++phien.luot;
  const conChay = () => phien && phien.luot === luot;
  $('nutTN').innerHTML = '';
  if (!giongHienTai()) { trangThai('Máy chưa có giọng tiếng Trung', 'im'); return; }
  const r = await moMicDo();
  if (!conChay()) return;
  if (!r.ok) { trangThai(r.loi, 'im'); $('nutTN').innerHTML = '<button class="chinh" id="hoi">▶ Thử lại</button>'; $('hoi').onclick = () => hoiCau(q, g); return; }
  trangThai('🤫 Yên lặng một chút…');
  const moc = performance.now();
  await nghi(600);
  if (!conChay()) return;
  const nguong = tinhNguong(mau.filter(x => x.t >= moc));
  trangThai('🔈 Máy đang hỏi…');
  await noi(q.zh);
  if (!conChay()) return;
  const xong = performance.now();
  trangThai('🎤 Trả lời ngay!', 'dang-nghe');
  const kim = $('kimHD');
  kim.style.transition = 'none'; kim.style.width = '100%'; kim.offsetWidth;
  kim.style.transition = `width ${g}s linear`; kim.style.width = '0%';
  let ms = null;
  while (performance.now() - xong < CHO_TOI_DA_MS) {
    await nghi(50);
    if (!conChay()) return;
    ms = timDiemMoMieng(mau, { batDau: xong, nguong });
    if (ms != null) break;
  }
  kim.style.transition = 'none';
  tatMicDo();   // tắt micro ngay để thẻ sau phát mẫu to, rõ
  const loai = loaiDoTre(ms, g);
  trangThai({ kip: `✅ Kịp · ${giay(ms ?? 0)} giây`, cham: `⏰ Chậm · ${giay(ms ?? 0)} giây`, im: '🤐 Không nghe thấy anh trả lời' }[loai], loai);
  $('sauCau').innerHTML = `
    <div class="cau">
      <div class="vai">Câu hỏi</div>
      <div class="zh" lang="zh-CN">${esc(q.zh)}</div><div class="py">${esc(q.py)}</div><div class="vi">${esc(q.vi)}</div>
      <div class="vai" style="margin-top:10px">Gợi ý trả lời</div>
      <div class="zh" lang="zh-CN">${esc(q.goi_y)}</div>
    </div>
    <p><b>Câu anh vừa nói có đúng ý không?</b> Máy chỉ đo tốc độ, phần đúng sai anh tự chấm.</p>`;
  const dgKhiDung = { kip: 'nho', cham: 'kho', im: 'sai' }[loai];
  $('nutTN').innerHTML = `
    <div class="hai-nut">
      <button class="nut-hieu" id="dungY"${loai === 'im' ? ' disabled' : ''}>✅ Đúng ý</button>
      <button class="nut-chua" id="saiY">❌ Sai ý / không biết</button>
    </div>
    <button id="hoiLai">🔁 Hỏi lại (không tính)</button>`;
  $('dungY').onclick = () => chamThe(dgKhiDung);
  $('saiY').onclick = () => chamThe('sai');
  $('hoiLai').onclick = () => { $('sauCau').innerHTML = ''; hoiCau(q, g); };
}

function theDanhMay(gm) {
  const { esc } = ctx;
  khungThe(`
    <p class="chi">👉 Nhìn pinyin, gõ lại bằng chữ Hán (bàn phím Bính âm).</p>
    <div class="cau"><div class="py py-lon">${esc(gm.py)}</div></div>
    <textarea id="oGo" class="o-go" rows="2" lang="zh-CN" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Gõ ở đây…"></textarea>
    <div id="ketQuaDM"></div>
    <div class="hang" id="nutDM"><button class="chinh" id="kiemTra">✔ Kiểm tra</button></div>`);
  $('kiemTra').onclick = () => {
    const go = $('oGo').value;
    if (!go.trim()) { $('ketQuaDM').innerHTML = '<p class="bao loi">Anh gõ câu trước đã.</p>'; return; }
    const r = soChu(gm.zh, go);
    $('oGo').readOnly = true;
    const dg = r.dat ? 'nho' : r.soSai === 1 ? 'kho' : 'sai';
    $('ketQuaDM').innerHTML = `
      <div class="o-hd ${r.dat ? 'kip' : 'cham'}">${r.dat ? '✅ Đúng hết' : `❌ Sai ${r.soSai} chữ`}</div>
      <p class="phu">Câu mẫu: <span lang="zh-CN" class="zh">${esc(gm.zh)}</span></p>`;
    $('nutDM').innerHTML = '<button class="chinh lon" id="tiep">▶ Thẻ tiếp</button>';
    $('tiep').onclick = () => chamThe(dg);
  };
}

function chamThe(dg) {
  dungDoc();
  const m = phien.ds[phien.i];
  const r = ctx.luuDuLieu(ghiOn(ctx.layDuLieu(), m.ky_nang, m.id, dg, ngayDiaPhuong()));
  if (!r.ok) phien.loiLuu = r.loi;
  phien.dem[dg]++;
  phien.theoKN[m.ky_nang] = phien.theoKN[m.ky_nang] || { nho: 0, kho: 0, sai: 0 };
  phien.theoKN[m.ky_nang][dg]++;
  if (phien.i < phien.ds.length - 1) { phien.i++; veThe(); } else ketThuc();
}

export function huyOnTap() {
  tatMicDo(); dungDoc();
  phien = null;
}

function ketThuc() {
  const p = phien;
  huyOnTap();
  if (!p) return;
  const { esc, manHinh } = ctx;
  const so = p.dem.nho + p.dem.kho + p.dem.sai;
  const h = hangDoiHomNay(ctx.layDuLieu());
  const conHomNay = h.on.length + h.moi.length;
  manHinh.innerHTML = `
    <h1>📊 Kết quả buổi ôn</h1>
    ${so ? `
      <p class="so-lon">${so} thẻ · ✅ ${p.dem.nho} · 🤏 ${p.dem.kho} · ❌ ${p.dem.sai}</p>
      <ul class="ghi">${KY_NANG.filter(k => p.theoKN[k]).map(k => {
        const d = p.theoKN[k];
        return `<li><b>${TEN_KY_NANG[k]}:</b> nhớ ${d.nho} · khó ${d.kho} · sai ${d.sai}</li>`;
      }).join('')}</ul>
      <p class="phu">Thẻ khó, sai và thẻ mới học sẽ quay lại vào ngày mai. Thẻ nhớ tốt giãn dần 3 → 7 → 14 → 30 ngày.</p>`
    : '<p>Buổi này chưa làm thẻ nào.</p>'}
    ${p.loiLuu ? `<p class="chi loi">${esc(p.loiLuu)}</p>` : ''}
    <p>${conHomNay ? `Hôm nay còn ${conHomNay} thẻ.` : '✅ Hôm nay ôn xong.'}</p>
    <div class="hang">
      ${conHomNay ? '<a class="nut chinh-nut" href="#/on" id="onTiep">▶ Ôn tiếp</a>' : ''}
      <a class="nut" href="#/">Trang chính</a>
    </div>`;
  const nut = $('onTiep');
  if (nut) nut.onclick = e => { if (location.hash === '#/on') { e.preventDefault(); veOnTap(ctx); } };
}
