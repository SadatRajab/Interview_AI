import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-schedule.component.html',
  styleUrl: './admin-schedule.component.css'
})
export class AdminScheduleComponent implements OnInit {
  startDate = signal<string>('');
  endDate = signal<string>('');
  isManualOpen = signal<boolean>(true);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Start Date Picker State
  showStartCalendar = false;
  startCalendarMonth = new Date();
  
  // End Date Picker State
  showEndCalendar = false;
  endCalendarMonth = new Date();

  // Time Picker State
  showStartTimePicker = false;
  showEndTimePicker = false;

  constructor(
    private adminService: AdminService,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.loadSchedule();
  }

  loadSchedule() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.adminService.getSchedule().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const sd = new Date(res.data.startDate);
          const ed = new Date(res.data.endDate);
          this.startDate.set(this.formatDateForInput(sd));
          this.endDate.set(this.formatDateForInput(ed));
          this.isManualOpen.set(res.data.isManualOpen);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Failed to load schedule settings.' : 'فشل تحميل إعدادات المواعيد.');
        console.error(err);
      }
    });
  }

  saveSchedule() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService.updateSchedule(this.startDate(), this.endDate()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.successMessage.set(this.lang.currentLang() === 'en' ? 'Schedule saved successfully!' : 'تم حفظ المواعيد بنجاح!');
          setTimeout(() => this.successMessage.set(''), 4000);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.error || (this.lang.currentLang() === 'en' ? 'Failed to save schedule.' : 'فشل حفظ المواعيد.'));
        console.error(err);
      }
    });
  }

  toggleStatus(isOpen: boolean) {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.adminService.toggleManualOpen(isOpen).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.isManualOpen.set(res.data.isManualOpen);
          this.successMessage.set(this.lang.currentLang() === 'en' ? 'Interview status updated successfully!' : 'تم تحديث حالة المقابلات بنجاح!');
          setTimeout(() => this.successMessage.set(''), 4000);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.error || (this.lang.currentLang() === 'en' ? 'Failed to update interview status.' : 'فشل تحديث حالة المقابلات.'));
        console.error(err);
      }
    });
  }

  onStatusToggleChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const targetState = checkbox.checked;

    if (!targetState) {
      const confirmMsg = this.lang.currentLang() === 'en'
        ? 'Are you sure you want to CLOSE interviews manually? This will prevent any candidates from uploading CVs or starting new sessions.'
        : 'هل أنت متأكد من إغلاق المقابلات يدوياً؟ سيؤدي ذلك إلى منع المتقدمين من رفع السير الذاتية أو بدء مقابلات جديدة.';
      
      if (!confirm(confirmMsg)) {
        checkbox.checked = true;
        return;
      }
    }

    this.toggleStatus(targetState);
  }

  getStartDatePart(): string {
    const val = this.startDate();
    if (!val) return '';
    return val.split('T')[0];
  }

  getStartTimePart(): string {
    const val = this.startDate();
    if (!val) return '';
    return val.split('T')[1] || '00:00';
  }

  setStartDatePart(dateStr: string) {
    const time = this.getStartTimePart() || '00:00';
    if (dateStr) {
      this.startDate.set(`${dateStr}T${time}`);
    }
  }

  setStartTimePart(timeStr: string) {
    const date = this.getStartDatePart() || this.formatDateForInput(new Date()).split('T')[0];
    if (timeStr) {
      this.startDate.set(`${date}T${timeStr}`);
    }
  }

  getEndDatePart(): string {
    const val = this.endDate();
    if (!val) return '';
    return val.split('T')[0];
  }

  getEndTimePart(): string {
    const val = this.endDate();
    if (!val) return '';
    return val.split('T')[1] || '00:00';
  }

  setEndDatePart(dateStr: string) {
    const time = this.getEndTimePart() || '00:00';
    if (dateStr) {
      this.endDate.set(`${dateStr}T${time}`);
    }
  }

  setEndTimePart(timeStr: string) {
    const date = this.getEndDatePart() || this.formatDateForInput(new Date()).split('T')[0];
    if (timeStr) {
      this.endDate.set(`${date}T${timeStr}`);
    }
  }

  private formatDateForInput(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  // --- CUSTOM POPUP DATE & TIME PICKER LOGIC ---

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isInsideContainer = target.closest('.datetime-input-container');
    if (!isInsideContainer) {
      this.showStartCalendar = false;
      this.showEndCalendar = false;
      this.showStartTimePicker = false;
      this.showEndTimePicker = false;
    }
  }

  formatDateDisplay(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const datePart = dateTimeStr.split('T')[0];
    if (!datePart) return '';
    const parts = datePart.split('-');
    if (parts.length !== 3) return '';
    return `${parts[1]}/${parts[2]}/${parts[0]}`; // MM/DD/YYYY
  }

  formatTimeDisplay(dateTimeStr: string): string {
    if (!dateTimeStr) return '';
    const timePart = dateTimeStr.split('T')[1];
    if (!timePart) return '';
    return this.convert24to12(timePart);
  }

  convert24to12(time24: string): string {
    const parts = time24.split(':');
    if (parts.length < 2) return '';
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hourStr = hour.toString().padStart(2, '0');
    return `${hourStr}:${minute} ${ampm}`;
  }

  getMonthYearLabel(date: Date): string {
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    const isEn = this.lang.currentLang() === 'en';
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return isEn ? `${monthNamesEn[monthIndex]} ${year}` : `${monthNamesAr[monthIndex]} ${year}`;
  }

  getDayNames(): string[] {
    const isEn = this.lang.currentLang() === 'en';
    return isEn 
      ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
      : ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  }

  getDaysInMonth(date: Date, selectedDateStr: string) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month filler
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevTotalDays - i;
      const prevMonthDate = new Date(year, month - 1, d);
      days.push({
        day: d,
        dateStr: this.formatDateYYYYMMDD(prevMonthDate),
        isCurrentMonth: false
      });
    }
    
    // Current month
    for (let d = 1; d <= totalDays; d++) {
      const curDate = new Date(year, month, d);
      days.push({
        day: d,
        dateStr: this.formatDateYYYYMMDD(curDate),
        isCurrentMonth: true
      });
    }
    
    // Next month filler
    const remainingCells = 42 - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthDate = new Date(year, month + 1, d);
      days.push({
        day: d,
        dateStr: this.formatDateYYYYMMDD(nextMonthDate),
        isCurrentMonth: false
      });
    }
    
    return days;
  }

  formatDateYYYYMMDD(date: Date): string {
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  // Toggle methods
  toggleStartCalendar() {
    this.showStartCalendar = !this.showStartCalendar;
    this.showEndCalendar = false;
    this.showStartTimePicker = false;
    this.showEndTimePicker = false;
    if (this.showStartCalendar) {
      const d = this.getStartDatePart();
      if (d) this.startCalendarMonth = new Date(d);
      else this.startCalendarMonth = new Date();
    }
  }

  toggleEndCalendar() {
    this.showEndCalendar = !this.showEndCalendar;
    this.showStartCalendar = false;
    this.showStartTimePicker = false;
    this.showEndTimePicker = false;
    if (this.showEndCalendar) {
      const d = this.getEndDatePart();
      if (d) this.endCalendarMonth = new Date(d);
      else this.endCalendarMonth = new Date();
    }
  }

  toggleStartTimePicker() {
    this.showStartTimePicker = !this.showStartTimePicker;
    this.showStartCalendar = false;
    this.showEndCalendar = false;
    this.showEndTimePicker = false;
  }

  toggleEndTimePicker() {
    this.showEndTimePicker = !this.showEndTimePicker;
    this.showStartCalendar = false;
    this.showEndCalendar = false;
    this.showStartTimePicker = false;
  }

  // Start Date selections
  prevStartMonth(event: Event) {
    event.stopPropagation();
    const cur = new Date(this.startCalendarMonth);
    cur.setMonth(cur.getMonth() - 1);
    this.startCalendarMonth = cur;
  }

  nextStartMonth(event: Event) {
    event.stopPropagation();
    const cur = new Date(this.startCalendarMonth);
    cur.setMonth(cur.getMonth() + 1);
    this.startCalendarMonth = cur;
  }

  getStartCalendarDays() {
    return this.getDaysInMonth(this.startCalendarMonth, this.getStartDatePart());
  }

  isStartDateSelected(dateStr: string): boolean {
    return this.getStartDatePart() === dateStr;
  }

  selectStartDate(dateStr: string) {
    this.setStartDatePart(dateStr);
    this.showStartCalendar = false;
  }

  clearStartDate(event: Event) {
    event.stopPropagation();
    this.startDate.set('');
    this.showStartCalendar = false;
  }

  setStartDateToday(event: Event) {
    event.stopPropagation();
    this.setStartDatePart(this.formatDateYYYYMMDD(new Date()));
    this.showStartCalendar = false;
  }

  // End Date selections
  prevEndMonth(event: Event) {
    event.stopPropagation();
    const cur = new Date(this.endCalendarMonth);
    cur.setMonth(cur.getMonth() - 1);
    this.endCalendarMonth = cur;
  }

  nextEndMonth(event: Event) {
    event.stopPropagation();
    const cur = new Date(this.endCalendarMonth);
    cur.setMonth(cur.getMonth() + 1);
    this.endCalendarMonth = cur;
  }

  getEndCalendarDays() {
    return this.getDaysInMonth(this.endCalendarMonth, this.getEndDatePart());
  }

  isEndDateSelected(dateStr: string): boolean {
    return this.getEndDatePart() === dateStr;
  }

  selectEndDate(dateStr: string) {
    this.setEndDatePart(dateStr);
    this.showEndCalendar = false;
  }

  clearEndDate(event: Event) {
    event.stopPropagation();
    this.endDate.set('');
    this.showEndCalendar = false;
  }

  setEndDateToday(event: Event) {
    event.stopPropagation();
    this.setEndDatePart(this.formatDateYYYYMMDD(new Date()));
    this.showEndCalendar = false;
  }

  // Time selections
  getStartHourDisplay(): string {
    const time24 = this.getStartTimePart();
    if (!time24) return '12';
    const parts = time24.split(':');
    let hour = parseInt(parts[0], 10) % 12;
    hour = hour ? hour : 12;
    return hour.toString().padStart(2, '0');
  }

  getStartMinuteDisplay(): string {
    const time24 = this.getStartTimePart();
    if (!time24) return '00';
    const parts = time24.split(':');
    return parts[1] || '00';
  }

  getStartAmPmDisplay(): string {
    const time24 = this.getStartTimePart();
    if (!time24) return 'AM';
    const parts = time24.split(':');
    const hour = parseInt(parts[0], 10);
    return hour >= 12 ? 'PM' : 'AM';
  }

  getEndHourDisplay(): string {
    const time24 = this.getEndTimePart();
    if (!time24) return '12';
    const parts = time24.split(':');
    let hour = parseInt(parts[0], 10) % 12;
    hour = hour ? hour : 12;
    return hour.toString().padStart(2, '0');
  }

  getEndMinuteDisplay(): string {
    const time24 = this.getEndTimePart();
    if (!time24) return '00';
    const parts = time24.split(':');
    return parts[1] || '00';
  }

  getEndAmPmDisplay(): string {
    const time24 = this.getEndTimePart();
    if (!time24) return 'AM';
    const parts = time24.split(':');
    const hour = parseInt(parts[0], 10);
    return hour >= 12 ? 'PM' : 'AM';
  }

  updateTimePart(isStart: boolean, hour: number, minute: number, ampm: 'AM' | 'PM') {
    let hour24 = hour;
    if (ampm === 'PM' && hour < 12) {
      hour24 = hour + 12;
    } else if (ampm === 'AM' && hour === 12) {
      hour24 = 0;
    }
    const timeStr = `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    if (isStart) {
      this.setStartTimePart(timeStr);
    } else {
      this.setEndTimePart(timeStr);
    }
  }

  incrementStartHour() {
    let hr = parseInt(this.getStartHourDisplay(), 10);
    hr = hr === 12 ? 1 : hr + 1;
    this.updateTimePart(true, hr, parseInt(this.getStartMinuteDisplay(), 10), this.getStartAmPmDisplay() as 'AM' | 'PM');
  }
  
  decrementStartHour() {
    let hr = parseInt(this.getStartHourDisplay(), 10);
    hr = hr === 1 ? 12 : hr - 1;
    this.updateTimePart(true, hr, parseInt(this.getStartMinuteDisplay(), 10), this.getStartAmPmDisplay() as 'AM' | 'PM');
  }

  incrementStartMinute() {
    let min = parseInt(this.getStartMinuteDisplay(), 10);
    min = min === 59 ? 0 : min + 1;
    this.updateTimePart(true, parseInt(this.getStartHourDisplay(), 10), min, this.getStartAmPmDisplay() as 'AM' | 'PM');
  }

  decrementStartMinute() {
    let min = parseInt(this.getStartMinuteDisplay(), 10);
    min = min === 0 ? 59 : min - 1;
    this.updateTimePart(true, parseInt(this.getStartHourDisplay(), 10), min, this.getStartAmPmDisplay() as 'AM' | 'PM');
  }

  incrementStartAmPm() {
    this.toggleStartAmPm();
  }

  decrementStartAmPm() {
    this.toggleStartAmPm();
  }

  toggleStartAmPm() {
    const ampm = this.getStartAmPmDisplay() === 'AM' ? 'PM' : 'AM';
    this.updateTimePart(true, parseInt(this.getStartHourDisplay(), 10), parseInt(this.getStartMinuteDisplay(), 10), ampm);
  }

  incrementEndHour() {
    let hr = parseInt(this.getEndHourDisplay(), 10);
    hr = hr === 12 ? 1 : hr + 1;
    this.updateTimePart(false, hr, parseInt(this.getEndMinuteDisplay(), 10), this.getEndAmPmDisplay() as 'AM' | 'PM');
  }
  
  decrementEndHour() {
    let hr = parseInt(this.getEndHourDisplay(), 10);
    hr = hr === 1 ? 12 : hr - 1;
    this.updateTimePart(false, hr, parseInt(this.getEndMinuteDisplay(), 10), this.getEndAmPmDisplay() as 'AM' | 'PM');
  }

  incrementEndMinute() {
    let min = parseInt(this.getEndMinuteDisplay(), 10);
    min = min === 59 ? 0 : min + 1;
    this.updateTimePart(false, parseInt(this.getEndHourDisplay(), 10), min, this.getEndAmPmDisplay() as 'AM' | 'PM');
  }

  decrementEndMinute() {
    let min = parseInt(this.getEndMinuteDisplay(), 10);
    min = min === 0 ? 59 : min - 1;
    this.updateTimePart(false, parseInt(this.getEndHourDisplay(), 10), min, this.getEndAmPmDisplay() as 'AM' | 'PM');
  }

  incrementEndAmPm() {
    this.toggleEndAmPm();
  }

  decrementEndAmPm() {
    this.toggleEndAmPm();
  }

  toggleEndAmPm() {
    const ampm = this.getEndAmPmDisplay() === 'AM' ? 'PM' : 'AM';
    this.updateTimePart(false, parseInt(this.getEndHourDisplay(), 10), parseInt(this.getEndMinuteDisplay(), 10), ampm);
  }

  clearStartTime(event: Event) {
    event.stopPropagation();
    const date = this.getStartDatePart();
    if (date) {
      this.startDate.set(`${date}T00:00`);
    } else {
      this.startDate.set('');
    }
    this.showStartTimePicker = false;
  }

  setStartTimeNow(event: Event) {
    event.stopPropagation();
    const date = this.getStartDatePart() || this.formatDateYYYYMMDD(new Date());
    const now = new Date();
    const hr = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    this.startDate.set(`${date}T${hr}:${min}`);
    this.showStartTimePicker = false;
  }

  clearEndTime(event: Event) {
    event.stopPropagation();
    const date = this.getEndDatePart();
    if (date) {
      this.endDate.set(`${date}T00:00`);
    } else {
      this.endDate.set('');
    }
    this.showEndTimePicker = false;
  }

  setEndTimeNow(event: Event) {
    event.stopPropagation();
    const date = this.getEndDatePart() || this.formatDateYYYYMMDD(new Date());
    const now = new Date();
    const hr = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    this.endDate.set(`${date}T${hr}:${min}`);
    this.showEndTimePicker = false;
  }
}
