// Tự sinh câu trắc nghiệm từ vựng từ danh sách 610 từ giáo trình.
// kieu 'nghia': nhìn chữ → chọn nghĩa; kieu 'chu': nghe → chọn chữ Hán.
// Phương án sai ưu tiên cùng cấp HSK (khó đoán hơn), không trùng chữ / nghĩa với đáp án.
export function chonPhuongAn(G, tuId, kieu, rand = Math.random) {
  const tu = G.tu.get(tuId);
  const truong = kieu === 'nghia' ? 'meaning_vi' : 'hanzi';
  const dapAn = tu[truong];
  const xao = ds => ds.map(x => ({ x, r: rand() })).sort((a, b) => a.r - b.r).map(o => o.x);
  const daCo = new Set([dapAn, tu.meaning_vi, tu.hanzi].map(String));
  const ungVien = v => v.id !== tuId && !daCo.has(v.hanzi) && !daCo.has(v.meaning_vi);
  const cungCap = xao([...G.tu.values()].filter(v => v.first_level_id === tu.first_level_id && ungVien(v)));
  const khac = xao([...G.tu.values()].filter(v => v.first_level_id !== tu.first_level_id && ungVien(v)));
  const sai = [];
  for (const v of [...cungCap, ...khac]) {
    const gt = v[truong];
    if (!sai.includes(gt) && gt !== dapAn) sai.push(gt);
    if (sai.length === 3) break;
  }
  const viTriDung = Math.floor(rand() * 4) % 4;
  const cacPhuongAn = [...sai];
  cacPhuongAn.splice(viTriDung, 0, dapAn);
  return { dapAn, cacPhuongAn, viTriDung };
}
