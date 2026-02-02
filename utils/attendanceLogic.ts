

// Fix: Removed missing and unused parseISO export from date-fns to resolve module error
import { differenceInMinutes, format, isBefore, isAfter } from 'date-fns';

export function calculateDelay(checkInTime: Date, scheduledStartTime: string): number {
  const [hours, minutes] = scheduledStartTime.split(':').map(Number);
  const scheduled = new Date(checkInTime);
  scheduled.setHours(hours, minutes, 0, 0);

  // إذا كان وقت الحضور بعد وقت الدوام المحدد
  if (isAfter(checkInTime, scheduled)) {
    return differenceInMinutes(checkInTime, scheduled);
  }
  return 0;
}

export function calculateEarlyDeparture(checkOutTime: Date, scheduledEndTime: string): number {
  const [hours, minutes] = scheduledEndTime.split(':').map(Number);
  const scheduled = new Date(checkOutTime);
  scheduled.setHours(hours, minutes, 0, 0);

  // إذا كان وقت الانصراف قبل وقت نهاية الدوام
  if (isBefore(checkOutTime, scheduled)) {
    return differenceInMinutes(scheduled, checkOutTime);
  }
  return 0;
}

export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  const minutes = differenceInMinutes(checkOut, checkIn);
  const hours = minutes / 60;
  // إرجاع عدد الساعات مقرباً لمرتبتين عشريتين
  return Math.max(0, Number(hours.toFixed(2)));
}

export function getTodayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// دالة مساعدة لتنظيف النصوص العربية للبحث
export function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}
