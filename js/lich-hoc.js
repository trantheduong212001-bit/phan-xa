// Lịch học giáo trình: 313 buổi của bộ giáo trình (days), đếm theo số buổi đã học — nghỉ không mất bài.
// Đã chốt 28/10/2026: nhịp B (mỗi ngày 1 buổi, nghỉ thứ 7), HSK1 ôn nhanh (mỗi bài 1 buổi; bài yếu chèn đủ buổi).
import { congNgay } from './on-tap.js';

export const maBuoi = d => d.session_id || d.assessment_id || `D${String(d.day).padStart(3, '0')}`;

// → [{ ma, loai: 'foundation'|'lesson'|'on_nhanh'|'weekly_review'|'unit_review'|'level_check', cap, bai?, d? }]
export function lapLich(G, { hsk1Nhanh = true, baiYeu = [] } = {}) {
  const ra = [];
  const daCoNhanh = new Set();
  for (const d of G.lich) {
    const thuocHsk1OnNhanh = hsk1Nhanh && d.level_id === 'HSK1' && (d.kind === 'lesson' || d.kind === 'weekly_review');
    if (!thuocHsk1OnNhanh) {
      ra.push({ ma: maBuoi(d), loai: d.kind, cap: d.level_id, bai: d.lesson_id, d });
      continue;
    }
    if (d.kind === 'weekly_review' || daCoNhanh.has(d.lesson_id)) continue;
    daCoNhanh.add(d.lesson_id);
    ra.push({ ma: `NHANH-${d.lesson_id}`, loai: 'on_nhanh', cap: 'HSK1', bai: d.lesson_id });
    if (baiYeu.includes(d.lesson_id)) {
      for (const s of G.bai.get(d.lesson_id).sessions) {
        ra.push({ ma: s.id, loai: 'lesson', cap: 'HSK1', bai: d.lesson_id, d: { kind: 'lesson', session_id: s.id, lesson_id: d.lesson_id, level_id: 'HSK1' } });
      }
    }
  }
  return ra;
}

// xong: { mã buổi: 'YYYY-MM-DD' }
export function buoiTiepTheo(lich, xong) {
  return lich.find(b => !xong[b.ma]) || null;
}

export function laNgayHoc(ngay) {
  const [y, m, d] = ngay.split('-').map(Number);
  return new Date(y, m - 1, d).getDay() !== 6;   // nghỉ thứ 7
}

function ngayHocTiep(ngay) {
  let n = congNgay(ngay, 1);
  while (!laNgayHoc(n)) n = congNgay(n, 1);
  return n;
}

// Ngày dự kiến xong từng cấp: mỗi ngày học 1 buổi; hôm nay đã học thì bắt đầu từ ngày học kế tiếp.
export function duKienXong(lich, xong, homNay) {
  let ngay = Object.values(xong).includes(homNay) || !laNgayHoc(homNay) ? ngayHocTiep(homNay) : homNay;
  const ra = {};
  for (const b of lich) {
    let n;
    if (xong[b.ma]) n = xong[b.ma];
    else { n = ngay; ngay = ngayHocTiep(ngay); }
    if (!ra[b.cap] || n > ra[b.cap]) ra[b.cap] = n;
  }
  return ra;
}

export function phutBuoi(G, b) {
  if (b.loai === 'on_nhanh') return 35;
  if (b.loai === 'foundation') return G.khoiDong.get(b.ma)?.minutes ?? 25;
  if (b.loai === 'lesson') return G.buoi.get(b.ma)?.phien.minutes ?? 35;
  return b.d?.minutes ?? 35;
}
