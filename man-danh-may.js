// Màn đánh máy 2 cấp (vé V06).
// Cấp thấp: gõ lại câu mẫu (nhìn chữ Hán, hoặc chỉ nhìn pinyin), app so từng chữ, bỏ dấu câu và khoảng trắng.
// Cấp cao: đọc câu hỏi chữ Hán, gõ câu trả lời thật; app không chấm, chỉ mở gợi ý sau khi gõ xong để tự đối chiếu.
import { soChu, ghiDanhMay, phienGanNhat } from './js/danh-may.js';

const CAP = {
  thap: { ten: 'Cấp thấp · chép câu mẫu', mo: 'Nhìn chữ Hán, gõ lại y nguyên.' },
  thap_py: { ten: 'Cấp thấp · chỉ nhìn pinyin', mo: 'Khó hơn: không thấy chữ Hán, phải tự chọn đúng chữ.' },
  cao: { ten: 'Cấp cao · gõ câu trả lời', mo: 'Đọc câu hỏi chữ Hán, tự gõ câu trả lời thật của anh.' },
};

let ctx = null;     // { manHinh, esc, layDuLieu, luuDuLieu }
let phien = null;   // { th, cap, ds, i, kq: Map(id → dat), id }

const $ = id => document.getElementById(id);

export function dongLanTruocDanhMay(duLieu, thId) {
  const p = phienGanNhat(duLieu, thId);
  if (!p) return 'Chưa đánh máy lần nào.';
  return `Lần trước: ${CAP[p.cap].ten.toLowerCase()} — ${p.cap === 'cao' ? 'tự chấm đạt' : 'đúng'} ${p.dat}/${p.so} câu.`;
}

export function veDanhMay(th, c) {
  ctx = c;
  phien = null;
  const { esc, manHinh } = ctx;
  document.title = `Đánh máy · ${th.ten} · Phản xạ`;
  const so = { thap: th.danh_may_thap.length, thap_py: th.danh_may_thap.length, cao: th.danh_may_cao.length };
  manHinh.innerHTML = `
    <a class="nut lui" href="#/th/${esc(th.id)}">← Về tình huống</a>
    <h1>⌨️ Đánh máy · ${esc(th.ten)}</h1>
    <p class="chi">👉 Chọn một cấp. Gõ bằng <b>bàn phím Bính âm</b>: gõ pinyin không dấu rồi chọn đúng chữ Hán. Chữ ü gõ bằng phím <b>v</b>.</p>
    <div class="ds">
      ${Object.entries(CAP).map(([k, v]) => `
        <button class="o" data-cap="${k}"><b>${v.ten}</b><span class="phu">${v.mo} ${so[k]} câu.</span></button>`).join('')}
    </div>
    <p class="phu">${esc(dongLanTruocDanhMay(ctx.layDuLieu(), th.id))}</p>
    <details>
      <summary>Chưa có bàn phím Bính âm?</summary>
      <ol class="ghi">
        <li>Cài đặt → Cài đặt chung → Bàn phím → Bàn phím → Thêm bàn phím mới.</li>
        <li>Chọn Tiếng Trung, Giản thể → tích Bính âm – QWERTY → Xong.</li>
        <li>Khi gõ, bấm nút 🌐 để chuyển sang bàn phím Bính âm.</li>
      </ol>
    </details>`;
  manHinh.querySelectorAll('[data-cap]').forEach(b => b.onclick = () => {
    const cap = b.dataset.cap;
    phien = { th, cap, ds: cap === 'cao' ? th.danh_may_cao : th.danh_may_thap, i: 0, kq: new Map(), id: new Date().toISOString() };
    veCau();
  });
}

