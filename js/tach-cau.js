// Tách câu chữ Hán thành các khúc; khúc nào là từ trong danh sách `ids` thì gắn id để bấm xem.
// Ưu tiên khớp dài nhất tại mỗi vị trí. tu[id].khop (nếu có) liệt kê các dạng cần khớp, mặc định là tu[id].zh.
export function tachCau(zh, tu, ids) {
  const mauKhop = ids.flatMap(id => (tu[id].khop || [tu[id].zh]).map(k => ({ k, id })))
    .sort((a, b) => b.k.length - a.k.length);
  const ra = [];
  let thuong = '';
  for (let i = 0; i < zh.length;) {
    const m = mauKhop.find(({ k }) => zh.startsWith(k, i));
    if (m) {
      if (thuong) { ra.push({ chu: thuong }); thuong = ''; }
      ra.push({ chu: m.k, id: m.id });
      i += m.k.length;
    } else {
      thuong += zh[i++];
    }
  }
  if (thuong) ra.push({ chu: thuong });
  return ra;
}
