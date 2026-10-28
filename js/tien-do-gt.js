// Tiến độ giáo trình trong kho.gt: { xong: {mã buổi: ngày}, diem: {id bài tập: {dung, luc}}, bai_yeu: [id bài] }
export const NGUONG_DAT = 80;   // dưới 80% thì đề xuất củng cố (không khoá cứng)
const laTuDong = bt => bt.scoring === 'exact_option' || bt.scoring === 'normalized_exact';
const gtCua = kho => kho.gt || { xong: {}, diem: {}, bai_yeu: [] };

export function ghiXongBuoi(kho, ma, ngay) {
  const gt = gtCua(kho);
  return { ...kho, gt: { ...gt, xong: { ...gt.xong, [ma]: ngay } } };
}

// Chỉ ghi lần làm đầu tiên (điểm lần đầu tách khỏi lần làm lại — luật bộ giáo trình)
export function ghiDiemBt(kho, btId, dung, ngay) {
  const gt = gtCua(kho);
  if (gt.diem?.[btId]) return kho;
  return { ...kho, gt: { ...gt, diem: { ...gt.diem, [btId]: { dung, luc: ngay } } } };
}

export function ketQuaBai(G, kho, baiId) {
  const diem = gtCua(kho).diem || {};
  const ids = G.bai.get(baiId).exercise_ids.filter(id => laTuDong(G.bt.get(id)) && diem[id]);
  const dung = ids.filter(id => diem[id].dung).length;
  return { dung, tong: ids.length, phanTram: ids.length ? Math.round(dung / ids.length * 100) : null };
}

// Gọi khi xong buổi ôn nhanh của một bài HSK1: dưới 80% → thêm vào bài yếu (lịch sẽ chèn đủ buổi học)
export function danhDauBaiYeu(G, kho, baiId) {
  const gt = gtCua(kho);
  const { phanTram } = ketQuaBai(G, kho, baiId);
  const conLai = (gt.bai_yeu || []).filter(id => id !== baiId);
  return { ...kho, gt: { ...gt, bai_yeu: phanTram != null && phanTram < NGUONG_DAT ? [...conLai, baiId] : conLai } };
}

// Ôn tuần / ôn đơn vị: tối đa 12 câu chấm tự động khác nhau; câu từng sai trước, rồi câu chưa làm, rồi câu đã đúng.
export function chonCauOn(G, kho, baiIds, toiDa = 12) {
  const diem = gtCua(kho).diem || {};
  const tatCa = baiIds.flatMap(b => G.bai.get(b).exercise_ids).filter(id => laTuDong(G.bt.get(id)));
  const hang = id => (diem[id] ? (diem[id].dung ? 2 : 0) : 1);
  return tatCa.map((id, i) => ({ id, i })).sort((a, b) => hang(a.id) - hang(b.id) || a.i - b.i).slice(0, toiDa).map(x => x.id);
}

// Từ đã được giới thiệu: từ mới của các buổi học đã xong + toàn bộ từ của bài đã ôn nhanh
export function tuDaHoc(G, kho) {
  const ra = new Set();
  for (const ma of Object.keys(gtCua(kho).xong || {})) {
    if (ma.startsWith('NHANH-')) G.bai.get(ma.slice(6))?.vocabulary_ids.forEach(id => ra.add(id));
    else G.buoi.get(ma)?.phien.new_vocabulary_ids?.forEach(id => ra.add(id));
  }
  return [...ra];
}
