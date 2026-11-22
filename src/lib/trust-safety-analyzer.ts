import type { DealAssessment } from '@/lib/market-deal-intelligence';

export type TrustLevel = 'verified_high' | 'good' | 'caution' | 'high_risk';
export type RiskSeverity = 'low' | 'medium' | 'high';
export type PillarStatus = 'passed' | 'neutral' | 'warning' | 'danger';

export type TrustCheckPillar = {
  key: 'seller' | 'price' | 'details' | 'text';
  label: string;
  summary: string;
  status: PillarStatus;
};

export type SafetyWarningFlag = {
  code: string;
  severity: RiskSeverity;
  title: string;
  message: string;
};

export type ListingTrustReport = {
  score: number;
  level: TrustLevel;
  positiveSignals: string[];
  warnings: SafetyWarningFlag[];
  pillars: TrustCheckPillar[];
};

export type ChatRiskAlert = {
  code: string;
  severity: RiskSeverity;
  title: string;
  advice: string;
};

function normalizeArabicText(raw: string): string {
  return String(raw ?? '')
    .toLowerCase()
    .trim()
    .replaceAll('أ', 'ا')
    .replaceAll('إ', 'ا')
    .replaceAll('آ', 'ا')
    .replaceAll('ٱ', 'ا')
    .replaceAll('ى', 'ي')
    .replaceAll('ة', 'ه')
    .replaceAll('ؤ', 'و')
    .replaceAll('ئ', 'ي')
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/\s+/g, ' ');
}

function isDeclaredNewCondition(condition?: string | null): boolean {
  const c = normalizeArabicText(condition ?? '');
  if (!c) return false;
  if (
    c.includes('مستعمل') ||
    c.includes('كسر') ||
    c.includes('شبه') ||
    c.includes('used') ||
    c.includes('refurb')
  ) {
    return false;
  }
  return c.includes('جديد') || c.includes('متبرشم') || c === 'new';
}

export function scanTextForFraud(rawText: string): ChatRiskAlert | null {
  const text = normalizeArabicText(rawText);
  if (text.length < 4) return null;

  const otpRe =
    /(?:كود التحقق|رمز التحقق|كود التاكيد|رمز التاكيد|كلمه السر|كلمه المرور|الباسورد|ابعت الكود|ابعتلي الكود|الرساله اللي وصلتك|\botp\b|verification code|password)/iu;
  if (otpRe.test(text)) {
    return {
      code: 'OTP_PHISHING',
      severity: 'high',
      title: 'تحذير أمان حرج: طلب رمز تحقق أو كلمة مرور!',
      advice:
        'لا تشارك أبداً أي كود تحقق (OTP) أو كلمة سر مع أي شخص؛ هذا أسلوب اختراق حسابات معروف.',
    };
  }

  const depositRe =
    /(?:عربون|مقدم حجز|تحويل مقدم|حول\s*(?:لي|لى)?\s*(?:مبلغ|فلوس|عربون|مصاريف)|ابعت\s*(?:لي|لى)?\s*(?:عربون|مصاريف الشحن|فلوس الشحن)|دفع\s*مقدم|تحويل\s*قبل\s*(?:الاستلام|المعاينه|الشحن)|لحجز\s*الجهاز)/iu;
  const walletRe =
    /(?:فودافون\s*كاش|انستا\s*باي|انستاباي|اتصالات\s*كاش|اورنج\s*كاش|اورانج\s*كاش|وي\s*باي|محفظه\s*الكترونيه|instapay|vodafone\s*cash|stc\s*pay)/iu;
  const urgencyRe =
    /(?:شحن|مندوب|بريد|حجز|قبل|عربون|مقدم|ارسل|حول|ابعت|بسرعه|مستعجل|اسكرين|سكرين)/iu;

  if (depositRe.test(text) || (walletRe.test(text) && urgencyRe.test(text))) {
    return {
      code: 'ADVANCE_PAYMENT_SCAM',
      severity: 'high',
      title: 'درع الأمان: احذر من تحويل أي عربون أو دفعة مقدمة!',
      advice:
        'لا تحوّل أي مبالغ عبر فودافون كاش أو إنستاباي لحجز جهاز أو «مصاريف شحن» قبل المعاينة الفعلية باليد في مكان عام.',
    };
  }

  const suspiciousLinkRe =
    /(?:https?:\/\/)?(?:bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|t\.me\/|[a-z0-9-]+\.(?:xyz|top|click|icu|gq|tk)\b)/i;
  if (suspiciousLinkRe.test(text)) {
    return {
      code: 'SUSPICIOUS_LINK',
      severity: 'medium',
      title: 'تنبيه: رابط خارجي غير موثوق',
      advice:
        'تجنّب فتح روابط مختصرة أو خارجية غير معروفة، ولا تدخل بيانات حسابك أو بطاقتك البنكية خارج سوق فون.',
    };
  }

  return null;
}

