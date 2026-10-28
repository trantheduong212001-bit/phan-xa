// Màn "Cùng mẹ" (vé V05). Màn mẹ cầm: chỉ có tiếng Việt, chữ to, nút to — mẹ không đọc được chữ Hán.
import { danhDau, tongKetMe, ghiBuoiMe, buoiGanNhat } from './js/cung-me.js';
import { noi, dungDoc, giongHienTai } from './js/giong.js';

let ctx = null;     // { manHinh, esc, layDuLieu, luuDuLieu }
let phien = null;   // { th, i, the: dsThe, tiengViet }

const $ = id => document.getElementById(id);
const nghi = ms => new Promise(r => setTimeout(r, ms));

export function dongBuoiTruoc(duLieu, thId) {
  const b = buoiGanNhat(duLieu, thId);
  if (!b) return 'Chưa luyện với mẹ lần nào.';
  const tk = tongKetMe(b.the);
  const ngay = new Date(b.luc).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
  return `Lần trước (${ngay}): mẹ hiểu ${tk.hieu}/${tk.so} câu · Dương nói tiếng Việt ${b.tieng_viet} lần.`;
}

export function veCungMe(th, c) {
  ctx = c;
  huyCungMe();
  const { esc, manHinh } = ctx;
  document.title = `Cùng mẹ · ${th.ten} · Phản xạ`;
  manHinh.innerHTML = `
    <a class="nut lui" href="#/th/${esc(th.id)}">← Về tình huống</a>
    <h1>👩 Cùng mẹ · ${esc(th.ten)}</h1>
    <p class="chi">👉 Đưa điện thoại cho mẹ. Mẹ đọc thẻ, hỏi Dương bằng lời của mẹ. Dương trả lời xong, mẹ bấm <b>Hiểu</b> hoặc <b>Chưa hiểu</b>.</p>
    <ul class="ghi">
      <li>Mẹ hỏi càng khác câu mẫu càng tốt: Dương phải nghe hiểu thật.</li>
      <li>Mẹ muốn biết câu hỏi đại ý thế nào thì bấm <b>🔈 Nghe câu mẫu</b>.</li>
      <li>Dương lỡ nói tiếng Việt thì mẹ bấm <b>🇻🇳 Dương nói tiếng Việt</b>.</li>
    </ul>
    <p>${th.the_me.length} thẻ.</p>
    <button class="chinh lon" id="batDauMe">▶ Bắt đầu</button>
    <p class="phu">${esc(dongBuoiTruoc(ctx.layDuLieu(), th.id))}</p>`;
  $('batDauMe').onclick = () => {
    phien = { th, i: 0, the: [], tiengViet: 0 };
    veThe();
  };
}

function veThe(loiNhan = '') {
  const { esc, manHinh } = ctx;
  const { th, i } = phien;
  const m = th.the_me[i];
  const cu = phien.the.find(t => t.id === m.id);
  manHinh.innerHTML = `
    <p class="phu">Thẻ ${i + 1}/${th.the_me.length} · Dương nói tiếng Việt: <b id="soTV">${phien.tiengViet}</b> lần</p>
    <div class="the-me">${esc(m.vi)}</div>
    <p class="phu">Mẹ hỏi bằng lời của mẹ, không cần đúng câu mẫu.</p>
    ${m.mau.length ? '<button id="ngheMau">🔈 Nghe câu mẫu</button>' : ''}
    <p class="bao ${loiNhan ? 'tot' : ''}" id="baoMe">${esc(loiNhan)}</p>
    <div class="hai-nut">
      <button class="nut-hieu" id="hieu">✅ Hiểu</button>
      <button class="nut-chua" id="chuaHieu">❓ Chưa hiểu</button>
    </div>
    <div class="hang">
      <button id="tiengViet">🇻🇳 Dương nói tiếng Việt</button>
      ${cu?.ket === 'chua' ? '<button id="boQua">▶ Bỏ qua, thẻ tiếp</button>' : ''}
      ${i > 0 ? '<button id="theTruoc">↩ Thẻ trước</button>' : ''}
      <button id="dungMe">⏹ Dừng</button>
    </div>`;
  if (m.mau.length) $('ngheMau').onclick = () => ngheMau(m);
  $('hieu').onclick = () => bam('hieu');
  $('chuaHieu').onclick = () => bam('chua');
  $('tiengViet').onclick = () => { phien.tiengViet++; $('soTV').textContent = phien.tiengViet; };
  if ($('boQua')) $('boQua').onclick = theTiep;
  if ($('theTruoc')) $('theTruoc').onclick = () => { dungDoc(); phien.i--; veThe(); };
  $('dungMe').onclick = ketThuc;
}

