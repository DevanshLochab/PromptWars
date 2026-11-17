/**
 * Saans Gujarati (ગુજરાતી) Message Catalogue
 */

export const gu: Record<string, string> = {
  // Navigation & Shell
  'nav.today': 'આજનો દિવસ',
  'nav.plan': 'આયોજન',
  'nav.what_if': 'સરખામણી',
  'nav.community': 'સમુદાય',
  'nav.ask': 'પૂછો',
  'header.title': 'Saans (શ્વાસ)',
  'header.subtitle': 'હવા ગુણવત્તા સલાહકાર',
  'header.settings': 'સેટિંગ્સ અને પસંદગીઓ',
  'header.live_aqi': 'લાઈવ AQI',

  // AQI Bands
  'aqi.good': 'સારી (Good)',
  'aqi.moderate': 'મધ્યમ (Moderate)',
  'aqi.poor': 'નબળી (Poor)',
  'aqi.unhealthy': 'અસ્વસ્થ (Unhealthy)',
  'aqi.severe': 'ગંભીર (Severe)',
  'aqi.hazardous': 'જોખમી (Hazardous)',
  'aqi.who_target': 'WHO 24 કલાક લક્ષ્ય (15 µg/m³)',
  'aqi.current_outdoor': 'વર્તમાન બહારનો AQI',
  'aqi.estimated_indoor': 'ઘરની અંદરની અંદાજિત હવા',
  'aqi.updated_at': '{time} વાગ્યે અપડેટ થયું',

  // Evidence Grades
  'evidence.grade_a': 'ગ્રેડ A — વૈજ્ઞાનિક રીતે સાબિત થયેલું',
  'evidence.grade_b': 'ગ્રેડ B — અવલોકન આધારિત અભ્યાસ કે માર્ગદર્શિકા',
  'evidence.grade_c': 'ગ્રેડ C — એન્જિનિયરિંગ ગણતરી કે સામાન્ય સંમતિ',
  'evidence.grade_d': 'ગ્રેડ D — ખોટી માન્યતા કે અફવા',
  'evidence.grade_a_short': 'ગ્રેડ A (મજબૂત)',
  'evidence.grade_b_short': 'ગ્રેડ B (મધ્યમ)',
  'evidence.grade_c_short': 'ગ્રેડ C (સંમતિ)',
  'evidence.grade_d_short': 'ગ્રેડ D (માન્યતા)',

  // Ledger
  'ledger.title': 'દ્વિપક્ષીય અસર હિસાબ',
  'ledger.breathe_title': 'તમે જે શ્વાસ લો છો',
  'ledger.breathe_desc': 'બહારના પ્રદૂષણની સરખામણીએ તમારા પરિવારનું રક્ષણ.',
  'ledger.give_title': 'તમારું યોગદાન',
  'ledger.give_desc': 'સ્વચ્છ પરિવહન અને આદતો દ્વારા ટાળેલું પ્રદૂષણ.',
  'ledger.exposure_cut': '{pct}% ઓછું પ્રદૂષણ',
  'ledger.avoided_emissions': '{grams} ગ્રામ ઝેરી રજકણો ટાળ્યા',
  'ledger.actions_done': 'આ અઠવાડિયે {count} કાર્યો પૂર્ણ',
  'ledger.mark_done': 'પૂર્ણ તરીકે ચિહ્નિત કરો',
  'ledger.completed': 'આજે પૂર્ણ થયું',
  'ledger.undo': 'રદ કરો',

  // Windows
  'windows.title': 'બારીઓ ખોલવાનો સલામત સમય',
  'windows.open_now': 'હવા ઉજાસ માટે બારીઓ ખોલવી સલામત છે',
  'windows.keep_closed': 'બારીઓ બંધ રાખો',
  'windows.best_window': 'શ્રેષ્ઠ સમય: {start} થી {end}',

  // Ask AI & Myths
  'ask.title': 'Saans AI વાયુ સલાહકારને પૂછો',
  'ask.subtitle': 'વિજ્ઞાન આધારિત જવાબો, પ્યુરિફાયર, માસ્ક અને ગેરમાન્યતાઓનું સત્ય.',
  'ask.placeholder': 'તમારો પ્રશ્ન પૂછો (દા.ત. કાપડનો માસ્ક પૂરતો છે? છોડ ઘરની હવા સાફ કરે છે?)...',
  'ask.button': 'પૂછો',
  'ask.suggested': 'વારંવાર પૂછાતા પ્રશ્નો અને માન્યતાઓ:',
  'ask.myth_badge': 'માન્યતા ખોટી સાબિત',
  'ask.myth_what_evidence_says': 'વિજ્ઞાન શું કહે છે:',
  'ask.myth_what_to_do': 'તેના બદલે શું કરવું (સાબિત ઉપાયો):',
  'ask.citations': 'વૈજ્ઞાનિક સંદર્ભો અને માર્ગદર્શિકાઓ:',

  // Settings
  'settings.title': 'સેટિંગ્સ અને પસંદગીઓ',
  'settings.language': 'ભાષા (Language)',
  'settings.theme': 'થીમ (Theme)',
  'settings.theme_system': 'સિસ્ટમ ડિફૉલ્ટ',
  'settings.theme_light': 'લાઇટ મોડ',
  'settings.theme_dark': 'ડાર્ક મોડ',
  'settings.demo_mode': 'ડેમો મોડ (દિલ્હીનું ગંભીર ધુમ્મસ)',
  'settings.demo_mode_desc': 'પરીક્ષણ માટે 4 સભ્યોનો પરિવાર અને ગંભીર પ્રદૂષણનો નમૂનો દર્શાવે છે.',
  'settings.reset_data': 'તમામ ડેટા રીસેટ કરો',
  'settings.reset_confirm': 'શું તમે સાચવેલો તમામ ડેટા ભૂંસી નાખવા માંગો છો?',
  'settings.privacy_title': 'ગોપનીયતા નીતિ',
  'settings.privacy_desc': 'તમારી તમામ માહિતી ફક્ત તમારા બ્રાઉઝરમાં સુરક્ષિત રહે છે. કોઈ ડેટા વેચવામાં કે ટ્રેક કરવામાં આવતો નથી.',
  'settings.location_title': 'શહેર અને સ્થાન',
  'settings.location_change': 'શહેર બદલો',

  // Common
  'common.close': 'બંધ કરો',
  'common.cancel': 'રદ કરો',
  'common.confirm': 'ખાતરી કરો',
  'common.save': 'સાચવો',
  'common.delete': 'કાઢી નાખો',
  'common.loading': 'લોડ થઈ રહ્યું છે...',
};
