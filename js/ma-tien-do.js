// Mã chuyển tiến độ: toàn bộ kho trên máy → một chuỗi chữ để chép sang máy khác (hoặc từ Safari sang biểu tượng
// ngoài màn hình chính — iPhone lưu riêng hai chỗ này). Không gửi đi đâu; người dùng tự chép, tự dán.
const DAU = 'PX1:';
const KHOA_DOI_TUONG = ['duyet', 'on', 'cai_dat'];
const KHOA_MANG = ['hoi_dap', 'cung_me', 'danh_may'];

export function taoMa(kho) {
  let nhiPhan = '';
  for (const b of new TextEncoder().encode(JSON.stringify(kho))) nhiPhan += String.fromCharCode(b);
  return DAU + btoa(nhiPhan);
}

// → { ok: true, kho } | { ok: false, loi }
export function docMa(chuoi) {
  const s = String(chuoi ?? '').replace(/\s+/g, '');
  if (!s) return { ok: false, loi: 'Anh dán mã vào ô trước đã.' };
  if (!s.startsWith(DAU)) return { ok: false, loi: 'Đây không phải mã của app Phản xạ (mã đúng bắt đầu bằng PX1:).' };
  let kho;
  try {
    const bytes = Uint8Array.from(atob(s.slice(DAU.length)), c => c.charCodeAt(0));
    kho = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    return { ok: false, loi: 'Mã bị thiếu hoặc hỏng. Lấy mã lại ở máy kia và chép đủ cả đoạn.' };
  }
  const laDoiTuong = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  if (!laDoiTuong(kho)
    || KHOA_DOI_TUONG.some(k => k in kho && !laDoiTuong(kho[k]))
    || KHOA_MANG.some(k => k in kho && !Array.isArray(kho[k]))) {
    return { ok: false, loi: 'Mã này không chứa dữ liệu tiến độ của app Phản xạ.' };
  }
  return { ok: true, kho };
}

export function tomTatKho(kho) {
  const so = x => (Array.isArray(x) ? x.length : Object.keys(x || {}).length);
  if (!['duyet', 'on', ...KHOA_MANG].some(k => so(kho[k]))) return 'chưa có tiến độ nào';
  return `${so(kho.duyet)} câu mẹ duyệt · ${so(kho.on)} thẻ ôn · ${so(kho.hoi_dap)} lượt hỏi–đáp · ${so(kho.cung_me)} buổi với mẹ · ${so(kho.danh_may)} lần đánh máy`;
}
