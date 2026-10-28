// Đánh máy: so câu gõ với câu mẫu từng chữ (cấp thấp) và lưu kết quả.
// Cấp cao KHÔNG so tự động — câu trả lời đúng có nhiều cách; người học tự đối chiếu gợi ý.
export const SO_BAN_GHI_GIU = 500;

// Bỏ khoảng trắng, dấu câu, ký hiệu (cả dấu Trung lẫn Latin) trước khi so
export function chuanHoa(s) {
  return String(s).replace(/[\s\p{P}\p{S}]/gu, '');
}

// → { dat, soSai, khuc: [{ loai: 'dung'|'sai'|'thieu'|'thua', mau?, go? }] } theo thứ tự câu mẫu.
// Dóng hai chuỗi bằng khoảng cách sửa (Levenshtein), ưu tiên coi là chọn nhầm chữ khi có thể.
export function soChu(mauGoc, goGoc) {
  const a = [...chuanHoa(mauGoc)], b = [...chuanHoa(goGoc)];
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i ? (j ? 0 : i) : j)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const khuc = [];
  let i = a.length, j = b.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      khuc.push(a[i - 1] === b[j - 1] ? { loai: 'dung', mau: a[i - 1] } : { loai: 'sai', mau: a[i - 1], go: b[j - 1] });
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      khuc.push({ loai: 'thieu', mau: a[i - 1] });
      i--;
    } else {
      khuc.push({ loai: 'thua', go: b[j - 1] });
      j--;
    }
  }
  khuc.reverse();
  const soSai = d[a.length][b.length];
  return { dat: soSai === 0 && a.length > 0, soSai, khuc };
}

// banGhi: { th, cap: 'thap' | 'thap_py' | 'cao', phien, id, dat, luc, so_sai? }
export function ghiDanhMay(kho, banGhi) {
  return { ...kho, danh_may: [...(kho.danh_may || []), banGhi].slice(-SO_BAN_GHI_GIU) };
}

// Tóm tắt phiên gần nhất của một tình huống → { cap, so, dat, luc } | null
export function phienGanNhat(kho, th) {
  const cua = (kho.danh_may || []).filter(b => b.th === th);
  if (!cua.length) return null;
  const cuoi = cua[cua.length - 1];
  const trong = cua.filter(b => b.phien === cuoi.phien);
  return { cap: cuoi.cap, so: trong.length, dat: trong.filter(b => b.dat).length, luc: cuoi.luc };
}
