/**
 * Saans Telugu (తెలుగు) Message Catalogue
 */

export const te: Record<string, string> = {
  // Navigation & Shell
  'nav.today': 'ఈ రోజు',
  'nav.plan': 'ప్రణాళిక',
  'nav.what_if': 'పోలిక',
  'nav.community': 'కమ్యూనిటీ',
  'nav.ask': 'అడగండి',
  'header.title': 'Saans (శ్వాస)',
  'header.subtitle': 'ఎయిర్ క్వాలిటీ కోచ్',
  'header.settings': 'సెట్టింగ్‌లు & ప్రాధాన్యతలు',
  'header.live_aqi': 'లైవ్ AQI',

  // AQI Bands
  'aqi.good': 'మంచిది (Good)',
  'aqi.moderate': 'మధ్యస్థం (Moderate)',
  'aqi.poor': 'పేలవం (Poor)',
  'aqi.unhealthy': 'అనారోగ్యకరం (Unhealthy)',
  'aqi.severe': 'తీవ్రమైనది (Severe)',
  'aqi.hazardous': 'ప్రమాదకరం (Hazardous)',
  'aqi.who_target': 'WHO 24 గంటల లక్ష్యం (15 µg/m³)',
  'aqi.current_outdoor': 'ప్రస్తుత బయటి AQI',
  'aqi.estimated_indoor': 'ఇంటి లోపలి అంచనా గాలి',
  'aqi.updated_at': '{time} కి అప్‌డేట్ చేయబడింది',

  // Evidence Grades
  'evidence.grade_a': 'గ్రేడ్ A — శాస్త్రీయంగా నిరూపించబడింది',
  'evidence.grade_b': 'గ్రేడ్ B — పరిశీలనాత్మక అధ్యయనం లేదా మార్గదర్శకాలు',
  'evidence.grade_c': 'గ్రేడ్ C — ఇంజనీరింగ్ అంచనా',
  'evidence.grade_d': 'గ్రేడ్ D — నిరాధారమైన అపోహ లేదా ప్రకటన',
  'evidence.grade_a_short': 'గ్రేడ్ A (బలమైనది)',
  'evidence.grade_b_short': 'గ్రేడ్ B (మధ్యస్థం)',
  'evidence.grade_c_short': 'గ్రేడ్ C (ఏకాభిప్రాయం)',
  'evidence.grade_d_short': 'గ్రేడ్ D (అపోహ)',

  // Ledger
  'ledger.title': 'ద్విముఖ ప్రభావ నివేదిక',
  'ledger.breathe_title': 'మీరు పీల్చే గాలి',
  'ledger.breathe_desc': 'బయటి కాలుష్యంతో పోలిస్తే మీ కుటుంబానికి రక్షణ.',
  'ledger.give_title': 'మీరు అందించే తోడ్పాటు',
  'ledger.give_desc': 'స్వచ్ఛమైన రవాణా మరియు అలవాట్ల ద్వారా తగ్గిన కాలుష్యం.',
  'ledger.exposure_cut': '{pct}% తక్కువ కాలుష్యం',
  'ledger.avoided_emissions': '{grams} గ్రాముల విషపూరిత కణాలు నివారించబడ్డాయి',
  'ledger.actions_done': 'ఈ వారం {count} పనులు పూర్తయ్యాయి',
  'ledger.mark_done': 'పూర్తయినట్లు గుర్తించండి',
  'ledger.completed': 'ఈ రోజు పూర్తయింది',
  'ledger.undo': 'రద్దు చేయండి',

  // Windows
  'windows.title': 'కిటికీలు తెరవడానికి సురక్షిత సమయం',
  'windows.open_now': 'ఇప్పుడు గాలి ప్రసరణకు సురక్షితం',
  'windows.keep_closed': 'కిటికీలను మూసి ఉంచండి',
  'windows.best_window': 'ఉత్తమ సమయం: {start} నుండి {end}',

  // Ask AI & Myths
  'ask.title': 'Saans AI గాలి కోచ్‌ని అడగండి',
  'ask.subtitle': 'సైన్స్ ఆధారిత సమాధానాలు, మాస్క్‌లు, ప్యూరిఫైయర్‌లు మరియు అపోహల నిజాలు.',
  'ask.placeholder': 'మీ ప్రశ్న అడగండి (ఉదా: గుడ్డ మాస్క్ సరిపోతుందా? మొక్కలు గాలిని శుభ్రపరుస్తాయా?)...',
  'ask.button': 'అడగండి',
  'ask.suggested': 'తరచుగా అడిగే ప్రశ్నలు & అపోహల పరిశీలన:',
  'ask.myth_badge': 'అపోహ తొలగించబడింది',
  'ask.myth_what_evidence_says': 'సైన్స్ ఏం చెబుతోంది:',
  'ask.myth_what_to_do': 'దానికి బదులుగా ఏమి చేయాలి (నిరూపిత చర్యలు):',
  'ask.citations': 'శాస్త్రీయ ఆధారాలు & మార్గదర్శకాలు:',

  // Settings
  'settings.title': 'సెట్టింగ్‌లు & ప్రాధాన్యతలు',
  'settings.language': 'భాష (Language)',
  'settings.theme': 'థీమ్ (Theme)',
  'settings.theme_system': 'సిస్టమ్ డిఫాల్ట్',
  'settings.theme_light': 'లైట్ మోడ్',
  'settings.theme_dark': 'డార్క్ మోడ్',
  'settings.demo_mode': 'డెమో మోడ్ (ఢిల్లీ తీవ్ర పొగమంచు)',
  'settings.demo_mode_desc': 'పరీక్ష కోసం 4 సభ్యుల కుటుంబం మరియు తీవ్ర పొగమంచు డేటాను లోడ్ చేస్తుంది.',
  'settings.reset_data': 'మొత్తం డేటాను రీసెట్ చేయండి',
  'settings.reset_confirm': 'మీరు సేవ్ చేసిన మొత్తం డేటాను తొలగించాలనుకుంటున్నారా?',
  'settings.privacy_title': 'గోప్యతా విధానం',
  'settings.privacy_desc': 'మీ వ్యక్తిగత సమాచారం మీ బ్రౌజర్‌లో మాత్రమే భద్రంగా ఉంటుంది. సమాచారం ఎవరికీ విక్రయించబడదు.',
  'settings.location_title': 'నగరం & స్థానం',
  'settings.location_change': 'నగరాన్ని మార్చండి',

  // Common
  'common.close': 'మూసివేయి',
  'common.cancel': 'రద్దు చేయి',
  'common.confirm': 'నిర్ధారించు',
  'common.save': 'సేవ్ చేయి',
  'common.delete': 'తొలగించు',
  'common.loading': 'లోడ్ అవుతోంది...',
};
