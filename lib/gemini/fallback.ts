import {
  HouseholdProfile,
  HourlyAir,
  Plan,
  PlanMemberTips,
  PlanTimelineEntry,
  PlanTopAction,
  Receipt,
  Language,
} from '@/lib/schemas';
import { rankActions, bestWindows, aqiBand } from '@/lib/engine';
import demoSnapshot from '@/data/demo_snapshot.json';

const ADVICE_MESSAGES: Record<string, Record<Language, string>> = {
  default: {
    en: 'Keep windows shut and run indoor purification.',
    hi: 'खिड़कियां बंद रखें और इनडोर प्यूरीफायर चालू रखें।',
    bn: 'জানালা বন্ধ রাখুন এবং ইনডোর এয়ার পিউরিফায়ার চালান।',
    mr: 'खिडक्या बंद ठेवा आणि घरातील एअर प्युरिफायर चालू ठेवा.',
    te: 'కిటికీలు మూసివేసి ఇండోర్ ఎయిర్ ప్యూరిఫైయర్‌ను నడపండి.',
    ta: 'ஜன்னல்களை மூடிவைத்து உட்புற காற்று சுத்திகரிப்பானை இயக்கவும்.',
    gu: 'બારીઓ બંધ રાખો અને ઇન્ડોર એર પ્યુરિફાયર ચાલુ રાખો.',
    kn: 'ಕಿಟಕಿಗಳನ್ನು ಮುಚ್ಚಿ ಮತ್ತು ಒಳಾಂಗಣ ಏರ್ ಪ್ಯೂರಿಫೈಯರ್ ಚಲಾಯಿಸಿ.',
    pa: 'ਖਿੜਕੀਆਂ ਬੰਦ ਰੱਖੋ ਅਤੇ ਅੰਦਰੂਨੀ ਏਅਰ ਪਿਊਰੀਫਾਇਰ ਚਲਾਓ।',
  },
  combustion: {
    en: 'Safety: Keep window cracked while combustion heater is active.',
    hi: 'सावधानी: हीटर जलते समय खिड़की थोड़ी खुली रखें।',
    bn: 'সতর্কতা: হিটার চলাকালীন জানালা কিছুটা খোলা রাখুন।',
    mr: 'सावधानता: हीटर चालू असताना खिडकी थोडी उघडी ठेवा.',
    te: 'భద్రత: హీటర్ పనిచేస్తున్నప్పుడు కిటికీని కొద్దిగా తెరిచి ఉంచండి.',
    ta: 'பாதுகாப்பு: ஹீட்டர் எரியும் போது ஜன்னலை சற்று திறந்து வைக்கவும்.',
    gu: 'સાવધાની: હીટર ચાલુ હોય ત્યારે બારી સહેજ ખુલ્લી રાખો.',
    kn: 'ಸುರಕ್ಷತೆ: ಹೀಟರ್ ಚಾಲನೆಯಲ್ಲಿರುವಾಗ ಕಿಟಕಿಯನ್ನು ಸ್ವಲ್ಪ ತೆರೆದಿಡಿ.',
    pa: 'ਸੁਰੱਖਿਆ: ਹੀਟਰ ਚੱਲਣ ਸਮੇਂ ਖਿੜਕੀ ਥੋੜ੍ਹੀ ਖੁੱਲ੍ਹੀ ਰੱਖੋ।',
  },
  vent: {
    en: 'Best window for brief cross-ventilation.',
    hi: 'संक्षिप्त वेंटिलेशन के लिए सबसे अनुकूल समय।',
    bn: 'সংক্ষিপ্ত ক্রস-বায়ুচলাচলের জন্য সেরা সময়।',
    mr: 'थोड्या वेळाच्या क्रॉस-व्हेंटिलेशनसाठी सर्वोत्तम वेळ.',
    te: 'సంక్షిప్త క్రాస్-వెంటిలేషన్ కోసం ఉత్తమ సమయం.',
    ta: 'குறுகிய குறுக்கு காற்றோட்டத்திற்கான சிறந்த நேரம்.',
    gu: 'સંક્ષિપ્ત ક્રોસ-વેન્ટિલેશન માટે શ્રેષ્ઠ સમય.',
    kn: 'ಸಂಕ್ಷಿಪ್ತ ಕ್ರಾಸ್-ವೆಂಟಿಲೇಷನ್‌ಗಾಗಿ ಉತ್ತಮ ಸಮಯ.',
    pa: 'ਸੰਖੇਪ ਕਰਾਸ-ਵੈਂਟੀਲੇਸ਼ਨ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ।',
  },
  morning_smog: {
    en: 'Morning peak smog: avoid intense outdoor exertion.',
    hi: 'सुबह का पीक स्मॉग: बाहरी गतिविधियां टालें।',
    bn: 'সকালের তীব্র ধোঁয়াশা: বাইরের ভারী কাজকর্ম এড়িয়ে চলুন।',
    mr: 'सकाळचा तीव्र धूर: बाहेरचे कठीण व्यायाम टाळा.',
    te: 'ఉదయం తీవ్రమైన పొగమంచు: బయట శ్రమతో కూడిన పనులు నివారించండి.',
    ta: 'காலை தீவிர புகைமூட்டம்: கடுமையான வெளிப்புற உடற்பயிற்சியைத் தவிர்க்கவும்.',
    gu: 'સવારનો પીક સ્મોગ: બહારની ભારે પ્રવૃત્તિ ટાળો.',
    kn: 'ಬೆಳಗಿನ ಗರಿಷ್ಠ ಹೊಗೆ: ಹೊರಾಂಗಣ ಶ್ರಮದಾಯಕ ಚಟುವಟಿಕೆಗಳನ್ನು ತಪ್ಪಿಸಿ.',
    pa: 'ਸਵੇਰ ਦਾ ਪੀਕ ਸਮੋਗ: ਬਾਹਰੀ ਸਖ਼ਤ ਮਿਹਨਤ ਤੋਂ ਬਚੋ।',
  },
  night_sleep: {
    en: 'Run bedroom purifier on quiet mode during sleep.',
    hi: 'सोने के कमरे में प्यूरीफायर स्लीप मोड पर चलाएं।',
    bn: 'ঘুমের সময় শোবার ঘরে পিউরিফায়ার স্লিপ মোডে চালান।',
    mr: 'झोपताना बेडरूममध्ये प्युरिफायर स्लीप मोडवर चालवा.',
    te: 'నిద్రపోయే సమయంలో బెడ్‌రూమ్‌లో ప్యూరిఫైయర్‌ను స్లీప్ మోడ్‌లో నడపండి.',
    ta: 'தூங்கும் போது படுக்கையறையில் பியூரிஃபையரை ஸ்லீப் பயன்முறையில் இயக்கவும்.',
    gu: 'ઊંઘતી વખતે બેડરૂમમાં પ્યુરિફાયર સ્લીપ મોડ પર ચલાવો.',
    kn: 'ನಿದ್ರೆಯ ಸಮಯದಲ್ಲಿ ಮಲಗುವ ಕೋಣೆಯಲ್ಲಿ ಪ್ಯೂರಿಫೈಯರ್ ಅನ್ನು ಸ್ಲೀಪ್ ಮೋಡ್‌ನಲ್ಲಿ ಚಲಾಯಿಸಿ.',
    pa: 'ਸੌਣ ਵੇਲੇ ਬੈੱਡਰੂਮ ਵਿੱਚ ਪਿਊਰੀਫਾਇਰ ਸਲੀਪ ਮੋਡ ਵਿੱਚ ਚਲਾਓ।',
  },
};