function veCau() {
  const { esc, manHinh } = ctx;
  const { cap, ds, i, th } = phien;
  const muc = ds[i];
  const de = cap === 'thap'
    ? `<div class="zh" lang="zh-CN">${esc(muc.zh)}</div><div class="py">${esc(muc.py)}</div>`
    : cap === 'thap_py'
      ? `<div class="py py-lon">${esc(muc.py)}</div>`
      : `<div class="vai">Câu hỏi</div><div class="zh" lang="zh-CN">${esc(muc.hoi)}</div>`;
  manHinh.innerHTML = `
    <h1>⌨️ ${esc(th.ten)}</h1>
    <p class="phu">Câu ${i + 1}/${ds.length} · ${CAP[cap].ten}</p>
    <div class="cau">${de}</div>
    <label for="oGo" class="phu">${cap === 'cao' ? 'Gõ câu trả lời bằng chữ Hán:' : 'Gõ lại câu này bằng chữ Hán:'}</label>
    <textarea id="oGo" class="o-go" rows="2" lang="zh-CN" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Gõ ở đây…"></textarea>
    <div id="ketQuaDM"></div>
    <div class="hang" id="nutDM">
      <button class="chinh" id="kiemTra">${cap === 'cao' ? '✔ Gõ xong, xem gợi ý' : '✔ Kiểm tra'}</button>
      <button id="dungDM">⏹ Dừng</button>
    </div>`;
  $('kiemTra').onclick = cap === 'cao' ? xemGoiY : kiemTraThap;
  $('dungDM').onclick = ketThuc;
}

function luu(id, dat, soSai) {
  if (phien.kq.has(id)) return null;   // chỉ tính lần kiểm đầu tiên của mỗi câu trong phiên
  phien.kq.set(id, dat);
  const r = ctx.luuDuLieu(ghiDanhMay(ctx.layDuLieu(), {
    th: phien.th.id, cap: phien.cap, phien: phien.id, id, dat, luc: new Date().toISOString(),
    ...(soSai != null ? { so_sai: soSai } : {}),
  }));
  return r.ok ? null : r.loi;
}

function nutSauKiem(goLai) {
  const cuoi = phien.i === phien.ds.length - 1;
  $('nutDM').innerHTML = `
    <button class="chinh" id="tiepDM">${cuoi ? '📊 Xem kết quả' : '▶ Câu tiếp'}</button>
    ${goLai ? '<button id="goLai">🔁 Gõ lại</button>' : ''}
    <button id="dungDM">⏹ Dừng</button>`;
  $('tiepDM').onclick = () => { if (cuoi) ketThuc(); else { phien.i++; veCau(); } };
  if (goLai) $('goLai').onclick = () => { $('oGo').value = ''; $('ketQuaDM').innerHTML = ''; veLaiNutKiem(); $('oGo').focus(); };
  $('dungDM').onclick = ketThuc;
}

function veLaiNutKiem() {
  $('nutDM').innerHTML = `<button class="chinh" id="kiemTra">✔ Kiểm tra</button><button id="dungDM">⏹ Dừng</button>`;
  $('kiemTra').onclick = kiemTraThap;
  $('dungDM').onclick = ketThuc;
}

function kiemTraThap() {
  const { esc } = ctx;
  const muc = phien.ds[phien.i];
  const go = $('oGo').value;
  if (!go.trim()) { $('ketQuaDM').innerHTML = '<p class="bao loi">Anh gõ câu trước đã.</p>'; return; }
  const r = soChu(muc.zh, go);
  const loi = luu(muc.id, r.dat, r.soSai);
  const chu = r.khuc.filter(k => k.loai !== 'thua').map(k =>
    k.loai === 'dung' ? `<span class="c-dung">${esc(k.mau)}</span>`
    : k.loai === 'sai' ? `<span class="c-sai" title="anh gõ ${esc(k.go)}">${esc(k.mau)}<small>${esc(k.go)}</small></span>`
    : `<span class="c-thieu">${esc(k.mau)}</span>`).join('');
  const giaiThich = r.khuc.filter(k => k.loai !== 'dung').map(k =>
    k.loai === 'sai' ? `Mẫu là <b lang="zh-CN">${esc(k.mau)}</b>, anh gõ <b lang="zh-CN">${esc(k.go)}</b>.`
    : k.loai === 'thieu' ? `Thiếu chữ <b lang="zh-CN">${esc(k.mau)}</b>.`
    : `Thừa chữ <b lang="zh-CN">${esc(k.go)}</b>.`);
  $('ketQuaDM').innerHTML = `
    <div class="o-hd ${r.dat ? 'kip' : 'cham'}">${r.dat ? '✅ Đúng hết' : `❌ Sai ${r.soSai} chữ`}</div>
    ${r.dat ? '' : `
      <div class="cau"><div class="vai">Câu mẫu: chữ đỏ là chọn nhầm (chữ nhỏ bên dưới là chữ anh gõ), chữ gạch chân là thiếu</div><div class="zh so-chu" lang="zh-CN">${chu}</div></div>
      <ul class="ghi">${giaiThich.map(g => `<li>${g}</li>`).join('')}</ul>
      <p class="phu">Gõ pinyin xong, đọc nghĩa câu rồi mới chọn chữ (vd shì: 是 / 事 / 市, zài: 在 / 再, de: 的 / 得).</p>`}
    ${phien.cap === 'thap_py' ? `<p class="phu">Câu mẫu: <span lang="zh-CN">${esc(muc.zh)}</span></p>` : ''}
    ${loi ? `<p class="chi loi">${esc(loi)}</p>` : ''}`;
  nutSauKiem(!r.dat);
}

