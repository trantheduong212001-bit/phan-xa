// Hỏi–đáp có đồng hồ (tầng 4): xáo câu hỏi, xếp loại độ trễ, tổng kết lượt, thống kê tuần.
// Chỉ đo "mở miệng sau bao lâu" — không chấm đúng sai, không chấm phát âm.
export const SO_LUOT_GIU = 300;

export function xaoTron(mang, rand = Math.random) {
  const ra = [...mang];
  for (let i = ra.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ra[i], ra[j]] = [ra[j], ra[i]];
  }
  return ra;
}

// → 'kip' | 'cham' | 'im'
export function danhGia(ms, gioiHanGiay) {
  if (ms == null) return 'im';
  return ms <= gioiHanGiay * 1000 ? 'kip' : 'cham';
}

function demLoai(cau, gioiHanGiay) {
  const dem = { kip: 0, cham: 0, im: 0 };
  for (const c of cau) dem[danhGia(c.ms, gioiHanGiay)]++;
  return dem;
}

function trungBinh(cau) {
  const co = cau.filter(c => c.ms != null);
  return co.length ? co.reduce((s, c) => s + c.ms, 0) / co.length : null;
}

export function tongKetLuot(cau, gioiHanGiay) {
  return { so: cau.length, ...demLoai(cau, gioiHanGiay), tbMs: trungBinh(cau) };
}

// luot: { th, gioi_han, luc (ISO), cau: [{ id, ms }] } → kho mới
export function ghiLuot(kho, luot) {
  const hoi_dap = [...(kho.hoi_dap || []), luot].slice(-SO_LUOT_GIU);
  return { ...kho, hoi_dap };
}

// Tuần = thứ 2 0h đến hết chủ nhật, theo giờ máy. Mỗi câu so với giới hạn của lượt chứa nó.
export function thongKeTuan(kho, bayGio) {
  const dau = new Date(bayGio.getFullYear(), bayGio.getMonth(), bayGio.getDate());
  dau.setDate(dau.getDate() - ((dau.getDay() + 6) % 7));
  const cuoi = new Date(dau); cuoi.setDate(cuoi.getDate() + 7);
  let so = 0, kip = 0;
  const tatCa = [];
  for (const l of kho.hoi_dap || []) {
    const t = new Date(l.luc);
    if (!(t >= dau && t < cuoi)) continue;
    so += l.cau.length;
    kip += demLoai(l.cau, l.gioi_han).kip;
    tatCa.push(...l.cau);
  }
  return { so, kip, tbMs: trungBinh(tatCa) };
}
