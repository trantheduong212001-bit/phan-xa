// Đo độ trễ phản xạ: từ lúc máy đọc xong câu hỏi đến lúc người học bắt đầu nói.
// Chỉ dựa vào âm lượng micro — không phân tích lời nói, không chấm phát âm.

// mau: [{ t: ms, muc: âm lượng 0..1 }] xếp theo thời gian tăng dần.
// batDau: mốc ms lúc máy đọc xong. Mẫu trước mốc này bị bỏ qua (tiếng máy còn dội lại).
// Trả về số ms tính từ batDau, hoặc null nếu không nghe thấy tiếng nói.
export function timDiemMoMieng(mau, { batDau, nguong, giuMs = 150 }) {
  let dauChuoi = null;
  for (const { t, muc } of mau) {
    if (t < batDau) continue;
    if (muc >= nguong) {
      if (dauChuoi === null) dauChuoi = t;
      if (t - dauChuoi >= giuMs) return dauChuoi - batDau;
    } else {
      dauChuoi = null;
    }
  }
  return null;
}

// Ngưỡng "đang nói" = tiếng nền trung bình × heSo, không thấp hơn toiThieu.
export function tinhNguong(mauNen, { toiThieu = 0.02, heSo = 3 } = {}) {
  if (!mauNen.length) return toiThieu;
  const tb = mauNen.reduce((s, m) => s + m.muc, 0) / mauNen.length;
  return Math.max(toiThieu, tb * heSo);
}
