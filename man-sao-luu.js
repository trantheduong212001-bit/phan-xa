// Màn "Sao lưu và chuyển máy" (vé V08): lấy mã / nạp mã tiến độ, trạng thái chạy khi mất mạng.
import { taoMa, docMa, tomTatKho } from './js/ma-tien-do.js';

let ctx = null;   // { manHinh, esc, layDuLieu, luuDuLieu }
const $ = id => document.getElementById(id);

function bao(id, chu, kieu = '') { const el = $(id); if (el) { el.textContent = chu; el.className = `bao ${kieu}`; } }

export function veSaoLuu(c) {
  ctx = c;
  const { esc, manHinh } = ctx;
  const offline = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
  document.title = 'Sao lưu · Phản xạ';
  manHinh.innerHTML = `
    <a class="nut lui" href="#/">← Về trang chính</a>
    <h1>💾 Sao lưu và chuyển máy</h1>
    <p class="chi">👉 iPhone lưu tiến độ của <b>Safari</b> và của <b>biểu tượng ngoài màn hình chính</b> riêng nhau. Muốn chuyển: bấm Lấy mã ở chỗ cũ, rồi Nạp mã ở chỗ mới.</p>
    <p>Tiến độ ở đây: <b>${esc(tomTatKho(ctx.layDuLieu()))}</b>.</p>

    <h2>1 · Lấy mã (ở chỗ đang có tiến độ)</h2>
    <button class="chinh" id="layMa">📤 Lấy mã</button>
    <div id="khungMa" hidden>
      <textarea id="oMa" class="o-ma" readonly rows="4"></textarea>
      <button id="chepMa">📋 Chép mã</button>
      <p class="phu">Dán mã vào Ghi chú, hoặc gửi cho chính anh qua Zalo "Cloud của tôi". Mã chỉ là chữ, không gửi đi đâu.</p>
    </div>
    <p class="bao" id="baoLay"></p>

    <h2>2 · Nạp mã (ở chỗ mới)</h2>
    <textarea id="oNap" class="o-ma" rows="4" placeholder="Dán mã bắt đầu bằng PX1: vào đây" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
    <div class="hang" id="nutNap"><button class="chinh" id="napMa">📥 Nạp mã</button></div>
    <p class="bao" id="baoNap"></p>

    <h2>Chạy khi mất mạng</h2>
    <p>${offline
      ? '✅ Đã sẵn sàng: app mở được cả khi không có mạng. Giọng đọc vẫn cần giọng tiếng Trung đã tải về máy.'
      : 'Chưa sẵn sàng. Mở app một lần khi có mạng, đợi vài giây rồi mở lại trang này.'}</p>`;

  $('layMa').onclick = () => {
    $('oMa').value = taoMa(ctx.layDuLieu());
    $('khungMa').hidden = false;
    bao('baoLay', 'Đã có mã. Bấm Chép mã.', 'tot');
  };
  $('chepMa').onclick = async () => {
    try {
      await navigator.clipboard.writeText($('oMa').value);
      bao('baoLay', 'Đã chép. Mở Ghi chú hoặc Zalo, giữ ngón tay rồi chọn Dán.', 'tot');
    } catch {
      $('oMa').select();
      bao('baoLay', 'Máy không cho chép tự động. Mã đã được bôi đen: giữ ngón tay lên khung rồi chọn Sao chép.', 'loi');
    }
  };
  $('napMa').onclick = kiemMaNap;
}

function kiemMaNap() {
  const { esc } = ctx;
  const r = docMa($('oNap').value);
  if (!r.ok) { bao('baoNap', r.loi, 'loi'); return; }
  bao('baoNap', '');
  // Hai bước: nạp là thay toàn bộ, nên hỏi lại kèm số liệu cả hai bên
  $('nutNap').innerHTML = `
    <div class="cau">
      <p><b>Mã có:</b> ${esc(tomTatKho(r.kho))}.</p>
      <p><b>Ở đây đang có:</b> ${esc(tomTatKho(ctx.layDuLieu()))}.</p>
      <p>Nạp sẽ <b>thay toàn bộ</b> tiến độ ở đây bằng tiến độ trong mã.</p>
      <div class="hang"><button class="chinh" id="dongYNap">✅ Đồng ý thay</button><button id="huyNap">Huỷ</button></div>
    </div>`;
  $('huyNap').onclick = () => veSaoLuu(ctx);
  $('dongYNap').onclick = () => {
    const ghi = ctx.luuDuLieu(r.kho);
    if (!ghi.ok) { bao('baoNap', ghi.loi, 'loi'); return; }
    veSaoLuu(ctx);
    bao('baoNap', `✅ Đã nạp xong: ${tomTatKho(r.kho)}.`, 'tot');
  };
}
