// Màn "Ôn hôm nay" (vé V07): ôn cách quãng riêng 4 kỹ năng.
import { NOI_DUNG } from './noi-dung.js';
import { KY_NANG, TEN_KY_NANG, ngayDiaPhuong, congNgay, danhSachMuc, lapHangDoi, ghiOn, khoa } from './js/on-tap.js';
import { timDiemMoMieng, tinhNguong } from './js/do-tre.js';
import { danhGia as loaiDoTre } from './js/hoi-dap.js';
import { soChu } from './js/danh-may.js';
import { moMicDo, tatMicDo, mau } from './js/nghe-mic.js';
import { noi, dungDoc, giongHienTai } from './js/giong.js';
import { giay } from './man-hoi-dap.js';

const TH = NOI_DUNG.tinh_huong;
const DS_MUC = danhSachMuc(TH);
const SO_THE_NGAY_BAN = 5;
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
  return lapHangDoi(duLieu, DS_MUC, ngayDiaPhuong());
}

export function demTheoKyNang(ds) {
  const dem = Object.fromEntries(KY_NANG.map(k => [k, 0]));
  for (const m of ds) dem[m.ky_nang]++;
  return KY_NANG.filter(k => dem[k]).map(k => `${TEN_KY_NANG[k]} ${dem[k]}`).join(' · ');
}

function gioiHan() {
  const g = ctx.layDuLieu().cai_dat?.gioi_han;
  return [5, 3, 2].includes(g) ? g : 5;
}

export function veOnTap(c) {
  ctx = c;
  huyOnTap();
  const { manHinh } = ctx;
  const h = hangDoiHomNay(ctx.layDuLieu());
  const tong = h.on.length + h.moi.length;
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
    : `<p class="chi">✅ Hôm nay ôn xong rồi. Mai có ${lapHangDoi(ctx.layDuLieu(), DS_MUC, congNgay(ngayDiaPhuong(), 1)).on.length} thẻ đến hạn.</p>
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
  const { th } = TRA[m.id];
  manHinh.innerHTML = `
    <p class="phu">Thẻ ${phien.i + 1}/${phien.ds.length} · <b>${TEN_KY_NANG[m.ky_nang]}</b> · ${esc(th.ten)}
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
  ({ nghe_hieu: theNgheHieu, nhac_lai: theNhacLai, tu_noi: theTuNoi, danh_may: theDanhMay })[m.ky_nang](TRA[m.id].c);
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
