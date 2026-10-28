// Màn giáo trình HSK1–4 (bản 2: vé G02–G04, G06): danh sách bài, chi tiết bài, buổi học theo lịch, bài tập, kiểm tra.
import { taiGiaoTrinh } from './js/giao-trinh.js';
import { lapLich, buoiTiepTheo, duKienXong, laNgayHoc, phutBuoi } from './js/lich-hoc.js';
import { chamBai, laTuDong } from './js/cham-bai.js';
import { ghiXongBuoi, ghiDiemBt, ketQuaBai, danhDauBaiYeu, chonCauOn, NGUONG_DAT } from './js/tien-do-gt.js';
import { ngayDiaPhuong, themVaoOn } from './js/on-tap.js';
import { dungDoc } from './js/giong.js';

const TEN_LOAI = {
  foundation: 'Khởi động', lesson: 'Buổi học', on_nhanh: 'Ôn nhanh HSK1',
  weekly_review: 'Ôn tuần', unit_review: 'Ôn đơn vị', level_check: 'Kiểm tra chuyển cấp',
};
const TEN_CAP = { HSK1: 'HSK 1', HSK2: 'HSK 2', HSK3: 'HSK 3', HSK4: 'HSK 4' };

let ctx = null;   // { manHinh, esc, layDuLieu, luuDuLieu }
const $ = id => document.getElementById(id);
const homNay = () => ngayDiaPhuong();

function lichCua(G, duLieu) {
  return lapLich(G, { hsk1Nhanh: true, baiYeu: duLieu.gt?.bai_yeu || [] });
}

function luu(kho) {
  const r = ctx.luuDuLieu(kho);
  if (!r.ok) ctx.manHinh.insertAdjacentHTML('afterbegin', `<p class="chi loi">${ctx.esc(r.loi)}</p>`);
}

function tenBuoi(G, b) {
  const bai = b.bai && G.bai.get(b.bai);
  if (b.loai === 'foundation') return `${TEN_LOAI.foundation} · ${G.khoiDong.get(b.ma).title}`;
  if (b.loai === 'lesson') return `${bai.id} · ${bai.title} · buổi ${G.buoi.get(b.ma).phien.phase}`;
  if (b.loai === 'on_nhanh') return `${TEN_LOAI.on_nhanh} · ${bai.id} · ${bai.title}`;
  if (b.loai === 'level_check') return `${TEN_LOAI.level_check} ${TEN_CAP[b.cap]}`;
  return `${TEN_LOAI[b.loai]} · ${(b.d.lesson_ids || []).join(', ')}`;
}

// Từ mới của buổi vừa học → lịch ôn từ ngày mai, 3 kỹ năng (nhận chữ, nghe từ, nhớ từ)
function themTuMoi(kho, ids) {
  for (const k of ['nhan_chu', 'nghe_tu', 'nho_tu']) kho = themVaoOn(kho, k, ids, homNay());
  return kho;
}

function chi(G, lich, xong, b) {
  const so = lich.indexOf(b) + 1;
  return `Buổi ${so}/${lich.length} · ${tenBuoi(G, b)} · ${phutBuoi(G, b)} phút`;
}