const TAG_LABELS: Record<string, Record<Language, string>> = {
  co_safety: { en: 'CO Safety', hi: 'सीओ सुरक्षा', bn: 'সিও নিরাপত্তা', mr: 'CO सुरक्षा', te: 'CO భద్రత', ta: 'CO பாதுகாப்பு', gu: 'CO સુરક્ષા', kn: 'CO ಸುರಕ್ಷತೆ', pa: 'CO ਸੁਰੱਖਿਆ' },
  ventilation: { en: 'Ventilation', hi: 'वेंटिलेशन', bn: 'বায়ুচলাচল', mr: 'व्हेंटिलेशन', te: 'వెంటిలేషన్', ta: 'காற்றோட்டம்', gu: 'વેન્ટિલેશન', kn: 'ವೆಂಟಿಲೇಷನ್', pa: 'ਵੈਂਟੀਲੇਸ਼ਨ' },
  peak_smog: { en: 'Peak Smog', hi: 'पीक स्मॉग', bn: 'তীব্র ধোঁয়াশা', mr: 'पीक स्मोॉग', te: 'తీవ్ర పొగమంచు', ta: 'தீவிர புகை', gu: 'પીક સ્મોગ', kn: 'ಗರಿಷ್ಠ ಹೊಗೆ', pa: 'ਪੀਕ ਸਮੋਗ' },
  night_sleep: { en: 'Night Sleep', hi: 'रात्रि विश्राम', bn: 'রাতের বিশ্রাম', mr: 'रात्रीची विश्रांती', te: 'రాత్రి విశ్రాంతి', ta: 'இரவு தூக்கம்', gu: 'રાત્રિ આરામ', kn: 'ರಾತ್ರಿ ವಿಶ್ರಾಂತಿ', pa: 'ਰਾਤ ਦਾ ਆਰਾਮ' },
};

