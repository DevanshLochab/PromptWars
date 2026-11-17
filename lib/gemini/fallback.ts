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
  const templates = isHindi ? HI_ACTION_TEMPLATES : EN_ACTION_TEMPLATES;

  // Determine severity tier based on peak AQI / PM2.5
  const peakPm25 = Math.max(...airData.map((h) => h.pm25));
  let severityTier = 'Moderate';
  if (peakPm25 > 350) severityTier = 'Severe Smog Emergency';
  else if (peakPm25 > 250) severityTier = 'Very Poor Air';
  else if (peakPm25 > 150) severityTier = 'Poor Air Quality';

  // Headline
  const headline = isHindi
    ? 'AI वैयक्तिकरण अनुपलब्ध — इंजन-गणना की गई व्यावहारिक सिफारिशें'
    : 'AI personalization unavailable — showing engine-computed recommendations.';

  // Top actions
  const topActions: PlanTopAction[] = topRanked.map((item, idx) => {
    const defaultTemplate = templates[item.action.id] || {
      why: item.why || (isHindi ? 'कमरे की हवा साफ रखें।' : 'Reduces fine particle exposure.'),
      how:
        item.action.steps?.[0] ||
        (isHindi ? 'दिशानिर्देशों का पालन करें।' : 'Follow recommended guideline steps.'),
      when: isHindi ? 'दिन के दौरान' : 'Throughout the day',
      forWhom: item.action.whoBenefits || (isHindi ? 'सभी सदस्य' : 'Household members'),
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

    let advice = isHindi
      ? 'खिड़कियां बंद रखें और इनडोर प्यूरीफायर चालू रखें।'
      : 'Keep windows shut and run indoor purification.';

    const tags: string[] = [];

    if (hasCombustionHeater) {
      advice = isHindi
        ? 'सावधानी: हीटर जलते समय खिड़की थोड़ी खुली रखें।'
        : 'Safety: Keep window cracked while combustion heater is active.';
      tags.push(isHindi ? 'सीओ सुरक्षा' : 'CO Safety');
    } else if (isVentHour) {
      advice = isHindi
        ? 'संक्षिप्त वेंटिलेशन के लिए सबसे अनुकूल समय।'
        : 'Best window for brief cross-ventilation.';
      tags.push(isHindi ? 'वेंटिलेशन' : 'Ventilation');
    } else if (hourIndex >= 7 && hourIndex <= 10) {
      advice = isHindi
        ? 'सुबह का पीक स्मॉग: बाहरी गतिविधियां टालें।'
        : 'Morning peak smog: avoid intense outdoor exertion.';
      tags.push(isHindi ? 'पीक स्मॉग' : 'Peak Smog');
    } else if (hourIndex >= 21 || hourIndex <= 6) {
      advice = isHindi
        ? 'सोने के कमरे में प्यूरीफायर स्लीप मोड पर चलाएं।'
        : 'Run bedroom purifier on quiet mode during sleep.';
      tags.push(isHindi ? 'रात्रि विश्राम' : 'Night Sleep');
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

  // P3 combustion heating rule
  if (hasCombustionHeater) {
    safetyNotes.push(
      isHindi
        ? 'अत्यंत जरूरी चेतावनी: कोयला, लकड़ी या गैस हीटर जलते समय कमरे को कभी भी पूरी तरह सील न करें। कार्बन मोनोऑक्साइड एक मूक घातक गैस है। हमेशा पर्याप्त वेंटिलेशन बनाए रखें।'
        : 'CRITICAL CARBON MONOXIDE WARNING: Never seal the room while operating combustion heating (coal, charcoal, wood, or gas). Fuel-burning heaters produce lethal, odorless carbon monoxide. Maintain continuous ventilation and install a certified CO alarm.'
    );
  }

  safetyNotes.push(
    isHindi
      ? 'यह सलाह केवल पर्यावरण सुरक्षा मार्गदर्शन के लिए है, चिकित्सा निदान या उपचार के लिए नहीं। स्वास्थ्य संबंधी परेशानी में योग्य चिकित्सक से संपर्क करें।'
      : 'Saans provides environmental exposure guidance based on scientific estimates, not medical diagnosis or clinical treatment. If you experience chest pain or severe respiratory distress, seek immediate medical attention.'
  );

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
