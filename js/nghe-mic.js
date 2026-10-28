// Micro bật suốt để đo độ trễ (cách A của thử V01: có khử tiếng vọng, tiếng máy đọc vẫn to, rõ).
// Chỉ đọc mức âm lượng 20 ms một lần; không thu, không lưu tiếng.
import { cheDoPhat, cheDoThu } from './phien-am-thanh.js';

let luong = null, ngu = null, dem = null;
export const mau = [];   // [{ t: performance.now(), muc }]

export function dangMo() { return !!(luong && luong.active); }

export async function moMicDo() {
  if (dangMo()) return { ok: true };
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, loi: 'Trình duyệt này không dùng được micro. Hãy mở bằng Safari.' };
  cheDoThu();
  try {
    luong = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch (e) {
    cheDoPhat();
    return {
      ok: false,
      loi: e.name === 'NotAllowedError'
        ? 'Chưa cho phép micro. Vào Cài đặt → Safari → Micrô → chọn "Cho phép", rồi mở lại app.'
        : `Không bật được micro (${e.name}).`,
    };
  }
  ngu = ngu || new (window.AudioContext || window.webkitAudioContext)();
  if (ngu.state === 'suspended') await ngu.resume();
  const phanTich = ngu.createAnalyser();
  phanTich.fftSize = 1024;
  ngu.createMediaStreamSource(luong).connect(phanTich);
  const buf = new Float32Array(phanTich.fftSize);
  mau.length = 0;
  dem = setInterval(() => {
    phanTich.getFloatTimeDomainData(buf);
    let s = 0; for (const x of buf) s += x * x;
    mau.push({ t: performance.now(), muc: Math.sqrt(s / buf.length) });
    if (mau.length > 1500) mau.splice(0, 500);
  }, 20);
  return { ok: true };
}

// Tắt micro, đóng hẳn bộ xử lý âm thanh và trả iPhone về chế độ phát loa ngoài
export function tatMicDo() {
  clearInterval(dem); dem = null;
  if (!luong && !ngu) return;
  if (luong) luong.getTracks().forEach(t => t.stop());
  luong = null;
  if (ngu) { ngu.close().catch(() => {}); ngu = null; }
  cheDoPhat();
}