const EN_ACTION_TEMPLATES: Record<
  string,
  { why: string; how: string; when: string; forWhom: string }
> = {
  never_seal_room_with_combustion_heater: {
    why: 'CRITICAL LIFE SAFETY: Burning fuel in an unventilated room causes lethal carbon monoxide buildup.',
    how: 'Keep a window cracked at least two inches. Install a working carbon monoxide alarm near sleeping areas.',
    when: 'All day and night while heating is active',
    forWhom: 'Entire household (especially sleeping members)',
  },
  install_co_alarm: {
    why: 'Carbon monoxide is completely invisible and odorless; an audible alarm is your only warning.',
    how: 'Place a battery-operated CO detector at breathing height, outside bedrooms.',
    when: 'Immediately',
    forWhom: 'Entire family',
  },
  purifier_run_high_bedroom_evening: {
    why: 'Reduces bedroom PM2.5 by [[r1.breathe.deltaPct]]% before bedtime, ensuring clean air during sleep.',
    how: 'Turn the air purifier to maximum fan speed thirty minutes before sleeping, then switch to quiet night mode.',
    when: '8:00 PM to 10:00 PM',
    forWhom: 'Family members resting indoors',
  },
  n95_or_ffp2_for_outdoor_commute: {
    why: 'Filters up to ninety-five percent of fine particulate smog during roadside travel.',
    how: 'Ensure a snug seal around nose bridge and chin without gaps. Replace when breathing becomes resistant.',
    when: 'During morning and evening commutes',
    forWhom: 'Two-wheeler and walking commuters',
  },
  shift_outdoor_play_to_best_window: {
    why: 'Protects growing lungs by moving outdoor activities to the least polluted hours of the day.',
    how: 'Check hourly smog levels and plan outdoor movement during afternoon sunshine hours.',
    when: '1:00 PM to 3:00 PM',
    forWhom: 'Children and seniors',
  },
  cooking_exhaust_on_during_and_after: {
    why: 'Prevents kitchen particulate spikes from dispersing into living and sleeping quarters.',
    how: 'Run the exhaust hood or open kitchen vent during stove use and keep running for fifteen minutes after.',
    when: 'During meal preparation',
    forWhom: 'All household members',
  },
  replace_overdue_filter: {
    why: 'Clogged filters lose airflow and filtration efficiency, degrading indoor air cleanup.',
    how: 'Inspect HEPA filter surface and replace with certified genuine filter cartridge.',
    when: 'This weekend',
    forWhom: 'Entire household',
  },
  wet_mop_not_dry_sweep: {
    why: 'Dry sweeping launches settled toxic dust back into the breathing zone.',
    how: 'Damp mop floors with clean water; avoid broom sweeping during smog season.',
    when: 'Morning cleaning routine',
    forWhom: 'Children and crawling infants',
  },
};

const HI_ACTION_TEMPLATES: Record<
  string,
  { why: string; how: string; when: string; forWhom: string }
