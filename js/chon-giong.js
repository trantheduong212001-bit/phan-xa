// Chọn giọng tiếng Trung tốt nhất trong danh sách giọng của máy.
// iPhone có cả giọng chuẩn (Tingting, Lili…) lẫn giọng vui (Eddy, Grandma, Rocko…) — giọng vui không dùng làm mẫu.
const GIONG_VUI = /eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|bad news|bells|boing|bubbles|cellos|jester|organ|trinoids|whisper|wobble|zarvox|superstar|albert|fred|junior|kathy|ralph/;

export function laGiongTrung(v) {
  return /^zh[-_]CN$/i.test(v.lang) || /^zh$/i.test(v.lang);
}

export function hangGiong(v) {
  const s = `${v.voiceURI || ''} ${v.name || ''}`.toLowerCase();
  if (/premium/.test(s)) return 0;
  if (/enhanced|nâng cao|增强|优化/.test(s)) return 1;
  if (GIONG_VUI.test(s)) return 9;
  if (/tingting|lili|yu-shu|lilian|meijia|li-mu|yaoyao|xiaoxiao/.test(s)) return 2;
  return 5;
}

export function nhanGiong(v) {
  const h = hangGiong(v);
  return v.name + (h === 0 ? ' (cao cấp)' : h === 1 ? ' (nâng cao)' : h === 9 ? ' (giọng vui)' : '');
}

// Trả về danh sách giọng tiếng Trung, tốt nhất đứng đầu
export function xepGiong(tatCa) {
  return tatCa.filter(laGiongTrung)
    .map((v, i) => ({ v, i }))
    .sort((a, b) => hangGiong(a.v) - hangGiong(b.v) || a.i - b.i)
    .map(x => x.v);
}
