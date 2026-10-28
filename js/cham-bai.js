// Chấm bài tập giáo trình theo luật của bộ giáo trình (BAN-GIAO-CHO-CODEX.md):
// exact_option so chỉ số đáp án; normalized_exact bỏ khoảng trắng + dấu câu rồi so với danh sách đáp án nhận;
// self_assessment không chấm, không tính vào điểm khách quan.
import { chuanHoa } from './danh-may.js';

export const laTuDong = bt => bt.scoring === 'exact_option' || bt.scoring === 'normalized_exact';

// traLoi: chỉ số (chọn đáp án) | chuỗi (điền từ) | mảng thẻ theo thứ tự đã chọn (xếp câu)
export function chamBai(bt, traLoi) {
  if (!laTuDong(bt)) return { dung: null, diem: null, toiDa: null };
  let dung = false;
  if (bt.scoring === 'exact_option') dung = traLoi === bt.correct_index;
  else {
    const go = chuanHoa(Array.isArray(traLoi) ? traLoi.join('') : traLoi ?? '');
    dung = go.length > 0 && bt.accepted_answers.some(a => chuanHoa(a) === go);
  }
  const toiDa = bt.max_score ?? 1;
  return { dung, diem: dung ? toiDa : 0, toiDa };
}