function xemGoiY() {
  const { esc } = ctx;
  const muc = phien.ds[phien.i];
  const go = $('oGo').value;
  if (!go.trim()) { $('ketQuaDM').innerHTML = '<p class="bao loi">Anh gõ câu trả lời trước, rồi mới xem gợi ý.</p>'; return; }
  $('oGo').readOnly = true;
  $('ketQuaDM').innerHTML = `
    <div class="cau">
      <div class="vai">Gợi ý (một cách đúng, không phải cách duy nhất)</div>
      <div class="zh" lang="zh-CN">${esc(muc.goi_y)}</div>
    </div>
    <p><b>Tự chấm câu của anh, đủ 3 ý là đạt:</b></p>
    <ul class="ghi"><li>Đúng ý câu hỏi?</li><li>Chữ Hán chọn đúng?</li><li>Có từ khóa của bài?</li></ul>
    <p class="phu">Câu nào phân vân đúng sai, chụp lại gửi em xem.</p>
    <div class="hai-nut"><button class="nut-hieu" id="datDM">✅ Đạt</button><button class="nut-chua" id="chuaDatDM">❌ Chưa đạt</button></div>`;
  $('nutDM').innerHTML = '<button id="dungDM">⏹ Dừng</button>';
  $('dungDM').onclick = ketThuc;
  const cham = dat => {
    const loi = luu(muc.id, dat);
    if (loi) { $('ketQuaDM').insertAdjacentHTML('beforeend', `<p class="chi loi">${esc(loi)}</p>`); }
    if (phien.i < phien.ds.length - 1) { phien.i++; veCau(); } else ketThuc();
  };
  $('datDM').onclick = () => cham(true);
  $('chuaDatDM').onclick = () => cham(false);
}

function ketThuc() {
  const p = phien;
  phien = null;
  if (!p) return;
  const { esc, manHinh } = ctx;
  const theoId = Object.fromEntries(p.ds.map(m => [m.id, m]));
  const so = p.kq.size;
  const dat = [...p.kq.values()].filter(Boolean).length;
  const chuaDat = [...p.kq].filter(([, d]) => !d).map(([id]) => theoId[id]);
  manHinh.innerHTML = `
    <h1>📊 Kết quả đánh máy</h1>
    <p class="phu">${esc(p.th.ten)} · ${CAP[p.cap].ten}</p>
    ${so ? `
      <p class="so-lon">${p.cap === 'cao' ? 'Tự chấm đạt' : '✅ Đúng'} ${dat}/${so} câu</p>
      ${chuaDat.length ? `
        <h2>${p.cap === 'cao' ? 'Câu chưa đạt' : 'Câu gõ sai'}</h2>
        <ul class="ghi">${chuaDat.map(m => `<li lang="zh-CN">${esc(m.zh || m.hoi)}</li>`).join('')}</ul>` : ''}
      ${p.cap === 'cao' ? '' : '<p class="phu">Chỉ tính lần kiểm đầu tiên của mỗi câu.</p>'}`
    : '<p>Phiên này chưa kiểm câu nào.</p>'}
    <div class="hang">
      <a class="nut chinh-nut" href="#/dm/${esc(p.th.id)}" id="dmMoi">🔁 Chọn cấp, làm lại</a>
      <a class="nut" href="#/th/${esc(p.th.id)}">← Về tình huống</a>
      <a class="nut" href="#/">Trang chính</a>
    </div>`;
  $('dmMoi').onclick = e => { if (location.hash === `#/dm/${p.th.id}`) { e.preventDefault(); veDanhMay(p.th, ctx); } };
}
