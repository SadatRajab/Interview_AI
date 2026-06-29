/**
 * ============================================
 * Language Translation Service
 * ============================================
 * Manages translation dictionaries and direction (RTL/LTR)
 * for both candidate pages and the Admin Dashboard.
 */

import { Injectable, signal, computed } from '@angular/core';

export type LangType = 'en' | 'ar';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly currentLang = signal<LangType>(this.getSavedLanguage());

  readonly isRtl = computed(() => this.currentLang() === 'ar');

  constructor() {
    this.applyDirection();
  }

  private getSavedLanguage(): LangType {
    const saved = localStorage.getItem('app_lang');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  }

  setLanguage(lang: LangType) {
    localStorage.setItem('app_lang', lang);
    this.currentLang.set(lang);
    this.applyDirection();
  }

  toggleLanguage() {
    this.setLanguage(this.currentLang() === 'en' ? 'ar' : 'en');
  }

  private applyDirection() {
    const root = document.documentElement;
    if (this.currentLang() === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
      document.body.classList.add('rtl');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
      document.body.classList.remove('rtl');
    }
  }

  readonly text = computed(() => {
    const lang = this.currentLang();
    return translations[lang];
  });
}

const translations = {
  en: {
    // CANDIDATE APP
    APP_TITLE: 'AI Interview System',
    APP_SUBTITLE: 'Upload your CV and practice your interview skills with real-time AI evaluations',
    LOADING_EXTRACTING: 'Extracting CV text...',
    LOADING_GENERATING: 'Generating interview questions...',
    LOADING_SUBMITTING: 'Submitting your answer...',
    LOADING_COMPLETING: 'Completing interview...',
    
    // CV UPLOAD
    DRAG_DROP_CV: 'Drag & Drop your CV here or click to browse',
    SUPPORTED_FORMATS: 'Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG (Max 10MB)',
    EXTRACT_CV_TEXT: 'Extract CV Text',
    START_INTERVIEW: 'Start Interview',
    EDIT_CV_TEXT: 'Extracted CV Text (Review and edit if needed):',
    SELECT_FILE: 'Selected File:',
    NO_FILE: 'No file selected',
    
    // INSTRUCTIONS MODAL
    INST_TITLE: 'Important Instructions',
    INST_SUBTITLE: 'Please read carefully before starting the interview',
    INST_RULE_1: 'The interview must be conducted in Fullscreen mode.',
    INST_RULE_2: 'Switching to any other tab or application is not allowed.',
    INST_RULE_3: 'Every violation will be recorded and may affect your evaluation.',
    INST_RULE_4: 'Repeated violations will result in interview cancellation.',
    INST_RULE_5: 'If the interview is cancelled due to a rule violation, you will not be allowed to retake it.',
    INST_RULE_6: 'By continuing, you agree to all the terms.',
    INST_CHECKBOX: 'I have read all the instructions and agree to comply with them.',
    CANCEL: 'Cancel',
    
    // INTERVIEW SESSION
    QUESTION_TITLE: 'Question',
    OF: 'of',
    ANSWER_PLACEHOLDER: 'Type your answer here... Be detailed and precise.',
    PREVIOUS: 'Previous',
    NEXT: 'Next',
    SUBMIT_ANSWER: 'Submit Answer',
    FINISH_INTERVIEW: 'Finish Interview',
    SUBMITTED_SUCCESS: 'Submitted successfully',
    PROCTOR_WARNING_DISQ: 'This interview has been disqualified due to rules violation.',
    PROCTOR_WARN: 'Warning',
    PROCTOR_WARN_MSG: 'switching tabs or leaving fullscreen is prohibited!',
    RESET: 'Start New Session',

    // ADMIN LOGIN
    ADMIN_LOGIN_TITLE: 'AI Interview Systems',
    ADMIN_LOGIN_SUBTITLE: 'Administrator Portal Login',
    USERNAME: 'Username',
    PASSWORD: 'Password',
    SIGN_IN: 'Sign In',
    SIGNING_IN: 'Signing in...',
    FILL_ALL_FIELDS: 'Please fill in all fields.',

    // ADMIN DASHBOARD
    ADMIN_PANEL: 'Admin Panel',
    MENU_STATS: 'General Stats',
    MENU_CANDIDATES: 'Candidates List',
    MENU_DUPLICATES: 'Duplicate Review',
    LOGOUT: 'Logout',
    DUPLICATE_BANNER_ALERT: 'duplicate candidate case(s) have been detected in the system and need review. Click here to check them.',
    NOTICE: 'Notice',

    // ADMIN STATS
    STATS_TITLE: 'General Statistics',
    STATS_SUBTITLE: 'Real-time overview of active applicants and system metrics',
    REFRESH: 'Refresh',
    STAT_TOTAL_CANDIDATES: 'Total Candidates',
    STAT_COMPLETED: 'Completed Interviews',
    STAT_ONGOING: 'Ongoing Sessions',
    STAT_CANCELLED: 'Cancelled Sessions',
    STAT_AVG_SCORE: 'Average Score',
    STAT_VIOLATIONS: 'Cheating Violations',
    STAT_DUPLICATES: 'Duplicate Candidates',
    VIEW_ALL_APPLICANTS: 'View all applicants →',
    VIEW_COMPLETED: 'View completed list →',
    VIEW_ACTIVE: 'View active sessions →',
    VIEW_CANCELLED: 'View cancelled list →',
    CHECK_DUPLICATES: 'Check duplicate cases →',
    DISQUALIFIED_STATS: 'Disqualified',
    BASED_COMPLETED: 'Based on completed sessions',

    // ADMIN CANDIDATES
    CANDIDATES_TITLE: 'Candidates Management',
    CANDIDATES_SUBTITLE: 'Search, filter, and review candidate answers and violations',
    SEARCH_PLACEHOLDER: 'Search by name, email, phone...',
    STATUS_LABEL: 'Status:',
    ALL_STATUSES: 'All Statuses',
    STATUS_PENDING: 'Pending',
    STATUS_ONGOING: 'Ongoing',
    STATUS_COMPLETED: 'Completed',
    STATUS_CANCELLED: 'Cancelled',
    STATUS_DISQUALIFIED: 'Disqualified',
    STATUS_DUPLICATE: 'Duplicate Candidates',
    TH_NAME: 'Name',
    TH_EMAIL: 'Email',
    TH_PHONE: 'Phone',
    TH_DATE: 'Date',
    TH_STATUS: 'Status',
    TH_SCORE: 'Final Score',
    TH_VIOLATIONS: 'Violations',
    TH_ACTIONS: 'Actions',
    BTN_DETAILS: 'Details',
    BTN_CV: 'CV',
    BTN_DELETE: 'Delete',
    PAGE: 'Page',
    PAGE_OF: 'of',
    PREV_BTN: '◀ Prev',
    NEXT_BTN: 'Next ▶',
    NO_CANDIDATES: 'No candidates found matching the filters.',

    // CANDIDATE DETAIL
    BACK_LIST: '← Back to List',
    DOWNLOAD_CV: 'Download CV',
    DELETE_INTERVIEW: 'Delete Interview',
    REGISTERED_ON: 'Registered on:',
    STATUS_CONTROL: 'Status Control:',
    INTERVIEW_SCORE: 'Interview Score',
    RAW_SCORE: 'Raw Answer Score:',
    DEDUCTIONS: 'Deduction points:',
    NOT_EVALUATED: 'Not Evaluated',
    NOT_FINALIZED: 'Interview has not been finalized yet.',
    LIMIT_WARNINGS: 'Limits Allowed: 3 warnings',
    DISQ_EXCEED: 'DISQUALIFIED FOR EXCEEDING RULE LIMITS',
    INTERVIEW_TIMING: 'Interview Timing',
    START_TIME: 'Start:',
    END_TIME: 'End:',
    TAB_QA: 'Questions & Answers',
    TAB_VIOLATIONS: 'Violations Logs',
    TAB_CV: 'Extracted CV Content',
    NO_ANSWERS: 'No answers have been recorded for this session.',
    QA_SCORE: 'Score',
    AI_FEEDBACK: 'AI Feedback:',
    NO_VIOLATIONS: 'No cheating violations recorded for this candidate.',
    VIOLATION: 'Warning',
    SCORE_DEDUCTED: 'Score Deducted:',
    UPLOADED_DOC: 'Uploaded Document:',
  },
  ar: {
    // CANDIDATE APP
    APP_TITLE: 'نظام المقابلات بالذكاء الاصطناعي',
    APP_SUBTITLE: 'قم برفع سيرتك الذاتية وتدرب على أسئلة المقابلة مع تقييم فوري بالذكاء الاصطناعي',
    LOADING_EXTRACTING: 'جاري استخراج نص السيرة الذاتية...',
    LOADING_GENERATING: 'جاري توليد أسئلة المقابلة...',
    LOADING_SUBMITTING: 'جاري إرسال إجابتك...',
    LOADING_COMPLETING: 'جاري إنهاء المقابلة وحساب النتيجة...',
    
    // CV UPLOAD
    DRAG_DROP_CV: 'اسحب وأسقط ملف السيرة الذاتية هنا أو اضغط للتصفح',
    SUPPORTED_FORMATS: 'الملفات المدعومة: PDF, DOC, DOCX, TXT, PNG, JPG (الحد الأقصى 10 ميجابايت)',
    EXTRACT_CV_TEXT: 'استخراج نص الـ CV',
    START_INTERVIEW: 'بدء المقابلة',
    EDIT_CV_TEXT: 'نص السيرة الذاتية المستخرج (راجع النص وعدله إذا لزم الأمر):',
    SELECT_FILE: 'الملف المختار:',
    NO_FILE: 'لم يتم اختيار ملف',
    
    // INSTRUCTIONS MODAL
    INST_TITLE: 'تعليمات هامة للمقابلة',
    INST_SUBTITLE: 'يرجى القراءة بعناية شديدة قبل البدء',
    INST_RULE_1: 'يجب إجراء المقابلة في وضع ملء الشاشة (Fullscreen).',
    INST_RULE_2: 'غير مسموح بالانتقال إلى أي تبويب آخر أو الخروج من المتصفح.',
    INST_RULE_3: 'سيتم تسجيل ورصد أي مخالفة وقد تؤثر سلباً على تقييمك.',
    INST_RULE_4: 'المخالفات المتكررة ستؤدي إلى إلغاء المقابلة فوراً.',
    INST_RULE_5: 'إذا تم إلغاء المقابلة بسبب المخالفات، فلن يُسمح لك بإعادتها مرة أخرى.',
    INST_RULE_6: 'باستمرارك في المقابلة، فإنك توافق على جميع الشروط والقواعد.',
    INST_CHECKBOX: 'لقد قرأت جميع التعليمات وأوافق على الالتزام الكامل بها.',
    CANCEL: 'إلغاء',
    
    // INTERVIEW SESSION
    QUESTION_TITLE: 'السؤال',
    OF: 'من',
    ANSWER_PLACEHOLDER: 'اكتب إجابتك هنا بالتفصيل... كن دقيقاً وواضحاً في شرح فكرتك.',
    PREVIOUS: 'السابق',
    NEXT: 'التالي',
    SUBMIT_ANSWER: 'إرسال الإجابة',
    FINISH_INTERVIEW: 'إنهاء المقابلة',
    SUBMITTED_SUCCESS: 'تم الإرسال بنجاح',
    PROCTOR_WARNING_DISQ: 'تم إلغاء هذه المقابلة واستبعادك بسبب مخالفة قواعد الامتحان.',
    PROCTOR_WARN: 'تحذير',
    PROCTOR_WARN_MSG: 'ممنوع تبديل النوافذ أو الخروج من وضع ملء الشاشة!',
    RESET: 'بدء جلسة جديدة',

    // ADMIN LOGIN
    ADMIN_LOGIN_TITLE: 'أنظمة المقابلات بالذكاء الاصطناعي',
    ADMIN_LOGIN_SUBTITLE: 'تسجيل دخول لوحة تحكم الإدارة',
    USERNAME: 'اسم المستخدم',
    PASSWORD: 'كلمة المرور',
    SIGN_IN: 'دخول',
    SIGNING_IN: 'جاري الدخول...',
    FILL_ALL_FIELDS: 'يرجى ملء جميع الحقول المطلوبة.',

    // ADMIN DASHBOARD
    ADMIN_PANEL: 'لوحة التحكم',
    MENU_STATS: 'الإحصائيات العامة',
    MENU_CANDIDATES: 'جدول المتقدمين',
    MENU_DUPLICATES: 'مراجعة التكرار',
    LOGOUT: 'تسجيل الخروج',
    DUPLICATE_BANNER_ALERT: 'حالة متقدم مكررة تم اكتشافها وتحتاج إلى مراجعة. اضغط هنا لفحصها.',
    NOTICE: 'تنبيه',

    // ADMIN STATS
    STATS_TITLE: 'الإحصائيات العامة',
    STATS_SUBTITLE: 'نظرة عامة على المتقدمين ومؤشرات أداء النظام بالكامل في الوقت الفعلي',
    REFRESH: 'تحديث البيانات',
    STAT_TOTAL_CANDIDATES: 'إجمالي المتقدمين',
    STAT_COMPLETED: 'المقابلات المكتملة',
    STAT_ONGOING: 'الجلسات النشطة',
    STAT_CANCELLED: 'الجلسات الملغاة',
    STAT_AVG_SCORE: 'متوسط الدرجات',
    STAT_VIOLATIONS: 'مخالفات الغش والرصد',
    STAT_DUPLICATES: 'الحالات المكررة',
    VIEW_ALL_APPLICANTS: 'عرض جميع المتقدمين ←',
    VIEW_COMPLETED: 'عرض المقابلات المكتملة ←',
    VIEW_ACTIVE: 'عرض الجلسات النشطة ←',
    VIEW_CANCELLED: 'عرض الجلسات الملغاة ←',
    CHECK_DUPLICATES: 'فحص الحالات المكررة ←',
    DISQUALIFIED_STATS: 'مستبعد',
    BASED_COMPLETED: 'بناءً على المقابلات المكتملة فقط',

    // ADMIN CANDIDATES
    CANDIDATES_TITLE: 'إدارة المتقدمين',
    CANDIDATES_SUBTITLE: 'البحث، الفلترة، ومراجعة إجابات المتقدمين ورصد المخالفات',
    SEARCH_PLACEHOLDER: 'ابحث بالاسم، الإيميل، الهاتف...',
    STATUS_LABEL: 'الحالة:',
    ALL_STATUSES: 'جميع الحالات',
    STATUS_PENDING: 'قيد الانتظار',
    STATUS_ONGOING: 'قيد المقابلة',
    STATUS_COMPLETED: 'مكتمل',
    STATUS_CANCELLED: 'ملغي',
    STATUS_DISQUALIFIED: 'مستبعد',
    STATUS_DUPLICATE: 'الحالات المكررة',
    TH_NAME: 'الاسم',
    TH_EMAIL: 'البريد الإلكتروني',
    TH_PHONE: 'الهاتف',
    TH_DATE: 'التاريخ',
    TH_STATUS: 'الحالة',
    TH_SCORE: 'الدرجة النهائية',
    TH_VIOLATIONS: 'المخالفات',
    TH_ACTIONS: 'إجراءات',
    BTN_DETAILS: 'تفاصيل',
    BTN_CV: 'سيرة ذاتية',
    BTN_DELETE: 'حذف',
    PAGE: 'صفحة',
    PAGE_OF: 'من',
    PREV_BTN: '◀ السابق',
    NEXT_BTN: 'التالي ▶',
    NO_CANDIDATES: 'لم يتم العثور على أي متقدم يطابق الفلاتر المحددة.',

    // CANDIDATE DETAIL
    BACK_LIST: '← العودة للقائمة',
    DOWNLOAD_CV: 'تحميل الـ CV',
    DELETE_INTERVIEW: 'حذف المقابلة',
    REGISTERED_ON: 'تاريخ التسجيل:',
    STATUS_CONTROL: 'التحكم في الحالة:',
    INTERVIEW_SCORE: 'نتيجة المقابلة',
    RAW_SCORE: 'درجة الإجابات الخام:',
    DEDUCTIONS: 'نقاط الخصم بسبب المخالفات:',
    NOT_EVALUATED: 'لم تقيم بعد',
    NOT_FINALIZED: 'لم يتم إنهاء هذه المقابلة بعد.',
    LIMIT_WARNINGS: 'الحد الأقصى المسموح: 3 تحذيرات',
    DISQ_EXCEED: 'تم استبعاد المتقدم لتجاوز حد المخالفات المسموح به',
    INTERVIEW_TIMING: 'توقيت الجلسة',
    START_TIME: 'البدء:',
    END_TIME: 'الانتهاء:',
    TAB_QA: 'الأسئلة والإجابات',
    TAB_VIOLATIONS: 'سجل المخالفات',
    TAB_CV: 'نص السيرة الذاتية',
    NO_ANSWERS: 'لا توجد إجابات مسجلة لهذه الجلسة.',
    QA_SCORE: 'الدرجة',
    AI_FEEDBACK: 'تقييم الذكاء الاصطناعي:',
    NO_VIOLATIONS: '🎉 لم يتم رصد أي مخالفات لقواعد المقابلة لهذا المتقدم.',
    VIOLATION: 'تحذير',
    SCORE_DEDUCTED: 'النقاط المخصومة:',
    UPLOADED_DOC: 'المستند المرفوع:',
  }
};
