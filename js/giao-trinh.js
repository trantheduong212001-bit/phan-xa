// Nạp giáo trình HSK1–4 (du-lieu/giao-trinh.json, chép nguyên từ Codex — giữ nguyên mọi ID) và lập chỉ mục tra nhanh.
export const DUONG_DAN = './du-lieu/giao-trinh.json';

export function lapChiMuc(d) {
  const theoId = ds => new Map(ds.map(x => [x.id, x]));
  const buoi = new Map();
  for (const bai of d.lessons) for (const phien of bai.sessions) buoi.set(phien.id, { phien, bai });
  return {
    goc: d,
    cap: d.levels,
    dsBai: d.lessons,
    bai: theoId(d.lessons),
    tu: theoId(d.vocabulary),
    bt: theoId(d.exercises),
    doc: theoId(d.reading_passages),
    kt: theoId(d.assessments),
    khoiDong: theoId(d.foundation_sessions),
    lich: d.days,
    buoi,
  };
}

let dangTai = null;
// Tải một lần, dùng lại. Lỗi mạng lần đầu (chưa lưu sẵn) thì báo để màn hình nói rõ cho người dùng.
export function taiGiaoTrinh() {
  dangTai = dangTai || fetch(DUONG_DAN)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(lapChiMuc)
    .catch(e => { dangTai = null; throw e; });
  return dangTai;
}
