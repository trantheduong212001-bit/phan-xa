// Mẹ duyệt câu mẫu bằng tai. Lần duyệt gắn với giọng đọc lúc duyệt:
// đổi giọng (vd tải Tingting bản nâng cao) thì tiếng phát ra khác → phải nghe duyệt lại.
const HOP_LE = ['tu_nhien', 'la', 'chua'];

// → 'chua' | 'tu_nhien' | 'la' | 'doi_giong'
export function trangThaiDuyet(kho, cauId, giong) {
  const d = kho.duyet?.[cauId];
  if (!d) return 'chua';
  if (d.giong !== giong) return 'doi_giong';
  return d.trang_thai;
}

// Trả về kho mới; trạng thái 'chua' là bỏ duyệt.
export function datDuyet(kho, cauId, trangThai, giong, luc) {
  if (!HOP_LE.includes(trangThai)) throw new Error(`trạng thái duyệt không hợp lệ: ${trangThai}`);
  const duyet = { ...(kho.duyet || {}) };
  if (trangThai === 'chua') delete duyet[cauId];
  else duyet[cauId] = { trang_thai: trangThai, giong, luc };
  return { ...kho, duyet };
}

export function demDuyet(kho, cauIds, giong) {
  return cauIds.filter(id => trangThaiDuyet(kho, id, giong) === 'tu_nhien').length;
}
