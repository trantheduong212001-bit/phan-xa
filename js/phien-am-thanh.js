// iPhone: sau khi trang dùng micro, Safari có thể kẹt ở chế độ "gọi điện" — tiếng ra loa nghe gọi, rất nhỏ,
// tải lại trang không hết, phải có cuộc gọi đến hoặc tắt hẳn Safari mới hết (anh Dương gặp 28/10/2026).
// Cách chữa: nói rõ với Safari đang phát hay đang thu (Audio Session API, Safari 16.4+). Máy không hỗ trợ thì bỏ qua.
function datKieu(kieu) {
  try {
    if (navigator.audioSession) navigator.audioSession.type = kieu;
  } catch { /* máy không cho đặt — giữ nguyên cách cũ */ }
}

// Phát mẫu: tiếng ra loa ngoài (chế độ này cũng phát cả khi máy đang để im lặng)
export function cheDoPhat() { datKieu('playback'); }

// Trước khi bật micro
export function cheDoThu() { datKieu('play-and-record'); }