// ——— Ô "Giáo trình hôm nay" trên trang chính (gọi sau khi vẽ trang chính) ———
export async function veOGiaoTrinhHomNay(el, c) {
  ctx = c;
  try {
    const G = await taiGiaoTrinh();
    const d = ctx.layDuLieu();
    const xong = d.gt?.xong || {};
    const lich = lichCua(G, d);
    const b = buoiTiepTheo(lich, xong);
    const daHocHomNay = Object.values(xong).includes(homNay());
    const { esc } = ctx;
    if (!b) { el.innerHTML = '<p class="chi">🎉 Đã học hết lộ trình HSK1 → HSK4.</p>'; return; }
    el.innerHTML = daHocHomNay
      ? `<p class="chi">✅ Hôm nay đã học xong buổi giáo trình.</p><a class="nut" href="#/gt/buoi">➕ Học thêm: ${esc(chi(G, lich, xong, b))}</a>`
      : !laNgayHoc(homNay())
        ? `<p class="chi">Thứ 7 nghỉ giáo trình. Muốn học bù thì bấm bên dưới.</p><a class="nut" href="#/gt/buoi">▶ ${esc(chi(G, lich, xong, b))}</a>`
        : `<p class="chi">👉 Buổi giáo trình hôm nay: <b>${esc(chi(G, lich, xong, b))}</b></p><a class="nut chinh-nut lon-nut" href="#/gt/buoi">▶ Học buổi này</a>`;
  } catch {
    el.innerHTML = '<p class="chi loi">Chưa tải được giáo trình. Mở app một lần khi có mạng rồi thử lại.</p>';
  }
}

// ——— Tổng quan giáo trình ———
export async function veGiaoTrinh(c) {
  ctx = c;
  const { esc, manHinh } = ctx;
  manHinh.innerHTML = '<p class="phu">⏳ Đang tải giáo trình…</p>';
  let G;
  try { G = await taiGiaoTrinh(); } catch { manHinh.innerHTML = '<p class="chi loi">Chưa tải được giáo trình. Mở app một lần khi có mạng rồi thử lại.</p><a class="nut" href="#/">← Về trang chính</a>'; return; }
  const d = ctx.layDuLieu();
  const xong = d.gt?.xong || {};
  const lich = lichCua(G, d);
  const b = buoiTiepTheo(lich, xong);
  const soXong = lich.filter(x => xong[x.ma]).length;
  const duKien = duKienXong(lich, xong, homNay());
  const fmt = n => new Date(n).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric', year: 'numeric' });
  document.title = 'Giáo trình · Phản xạ';
  manHinh.innerHTML = `
    <a class="nut lui" href="#/">← Về trang chính</a>
    <h1>📚 Giáo trình HSK1 → HSK4</h1>
    <p class="phu">70 bài · mỗi ngày 1 buổi, nghỉ thứ 7 · HSK1 ôn nhanh. Lịch đếm theo số buổi: nghỉ hôm nào thì hôm sau học tiếp, không mất bài.</p>
    <p class="so-lon">${soXong}/${lich.length} buổi</p>
    ${b ? `<p class="chi">👉 Buổi tiếp theo: <b>${esc(chi(G, lich, xong, b))}</b></p><a class="nut chinh-nut lon-nut" href="#/gt/buoi">▶ Học buổi này</a>` : '<p class="chi">🎉 Đã học hết lộ trình.</p>'}
    <h2>Dự kiến xong (nếu ngày nào cũng học)</h2>
    <ul class="ghi">${Object.entries(duKien).map(([cap, n]) => `<li><b>${TEN_CAP[cap]}</b>: ${fmt(n)}</li>`).join('')}</ul>
    ${(d.gt?.bai_yeu || []).length ? `<p class="phu">Bài cần củng cố (đã xếp thêm buổi học đủ): ${esc(d.gt.bai_yeu.join(', '))}</p>` : ''}
    <h2>Các bài</h2>
    ${G.cap.map(cap => `
      <details ${b && b.cap === cap.id ? 'open' : ''}>
        <summary>${esc(cap.title)} · ${cap.lesson_count} bài</summary>
        <p class="phu">${esc(cap.outcome)}</p>
        <div class="ds">${G.dsBai.filter(x => x.level_id === cap.id).map(x => {
          const kq = ketQuaBai(G, d, x.id);
          return `<a class="o" href="#/gt/bai/${esc(x.id)}"><b>${esc(x.id)} · ${esc(x.title)}</b>
            <span class="phu">${esc(x.objective)}</span>
            ${kq.tong ? `<span class="phu">Bài tập đã làm: ${kq.dung}/${kq.tong} đúng (${kq.phanTram}%)</span>` : ''}</a>`;
        }).join('')}</div>
      </details>`).join('')}`;
}

