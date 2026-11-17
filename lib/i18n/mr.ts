/**
 * Saans Marathi (मराठी) Message Catalogue
 */

export const mr: Record<string, string> = {
  // Navigation & Shell
  'nav.today': 'आजची स्थिती',
  'nav.plan': 'नियोजन',
  'nav.what_if': 'तुलना करा',
  'nav.community': 'समुदाय',
  'nav.ask': 'विचारा',
  'header.title': 'Saans (श्वास)',
  'header.subtitle': 'हवा गुणवत्ता मार्गदर्शक',
  'header.settings': 'सेटिंग्ज आणि प्राधान्ये',
  'header.live_aqi': 'थेट AQI',

  // AQI Bands
  'aqi.good': 'चांगली (Good)',
  'aqi.moderate': 'मध्यम (Moderate)',
  'aqi.poor': 'वाईट (Poor)',
  'aqi.unhealthy': 'अस्वस्थ (Unhealthy)',
  'aqi.severe': 'गंभीर (Severe)',
  'aqi.hazardous': 'धोकादायक (Hazardous)',
  'aqi.who_target': 'WHO २४ तास मानक (15 µg/m³)',
  'aqi.current_outdoor': 'सध्याचा बाहेरील AQI',
  'aqi.estimated_indoor': 'घरातील अंदाजे हवा',
  'aqi.updated_at': '{time} वाजता अपडेट केले',
  'aqi.as_of': '{time} च्या वेळेनुसार',

  // Evidence Grades
  'evidence.grade_a': 'दर्जा अ — सिद्ध आणि उच्च दर्जाचे संशोधन',
  'evidence.grade_b': 'दर्जा ब — निरीक्षणात्मक अभ्यास किंवा मार्गदर्शक तत्त्वे',
  'evidence.grade_c': 'दर्जा क — अभियांत्रिकी अंदाज किंवा सामान्य एकमत',
  'evidence.grade_d': 'दर्जा ड — चुकीची समजूत किंवा खोटा दावा',
  'evidence.grade_a_short': 'दर्जा अ (भक्कम)',
  'evidence.grade_b_short': 'दर्जा ब (मध्यम)',
  'evidence.grade_c_short': 'दर्जा क (एकमत)',
  'evidence.grade_d_short': 'दर्जा ड (गैरसमज)',
  'evidence.badge_title': 'वैज्ञानिक पुरावा रेटिंग',

  // Dual Ledger
  'ledger.title': 'दुहेरी परिणाम ताळेबंद',
  'ledger.breathe_title': 'तुम्ही काय श्वास घेता',
  'ledger.breathe_desc': 'बाहेरील धुराच्या तुलनेत घरातील सुरक्षिततेत वाढ.',
  'ledger.give_title': 'तुमचे समाजासाठी योगदान',
  'ledger.give_desc': 'स्वच्छ प्रवास आणि सवयींमुळे टाळलेले प्रदूषण.',
  'ledger.exposure_cut': '{pct}% कमी प्रदूषण',
  'ledger.avoided_emissions': '{grams} ग्रॅम विषारी कण रोखले',
  'ledger.actions_done': 'या आठवड्यात {count} कृती पूर्ण',
  'ledger.mark_done': 'पूर्ण झाले म्हणून चिन्हांकित करा',
  'ledger.completed': 'आज पूर्ण झाले',
  'ledger.undo': 'पूर्ववत करा',

  // Windows
  'windows.title': 'खिडक्या उघडण्याची सुरक्षित वेळ',
  'windows.open_now': 'आता हवा खेळती ठेवणे सुरक्षित आहे',
  'windows.keep_closed': 'खिडक्या बंद ठेवा',
  'windows.best_window': 'सर्वोत्तम वेळ: {start} ते {end}',

  // Safety
  'safety.co_warning_title': 'कार्बन मोनॉक्साइड (CO) धोक्याचा इशारा',
  'safety.co_warning_desc': 'हिटर किंवा शेकोटी सुरू असताना खोली पूर्ण बंद करू नका.',
  'safety.medical_disclaimer_title': 'वैद्यकीय सल्ला नाही',
  'safety.medical_disclaimer_desc': 'श्वास (Saans) हे हवेचे विश्लेषण करणारे साधन आहे, डॉक्टर नाही. त्रास असल्यास त्वरित डॉक्टरांचा सल्ला घ्या.',
  'safety.call_112': 'आपत्कालीन क्रमांक ११२ वर कॉल करा',

  // Ask AI & Myths
  'ask.title': 'Saans AI हवा मार्गदर्शकाला विचारा',
  'ask.subtitle': 'विज्ञानावर आधारित उत्तरे, प्युरिफायर, मास्क आणि गैरसमजांचे खंडन.',
  'ask.placeholder': 'तुमचा प्रश्न विचारा (उदा. कापडी मास्क उपयोगी आहे का? झाडे हवा शुद्ध करतात का?)...',
  'ask.button': 'विचारा',
  'ask.suggested': 'वारंवार विचारले जाणारे प्रश्न आणि गैरसमज:',
  'ask.myth_badge': 'गैरसमज उघड',
  'ask.myth_what_evidence_says': 'विज्ञान काय सांगते:',
  'ask.myth_what_to_do': 'त्याऐवजी काय करावे (सिद्ध उपाय):',
  'ask.citations': 'वैज्ञानिक संदर्भ आणि मार्गदर्शक:',

  // Settings
  'settings.title': 'सेटिंग्ज आणि प्राधान्ये',
  'settings.language': 'भाषा (Language)',
  'settings.theme': 'थीम (Theme)',
  'settings.theme_system': 'सिस्टम डीफॉल्ट',
  'settings.theme_light': 'लाइट मोड',
  'settings.theme_dark': 'डार्क मोड',
  'settings.demo_mode': 'डेमो मोड (दिल्लीची गंभीर धुक्याची स्थिती)',
  'settings.demo_mode_desc': '४ सदस्यांचे कुटुंब आणि गंभीर प्रदूषणाचा नमुना लोड करतो.',
  'settings.reset_data': 'सर्व डेटा रीसेट करा',
  'settings.reset_confirm': 'तुम्ही सर्व जतन केलेला डेटा हटवू इच्छिता का?',
  'settings.privacy_title': 'गोपनीयता धोरण',
  'settings.privacy_desc': 'तुमची वैयक्तिक माहिती केवळ तुमच्या ब्राउझरमध्ये सुरक्षित राहते. डेटा विकला किंवा ट्रॅक केला जात नाही.',
  'settings.location_title': 'शहर आणि स्थान',
  'settings.location_change': 'शहर बदला',

  // Common
  'common.close': 'बंद करा',
  'common.cancel': 'रद्द करा',
  'common.confirm': 'पुष्टी करा',
  'common.save': 'जतन करा',
  'common.delete': 'हटवा',
  'common.loading': 'लोड होत आहे...',
};