> = {
  never_seal_room_with_combustion_heater: {
    why: 'अत्यंत महत्वपूर्ण जीवन-सुरक्षा: हीटर/अंगीठी जलते समय कमरा पूरी तरह बंद करने से जानलेवा कार्बन मोनोऑक्साइड भर सकती है।',
    how: 'खिड़की को कम से कम दो इंच खुला रखें और सोने के कमरे में सीओ (CO) अलार्म लगाएं।',
    when: 'हीटर चलने के दौरान पूरे समय',
    forWhom: 'पूरे परिवार के लिए',
  },
  install_co_alarm: {
    why: 'कार्बन मोनोऑक्साइड गैस बिना गंध और अदृश्य होती है; केवल अलार्म ही इसका समय पर पता लगा सकता है।',
    how: 'सोने के कमरे के पास सांस लेने की ऊंचाई पर बैटरी वाला अलार्म लगाएं।',
    when: 'तुरंत',
    forWhom: 'सभी सदस्यों के लिए',
  },
  purifier_run_high_bedroom_evening: {
    why: 'सोने से पहले कमरे के प्रदूषण को कम करता है ताकि रात भर स्वच्छ हवा मिल सके।',
    how: 'सोने से आधा घंटा पहले प्यूरीफायर को तेज गति पर चलाएं, फिर स्लीप मोड पर रखें।',
    when: 'रात 8:00 PM से 10:00 PM',
    forWhom: 'कमरे में सोने वाले सदस्यों के लिए',
  },
  n95_or_ffp2_for_outdoor_commute: {
    why: 'सड़क पर यात्रा के दौरान हानिकारक धुएं और कणों से फेफड़ों की रक्षा करता है।',
    how: 'मास्क को नाक और ठुड्डी पर अच्छी तरह से कसकर लगाएं ताकि कहीं से हवा न छूटे।',
    when: 'सुबह और शाम की यात्रा के समय',
    forWhom: 'सड़क पर आने-जाने वाले सदस्यों के लिए',
  },
  shift_outdoor_play_to_best_window: {
    why: 'दिन के सबसे कम प्रदूषित समय में बाहर निकलकर बच्चों के फेफड़ों को सुरक्षित रखें।',
    how: 'दोपहर की धूप में जब हवा साफ हो, तभी बाहर जाएं।',
    when: 'दोपहर 1:00 PM से 3:00 PM',
    forWhom: 'बच्चों और बुजुर्गों के लिए',
  },
  cooking_exhaust_on_during_and_after: {
    why: 'रसोई का धुआं और गैस बाकी कमरों में फैलने से रोकता है।',
    how: 'खाना बनाते समय और उसके पंद्रह मिनट बाद तक एग्जॉस्ट फैन चालू रखें।',
    when: 'खाना बनाते समय',
    forWhom: 'घर के सभी सदस्यों के लिए',
  },
  replace_overdue_filter: {
    why: 'पुराना और चोक फिल्टर हवा को साफ करने की क्षमता खो देता है।',
    how: 'प्यूरीफायर का फिल्टर जांचें और नया प्रमाणित फिल्टर लगाएं।',
    when: 'इस सप्ताह',
    forWhom: 'पूरे परिवार के लिए',
  },
  wet_mop_not_dry_sweep: {
    why: 'सूखा झाड़ू लगाने से जमीन पर जमी जहरीली धूल फिर से हवा में उड़ने लगती है।',
    how: 'सूखे झाड़ू के बजाय गीले पोछे का इस्तेमाल करें।',
    when: 'सुबह की सफाई के दौरान',
    forWhom: 'पूरे घर के लिए',
  },
};

const REGIONAL_FALLBACK_COPY: Record<
  Exclude<Language, 'en' | 'hi'>,
  { why: string; how: string; when: string; forWhom: string }
> = {
  bn: { why: 'সূক্ষ্ম কণার ধুলোর সংস্পর্শ কমায়।', how: 'প্রস্তাবিত নিরাপত্তা নির্দেশাবলী অনুসরণ করুন।', when: 'সারা দিন', forWhom: 'সব পরিবারের সদস্য' },
  mr: { why: 'सूक्ष्म कणांच्या धुळीचा संपर्क कमी करते.', how: 'शिफारस केलेली सुरक्षा सूचना पाळा.', when: 'दिवसभर', forWhom: 'घरातील सर्व सदस्य' },
  te: { why: 'सूక్ష్మ కణాల పీక్రమాన్ని తగ్గిస్తుంది.', how: 'సిఫార్సు చేసిన భద్రతా సూచనలను పాటించండి.', when: 'రోజంతా', forWhom: 'ఇంటి సభ్యులందరూ' },
  ta: { why: 'மிக நுண்ணிய துகள்களின் வெளிப்பாட்டைக் குறைக்கிறது.', how: 'பரிந்துரைக்கப்பட்ட பாதுகாப்பு வழிகாட்டுதல்களைப் பின்பற்றவும்.', when: 'நாள் முழுவதும்', forWhom: 'எல்லா குடும்ப உறுப்பினர்களும்' },
  gu: { why: 'સૂક્ષ્મ કણોનું સંપર્ક ઓછું કરે છે.', how: 'ભલામણ કરેલી સલામતી સૂચનાઓ અનુસરો.', when: 'દિવસભર', forWhom: 'ઘરના તમામ સભ્યો' },
  kn: { why: 'सूಕ್ಷ್ಮ ಕಣಗಳ ಒಡ್ಡುವಿಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.', how: 'ಶಿಫಾರಸು ಮಾಡಿದ ಸುರಕ್ಷತಾ ಸೂಚನೆಗಳನ್ನು ಪಾಲಿಸಿ.', when: 'ದಿನಪೂರ್ತಿ', forWhom: 'ಮನೆಗೆಲ್ಲಾ ಸದಸ್ಯರು' },
  pa: { why: 'ਸੂਖਮ ਧੂੜੀ ਦੇ ਸੰਪਰਕ ਨੂੰ ਘਟਾਉਂਦਾ ਹੈ।', how: 'ਸਿਫਾਰਸ਼ ਕੀਤੀਆਂ ਸੁਰੱਖਿਆ ਹਦਾਇਤਾਂ ਦੀ ਪਾਲਣਾ ਕਰੋ।', when: 'ਪੂਰਾ ਦਿਨ', forWhom: 'ਸਾਰੇ ਪਰਿਵਾਰਕ ਮੈਂਬਰ' },
};