// ——— Khối nội dung bài (dùng ở chi tiết bài và buổi học) ———
function khoiTu(G, ids) {
  const { esc } = ctx;
  return `<div class="bang-tu">${ids.map(id => {
    const v = G.tu.get(id);
    return `<div class="o"><span class="zh" lang="zh-CN">${esc(v.hanzi)}</span> <span class="py">${esc(v.pinyin)}</span> — <b>${esc(v.meaning_vi)}</b>
      <div class="hang"><button data-noi-chu="${esc(v.hanzi)}">▶ Nghe</button></div></div>`;
  }).join('')}</div>`;
}

function khoiNguPhap(bai) {
  const { esc } = ctx;
  return bai.grammar.map(g => `
    <div class="cau">
      <div class="vai">${esc(g.title)}</div>
      <p><b>${esc(g.pattern)}</b> — ${esc(g.explanation_vi)}</p>
      <div class="zh" lang="zh-CN">${esc(g.example_zh)}</div><div class="py">${esc(g.pinyin)}</div><div class="vi">${esc(g.meaning_vi)}</div>
      <div class="hang"><button data-noi-chu="${esc(g.example_zh)}">▶ Nghe ví dụ</button></div>
    </div>`).join('');
}

function khoiHoiThoaiDoc(G, bai) {
  const { esc } = ctx;
  if (bai.dialogue?.length) {
    return `<div class="hoi-thoai che-nghia" id="khoiDoc">${bai.dialogue.map(c => `
      <div class="cau"><div class="vai">${esc(c.speaker)}</div><div class="zh" lang="zh-CN">${esc(c.zh)}</div>
        <div class="py">${esc(c.pinyin)}</div><div class="vi">${esc(c.vi)}</div>
        <div class="hang"><button data-noi-chu="${esc(c.zh)}">▶ Nghe</button></div></div>`).join('')}</div>
      <button data-hien-nghia="khoiDoc">👁 Hiện nghĩa</button>`;
  }
  return (bai.reading_passage_ids || []).map(id => {
    const r = G.doc.get(id);
    return `<div class="cau che-nghia" id="doc-${esc(id)}"><div class="zh" lang="zh-CN">${esc(r.zh)}</div><div class="vi">${esc(r.vi)}</div>
      <div class="hang"><button data-noi-chu="${esc(r.zh)}">▶ Nghe cả đoạn</button><button data-hien-nghia="doc-${esc(id)}">👁 Hiện nghĩa</button></div></div>
      <p class="phu">Đọc trước, tự đoán ý, rồi mới bấm Hiện nghĩa.</p>`;
  }).join('');
}

// ——— Chi tiết bài ———
export async function veBai(c, baiId) {
  ctx = c;
  const { esc, manHinh } = ctx;
  const G = await taiGiaoTrinh();
  const bai = G.bai.get(baiId);
  if (!bai) { manHinh.innerHTML = '<p class="chi">Không tìm thấy bài.</p><a class="nut" href="#/gt">← Giáo trình</a>'; return; }
  document.title = `${bai.id} · Phản xạ`;
  manHinh.innerHTML = `
    <a class="nut lui" href="#/gt">← Giáo trình</a>
    <h1>${esc(bai.id)} · ${esc(bai.title)}</h1>
    <p><b>Mục tiêu:</b> ${esc(bai.objective)}</p>
    <h2>Từ mới (${bai.vocabulary_ids.length})</h2>${khoiTu(G, bai.vocabulary_ids)}
    <h2>Ngữ pháp</h2>${khoiNguPhap(bai)}
    <h2>${bai.dialogue?.length ? 'Hội thoại' : 'Bài đọc'}</h2>${khoiHoiThoaiDoc(G, bai)}
    <p class="phu">${esc(bai.pronunciation_note || '')}</p>
    <h2>Bài tập (${bai.exercise_ids.length})</h2>
    <p class="phu">Làm lại ở đây là luyện thêm; điểm chỉ tính lần làm đầu tiên.</p>
    <button class="chinh lon" id="lamBt">▶ Làm bài tập của bài</button>
    <div id="vungBt"></div>`;
  $('lamBt').onclick = () => { $('lamBt').hidden = true; chayBaiTap(G, bai.exercise_ids, $('vungBt'), () => { $('vungBt').insertAdjacentHTML('beforeend', '<p class="chi">✅ Xong bài tập của bài.</p>'); }); };
}

