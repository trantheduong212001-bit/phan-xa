// Lưu tiến độ ngay trên máy (localStorage). Không gửi đi đâu.
// Mọi lần đọc/ghi đều bọc try/catch: chế độ riêng tư, bộ nhớ đầy hay dữ liệu hỏng không được làm app chết.
export const KHOA_KHO = 'phanxa.v1';

export function taoKho(boNho) {
  const kho = {
    hong: false,
    doc() {
      try {
        const s = boNho?.getItem(KHOA_KHO);
        return s ? JSON.parse(s) : {};
      } catch {
        kho.hong = true;
        return {};
      }
    },
    ghi(duLieu) {
      try {
        if (!boNho) throw new Error('không có bộ nhớ');
        boNho.setItem(KHOA_KHO, JSON.stringify(duLieu));
        return { ok: true };
      } catch {
        return { ok: false, loi: 'Không lưu được trên máy (bộ nhớ đầy hoặc đang ở chế độ duyệt riêng tư).' };
      }
    },
  };
  return kho;
}
