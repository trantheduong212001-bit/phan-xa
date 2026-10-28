// Ôn cách quãng riêng từng kỹ năng, theo luật của bộ giáo trình (BAN-GIAO-CHO-CODEX.md, mục "Lịch ôn"):
// mốc [1, 3, 7, 14, 30] ngày; nhớ → tăng stage (tối đa 4); khó → giữ stage, hẹn mai; sai → stage 0, tăng lapses, hẹn mai;
// ôn sớm hoặc làm lại trong ngày → không tiến lịch. Tối đa 20 thẻ ôn + 8 thẻ mới mỗi buổi.
export const KY_NANG = ['nghe_hieu', 'nhac_lai', 'tu_noi', 'danh_may'];
// Thẻ giáo trình (bản 2): xếp lịch ngay khi xong buổi học / làm sai, không qua hạn mức "thẻ mới"
export const KY_NANG_GT = ['nhan_chu', 'nghe_tu', 'nho_tu', 'bai_tap'];
export const TEN_KY_NANG = {
  nghe_hieu: 'Nghe hiểu', nhac_lai: 'Nhắc lại', tu_noi: 'Tự nói', danh_may: 'Đánh máy',
  nhan_chu: 'Nhận chữ', nghe_tu: 'Nghe từ', nho_tu: 'Nhớ từ', bai_tap: 'Làm lại bài sai',
};
const MOC = [1, 3, 7, 14, 30];
const DANH_GIA = ['nho', 'kho', 'sai'];

export const khoa = (kyNang, id) => `${kyNang}|${id}`;

// Ngày theo giờ máy (iPhone ở Việt Nam → giờ Việt Nam), dạng YYYY-MM-DD
export function ngayDiaPhuong(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function congNgay(ngay, n) {
  const [y, m, d] = ngay.split('-').map(Number);
  return ngayDiaPhuong(new Date(y, m - 1, d + n));
}

// cu: trạng thái cũ hoặc undefined (thẻ mới). Trả về trạng thái mới.
export function capNhatOn(cu, danhGia, homNay) {
  if (!DANH_GIA.includes(danhGia)) throw new Error(`đánh giá không hợp lệ: ${danhGia}`);
  if (cu && (cu.lan_cuoi === homNay || cu.han > homNay)) return cu;   // làm lại trong ngày / ôn sớm
  const st = cu?.stage ?? null;
  const chung = { ...(cu || {}), lan_cuoi: homNay, danh_gia: danhGia, lapses: cu?.lapses || 0, ngay_dau: cu?.ngay_dau || homNay };
  if (danhGia === 'nho') {
    const stage = st == null ? 0 : Math.min(st + 1, MOC.length - 1);
    return { ...chung, stage, han: congNgay(homNay, MOC[stage]) };
  }
  if (danhGia === 'kho') return { ...chung, stage: st ?? 0, han: congNgay(homNay, 1) };
  return { ...chung, stage: 0, han: congNgay(homNay, 1), lapses: chung.lapses + 1 };
}

// Mỗi câu hội thoại → nghe hiểu + nhắc lại; mỗi câu hỏi → tự nói; mỗi câu chép mẫu → đánh máy.
export function danhSachMuc(dsTH) {
  const ra = [];
  for (const th of dsTH) {
    for (const c of th.cau) ra.push({ ky_nang: 'nghe_hieu', id: c.id, th: th.id });
    for (const c of th.cau) ra.push({ ky_nang: 'nhac_lai', id: c.id, th: th.id });
    for (const q of th.hoi_dap) ra.push({ ky_nang: 'tu_noi', id: q.id, th: th.id });
    for (const g of th.danh_may_thap) ra.push({ ky_nang: 'danh_may', id: g.id, th: th.id });
  }
  return ra;
}

// → { on: thẻ đến hạn (cũ nhất trước), moi: thẻ mới chia đều kỹ năng, conLai: số thẻ đến hạn chưa xếp vào buổi }
// toiDaMoi tính theo NGÀY: thẻ đã học lần đầu hôm nay được trừ đi.
export function lapHangDoi(kho, dsMuc, homNay, { toiDaOn = 20, toiDaMoi = 8 } = {}) {
  const on = kho.on || {};
  toiDaMoi = Math.max(0, toiDaMoi - Object.values(on).filter(s => s.ngay_dau === homNay && !s.tu_buoi).length);
  const denHan = dsMuc
    .map((m, i) => ({ m, i, s: on[khoa(m.ky_nang, m.id)] }))
    .filter(x => x.s && x.s.han <= homNay)
    .sort((a, b) => (a.s.han < b.s.han ? -1 : a.s.han > b.s.han ? 1 : a.i - b.i))
    .map(x => x.m);
  const theoKyNang = KY_NANG.map(k => dsMuc.filter(m => m.ky_nang === k && !on[khoa(k, m.id)]));
  const moi = [];
  for (let vong = 0; moi.length < toiDaMoi && theoKyNang.some(ds => ds.length > vong); vong++) {
    for (const ds of theoKyNang) if (ds[vong] && moi.length < toiDaMoi) moi.push(ds[vong]);
  }
  return { on: denHan.slice(0, toiDaOn), moi, conLai: Math.max(0, denHan.length - toiDaOn) };
}

// Xếp lịch cho thẻ giáo trình (từ mới của buổi vừa học, câu vừa làm sai): đến hạn từ ngày mai.
// Thẻ đã có lịch thì giữ nguyên.
export function themVaoOn(kho, kyNang, ids, homNay) {
  const on = { ...(kho.on || {}) };
  for (const id of ids) {
    const k = khoa(kyNang, id);
    if (!on[k]) on[k] = { stage: null, han: congNgay(homNay, 1), lan_cuoi: null, danh_gia: null, lapses: 0, ngay_dau: homNay, tu_buoi: true };
  }
  return { ...kho, on };
}

// Các thẻ giáo trình đang có lịch (đọc từ khoá kỹ năng|id), để đưa vào hàng đợi chung
export function mucTuKho(kho) {
  return Object.keys(kho.on || {}).map(k => k.split('|')).filter(([kn]) => KY_NANG_GT.includes(kn))
    .map(([ky_nang, id]) => ({ ky_nang, id, th: 'GT' }));
}

export function ghiOn(kho, kyNang, id, danhGia, homNay) {
  const k = khoa(kyNang, id);
  return { ...kho, on: { ...(kho.on || {}), [k]: capNhatOn(kho.on?.[k], danhGia, homNay) } };
}
