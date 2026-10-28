// Giọng đọc mẫu = giọng tiếng Trung có sẵn của máy (Speak Selection trên iPhone). Chưa có file audio.
import { xepGiong, nhanGiong } from './chon-giong.js';

let giong = null;
const nguoiNghe = new Set();

function nap() {
  const ds = xepGiong(speechSynthesis.getVoices());
  const moi = ds[0] || null;
  if (moi?.voiceURI === giong?.voiceURI) return;
  giong = moi;
  nguoiNghe.forEach(f => f());
}

export function coDocDuoc() { return 'speechSynthesis' in window; }

// onDoi: gọi lại khi danh sách giọng nạp xong hoặc đổi (Safari nạp giọng không đồng bộ)
export function khoiDongGiong(onDoi) {
  if (!coDocDuoc()) return;
  if (onDoi) nguoiNghe.add(onDoi);
  nap();
  speechSynthesis.addEventListener('voiceschanged', nap);
}

export function giongHienTai() { return giong; }
export function tenGiong() { return giong ? nhanGiong(giong) : ''; }

export function dungDoc() { if (coDocDuoc()) speechSynthesis.cancel(); }

// Đọc một câu. Trả về Promise xong khi đọc hết, bị ngắt, hoặc hết giờ chờ.
export function noi(chu, toc = 1) {
  return new Promise(resolve => {
    if (!coDocDuoc()) { resolve({ ok: false }); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(chu);
    u.lang = 'zh-CN';
    if (giong) u.voice = giong;
    u.rate = toc;
    let xong = false;
    const ket = ok => { if (xong) return; xong = true; clearTimeout(cho); resolve({ ok }); };
    const cho = setTimeout(() => ket(false), 2500 + chu.length * 700 / toc);
    u.onend = () => ket(true);
    u.onerror = () => ket(false);
    speechSynthesis.speak(u);
  });
}
