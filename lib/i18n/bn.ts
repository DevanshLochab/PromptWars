/**
 * Saans Bengali (বাংলা) Message Catalogue
 */

export const bn: Record<string, string> = {
  // Navigation & Shell
  'nav.today': 'আজকের অবস্থা',
  'nav.plan': 'পরিকল্পনা',
  'nav.what_if': 'তুলনা',
  'nav.community': 'কমিউনিটি',
  'nav.ask': 'জিজ্ঞাসা করুন',
  'header.title': 'Saans (শ্বাস)',
  'header.subtitle': 'এয়ার কোয়ালিটি কোচ',
  'header.settings': 'সেটিংস ও পছন্দসমূহ',
  'header.live_aqi': 'লাইভ একিউআই',

  // AQI Bands
  'aqi.good': 'ভালো (Good)',
  'aqi.moderate': 'মাঝারি (Moderate)',
  'aqi.poor': 'খারাপ (Poor)',
  'aqi.unhealthy': 'অস্বাস্থ্যকর (Unhealthy)',
  'aqi.severe': 'মারাত্মক (Severe)',
  'aqi.hazardous': 'বিপজ্জনক (Hazardous)',
  'aqi.who_target': 'হু (WHO) ২৪ ঘণ্টার লক্ষ্য (১৫ µg/m³)',
  'aqi.current_outdoor': 'বর্তমান বহিরঙ্গন একিউআই',
  'aqi.estimated_indoor': 'ঘরের ভেতরের আনুমানিক বাতাস',
  'aqi.updated_at': '{time} এ আপডেটেড',
  'aqi.as_of': '{time} অনুযায়ী',

  // Evidence Grades
  'evidence.grade_a': 'গ্রেড এ — প্রমাণিত ও উচ্চ মানের গবেষণা',
  'evidence.grade_b': 'গ্রেড বি — পর্যবেক্ষণমূলক স্টাডি বা নির্দেশিকা',
  'evidence.grade_c': 'গ্রেড সি — প্রকৌশল হিসেব বা সাধারণ ঐকমত্য',
  'evidence.grade_d': 'গ্রেড ডি — ভিত্তিহীন কুসংস্কার বা ভ্রান্ত ধারণা',
  'evidence.grade_a_short': 'গ্রেড এ (দৃঢ়)',
  'evidence.grade_b_short': 'গ্রেড বি (মাঝারি)',
  'evidence.grade_c_short': 'গ্রেড সি (ঐকমত্য)',
  'evidence.grade_d_short': 'গ্রেড ডি (ভুল ধারণা)',
  'evidence.badge_title': 'বৈজ্ঞানিক প্রমাণ রেটিং',

  // Dual Ledger (Breathe & Give)
  'ledger.title': 'দ্বিমুখী ইমপ্যাক্ট হিসাব',
  'ledger.breathe_title': 'আপনি যা শ্বাস নিচ্ছেন',
  'ledger.breathe_desc': 'বাইরের দূষণের তুলনায় আপনার পরিবারের সুরক্ষা বৃদ্ধি।',
  'ledger.give_title': 'আপনি যা অবদান রাখছেন',
  'ledger.give_desc': 'পরিচ্ছন্ন যাতায়াত ও সচেতন অভ্যাসের মাধ্যমে দূষণ হ্রাস।',
  'ledger.exposure_cut': '{pct}% কম দূষণ',
  'ledger.avoided_emissions': '{grams} গ্রাম দূষিত কণা রোধ',
  'ledger.actions_done': 'এই সপ্তাহে {count}টি পদক্ষেপ সম্পন্ন',
  'ledger.mark_done': 'সম্পন্ন চিহ্নিত করুন',
  'ledger.completed': 'আজ সম্পন্ন হয়েছে',
  'ledger.undo': 'পূর্বাবস্থায় ফেরান',

  // Impact Receipt Card
  'receipt.title': 'প্রভাব রসিদ (Impact Receipt)',
  'receipt.for_who': 'নির্দিষ্ট লক্ষ্য:',
  'receipt.cost': 'আনুমানিক খরচ',
  'receipt.effort': 'প্রয়োজনীয় প্রচেষ্টা',
  'receipt.effort_low': 'সহজ (১-২/৫)',
  'receipt.effort_med': 'মাঝারি (৩/৫)',
  'receipt.effort_high': 'কঠিন (৪-৫/৫)',
  'receipt.confidence': 'অনুমানের নির্ভরযোগ্যতা',
  'receipt.confidence_high': 'উচ্চ নির্ভরযোগ্যতা',
  'receipt.confidence_med': 'মাঝারি নির্ভরযোগ্যতা',
  'receipt.confidence_low': 'প্রাথমিক অনুমান',
  'receipt.view_assumptions': 'বৈজ্ঞানিক অনুমান ও সূত্র দেখুন',
  'receipt.hide_assumptions': 'অনুমান লুকান',

  // Ventilation & Windows
  'windows.title': 'জানালা খোলার নিরাপদ সময়',
  'windows.open_now': 'এখন বায়ু চলাচলের জন্য নিরাপদ',
  'windows.keep_closed': 'জানালা বন্ধ রাখুন',
  'windows.best_window': 'সেরা বায়ু চলাচলের সময়: {start} থেকে {end}',

  // Safety
  'safety.co_warning_title': 'কার্বন মনোক্সাইড (CO) সংক্রান্ত জরুরি সতর্কতা',
  'safety.co_warning_desc': 'হিটার বা আগুন জ্বালালে ঘর সম্পূর্ণ সিল করবেন না।',
  'safety.medical_disclaimer_title': 'অ-চিকিৎসা নোটিশ',
  'safety.medical_disclaimer_desc': 'শ্বাস (Saans) একটি পরিবেশ ও জীবনধারা নির্দেশক, কোনো চিকিৎসালয় নয়। অসুস্থতায় অবিলম্বে চিকিৎসকের পরামর্শ নিন।',
  'safety.call_112': 'জরুরি পরিষেবা ১১২-তে কল করুন',

  // Ask AI & Myths
  'ask.title': 'Saans এআই বায়ু কোচকে জিজ্ঞাসা করুন',
  'ask.subtitle': 'বিজ্ঞানভিত্তিক বিশ্লেষণ, মাস্ক, পিউরিফায়ার এবং ভুল ধারণার সত্যতা যাচাই।',
  'ask.placeholder': 'আপনার প্রশ্ন লিখুন (যেমন: কাপড়ের মাস্ক কি যথেষ্ট? গাছ কি ঘরের বাতাস পরিষ্কার করে?)...',
  'ask.button': 'জিজ্ঞাসা করুন',
  'ask.suggested': 'জনপ্রিয় প্রশ্ন ও ভুল ধারণা যাচাই:',
  'ask.myth_badge': 'ভ্রান্ত ধারণা খণ্ডন',
  'ask.myth_what_evidence_says': 'বিজ্ঞান কী বলে:',
  'ask.myth_what_to_do': 'এর পরিবর্তে কী করবেন (প্রমাণিত উপায়):',
  'ask.citations': 'বৈজ্ঞানিক সূত্র ও উৎস:',

  // Settings
  'settings.title': 'সেটিংস ও পছন্দসমূহ',
  'settings.language': 'ভাষা (Language)',
  'settings.theme': 'চেহারা / থিম (Theme)',
  'settings.theme_system': 'সিস্টেম ডিফল্ট',
  'settings.theme_light': 'লাইট মোড',
  'settings.theme_dark': 'ডার্ক মোড',
  'settings.demo_mode': 'ডেমো মোড (দিল্লির তীব্র ধোঁয়াশা)',
  'settings.demo_mode_desc': 'পরীক্ষার জন্য ৪ সদস্যের পরিবার ও তীব্র স্মগের নমুনা প্রদর্শন করে।',
  'settings.reset_data': 'সমস্ত ডেটা মুছে ফেলুন',
  'settings.reset_confirm': 'আপনি কি সমস্ত প্রোফাইল ও ডেটা মুছে ফেলতে নিশ্চিত?',
  'settings.privacy_title': 'গোপনীয়তা নীতি',
  'settings.privacy_desc': 'আপনার সমস্ত তথ্য কেবলমাত্র আপনার ব্রাউজারে সুরক্ষিত থাকে। কোনো তথ্য ট্র্যাকিং বা বিক্রি করা হয় না।',
  'settings.location_title': 'শহর ও অবস্থান',
  'settings.location_change': 'শহর পরিবর্তন করুন',

  // Common
  'common.close': 'বন্ধ করুন',
  'common.cancel': 'বাতিল',
  'common.confirm': 'নিশ্চিত করুন',
  'common.save': 'সংরক্ষণ করুন',
  'common.delete': 'মুছুন',
  'common.loading': 'লোড হচ্ছে...',
};
