/**
 * Saans Tamil (தமிழ்) Message Catalogue
 */

export const ta: Record<string, string> = {
  // Navigation & Shell
  'nav.today': 'இன்று',
  'nav.plan': 'திட்டம்',
  'nav.what_if': 'ஒப்பீடு',
  'nav.community': 'சமூகம்',
  'nav.ask': 'கேளுங்கள்',
  'header.title': 'Saans (மூச்சு)',
  'header.subtitle': 'காற்று தர வழிகாட்டி',
  'header.settings': 'அமைப்புகள் & விருப்பங்கள்',
  'header.live_aqi': 'நேரலை AQI',

  // AQI Bands
  'aqi.good': 'நல்லது (Good)',
  'aqi.moderate': 'மிதமானது (Moderate)',
  'aqi.poor': 'மோசமானது (Poor)',
  'aqi.unhealthy': 'ஆரோக்கியமற்றது (Unhealthy)',
  'aqi.severe': 'கடுமையானது (Severe)',
  'aqi.hazardous': 'ஆபத்தானது (Hazardous)',
  'aqi.who_target': 'WHO 24 மணி நேர இலக்கு (15 µg/m³)',
  'aqi.current_outdoor': 'தற்போதைய வெளிப்புற AQI',
  'aqi.estimated_indoor': 'வீட்டுக்குள் மதிப்பிடப்பட்ட காற்று',
  'aqi.updated_at': '{time} மணிக்கு புதுப்பிக்கப்பட்டது',

  // Evidence Grades
  'evidence.grade_a': 'கிரேடு A — அறிவியல் ரீதியாக நிரூபிக்கப்பட்டது',
  'evidence.grade_b': 'கிரேடு B — அவதானிப்பு ஆய்வு அல்லது வழிகாட்டுதல்கள்',
  'evidence.grade_c': 'கிரேடு C — பொறியியல் மதிப்பீடு',
  'evidence.grade_d': 'கிரேடு D — ஆதாரமற்ற தவறான கருத்து அல்லது வதந்தி',
  'evidence.grade_a_short': 'கிரேடு A (வலுவானது)',
  'evidence.grade_b_short': 'கிரேடு B (மிதமானது)',
  'evidence.grade_c_short': 'கிரேடு C (ஒருமித்த கருத்து)',
  'evidence.grade_d_short': 'கிரேடு D (வதந்தி)',

  // Ledger
  'ledger.title': 'இரட்டை தாக்கக் கணக்கு',
  'ledger.breathe_title': 'நீங்கள் சுவாசிப்பது',
  'ledger.breathe_desc': 'வெளிப்புற மாசுபாட்டுடன் ஒப்பிடும்போது உங்கள் குடும்பப் பாதுகாப்பு.',
  'ledger.give_title': 'சமூகத்திற்கான உங்கள் பங்களிப்பு',
  'ledger.give_desc': 'சுத்தமான போக்குவரத்து மற்றும் நல்ல பழக்கவழக்கங்கள் மூலம் தவிர்க்கப்பட்ட புகை.',
  'ledger.exposure_cut': '{pct}% குறைக்கப்பட்ட மாசு',
  'ledger.avoided_emissions': '{grams} கிராம் நச்சுத் துகள்கள் தவிர்க்கப்பட்டன',
  'ledger.actions_done': 'இந்த வாரம் {count} செயல்கள் முடிக்கப்பட்டன',
  'ledger.mark_done': 'முடிந்தது எனக் குறிக்கவும்',
  'ledger.completed': 'இன்று முடிந்தது',
  'ledger.undo': 'மீட்டமை',

  // Windows
  'windows.title': 'ஜன்னல்களைத் திறக்க பாதுகாப்பான நேரம்',
  'windows.open_now': 'இப்போது காற்று வர திறந்து வைக்கலாம்',
  'windows.keep_closed': 'ஜன்னல்களை மூடி வைக்கவும்',
  'windows.best_window': 'சிறந்த நேரம்: {start} முதல் {end} வரை',

  // Ask AI & Myths
  'ask.title': 'Saans AI காற்று வழிகாட்டியிடம் கேளுங்கள்',
  'ask.subtitle': 'அறிவியல் அடிப்படையிலான பதில்கள், முகக்கவசங்கள், பியூரிஃபையர்கள் மற்றும் வதந்திகள் குறித்த உண்மை.',
  'ask.placeholder': 'உங்கள் கேள்வியைக் கேளுங்கள் (எ.கா: துணி மாஸ்க் போதுமா? செடிகள் காற்றைச் சுத்தப்படுத்துமா?)...',
  'ask.button': 'கேளுங்கள்',
  'ask.suggested': 'அடிக்கடி கேட்கப்படும் கேள்விகள் & வதந்திகள்:',
  'ask.myth_badge': 'வதந்தி முறியடிக்கப்பட்டது',
  'ask.myth_what_evidence_says': 'அறிவியல் கூறுவது என்ன:',
  'ask.myth_what_to_do': 'அதற்குப் பதிலாக என்ன செய்ய வேண்டும் (நிரூபிக்கப்பட்ட வழிகள்):',
  'ask.citations': 'அறிவியல் சான்றுகள் & வழிகாட்டுதல்கள்:',

  // Settings
  'settings.title': 'அமைப்புகள் & விருப்பங்கள்',
  'settings.language': 'மொழி (Language)',
  'settings.theme': 'தோற்றம் / தீம் (Theme)',
  'settings.theme_system': 'இயல்புநிலை (System)',
  'settings.theme_light': 'வெளிச்சப் பயன்முறை (Light)',
  'settings.theme_dark': 'இருண்ட பயன்முறை (Dark)',
  'settings.demo_mode': 'டெமோ பயன்முறை (டெல்லி கடுமையான காற்று மாசுபாடு)',
  'settings.demo_mode_desc': 'சோதனைக்காக 4 பேர் கொண்ட குடும்பம் மற்றும் கடுமையான புகைமூட்ட மாதிரியைக் காட்டுகிறது.',
  'settings.reset_data': 'அனைத்து தரவுகளையும் மீட்டமை',
  'settings.reset_confirm': 'சேமிக்கப்பட்ட அனைத்து தரவுகளையும் நீக்க விரும்புகிறீர்களா?',
  'settings.privacy_title': 'தனியுரிமைக் கொள்கை',
  'settings.privacy_desc': 'உங்கள் தனிப்பட்ட தகவல்கள் உங்கள் உலாவியில் மட்டுமே பாதுகாப்பாக இருக்கும். தரவு எதுவும் பகிரப்படவோ விற்கப்படவோ மாட்டாது.',
  'settings.location_title': 'நகரம் & இருப்பிடம்',
  'settings.location_change': 'நகரத்தை மாற்றவும்',

  // Common
  'common.close': 'மூடு',
  'common.cancel': 'ரத்துசெய்',
  'common.confirm': 'உறுதிசெய்',
  'common.save': 'சேமி',
  'common.delete': 'நீக்கு',
  'common.loading': 'ஏற்றுகிறது...',
};