export function scanIncomingMessagesForFraud(messages: string[]): ChatRiskAlert | null {
  let highest: ChatRiskAlert | null = null;
  for (const text of messages) {
    const alert = scanTextForFraud(text);
    if (!alert) continue;
    if (alert.severity === 'high') return alert;
    if (!highest) highest = alert;
  }
  return highest;
}

export function analyzeListingTrust(input: {
  title: string;
  description?: string | null;
  condition?: string | null;
  category?: string | null;
  price: number;
  isSaudi: boolean;
  imagesCount: number;
  specifications?: Record<string, unknown> | null;
  isStore?: boolean;
  sellerVerified?: boolean | null;
  sellerRating?: number | null;
  sellerCreatedAt?: string | null;
  dealAssessment?: DealAssessment | null;
}): ListingTrustReport {
  let score = 42;
  const positiveSignals: string[] = [];
  const warnings: SafetyWarningFlag[] = [];

  const specs = input.specifications ?? {};
  const isStore = Boolean(input.isStore);
  const isVerified = Boolean(input.sellerVerified);

  // 1. محور البائع
  let sellerStatus: PillarStatus = 'neutral';
  let sellerSummary = 'بائع فردي';

  if (isStore) {
    score += 20;
    positiveSignals.push('متجر معتمد على سوق فون');
    sellerStatus = 'passed';
    sellerSummary = 'متجر معتمد';
  }

  if (isVerified) {
    score += 11;
    positiveSignals.push('حساب موثّق');
    if (sellerStatus !== 'passed') {
      sellerStatus = 'passed';
      sellerSummary = 'حساب موثّق';
    }
  }

  let accountAgeDays = 30;
  if (input.sellerCreatedAt) {
    const createdMs = new Date(input.sellerCreatedAt).getTime();
    if (Number.isFinite(createdMs)) {
      accountAgeDays = Math.max(0, Math.floor((Date.now() - createdMs) / 86_400_000));
      if (accountAgeDays >= 180) {
        score += 10;
        positiveSignals.push('عضو قديم ومستقر في سوق فون');
        if (!isStore && !isVerified) {
          sellerStatus = 'passed';
          sellerSummary = 'عضو قديم';
        }
      } else if (accountAgeDays >= 60) {
        score += 6;
        positiveSignals.push('عضو نشط في سوق فون');
      } else if (accountAgeDays >= 21) {
        score += 3;
      }
    }
  }

  if (input.sellerRating && input.sellerRating > 0) {
    if (input.sellerRating >= 4.5) {
      score += 6;
      positiveSignals.push(`تقييم بائع مرتفع (${input.sellerRating.toFixed(1)}★)`);
      sellerStatus = 'passed';
    } else if (input.sellerRating < 3.2) {
      score -= 14;
      sellerStatus = 'warning';
      sellerSummary = `تقييم منخفض (${input.sellerRating.toFixed(1)}★)`;
      warnings.push({
        code: 'LOW_SELLER_RATING',
        severity: 'medium',
        title: `تقييم البائع أقل من المعتاد (${input.sellerRating.toFixed(1)}★)`,
        message:
          'راجع تقييمات المشترين السابقين واحرص على فحص الجهاز بالكامل شخصياً قبل الدفع.',
      });
    }
  }

  // 2. محور السعر
  let priceStatus: PillarStatus = 'neutral';
  let priceSummary = 'سعر معلن';
  const catNorm = normalizeArabicText(input.category ?? 'هواتف');
  const isPhoneListing =
    catNorm.includes('هواتف') || catNorm.includes('موبايل') || catNorm.includes('phone');
  const minPlausiblePrice = input.isSaudi ? 60 : 400;

  if (input.price <= 0) {
    priceStatus = 'neutral';
    priceSummary = 'عند التواصل';
  } else if (isPhoneListing && input.price < minPlausiblePrice) {
    score -= 12;
    priceStatus = 'warning';
    priceSummary = 'سعر غير منطقي';
    warnings.push({
      code: 'IMPLAUSIBLE_LOW_PRICE',
      severity: 'medium',
      title: 'السعر المعروض يبدو رمزياً أو غير دقيق',
      message: 'تأكد من السعر الفعلي مع البائع داخل دردشة التطبيق قبل التوجه للمعاينة.',
    });
  } else if (input.dealAssessment) {
    if (input.dealAssessment.tier === 'suspiciously_low' && !isStore) {
      score -= 38;
      priceStatus = 'danger';
      priceSummary = `أقل بـ ${input.dealAssessment.savingsPercent}% من السوق`;
      warnings.push({
        code: 'SUSPICIOUSLY_LOW_PRICE',
        severity: 'high',
        title: `سعر منخفض بشكل غير معتاد (-${input.dealAssessment.savingsPercent}%)`,
        message:
          'السعر أقل بكثير من متوسط سوق فون لنفس الموديل. لا تحوّل أي عربون أو مبلغ مقدم مطلقاً وتأكد من المعاينة الشخصية في مكان عام.',
      });
    } else if (input.dealAssessment.tier === 'hot_deal') {
      score += 8;
      priceStatus = 'passed';
      priceSummary = `لقطة (-${input.dealAssessment.savingsPercent}%)`;
      positiveSignals.push('سعر ممتاز مقارنة بمتوسط السوق');
    } else if (input.dealAssessment.tier === 'fair_price') {
      score += 8;
      priceStatus = 'passed';
      priceSummary = 'متوافق مع السوق';
      positiveSignals.push('السعر متوافق مع متوسط السوق');
    } else if (input.dealAssessment.tier === 'above_market') {
      priceStatus = 'neutral';
      priceSummary = 'أعلى من المتوسط';
    }
  }

  // 3. محور الصور والمواصفات وتطابق الحالة
  let detailsStatus: PillarStatus = 'neutral';
  let detailsSummary = `${input.imagesCount} صور`;
  const hasSpecs =
    Boolean(String(specs.brand ?? '').trim()) &&
    Boolean(String(specs.model ?? '').trim()) &&
    Boolean(String(specs.storage ?? '').trim());
  const hasExtraSpecs =
    Boolean(String(specs.ram ?? '').trim()) ||
    Boolean(String(specs.battery_health ?? '').trim()) ||
    Boolean(String(specs.warranty ?? '').trim());
  const descLen = String(input.description ?? '').trim().length;

  if (input.imagesCount >= 3) {
    score += 8;
    positiveSignals.push(`${input.imagesCount} صور واضحة للجهاز`);
  } else if (input.imagesCount >= 2) {
    score += 4;
  }

  if (hasSpecs) {
    score += 8;
    positiveSignals.push('المواصفات الفنية مكتملة');
  }
  if (hasExtraSpecs) score += 3;
  if (descLen >= 40) score += 5;

  if (input.imagesCount >= 2 && hasSpecs) {
    detailsStatus = 'passed';
    detailsSummary = `${input.imagesCount} صور + مواصفات`;
  } else if (hasSpecs) {
    detailsSummary = 'مواصفات مكتملة';
  }

  const textToScan = normalizeArabicText(`${input.title} ${input.description ?? ''}`);

  if (isDeclaredNewCondition(input.condition)) {
    const contradictionRe =
      /(?:مكسور|كسر\s*شاشه|كسر\s*ضهر|كسر\s*ظهر|شرخ|خدوش|مفتوح\s*للصيانه|تغيير\s*شاشه|تبديل\s*شاشه|شاشه\s*متغيره|تغيير\s*بطاريه|بطاريه\s*متغيره|استعمال|مستعمل|مستخدم|عيب\s*في|به\s*عيب)/iu;
    if (contradictionRe.test(textToScan)) {
      score -= 18;
      detailsStatus = 'warning';
      detailsSummary = 'تناقض بالحالة والوصف';
      warnings.push({
        code: 'CONDITION_CONTRADICTION',
        severity: 'medium',
        title: 'تناقض بين الحالة المختارة (جديد) ونص الوصف',
        message:
          'الإعلان مصنّف كـ «جديد» لكن الوصف يذكر استعمالاً أو عيوباً/صيانة سابقة. استوضح الحالة الفعلية وافحص الجهاز جيداً.',
      });
    }
  }

  const isHighValue = input.isSaudi ? input.price >= 1800 : input.price >= 15000;
  if (!isStore && input.sellerCreatedAt && accountAgeDays < 7 && isHighValue && input.imagesCount <= 1) {
    score -= 16;
    sellerStatus = 'warning';
    sellerSummary = 'حساب جديد جداً';
    detailsStatus = 'warning';
    detailsSummary = 'صورة واحدة فقط';
    warnings.push({
      code: 'NEW_ACCOUNT_HIGH_VALUE',
      severity: 'medium',
      title: 'حساب جديد بصورة واحدة لجهاز مرتفع القيمة',
      message:
        'اطلب صوراً إضافية واضحة للجهاز ورقم الـ IMEI، وفضّل المعاينة في مكان عام أو مركز صيانة معتمد.',
    });
  } else if (!isStore && isHighValue && descLen < 12 && input.imagesCount <= 1) {
    score -= 10;
    detailsStatus = 'warning';
    detailsSummary = 'بيانات غير كافية';
    warnings.push({
      code: 'SPARSE_HIGH_VALUE_LISTING',
      severity: 'low',
      title: 'تفاصيل وصور الإعلان محدودة مقارنة بسعره',
      message: 'اسأل البائع عن حالة البطارية، الضمان، ووجود العلبة الأصلية وصور أوضح قبل الاتفاق.',
    });
  }

  // 4. محور سلامة النص وكشف التقليد والأقفال
  let textStatus: PillarStatus = 'passed';
  let textSummary = 'نص سليم';

  const textAlert = scanTextForFraud(textToScan);
  if (textAlert) {
    score -= textAlert.severity === 'high' ? 38 : 16;
    textStatus = textAlert.severity === 'high' ? 'danger' : 'warning';
    textSummary = textAlert.severity === 'high' ? 'تحذير احتيال' : 'رابط/تنبيه';
    warnings.push({
      code: textAlert.code,
      severity: textAlert.severity,
      title: textAlert.title,
      message: textAlert.advice,
    });
  }

  const replicaRe =
    /(?:هاي\s*كوبي|فرست\s*كوبي|كوبي\s*اول|تقفيل\s*دبي|تقليد\s*(?:درجه|اولي|طبق)?|نسخه\s*مقلده|تجميع\s*صيني|\bhigh\s*copy\b|\bfirst\s*copy\b|\breplica\b|\bclone\b)/iu;
  if (replicaRe.test(textToScan)) {
    score -= 32;
    textStatus = 'danger';
    textSummary = 'اشتباه جهاز مقلّد';
    warnings.push({
      code: 'REPLICA_DEVICE',
      severity: 'high',
      title: 'تنبيه: الوصف يشير إلى جهاز غير أصلي أو مقلّد',
      message:
        'تحقق من الرقم التسلسلي (IMEI) على الموقع الرسمي للشركة المصنّعة قبل الشراء للتأكد من أصالة الجهاز.',
    });
  }

  const sanitizedNoNegatedIcloud = textToScan.replace(
    /(?:بدون|خالي\s*من|خال\s*من|لا\s*يوجد|مفيش|ما\s*فيه)\s*(?:اي\s*كلاود|ايكلاود|icloud|قفل|اقفال)/giu,
    ' ',
  );
  const lockRe =
    /(?:اي\s*كلاود\s*مقفول|عليه\s*اي\s*كلاود|تخطي\s*اي\s*كلاود|ايكلاود\s*مقفول|icloud\s*lock|bypass|بايباس|مقفول\s*شبكه|مغلق\s*شبكه|بدون\s*شبكه|شريحه\s*مقفوله|لا\s*يقبل\s*شريحه)/iu;
  if (lockRe.test(sanitizedNoNegatedIcloud)) {
    score -= 32;
    textStatus = 'danger';
    textSummary = 'قفل iCloud/شبكة';
    warnings.push({
      code: 'LOCKED_OR_BYPASS_DEVICE',
      severity: 'high',
      title: 'تنبيه: الجهاز قد يكون مقفولاً (iCloud / شبكة / Bypass)',
      message:
        'تأكد من تسجيل خروج حساب iCloud/Google بالكامل وتشغيل شريحة الاتصال الخاصة بك وإجراء إعادة ضبط مصنع أمامك قبل الدفع.',
    });
  }

  const unpaidTaxRe =
    /(?:عليه\s*ضريبه|غير\s*مسدد\s*الضريبه|لم\s*تسدد\s*الضريبه|ضريبه\s*غير\s*مدفوعه|عليه\s*جمارك|غير\s*خالص\s*الضريبه)/iu;
  if (unpaidTaxRe.test(textToScan)) {
    score -= 12;
    if (textStatus === 'passed') {
      textStatus = 'warning';
      textSummary = 'تنبيه ضريبة جمركية';
    }
    warnings.push({
      code: 'UNPAID_CUSTOMS_TAX',
      severity: 'medium',
      title: 'تنبيه: قد توجد رسوم ضريبية/جمركية على الجهاز',
      message:
        'افحص رقم الـ IMEI عبر تطبيق «تليفوني» للتأكد من قيمة الرسوم المستحقة قبل الشراء واحتسابها ضمن السعر.',
    });
  }

  const offPlatformRe =
    /(?:واتس\s*فقط|واتساب\s*فقط|واتس\s*اب\s*فقط|لا\s*ارد\s*هنا|مش\s*برد\s*هنا|لا\s*اتواصل\s*داخل\s*التطبيق|whatsapp\s*only)/iu;
  if (offPlatformRe.test(textToScan)) {
    score -= 8;
    if (textStatus === 'passed') {
      textStatus = 'warning';
      textSummary = 'تواصل خارج التطبيق';
    }
    warnings.push({
      code: 'OFF_PLATFORM_PRESSURE',
      severity: 'low',
      title: 'يفضّل توثيق الاتفاق داخل دردشة سوق فون',
      message:
        'البائع يطلب التواصل خارج التطبيق؛ احتفظ دائماً بتفاصيل الاتفاق داخل دردشة سوق فون لحمايتك.',
    });
  }

  const hasHigh = warnings.some((w) => w.severity === 'high');
  let clampedScore = Math.min(99, Math.max(12, score));
  if (hasHigh && clampedScore > 42) {
    clampedScore = 42;
  }

  const level: TrustLevel =
    hasHigh || clampedScore < 45
      ? 'high_risk'
      : clampedScore > 80
        ? 'verified_high'
        : clampedScore >= 60
          ? 'good'
          : 'caution';

  const pillars: TrustCheckPillar[] = [
    { key: 'seller', label: 'البائع', summary: sellerSummary, status: sellerStatus },
    { key: 'price', label: 'السعر', summary: priceSummary, status: priceStatus },
    { key: 'details', label: 'الصور والمواصفات', summary: detailsSummary, status: detailsStatus },
    { key: 'text', label: 'سلامة الإعلان', summary: textSummary, status: textStatus },
  ];

  return {
    score: clampedScore,
    level,
    positiveSignals: positiveSignals.slice(0, 4),
    warnings,
    pillars,
  };
}