// ——— Trình chạy bài tập: lần lượt từng bài, gọi xong(kq) khi hết ———
function chayBaiTap(G, ids, vung, xong) {
  const kq = { dung: 0, tong: 0 };
  let i = 0;
  const tiep = () => {
    if (i >= ids.length) { xong(kq); return; }
    const bt = G.bt.get(ids[i++]);
    veMotBai(G, bt, vung, ketQua => {
      if (ketQua === true || ketQua === false) { kq.tong++; if (ketQua) kq.dung++; }
      tiep();
    }, `${i}/${ids.length}`);
  };
  tiep();
}

// Cho màn Ôn hôm nay dùng lại: làm một bài tập, xong(true|false|null)
export function lamMotBaiTap(c, G, btId, vung, xong) {
  ctx = c;
  veMotBai(G, G.bt.get(btId), vung, xong, 'ôn lại');
}

function veMotBai(G, bt, vung, xongBai, soThuTu) {
  const { esc } = ctx;
  const khung = noi => {
    vung.innerHTML = `<div class="cau bai-tap"><div class="vai">Bài tập ${soThuTu} · ${esc(bt.id)}</div><p><b>${esc(bt.prompt_vi)}</b></p>${noi}</div>`;
  };
  const sauCham = (dung, giaiThich) => {
    let kho = ghiDiemBt(ctx.layDuLieu(), bt.id, dung, homNay());
    if (!dung) kho = themVaoOn(kho, 'bai_tap', [bt.id], homNay());   // câu sai → mai làm lại trong Ôn hôm nay
    luu(kho);
    vung.querySelector('.bai-tap').insertAdjacentHTML('beforeend', `
      <div class="o-hd ${dung ? 'kip' : 'cham'}">${dung ? '✅ Đúng' : '❌ Chưa đúng'}</div>
      ${giaiThich ? `<p>${esc(giaiThich)}</p>` : ''}
      <button class="chinh lon" id="btTiep">▶ Tiếp</button>`);
    $('btTiep').onclick = () => xongBai(dung);
  };
  const tuCham = () => `
    ${bt.rubric ? `<p><b>Tự chấm theo tiêu chí:</b></p><ul class="ghi">${bt.rubric.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    <div class="ba-nut"><button class="nut-hieu" data-muc="good">✅ Tốt</button><button data-muc="hard">🤏 Khó</button><button class="nut-chua" data-muc="again">❌ Làm lại sau</button></div>`;
  const ganTuCham = () => vung.querySelectorAll('[data-muc]').forEach(b => b.onclick = () => {
    const d = ctx.layDuLieu();
    const gt = d.gt || {};
    luu({ ...d, gt: { ...gt, tu_cham: { ...(gt.tu_cham || {}), [bt.id]: { muc: b.dataset.muc, luc: homNay() } } } });
    xongBai(null);
  });

  if (bt.type === 'meaning_choice' || bt.type === 'reading_choice') {
    let nguCanh = '';
    if (bt.dialogue_lesson_id) nguCanh = G.bai.get(bt.dialogue_lesson_id).dialogue.map(c => `<div class="zh" lang="zh-CN">${esc(c.speaker)}: ${esc(c.zh)}</div>`).join('');
    if (bt.passage_id) nguCanh = `<div class="zh" lang="zh-CN">${esc(G.doc.get(bt.passage_id).zh)}</div>`;
    khung(`${nguCanh ? `<div class="cau">${nguCanh}</div>` : ''}<div class="ba-nut">${bt.options.map((o, k) => `<button data-chon="${k}">${esc(o)}</button>`).join('')}</div>`);
    vung.querySelectorAll('[data-chon]').forEach(b => b.onclick = () => {
      vung.querySelectorAll('[data-chon]').forEach(x => { x.disabled = true; if (+x.dataset.chon === bt.correct_index) x.classList.add('nut-hieu'); });
      sauCham(chamBai(bt, +b.dataset.chon).dung, bt.explanation_vi);
    });
  } else if (bt.type === 'gap_fill') {
    khung(`<textarea id="oDien" class="o-go" rows="1" lang="zh-CN" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="Gõ chữ Hán…"></textarea>
      <div class="hang"><button class="chinh" id="kiemDien">✔ Kiểm tra</button><button id="khongBiet">🤷 Không biết, xem đáp án</button></div>`);
    $('kiemDien').onclick = () => {
      if (!$('oDien').value.trim()) return;
      $('oDien').readOnly = true; $('kiemDien').disabled = true; $('khongBiet').disabled = true;
      sauCham(chamBai(bt, $('oDien').value).dung, `Đáp án: ${bt.accepted_answers.join(' / ')}. ${bt.explanation_vi || ''}`);
    };
    $('khongBiet').onclick = () => { $('kiemDien').disabled = true; $('khongBiet').disabled = true; sauCham(false, `Đáp án: ${bt.accepted_answers.join(' / ')}. ${bt.explanation_vi || ''}`); };
  } else if (bt.type === 'sentence_order') {
    const con = bt.tokens.map((t, k) => ({ t, k }));
    const chon = [];
    const ve = () => {
      $('daChon').innerHTML = chon.map((x, j) => `<button class="the-chu" data-bo="${j}" lang="zh-CN">${esc(x.t)}</button>`).join('') || '<span class="phu">Chạm các thẻ bên dưới theo đúng thứ tự…</span>';
      $('conLai').innerHTML = con.filter(x => !chon.includes(x)).map(x => `<button class="the-chu" data-lay="${x.k}" lang="zh-CN">${esc(x.t)}</button>`).join('');
      $('kiemXep').disabled = chon.length !== con.length;
      vung.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => { chon.push(con.find(x => x.k === +b.dataset.lay)); ve(); });
      vung.querySelectorAll('[data-bo]').forEach(b => b.onclick = () => { chon.splice(+b.dataset.bo, 1); ve(); });
    };
    khung(`<div class="xep-cau" id="daChon"></div><div class="hang" id="conLai"></div><button class="chinh" id="kiemXep">✔ Kiểm tra</button>`);
    $('kiemXep').onclick = () => {
      $('kiemXep').disabled = true;
      vung.querySelectorAll('[data-lay],[data-bo]').forEach(b => { b.disabled = true; });
      sauCham(chamBai(bt, chon.map(x => x.t)).dung, `Câu đúng: ${bt.accepted_answers[0]}. ${bt.explanation_vi || ''}`);
    };
    ve();
  } else if (bt.type === 'handwriting' || bt.type === 'handwriting_words') {
    const chu = bt.character ? [bt.character] : (bt.vocabulary_ids || []).map(id => G.tu.get(id).hanzi);
    khung(`<div class="chu-mau" lang="zh-CN">${chu.map(esc).join(' ')}</div>
      <p class="phu">Viết trên giấy (ô vuông hoặc vở).</p>
      ${bt.steps ? `<ol class="ghi">${bt.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}${tuCham()}`);
    ganTuCham();
  } else if (bt.type === 'speaking') {
    const mau = bt.model_dialogue_lesson_id && G.bai.get(bt.model_dialogue_lesson_id).dialogue;
    khung(`${mau?.length ? `<button id="xemMau">👁 Xem câu mẫu (tính là có gợi ý)</button><div class="cau" id="khoiMau" hidden>${mau.map(c => `<div class="zh" lang="zh-CN">${esc(c.speaker)}: ${esc(c.zh)}</div><div class="py">${esc(c.pinyin)}</div>`).join('')}</div>` : ''}
      <p class="phu">Nói thành tiếng, không nhìn mẫu. Muốn nghe lại giọng mình thì dùng 🎤 ở phần tình huống.</p>${tuCham()}`);
    if ($('xemMau')) $('xemMau').onclick = () => { $('khoiMau').hidden = false; vung.querySelector('[data-muc="good"]').disabled = true; };
    ganTuCham();
  } else {   // guided_writing
    khung(`<textarea class="o-go" rows="4" lang="zh-CN" placeholder="Viết ra giấy, hoặc gõ ở đây (không bắt buộc)…"></textarea>
      <button id="xemMau">📄 Xem bài mẫu (sau khi tự viết)</button>
      <div class="cau" id="khoiMau" hidden><div class="zh" lang="zh-CN">${esc(bt.model_answer_zh || '')}</div><p class="phu">${esc(bt.constraint_policy || '')}</p></div>${tuCham()}`);
    $('xemMau').onclick = () => { $('khoiMau').hidden = false; };
    ganTuCham();
  }
}

