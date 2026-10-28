// Thu giọng người học để nghe lại. Bản thu chỉ nằm trong bộ nhớ lúc app đang mở, không lưu xuống máy.
// Micro chỉ bật trong lúc thu — phát mẫu luôn phát khi micro tắt để tiếng to, rõ (kết quả thử V01).
import { cheDoPhat, cheDoThu } from './phien-am-thanh.js';

let luong = null, rec = null, manh = [], khiDung = null;

export function dangThu() { return !!rec; }

export async function batDauThu() {
  if (rec) return { ok: true };
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    return { ok: false, loi: 'Trình duyệt này không thu giọng được. Hãy mở bằng Safari.' };
  }
  cheDoThu();
  try {
    luong = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch (e) {
    cheDoPhat();
    return {
      ok: false,
      loi: e.name === 'NotAllowedError'
        ? 'Chưa cho phép micro. Vào Cài đặt → Safari → Micrô → chọn "Cho phép", rồi mở lại app.'
        : `Không bật được micro (${e.name}).`,
    };
  }
  const kieu = ['audio/mp4', 'audio/webm'].find(k => MediaRecorder.isTypeSupported(k));
  rec = new MediaRecorder(luong, kieu ? { mimeType: kieu } : undefined);
  manh = [];
  rec.ondataavailable = e => e.data.size && manh.push(e.data);
  rec.onstop = () => {
    const blob = new Blob(manh, { type: rec.mimeType || kieu || 'audio/mp4' });
    luong.getTracks().forEach(t => t.stop());
    luong = null; rec = null;
    cheDoPhat();   // trả về loa ngoài để nghe lại bản thu và phát mẫu to, rõ
    const f = khiDung; khiDung = null;
    f?.(blob.size ? URL.createObjectURL(blob) : null);
  };
  rec.start();
  return { ok: true };
}

// → Promise<url của bản thu | null>
export function dungThu() {
  if (!rec) return Promise.resolve(null);
  return new Promise(resolve => { khiDung = resolve; rec.stop(); });
}
