import type { DealAssessment } from '@/lib/market-deal-intelligence';

export type TrustLevel = 'verified_high' | 'good' | 'caution' | 'high_risk';
export type RiskSeverity = 'low' | 'medium' | 'high';

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
    .replaceAll('ى', 'ي')
    .replaceAll('ة', 'ه')
    .replace(/[\u064B-\u0652]/g, '')
    .replace(/\s+/g, ' ');
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
  let score = 45;
  const positiveSignals: string[] = [];
  const warnings: SafetyWarningFlag[] = [];

  const specs = input.specifications ?? {};
  const isStore = Boolean(input.isStore);
  if (isStore) {
    score += 22;
    positiveSignals.push('متجر معتمد على سوق فون');
  }

  if (input.sellerVerified) {
    score += 12;
    positiveSignals.push('حساب موثّق');
  }

  let accountAgeDays = 30;
  if (input.sellerCreatedAt) {
    const createdMs = new Date(input.sellerCreatedAt).getTime();
    if (Number.isFinite(createdMs)) {
      accountAgeDays = Math.max(0, Math.floor((Date.now() - createdMs) / 86_400_000));
      if (accountAgeDays >= 90) {
        score += 10;
        positiveSignals.push('عضو قديم في سوق فون');
      } else if (accountAgeDays >= 30) {
        score += 5;
      }
    }
  }

  if (input.sellerRating && input.sellerRating >= 4.5) {
    score += 6;
    positiveSignals.push(`تقييم بائع مرتفع (${input.sellerRating.toFixed(1)}★)`);
  }

  if (input.imagesCount >= 3) {
    score += 8;
    positiveSignals.push(`${input.imagesCount} صور واضحة للجهاز`);
  } else if (input.imagesCount >= 2) {
    score += 4;
  }

  const hasSpecs =
    Boolean(String(specs.brand ?? '').trim()) &&
    Boolean(String(specs.model ?? '').trim()) &&
    Boolean(String(specs.storage ?? '').trim());
  if (hasSpecs) {
    score += 8;
    positiveSignals.push('المواصفات الفنية مكتملة');
  }

  if (String(input.description ?? '').trim().length >= 40) {
    score += 5;
  }

  if (
    input.dealAssessment &&
    (input.dealAssessment.tier === 'fair_price' || input.dealAssessment.tier === 'hot_deal')
  ) {
    score += 8;
    positiveSignals.push(
      input.dealAssessment.tier === 'hot_deal'
        ? 'سعر ممتاز مقارنة بمتوسط السوق'
        : 'السعر متوافق مع متوسط السوق',
    );
  }

  if (input.dealAssessment?.tier === 'suspiciously_low' && !isStore) {
    score -= 35;
    warnings.push({
      code: 'SUSPICIOUSLY_LOW_PRICE',
      severity: 'high',
      title: `سعر منخفض بشكل غير معتاد (-${input.dealAssessment.savingsPercent}%)`,
      message:
        'السعر أقل بكثير من متوسط سوق فون لنفس الموديل. لا تحوّل أي عربون أو مبلغ مقدم مطلقاً وتأكد من المعاينة الشخصية في مكان عام.',
    });
  }

  const textAlert = scanTextForFraud(`${input.title} ${input.description ?? ''}`);
  if (textAlert) {
    score -= textAlert.severity === 'high' ? 35 : 15;
    warnings.push({
      code: textAlert.code,
      severity: textAlert.severity,
      title: textAlert.title,
      message: textAlert.advice,
    });
  }

  const isHighValue = input.isSaudi ? input.price >= 1800 : input.price >= 15000;
  if (!isStore && input.sellerCreatedAt && accountAgeDays < 7 && isHighValue && input.imagesCount <= 1) {
    score -= 15;
    warnings.push({
      code: 'NEW_ACCOUNT_HIGH_VALUE',
      severity: 'medium',
      title: 'حساب جديد بصورة واحدة فقط',
      message:
        'اطلب صوراً إضافية واضحة للجهاز ورقم الـ IMEI، وفضّل المعاينة في مكان عام أو مركز صيانة معتمد.',
    });
  }

  const clampedScore = Math.min(100, Math.max(10, score));
  const hasHigh = warnings.some((w) => w.severity === 'high');
  const level: TrustLevel =
    hasHigh || clampedScore < 45
      ? 'high_risk'
      : clampedScore >= 80
        ? 'verified_high'
        : clampedScore >= 60
          ? 'good'
          : 'caution';

  return {
    score: clampedScore,
    level,
    positiveSignals: positiveSignals.slice(0, 4),
    warnings,
  };
}
