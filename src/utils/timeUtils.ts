const DATE_TIME_WITH_ZONE_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;
const ISO_LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T|\s)/;

export function parseBackendDate(dateString: unknown): Date | null {
  if (!dateString) return null;

  const value = String(dateString).trim();
  if (!value) return null;

  const normalized =
    ISO_LOCAL_DATE_TIME_PATTERN.test(value) && !DATE_TIME_WITH_ZONE_PATTERN.test(value)
      ? `${value}Z`
      : value;
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimeAgo(dateString: string): string {
  const date = parseBackendDate(dateString) ?? new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Nếu trong vòng 1 phút
  if (diffInSeconds < 60) {
    return "Vừa xong";
  }

  // Nếu trong vòng 1 giờ
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }

  // Nếu trong vòng 24 giờ
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }

  // Nếu trong vòng 7 ngày
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }

  // Hiển thị ngày/tháng
  const isThisYear = date.getFullYear() === now.getFullYear();

  if (isThisYear) {
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
    });
  } else {
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}

export function formatMessageTime(dateString: string): string {
  const date = parseBackendDate(dateString) ?? new Date(dateString);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Đảm bảo dùng định dạng 24h
  });
}

export function formatFullDate(dateString: string): string {
  const date = parseBackendDate(dateString) ?? new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


/**
 * Kiểm tra xem có nên hiện dòng thời gian giữa 2 tin nhắn không
 * Rule: Nếu cách nhau > 60 phút thì hiện
 */
export const shouldShowTimestamp = (
  currentDateString: string,
  prevDateString?: string,
): boolean => {
  if (!prevDateString) return true;

  const current = (parseBackendDate(currentDateString) ?? new Date(currentDateString)).getTime();
  const prev = (parseBackendDate(prevDateString) ?? new Date(prevDateString)).getTime();

  const THRESHOLD = 60 * 60 * 1000;

  return current - prev > THRESHOLD;
};

/**
 * Format hiển thị cho dòng thời gian ngăn cách (Phiên bản nâng cấp)
 * - Hôm nay: "Hôm nay, 14:30"
 * - Hôm qua: "Hôm qua, 14:30"
 * - Trong tuần: "Thứ Hai, 14:30"
 * - Xa hơn: "05/02/2026, 14:30" (Luôn hiện năm)
 */
export const formatChatTimestamp = (dateString: string): string => {
  const date = parseBackendDate(dateString) ?? new Date(dateString);
  const now = new Date();

  // 1. Reset giờ phút giây về 0 để so sánh khoảng cách ngày chính xác
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Tính khoảng cách số ngày
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Lấy giờ phút (VD: 14:30)
  const timeStr = formatMessageTime(dateString);

  if (diffDays === 0) {
    // Nếu là hôm nay
    return `Hôm nay, ${timeStr}`;
  } else if (diffDays === 1) {
    // Nếu là hôm qua
    return `Hôm qua, ${timeStr}`;
  } else if (diffDays < 7) {
    // Nếu trong vòng 1 tuần -> Hiện thứ (VD: Thứ Hai, 14:30)
    const dayName = date.toLocaleDateString("vi-VN", { weekday: "long" });
    return `${dayName}, ${timeStr}`;
  } else {
    // Kết quả: 05/02/2026, 14:30
    const dateStr = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric", 
    });
    return `${dateStr}, ${timeStr}`;
  }
};