async function ngheMau(m) {
  if (!giongHienTai()) { $('baoMe').textContent = 'Máy chưa có giọng tiếng Trung nên chưa phát được câu mẫu.'; $('baoMe').className = 'bao loi'; return; }
  const theoId = Object.fromEntries(phien.th.hoi_dap.map(q => [q.id, q]));
  for (const id of m.mau) {
    if (!phien) return;
    await noi(theoId[id].zh);
    await nghi(400);
  }
}

function bam(ket) {
  dungDoc();
  const m = phien.th.the_me[phien.i];
  phien.the = danhDau(phien.the, m.id, ket);
  if (ket === 'hieu') theTiep();
  else veThe('Dương nói lại một lần nữa. Mẹ nghe rồi bấm lại Hiểu hoặc Chưa hiểu.');
}

function theTiep() {
  dungDoc();
  if (phien.i < phien.th.the_me.length - 1) { phien.i++; veThe(); }
  else ketThuc();
}

function luuPhien() {
  if (!phien?.the.length) return null;
  return ctx.luuDuLieu(ghiBuoiMe(ctx.layDuLieu(), {
    th: phien.th.id, luc: new Date().toISOString(), the: phien.the, tieng_viet: phien.tiengViet,
  }));
}

function ketThuc() {
  const p = phien;
  const r = luuPhien();
  dungDoc();
  phien = null;
  if (p) veTongKet(p, r);
}

// Rời màn giữa chừng: vẫn lưu các thẻ đã bấm
export function huyCungMe() {
  if (!phien) return;
  luuPhien();
  dungDoc();
  phien = null;
}

function veTongKet(p, ghi) {
  const { esc, manHinh } = ctx;
  const tk = tongKetMe(p.the);
  const theoId = Object.fromEntries(p.th.the_me.map(m => [m.id, m]));
  const chua = p.the.filter(t => t.ket === 'chua');
  manHinh.innerHTML = `
    <h1>📊 Kết quả buổi với mẹ</h1>
    <p class="phu">${esc(p.th.ten)}</p>
    ${tk.so ? `
      <p class="so-lon">✅ Mẹ hiểu ${tk.hieu}/${tk.so} câu</p>
      <p>Phải nói lại: ${tk.noiLai} lần · Dương nói tiếng Việt: ${p.tiengViet} lần.</p>
      ${ghi && !ghi.ok ? `<p class="chi loi">${esc(ghi.loi)}</p>` : ''}
      ${chua.length ? `
        <h2>Mẹ chưa hiểu</h2>
        <ul class="ghi">${chua.map(t => `<li>${esc(theoId[t.id].vi)}</li>`).join('')}</ul>
        <p class="chi">👉 Những câu này: vào tình huống, bấm 🎤 Luyện câu này để nói theo vài lần. Câu nào mẹ thấy "người Trung Quốc không nói vậy" thì ghi lại gửi em sửa.</p>` : ''}`
    : '<p>Buổi này chưa bấm thẻ nào nên không lưu.</p>'}
    <div class="hang">
      <a class="nut chinh-nut" href="#/me/${esc(p.th.id)}" id="buoiMoi">🔁 Làm lại từ đầu</a>
      <a class="nut" href="#/th/${esc(p.th.id)}">← Về tình huống</a>
      <a class="nut" href="#/">Trang chính</a>
    </div>`;
  // Đang ở #/me/… thì bấm không đổi hash → vẽ lại màn bắt đầu trực tiếp
  $('buoiMoi').onclick = e => { if (location.hash === `#/me/${p.th.id}`) { e.preventDefault(); veCungMe(p.th, ctx); } };
}