// ——— Buổi học theo lịch ———
export async function veBuoi(c) {
  ctx = c;
  const { esc, manHinh } = ctx;
  manHinh.innerHTML = '<p class="phu">⏳ Đang tải giáo trình…</p>';
  let G;
  try { G = await taiGiaoTrinh(); } catch { manHinh.innerHTML = '<p class="chi loi">Chưa tải được giáo trình. Mở app một lần khi có mạng rồi thử lại.</p>'; return; }
  const d = ctx.layDuLieu();
  const xong = d.gt?.xong || {};
  const lich = lichCua(G, d);
  const b = buoiTiepTheo(lich, xong);
  if (!b) { manHinh.innerHTML = '<p class="chi">🎉 Đã học hết lộ trình.</p><a class="nut" href="#/gt">← Giáo trình</a>'; return; }
  document.title = `${tenBuoi(G, b)} · Phản xạ`;
  const dau = `
    <a class="nut lui" href="#/gt">← Giáo trình</a>
    <p class="phu">${esc(chi(G, lich, xong, b))}</p>
    <h1>${esc(TEN_LOAI[b.loai])}</h1>`;
  const nutXong = (ghiChu = '') => `
    <div id="ketThucBuoi">${ghiChu}
      <button class="chinh lon" id="xongBuoi">✅ Xong buổi</button>
      <p class="phu">Bận, chỉ làm được bản 10 phút (2' ôn từ · 5' một cặp hỏi–đáp · 2' viết · 1' ghi kết quả)? Bản ngắn không tính là xong buổi: để mai học tiếp buổi này.</p>
    </div>`;
  const ganXong = sau => {
    $('xongBuoi').onclick = () => {
      dungDoc();
      let kho = ghiXongBuoi(ctx.layDuLieu(), b.ma, homNay());
      if (sau) kho = sau(kho);
      luu(kho);
      veSauBuoi(G, b);
    };
  };

  if (b.loai === 'foundation') {
    const f = G.khoiDong.get(b.ma);
    manHinh.innerHTML = `${dau}<h2>${esc(f.title)} · ${f.minutes} phút</h2>
      <ol class="ghi">${f.instructions.map(s => `<li>${esc(s)}</li>`).join('')}</ol>${nutXong()}`;
    ganXong();
    return;
  }

  if (b.loai === 'on_nhanh' || b.loai === 'lesson') {
    const bai = G.bai.get(b.bai);
    const phien = b.loai === 'lesson' ? G.buoi.get(b.ma).phien : null;
    const tuMoi = phien ? phien.new_vocabulary_ids || [] : bai.vocabulary_ids;
    const dsBt = phien ? phien.exercise_ids || [] : bai.exercise_ids.filter(id => laTuDong(G.bt.get(id)));
    manHinh.innerHTML = `${dau}
      <h2>${esc(bai.id)} · ${esc(bai.title)}</h2>
      <p><b>Mục tiêu:</b> ${esc(bai.objective)}</p>
      ${phien ? `<ol class="ghi">${phien.steps.map(s => `<li>${esc(s.label)} · ${s.minutes} phút</li>`).join('')}</ol>` :
        '<p class="chi">👉 Ôn nhanh: lướt từ, ngữ pháp, hội thoại; rồi làm bài tập có đáp án. Dưới 80% thì app tự xếp thêm buổi học đủ cho bài này.</p>'}
      <p class="phu">1 · Ôn đến hạn: làm <a href="#/on">📅 Ôn hôm nay</a> trước hoặc sau buổi này.</p>
      ${tuMoi.length ? `<details open><summary>Từ mới (${tuMoi.length})</summary>${khoiTu(G, tuMoi)}</details>` : ''}
      ${!phien || phien.phase === 'A' ? `<details open><summary>Ngữ pháp</summary>${khoiNguPhap(bai)}</details>` : `<details><summary>Ngữ pháp (xem lại)</summary>${khoiNguPhap(bai)}</details>`}
      <details ${!phien || phien.phase !== 'A' ? 'open' : ''}><summary>${bai.dialogue?.length ? 'Hội thoại' : 'Bài đọc'}</summary>${khoiHoiThoaiDoc(G, bai)}</details>
      <h2>Bài tập của buổi (${dsBt.length})</h2>
      <button class="chinh lon" id="batDauBt">▶ Làm bài tập</button>
      <div id="vungBt"></div>`;
    $('batDauBt').onclick = () => {
      $('batDauBt').hidden = true;
      chayBaiTap(G, dsBt, $('vungBt'), kq => {
        const phanTram = kq.tong ? Math.round(kq.dung / kq.tong * 100) : null;
        const ghiChu = phanTram == null ? '' : `<p class="so-lon">${kq.dung}/${kq.tong} câu đúng (${phanTram}%)</p>
          ${phanTram < NGUONG_DAT ? `<p class="chi">Dưới ${NGUONG_DAT}%: ${b.loai === 'on_nhanh' ? 'bấm Xong buổi, app sẽ xếp thêm các buổi học đủ cho bài này.' : 'nên xem lại từ và ngữ pháp của bài trước buổi sau.'}</p>` : ''}`;
        $('vungBt').innerHTML = nutXong(ghiChu);
        ganXong(kho => {
          kho = themTuMoi(kho, tuMoi);
          return b.loai === 'on_nhanh' ? danhDauBaiYeu(G, kho, b.bai) : kho;
        });
      });
    };
    return;
  }

  if (b.loai === 'weekly_review' || b.loai === 'unit_review') {
    const ds = chonCauOn(G, d, b.d.lesson_ids);
    manHinh.innerHTML = `${dau}
      <ol class="ghi">${(b.d.instructions || []).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      <h2>${ds.length} câu có đáp án</h2>
      <button class="chinh lon" id="batDauBt">▶ Làm bài ôn</button><div id="vungBt"></div>`;
    $('batDauBt').onclick = () => {
      $('batDauBt').hidden = true;
      chayBaiTap(G, ds, $('vungBt'), kq => {
        const pt = kq.tong ? Math.round(kq.dung / kq.tong * 100) : 0;
        $('vungBt').innerHTML = nutXong(`<p class="so-lon">${kq.dung}/${kq.tong} câu đúng (${pt}%)</p>
          <p class="chi">${pt >= NGUONG_DAT ? '✅ Đạt. Học tiếp bài mới.' : `Dưới ${NGUONG_DAT}%: nên xem lại các bài ${esc(b.d.lesson_ids.join(', '))} (bấm vào bài trong Giáo trình). Vẫn được học tiếp.`}</p>`);
        ganXong();
      });
    };
    return;
  }

  // level_check
  const a = G.kt.get(b.d.assessment_id);
  manHinh.innerHTML = `${dau}
    <p class="phu">${esc(a.title)} · kiểm tra nội bộ, không phải chứng nhận đỗ HSK.</p>
    <h2>1 · Đọc</h2>
    <div class="cau che-nghia" id="ktDoc"><div class="zh" lang="zh-CN">${esc(a.passage_zh)}</div><div class="vi">${esc(a.passage_vi)}</div>
      <div class="hang"><button data-noi-chu="${esc(a.passage_zh)}">▶ Nghe</button></div></div>
    <div id="vungKt"></div>`;
  let i = 0, dung = 0;
  const cauTiep = () => {
    if (i >= a.questions.length) {
      $('ktDoc').classList.remove('che-nghia');
      $('vungKt').innerHTML = `<p class="so-lon">Đọc: ${dung}/${a.questions.length}</p>
        <h2>2 · Viết</h2><p>${esc(a.writing_prompt_vi)}</p><p class="phu">Viết ra giấy trước khi xem lại bài.</p>
        <h2>3 · Nói</h2><p>${esc(a.speaking_prompt_vi)}</p>
        <p><b>Tiêu chí:</b></p><ul class="ghi">${a.rubric.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
        <p class="phu">${esc(a.release_rule)}</p>${nutXong()}`;
      ganXong(kho => ({ ...kho, gt: { ...kho.gt, kiem_tra: { ...(kho.gt.kiem_tra || {}), [a.id]: { doc: dung, tong: a.questions.length, luc: homNay() } } } }));
      return;
    }
    const q = a.questions[i];
    $('vungKt').innerHTML = `<div class="cau"><p><b>Câu ${i + 1}: ${esc(q.prompt_vi)}</b></p>
      <div class="ba-nut">${q.options.map((o, k) => `<button data-chon="${k}">${esc(o)}</button>`).join('')}</div></div>`;
    $('vungKt').querySelectorAll('[data-chon]').forEach(btn => btn.onclick = () => {
      if (+btn.dataset.chon === q.correct_index) dung++;
      i++; cauTiep();
    });
  };
  cauTiep();
}