/**
 * Deterministic fallback plan generator.
 * Produces a full valid Plan object using the calculation engine and templated copy.
 * Ensures the app is completely reliable and functional even without Gemini API access.
 */
export function generateFallbackPlan(
  profile: HouseholdProfile,
  hourlyAir?: HourlyAir[],
  receipts?: Receipt[],
  language: Language = 'en'
): Plan {
  const airData =
    hourlyAir && hourlyAir.length >= 24
      ? hourlyAir.slice(0, 24)
      : (demoSnapshot.hourly as HourlyAir[]);

  const ranked = rankActions(profile, airData, receipts);
  const topRanked = ranked.slice(0, 3);

  const isHindi = language === 'hi';
  const templates: Record<string, { why: string; how: string; when: string; forWhom: string }> =
    language === 'hi'
      ? HI_ACTION_TEMPLATES
      : language === 'en'
        ? EN_ACTION_TEMPLATES
        : {};

  // Determine severity tier based on peak AQI / PM2.5 (aligned with CPCB and EPA AQI)
  const peakPm25 = Math.max(...airData.map((h) => h.pm25 || 0));
  const peakAqi = Math.max(...airData.map((h) => h.usAqi || 0));
  let severityTier = 'Moderate';
  if (peakAqi > 300 || peakPm25 > 250) severityTier = 'Severe Smog Emergency';
  else if (peakAqi > 200 || peakPm25 > 150) severityTier = 'Very Poor Air';
  else if (peakAqi > 100 || peakPm25 > 60) severityTier = 'Poor Air Quality';
  else if (peakAqi <= 50 && peakPm25 <= 30) severityTier = 'Good Air Quality';

  // Localized Fallback Headlines
  const fallbackHeadlines: Record<Language, string> = {
    en: 'AI personalization unavailable — showing engine-computed recommendations.',
    hi: 'AI वैयक्तिकरण अनुपलब्ध — इंजन-गणना की गई व्यावहारिक सिफारिशें।',
    bn: 'এআই ব্যক্তিগতকরণ অনুপলব্ধ — ইঞ্জিন-গণনাকৃত ব্যবহারিক সুপারিশ দেখানো হচ্ছে।',
    mr: 'AI वैयक्तिकरण अनुपलब्ध — इंजिन-गणना केलेल्या शिफारसी दर्शवित आहे.',
    te: 'AI వ్యక్తిగతీకరణ అందుబాటులో లేదు — ఇంజిన్-లెక్కించిన ఆచరణాత్మక సిఫార్సులను చూపుతోంది.',
    ta: 'AI தனிப்பயனாக்கம் கிடைக்கவில்லை — எஞ்சின் கணக்கிடப்பட்ட நடைமுறை பரிந்துரைகளைக் காட்டுகிறது.',
    gu: 'AI વૈયક્તિકરણ અનુપલબ્ધ — એન્જિન-ગણતરી કરેલી ભલામણો દર્શાવી રહ્યું છે.',
    kn: 'AI ವೈಯಕ್ತೀಕರಣ ಲಭ್ಯವಿಲ್ಲ — ಎಂಜಿನ್-ಲೆಕ್ಕಾಚಾರದ ಪ್ರಾಯೋಗಿಕ ಶಿಫಾರಸುಗಳನ್ನು ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
    pa: 'AI ਨਿੱਜੀਕਰਨ ਅਣਉਪਲਬਧ — ਇੰਜਨ-ਹਿਸਾਬ ਵਾਲੀਆਂ ਸਿਫ਼ਾਰਸ਼ਾਂ ਦਿਖਾਈਆਂ ਜਾ ਰਹੀਆਂ ਹਨ।',
  };
  const headline = fallbackHeadlines[language] || fallbackHeadlines.en;

  // Top actions
  const topActions: PlanTopAction[] = topRanked.map((item, idx) => {
    const regionalCopy =
      language !== 'en' && language !== 'hi'
        ? REGIONAL_FALLBACK_COPY[language]
        : null;
    const defaultTemplate = templates[item.action.id] || {
      why: item.why || (regionalCopy?.why || (isHindi ? 'कमरे की हवा साफ रखें।' : 'Reduces fine particle exposure.')),
      how:
        item.action.steps?.[0] ||
        regionalCopy?.how ||
        (isHindi ? 'दिशानिर्देशों का पालन करें।' : 'Follow recommended guideline steps.'),
      when: regionalCopy?.when || (isHindi ? 'दिन के दौरान' : 'Throughout the day'),
      forWhom: item.action.whoBenefits || regionalCopy?.forWhom || (isHindi ? 'सभी सदस्य' : 'Household members'),
    };

    return {
      receiptId: item.receipt.id || `r${idx + 1}`,
      why: defaultTemplate.why,
      how: defaultTemplate.how,
      whenWindow: defaultTemplate.when,
      forWhom: defaultTemplate.forWhom,
    };
  });

  // Calculate best ventilation windows
  const outdoorSeries = airData.map((h) => h.pm25);
  // Estimate baseline indoor as ~60% of outdoor if no purifier, or ~30% if purifier present
  const hasPurifier = profile.devices?.some(
    (d) => d.type === 'purifier' || d.type === 'diy_filter'
  );
  const indoorRatio = hasPurifier ? 0.35 : 0.65;
  const indoorSeries = outdoorSeries.map((c) => Math.round(c * indoorRatio));

  const hasCombustionHeater = Boolean(
    profile.home?.heating?.some((h) => ['coal_charcoal', 'wood', 'gas'].includes(h))
  );

  const ventWindows = bestWindows(outdoorSeries, indoorSeries, {
    hasCombustionHeater,
  });

  const bestWindowHours = new Set<number>();
  ventWindows.forEach((w) => {
    for (let h = w.startHour; h <= w.endHour; h++) {
      bestWindowHours.add(h % 24);
    }
  });

  // 24-hour timeline
  const timeline: PlanTimelineEntry[] = airData.map((h, hourIndex) => {
    const currentAqiBand = aqiBand(h.usAqi || h.pm25 * 1.2);
    const isVentHour = bestWindowHours.has(hourIndex);

    let advice = ADVICE_MESSAGES.default[language] || ADVICE_MESSAGES.default.en;
    const tags: string[] = [];

    if (hasCombustionHeater) {
      advice = ADVICE_MESSAGES.combustion[language] || ADVICE_MESSAGES.combustion.en;
      tags.push(TAG_LABELS.co_safety[language] || TAG_LABELS.co_safety.en);
    } else if (isVentHour) {
      advice = ADVICE_MESSAGES.vent[language] || ADVICE_MESSAGES.vent.en;
      tags.push(TAG_LABELS.ventilation[language] || TAG_LABELS.ventilation.en);
    } else if (hourIndex >= 7 && hourIndex <= 10) {
      advice = ADVICE_MESSAGES.morning_smog[language] || ADVICE_MESSAGES.morning_smog.en;
      tags.push(TAG_LABELS.peak_smog[language] || TAG_LABELS.peak_smog.en);
    } else if (hourIndex >= 21 || hourIndex <= 6) {
      advice = ADVICE_MESSAGES.night_sleep[language] || ADVICE_MESSAGES.night_sleep.en;
      tags.push(TAG_LABELS.night_sleep[language] || TAG_LABELS.night_sleep.en);
    }

    return {
      hour: hourIndex,
      aqiBand: currentAqiBand,
      tags,
      advice,
    };
  });

  // Member tips with safety checks
  const perMember: PlanMemberTips[] = profile.members.map((member) => {
    const tips: string[] = [];
    const isChildOrInfant = ['infant', 'toddler', 'child'].includes(member.ageBand);
    const isInfant = member.ageBand === 'infant' || member.ageBand === 'toddler';
    const hasAsthma = member.conditions?.includes('asthma');
    const isCommuter = member.commute?.mode && member.commute.mode !== 'none';

    if (isInfant) {
      // LIFE SAFETY: No tight respirators for infants/toddlers
      tips.push(
        isHindi
          ? 'शिशुओं के लिए टाइट N95 मास्क का उपयोग न करें (दम घुटने का खतरा)। केवल कमरे की शुद्ध हवा में रखें।'
          : 'Do not use tight respirators or N95 masks for infants under two years (suffocation hazard). Rely on indoor purified air.'
      );
    } else if (isChildOrInfant) {
      tips.push(
        isHindi
          ? 'शाम के समय बाहरी खेलकूद बंद रखें और इनडोर खेल खेलें।'
          : 'Avoid intense outdoor sports during high-pollution hours; play indoors.'
      );
    }

    if (hasAsthma) {
      tips.push(
        isHindi
          ? 'त्वरित राहत वाला इनहेलर हमेशा पास रखें। सांस लेने में कठिनाई होने पर तुरंत डॉक्टर से परामर्श लें।'
          : 'Keep prescribed rescue inhaler accessible at all times. Consult a clinician if symptoms worsen.'
      );
    }

    if (isCommuter) {
      if (member.commute.mode === 'two_wheeler' || member.commute.mode === 'walk') {
        tips.push(
          isHindi
            ? 'सड़क यात्रा के समय अच्छी तरह फिट होने वाला N95 मास्क अवश्य पहनें।'
            : 'Wear a well-fitted N95/FFP2 respirator during transit; seal the nose clip securely.'
        );
      } else if (member.commute.mode === 'car') {
        tips.push(
          isHindi
            ? 'कार में एयर रिसर्कुलेशन मोड चालू रखें और खिड़कियां बंद रखें।'
            : 'Set car ventilation to internal recirculation mode with windows closed.'
        );
      }
    }

    if (tips.length === 0) {
      tips.push(
        isHindi
          ? 'पर्याप्त पानी पिएं और दिन के समय कम प्रदूषित घंटों में ही आवश्यक कार्य करें।'
          : 'Stay hydrated and schedule necessary outdoor errands during afternoon hours.'
      );
    }

    return {
      memberId: member.id,
      nickname: member.nickname,
      tips,
    };
  });

  // Safety notes
  const safetyNotes: string[] = [];

  const coWarningText: Record<Language, string> = {
    en: 'CRITICAL CARBON MONOXIDE WARNING: Never seal the room while operating combustion heating (coal, charcoal, wood, or gas). Fuel-burning heaters produce lethal, odorless carbon monoxide. Maintain continuous ventilation and install a certified CO alarm.',
    hi: 'अत्यंत जरूरी चेतावनी: कोयला, लकड़ी या गैस हीटर जलते समय कमरे को कभी भी पूरी तरह सील न करें। कार्बन मोनोऑक्साइड एक मूक घातक गैस है। हमेशा पर्याप्त वेंटिलेशन बनाए रखें।',
    bn: 'জরুরি সতর্কতা: কয়লা, কাঠ বা গ্যাস হিটার জ্বালানোর সময় ঘর কখনও সম্পূর্ণ বন্ধ করবেন না। কার্বন মনোক্সাইড একটি প্রাণঘাতী গ্যাস। সর্বদা বায়ুচলাচল বজায় রাখুন।',
    mr: 'अत्यंत महत्त्वाची चेतावणी: कोळसा, लाकूड किंवा गॅस हीटर चालू असताना खोली कधीही पूर्णपणे बंद करू नका. कार्बन मोनोऑक्साइड हा एक घातक वायू आहे. सतत वायुवीजन ठेवा.',
    te: 'ముఖ్యమైన హెచ్చరిక: బొగ్గు, కలప లేదా గ్యాస్ హీటర్ వెలుగుతున్నప్పుడు గదిని ఎప్పుడూ పూర్తిగా మూసివేయవద్దు. కార్బన్ మోనాక్సైడ్ ప్రాణాంతకం. నిరంతర వెంటిలేషన్ ఉంచండి.',
    ta: 'முக்கிய எச்சரிக்கை: நிலக்கரி, மரம் அல்லது எரிவாயு ஹீட்டர் எரியும் போது அறையை முழுமையாக மூட வேண்டாம். கார்பன் மோனாக்சைடு ஆபத்தானது. எப்போதும் காற்றோட்டம் வைக்கவும்.',
    gu: 'મહત્વપૂર્ણ ચેતવણી: કોલસો, લાકડું અથવા ગેસ હીટર ચાલુ હોય ત્યારે રૂમને ક્યારેય સંપૂર્ણપણે સીલ કરશો નહીં. કાર્બન મોનોક્સાઇડ જીવલેણ છે. હંમેશા વેન્ટિલેશન જાળવો.',
    kn: 'ನಿರ್ಣಾಯಕ ಎಚ್ಚರಿಕೆ: ಕಲ್ಲಿದ್ದಲು, ಮರ ಅಥವಾ ಗ್ಯಾಸ್ ಹೀಟರ್ ಉರಿಯುವಾಗ ಕೋಣೆಯನ್ನು ಎಂದಿಗೂ ಮುಚ್ಚಬೇಡಿ. ಕಾರ್ಬನ್ ಮಾನಾಕ್ಸೈಡ್ ಮಾರಕವಾಗಿದೆ. ಯಾವಾಗಲೂ ನಿರಂತರ ವಾತಾಯನವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ.',
    pa: 'ਜ਼ਰੂਰੀ ਚੇਤਾਵਨੀ: ਕੋਲਾ, ਲੱਕੜ ਜਾਂ ਗੈਸ ਹੀਟਰ ਚੱਲਣ ਸਮੇਂ ਕਮਰੇ ਨੂੰ ਕਦੇ ਵੀ ਪੂਰੀ ਤਰ੍ਹਾਂ ਬੰਦ ਨਾ ਕਰੋ। ਕਾਰਬਨ ਮੋਨੋਆਕਸਾਈਡ ਘਾਤਕ ਹੈ। ਹਮੇਸ਼ਾ ਹਵਾਦਾਰੀ ਬਣਾਈ ਰੱਖੋ।',
  };

  const disclaimerText: Record<Language, string> = {
    en: 'Saans provides environmental exposure guidance based on scientific estimates, not medical diagnosis or clinical treatment. If you experience chest pain or severe respiratory distress, seek immediate medical attention.',
    hi: 'यह सलाह केवल पर्यावरण सुरक्षा मार्गदर्शन के लिए है, चिकित्सा निदान या उपचार के लिए नहीं। स्वास्थ्य संबंधी परेशानी में योग्य चिकित्सक से संपर्क करें।',
    bn: 'এই পরামর্শ কেবল পরিবেশগত সুরক্ষার জন্য, চিকিৎসা পরামর্শ বা চিকিৎসার বিকল্প নয়। তীব্র শ্বাসকষ্টে চিকিৎসকের পরামর্শ নিন।',
    mr: 'हा सल्ला केवळ पर्यावरण सुरक्षेसाठी आहे, वैद्यकीय निदानासाठी नाही. तीव्र श्वसनाचा त्रास झाल्यास डॉक्टरांशी संपर्क साधा.',
    te: 'ఈ సలహా కేవలం పర్యావరణ రక్షణ మార్గదర్శకం మాత్రమే, వైద్య చికిత్స కాదు. శ్వాస సమస్యలు ఉంటే వెంటనే వైద్యుడిని సంప్రదించండి.',
    ta: 'இந்த வழிகாட்டல் சுற்றுச்சூழல் பாதுகாப்புக்காக மட்டுமே, மருத்துவ சிகிச்சை அல்ல. தீவிர மூச்சுத் திணறல் ஏற்பட்டால் மருத்துவரை அணுகவும்.',
    gu: 'આ માર્ગદર્શન પર્યાવરણીય સુરક્ષા માટે છે, તબીબી નિદાન માટે નથી. શ્વાસ લેવામાં તકલીફ થાય તો તાત્કાલિક ડૉક્ટરનો સંપર્ક કરો.',
    kn: 'ಈ ಮಾರ್ಗದರ್ಶನವು ಪರಿಸರ ಸುರಕ್ಷತೆಗಾಗಿ ಮಾತ್ರ, ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಯಲ್ಲ. ಉಸಿರಾಟದ ತೊಂದರೆ ಉಂಟಾದರೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
    pa: 'ਇਹ ਸਲਾਹ ਸਿਰਫ਼ ਵਾਤਾਵਰਣ ਸੁਰੱਖਿਆ ਮਾਰਗਦਰਸ਼ਨ ਲਈ ਹੈ, ਡਾਕਟਰੀ ਇਲਾਜ ਲਈ ਨਹੀਂ। ਸਾਹ ਦੀ ਤਕਲੀਫ਼ ਹੋਣ ਤੇ ਡਾਕਟਰ ਨਾਲ ਸੰਪਰਕ ਕਰੋ।',
  };

  // P3 combustion heating rule
  if (hasCombustionHeater) {
    safetyNotes.push(coWarningText[language] || coWarningText.en);
  }

  safetyNotes.push(disclaimerText[language] || disclaimerText.en);

  const citations = [
    {
      title: 'WHO Global Air Quality Guidelines (2021)',
      url: 'https://www.who.int/publications/i/item/9789240034228',
    },
    {
      title: 'Central Pollution Control Board (CPCB) Winter Smog Action Plan',
      url: 'https://cpcb.nic.in/',
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    language,
    headline,
    severityTier,
    topActions,
    timeline,
    perMember,
    safetyNotes,
    citations,
  };
}
