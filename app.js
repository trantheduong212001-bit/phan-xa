import { NOI_DUNG } from './noi-dung.js';
import { tachCau } from './js/tach-cau.js';

const { tu: TU, tinh_huong: TH } = NOI_DUNG;
const manHinh = document.getElementById('manHinh');
const theTu = document.getElementById('theTu');

// Chữ từ dữ liệu luôn đi qua hàm này trước khi vào innerHTML
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function soTuMoi(th) { return th.tu_moi.length; }

function veTrangChinh() {
  document.title = 'Phản xạ · luyện nói tiếng Trung';
  manHinh.innerHTML = `
    <h1>Phản xạ</h1>
    <p class="phu">Luyện nói tiếng Trung để gặp đối tác, ngồi bàn tiệc.</p>
    <p class="chi">👉 Chọn một tình huống để xem hội thoại và từ mới. Phần nghe, nói, đánh máy có ở bản sau.</p>

    <h2>Tình huống</h2>
    <div class="ds">
      ${TH.map(th => `
        <a class="o" href="#/th/${esc(th.id)}">
          <b>${esc(th.ten)}</b>
          <span class="phu">${esc(th.muc_tieu)}</span>
          <span class="phu">${th.cau.length} câu · ${soTuMoi(th)} từ mới</span>
        </a>`).join('')}
    </div>

    <h2>Sắp có</h2>
    <div class="ds">
      ${[
        ['⏱ Hỏi–đáp có đồng hồ', 'Trả lời trong 5 → 3 → 2 giây, máy đo anh mở miệng sau bao lâu'],
        ['👩 Cùng mẹ', 'Gợi ý tiếng Việt chữ to, mẹ bấm Hiểu / Chưa hiểu'],
        ['⌨️ Đánh máy', 'Cấp thấp chép câu mẫu, cấp cao gõ câu trả lời'],
        ['📅 Ôn hôm nay', 'Ôn riêng nghe hiểu, nhắc lại, tự nói, đánh máy'],
      ].map(([ten, mo]) => `<div class="o sap"><b>${ten}</b> <span class="nhan">bản sau</span><span class="phu">${mo}</span></div>`).join('')}
    </div>

    <footer class="phu">Bản ${esc(NOI_DUNG.phien_ban)} · Câu mẫu chưa được người bản ngữ nghe duyệt.</footer>`;
}

function veCau(th, c) {
  const ids = [...th.tu_moi, ...th.ten_rieng];
  const khuc = tachCau(c.zh, TU, ids).map(k => k.id
    ? `<button class="tu-moi" data-tu="${esc(k.id)}">${esc(k.chu)}</button>`
    : esc(k.chu)).join('');
  return `
    <div class="cau ${esc(c.vai)}">
      <div class="vai">${esc(th.vai[c.vai])}</div>
      <div class="zh" lang="zh-CN">${khuc}</div>
      <div class="py">${esc(c.py)}</div>
      <div class="vi">${esc(c.vi)}</div>
      ${c.sua_04 ? `<div class="sua">Đã sửa theo kế hoạch 0.4 · câu cũ: <span lang="zh-CN">${esc(c.sua_04)}</span></div>` : ''}
    </div>`;
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

function veTinhHuong(id) {
  const th = TH.find(t => t.id === id);
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
    <p class="chi">👉 Đọc hội thoại. Chữ tô màu là từ mới: chạm vào để xem pinyin, nghĩa, cách dùng.</p>

    <h2>Hội thoại</h2>
    <button id="cheNghia" aria-pressed="false">🙈 Che nghĩa tiếng Việt để tự đoán</button>
    <div class="hoi-thoai" id="hoiThoai" style="margin-top:10px">${th.cau.map(c => veCau(th, c)).join('')}</div>

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
        <div class="cau"><div class="zh" lang="zh-CN">${esc(c.zh)}</div><div class="py">${esc(c.py)}</div><div class="vi">${esc(c.vi)}</div></div>`).join('')}
      </div>` : ''}

    <h2>Thay thế nhanh</h2>
    <p class="phu">Nhìn gợi ý, nói trọn câu trong 3 giây.</p>
    <div class="hoi-thoai">${th.thay_the.map(s => `
      <div class="cau">
        <div class="khung" lang="zh-CN">${esc(s.khung)}</div>
        <div class="vi">${esc(s.vi)}</div>
        <div class="goi-y">${s.goi_y.map(g => `<span lang="zh-CN">${esc(g.zh)} <small>${esc(g.py)}${g.vi ? ' · ' + esc(g.vi) : ''}</small></span>`).join('')}</div>
      </div>`).join('')}
    </div>

    <p style="margin-top:24px"><a class="nut" href="#/">← Về trang chính</a></p>`;

  document.getElementById('cheNghia').onclick = e => {
    const bat = document.getElementById('hoiThoai').classList.toggle('che-nghia');
    e.currentTarget.setAttribute('aria-pressed', String(bat));
    e.currentTarget.textContent = bat ? '👁 Hiện lại nghĩa tiếng Việt' : '🙈 Che nghĩa tiếng Việt để tự đoán';
  };
}

function moTheTu(id) {
  const w = TU[id];
  if (!w) return;
  theTu.innerHTML = `
    <div class="zh" lang="zh-CN">${esc(w.zh)}</div>
    <div class="py" style="font-size:20px">${esc(w.py)}</div>
    <p><b>${esc(w.vi)}</b></p>
    <p><b>Cách dùng:</b> ${esc(w.cach_dung)}</p>
    ${w.phat_am ? `<p><b>Phát âm:</b> ${esc(w.phat_am)}</p>` : ''}
    <button class="chinh" id="dongTheTu">Đóng</button>`;
  theTu.hidden = false;
  document.getElementById('dongTheTu').onclick = dongTheTu;
}
function dongTheTu() { theTu.hidden = true; }

document.addEventListener('click', e => {
  const nut = e.target.closest('[data-tu]');
  if (nut) moTheTu(nut.dataset.tu);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') dongTheTu(); });

function dinhTuyen() {
  dongTheTu();
  const m = location.hash.match(/^#\/th\/(.+)$/);
  if (m) veTinhHuong(decodeURIComponent(m[1]));
  else veTrangChinh();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', dinhTuyen);
dinhTuyen();