function veSauBuoi(G, b) {
  const { esc, manHinh } = ctx;
  const d = ctx.layDuLieu();
  const lich = lichCua(G, d);
  const tiep = buoiTiepTheo(lich, d.gt.xong);
  const yeuMoi = b.loai === 'on_nhanh' && (d.gt.bai_yeu || []).includes(b.bai);
  manHinh.innerHTML = `
    <h1>✅ Xong buổi</h1>
    <p>${esc(tenBuoi(G, b))}</p>
    ${yeuMoi ? `<p class="chi">Bài ${esc(b.bai)} dưới ${NGUONG_DAT}%: app đã xếp thêm ${G.bai.get(b.bai).sessions.length} buổi học đủ cho bài này, bắt đầu từ buổi sau.</p>` : ''}
    ${b.loai === 'lesson' || b.loai === 'on_nhanh' ? '<p class="phu">Từ mới của buổi và các câu làm sai đã vào <b>📅 Ôn hôm nay</b>, bắt đầu từ ngày mai.</p>' : ''}
    ${tiep ? `<p>Buổi sau: ${esc(chi(G, lich, d.gt.xong, tiep))}</p>` : ''}
    <div class="hang"><a class="nut chinh-nut" href="#/">Trang chính</a><a class="nut" href="#/gt">📚 Giáo trình</a></div>`;
}
