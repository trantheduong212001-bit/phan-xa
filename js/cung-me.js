// Chế độ "Cùng mẹ": mẹ hỏi theo thẻ gợi ý tiếng Việt, bấm Hiểu / Chưa hiểu cho câu trả lời của Dương.
// Đây là thước đo "mẹ hiểu không" của kế hoạch 0.4 — thay cho việc người học tự chấm.
export const SO_BUOI_GIU = 100;
const KET = ['hieu', 'chua'];

// dsThe: [{ id, ket, lan_chua }] theo thứ tự thẻ được hỏi. Trả về mảng mới.
export function danhDau(dsThe, id, ket) {
  if (!KET.includes(ket)) throw new Error(`kết quả không hợp lệ: ${ket}`);
  const cu = dsThe.find(t => t.id === id);
  const lan_chua = (cu?.lan_chua || 0) + (ket === 'chua' ? 1 : 0);
  const moi = { id, ket, lan_chua };
  return cu ? dsThe.map(t => (t.id === id ? moi : t)) : [...dsThe, moi];
}

export function tongKetMe(dsThe) {
  return {
    so: dsThe.length,
    hieu: dsThe.filter(t => t.ket === 'hieu').length,
    chua: dsThe.filter(t => t.ket === 'chua').length,
    noiLai: dsThe.reduce((s, t) => s + t.lan_chua, 0),
  };
}

// buoi: { th, luc (ISO), the: dsThe, tieng_viet: số lần Dương chuyển sang tiếng Việt }
export function ghiBuoiMe(kho, buoi) {
  return { ...kho, cung_me: [...(kho.cung_me || []), buoi].slice(-SO_BUOI_GIU) };
}

export function buoiGanNhat(kho, thId) {
  const ds = (kho.cung_me || []).filter(b => b.th === thId);
  return ds.length ? ds[ds.length - 1] : null;
}
