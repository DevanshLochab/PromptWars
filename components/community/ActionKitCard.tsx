'use client';

import React, { useState } from 'react';
import { ActionKit } from '@/lib/store/communityStore';
import { useTranslation } from '@/lib/i18n';
import { Copy, Share2, Check, Lightbulb, BarChart3, Building2, MessageSquare, School } from 'lucide-react';

interface ActionKitCardProps {
  kit: ActionKit;
  language?: 'en' | 'hi';
}

// Hindi translations and advisories for action kits
const HINDI_KIT_DATA: Record<
  string,
  {
    title: string;
    description: string;
    buildingNotice: string;
    schoolNotice?: string;
    whatsAppMessage: string;
  }
> = {
  waste_burning: {
    title: 'सूखे पत्ते व बागवानी अपशिष्ट कम्पोस्टिंग अभियान',
    description:
      'सूखे पत्ते और कचरा जलाने से अत्यधिक जहरीला धुआं और PM2.5 सीधे सांस लेने के स्तर पर फैलता है। कम्पोस्टिंग से कॉलोनी के पार्कों को मुफ्त जैविक खाद मिलती है।',
    buildingNotice: `सामुदायिक सूचना: बागवानी अपशिष्ट एवं पत्ता दहन निषेध

प्रिय निवासी एवं मेंटेनेंस टीम,

सर्दियों में दिल्ली-एनसीआर में बढ़ते वायु प्रदूषण (AQI) को देखते हुए सभी निवासियों, मालियों व कर्मचारियों से विनम्र अनुरोध है कि सूखे पत्ते, घास व कचरा खुले में न जलाएं। यह राष्ट्रीय हरित अधिकरण (NGT) के आदेशों का उल्लंघन है और बच्चों व बुजुर्गों के स्वास्थ्य के लिए अत्यंत घातक है।

सोसाइटी स्तर पर किए गए उपाय:
1. कृपया सभी सूखे पत्तों को पार्क 2 के पीछे बने कम्पोस्टिंग पिट में जमा करें।
2. आरडब्ल्यूए ने नगर निगम के ग्रीन-वेस्ट वाहन का साप्ताहिक प्रबंध किया है।
3. मालियों को पत्ते बारीक करने के लिए श्रेडर उपलब्ध कराए गए हैं।

हवा को स्वच्छ और सांस लेने योग्य बनाए रखने में सहयोग करें।

— आरडब्ल्यूए पर्यावरण समिति`,
    whatsAppMessage: `🍂 *स्वच्छ हवा परामर्श: कृपया सूखे पत्ते न जलाएं* 🍂

प्रिय पड़ोसियों,
एक्यूआई खतरनाक स्तर पर है। कृपया सुनिश्चित करें कि हमारी सोसाइटी में कोई भी सूखा पत्ता या कचरा न जलाए। पत्तों का धुआं फेफड़ों के लिए अत्यंत हानिकारक है।

✅ *हम क्या कर रहे हैं:*
• गेट 2 के पास बने खाद गड्ढे में सूखे पत्ते डालें
• पेड़ों के चारों ओर मिट्टी में नमी बनाए रखने हेतु उपयोग करें
• ग्रीन-वेस्ट उठवाने हेतु आरडब्ल्यूए ऑफिस (एक्सटेंशन 104) से संपर्क करें

आइए मिलकर अपने बच्चों व बुजुर्गों की सांसों की रक्षा करें! 🙏🍃`,
  },
  bonfires: {
    title: 'सुरक्षा गार्डों के लिए गर्माहट एवं इलेक्ट्रिक हीटर पहल',
    description:
      'कड़ाके की 4°C ठंड में सुरक्षा गार्ड प्लास्टिक व लकड़ी का कचरा जलाते हैं। उन्हें इलेक्ट्रिक हीटर व गर्म कपड़े उपलब्ध कराने से जहरीला धुआं बंद होता है और गार्ड सुरक्षित रहते हैं।',
    buildingNotice: `आरडब्ल्यूए संकल्प: सुरक्षा गार्डों के लिए धुआं-मुक्त गर्माहट व्यवस्था

प्रिय निवासी,

सर्दियों की रातों में सुरक्षा गार्डों द्वारा जलाए जाने वाले कचरे व प्लास्टिक के अलाव से गेट और आसपास के घरों में भारी जहरीला धुआं फैलता है।

स्वच्छ एवं मानवीय समाधान हेतु प्रबंधन समिति ने स्वीकृत किया है:
1. सभी सुरक्षा गार्ड बूथों में 2-2 इलेक्ट्रिक रेडिएंट हीटर लगाए गए हैं।
2. सभी 12 सुरक्षाकर्मियों को भारी थर्मल विंटर जैकेट व कंबल दिए गए हैं।
3. गेट 1 और 2 पर गर्म पानी व चाय की व्यवस्था की गई है।

कृपया किसी भी खुले अलाव की सूचना तुरंत आरडब्ल्यूए ऑफिस को दें।

— प्रबंधन समिति एवं सुरक्षा उप-समिति`,
    whatsAppMessage: `🧤 *सुरक्षा गार्डों के लिए गर्माहट — शून्य धुआं अभियान* 🧤

प्रिय समाज सदस्य,
कड़ाके की ठंड में गार्ड प्लास्टिक व लकड़ी का अलाव जलाते हैं जिससे जहरीला धुआं सोसाइटी में फैलता है।

आरडब्ल्यूए ने स्वच्छ समाधान किया है:
⚡ गार्ड केबिन में इलेक्ट्रिक हीटर
🧥 12 विंडप्रूफ भारी थर्मल जैकेट
☕ रात की ड्यूटी हेतु गर्म पानी व चाय की केतली

धुआं-मुक्त सोसाइटी बनाने में अपना सहयोग दें! 💙`,
  },
  school_idling: {
    title: 'स्कूल गेट "इंजन बंद रखें" स्वच्छ वायु क्षेत्र',
    description:
      'स्कूल की छुट्टी के समय दर्जनों कारें व वैन 20-40 मिनट इंजन चालू रखती हैं। जहरीला धुआं ठीक छोटे बच्चों के सांस लेने की ऊंचाई पर जमा होता है।',
    buildingNotice: `अभिभावकों व चालकों हेतु परामर्श: स्कूल गेट पर स्वच्छ हवा क्षेत्र

प्रिय अभिभावक एवं वैन चालक,

दोपहर 1:30 से 2:30 के बीच छुट्टी के समय दर्जनों वाहन इंजन चालू रखते हैं। बच्चे ठीक साइलेंसर की ऊंचाई पर सांस लेते हैं जहां नाइट्रोजन डाइऑक्साइड व जहरीले कण 5 गुना अधिक होते हैं।

कृपया सहयोग करें:
1. इंतजार करते समय वाहन का इग्निशन बंद रखें।
2. 10 सेकंड से अधिक आइडलिंग करने पर इंजन बंद करना अधिक ईंधन बचाता है।
3. बच्चों को स्वच्छ हवा में सांस लेने का अधिकार दें।

— पीटीए एवं पर्यावरण परिषद`,
    schoolNotice: `परिपत्र: स्कूल परिसर के आसपास नो-आइडलिंग नीति

समस्त अभिभावक एवं वाहन चालक,
विषय: पिकअप के दौरान अनिवार्य 'इंजन बंद' नियम।

बच्चों के फेफड़े प्रदूषण के प्रति अत्यधिक संवेदनशील हैं। पार्किंग में खड़े होते ही कृपया इंजन बंद रखें। सहयोग के लिए धन्यवाद।`,
    whatsAppMessage: `🛑 *स्कूल गेट स्वच्छ हवा अपील: इंजन बंद रखें* 🛑

प्रिय अभिभावक,
स्कूल की छुट्टी पर खड़ी गाड़ियां चालू रखने से बच्चों के सांस लेने के स्तर पर जहरीला धुआं जमा होता है।

*सरल आदत बदलें:*
🔑 रुकते ही इग्निशन बंद करें
⏱️ 10 सेकंड से अधिक गाड़ी चालू रखना ईंधन बर्बाद करता है
🫁 नन्हे फेफड़ों को जहरीले धुएं से बचाएं

कृपया अपने कारपूल और ड्राइवर ग्रुप में साझा करें! 🚸❤️`,
  },
  construction_dust: {
    title: 'निर्माण एवं नवीनीकरण धूल नियंत्रण प्रोटोकॉल',
    description:
      'रेत के ढेर व मलबे की धूल हवा से आसपास की बालकनियों और घरों में फैलती है। ग्रीन नेट और पानी के छिड़काव से 70% तक धूल रुकती है।',
    buildingNotice: `अनिवार्य धूल नियंत्रण दिशा-निर्देश: गृह नवीनीकरण एवं मरम्मत

ध्यान दें: फ्लैट मालिक, ठेकेदार एवं मेंटेनेंस सुपरवाइजर,

ग्रेडेड रिस्पांस एक्शन प्लान (GRAP) के तहत निर्माण धूल नियंत्रण अनिवार्य है:
1. बालकनी व कार्यक्षेत्र को 80% डेंसिटी ग्रीन नेट से पूरी तरह ढकें।
2. रेत और मलबे को हमेशा तिरपाल से ढक कर रखें।
3. झाड़ू लगाने या मलबा उठाने से पहले पानी का हल्का छिड़काव करें।
4. मलबा ले जाने वाले वाहनों को ढका रखें।

— आरडब्ल्यूए इंजीनियरिंग शाखा`,
    whatsAppMessage: `🏗️ *मकान मरम्मत एवं धूल नियंत्रण परामर्श* 🏗️

प्रिय निवासी एवं ठेकेदार बंधु,
सर्दियों में धूल प्रदूषण रोकने हेतु 3 नियम अपनाएं:
1. रेत, सीमेंट व मलबे को तिरपाल से ढकें।
2. मलबा उठाने से पहले पानी का छिड़काव करें।
3. बालकनी पर ग्रीन सेफ्टी नेट लगाएं।

स्वच्छ व धूल-मुक्त परिसर बनाने में सहयोग दें! 🏢✨`,
  },
  stubble_burning: {
    title: 'पराली के धुएं से बचाव हेतु एयरशेड परामर्श',
    description:
      'कृषि अवशेष (पराली) जलने से भारी जहरीला धुआं शहर में प्रवेश करता है। सामूहिक रूप से दरवाजे-खिड़कियां सील करने और प्यूरीफायर चलाने से स्वास्थ्य की रक्षा होती है।',
    buildingNotice: `आरडब्ल्यूए स्वास्थ्य परामर्श: मौसमी पराली धुआं व स्मॉग चेतावनी

प्रिय निवासी,

मौसम पूर्वानुमान के अनुसार आगामी 48 घंटों में भारी पराली का धुआं शहर में प्रवेश कर रहा है जिससे एक्यूआई गंभीर श्रेणी में रहेगा।

बचाव उपाय:
1. खिड़कियां और बालकनी के दरवाजे अच्छी तरह बंद रखें।
2. बेडरूम में सोने से पहले एयर प्यूरीफायर चलाएं।
3. सुबह व शाम खुली हवा में सैर से बचें।
4. बाहर निकलते समय N95 मास्क अवश्य लगाएं।

— आरडब्ल्यूए पर्यावरण व स्वास्थ्य सेल`,
    whatsAppMessage: `🌾 *वायु गुणवत्ता चेतावनी: पराली का धुआं* 🌾

प्रिय पड़ोसियों,
आसपास के क्षेत्रों से पराली का धुआं आने के कारण एक्यूआई गंभीर स्तर पर पहुंच गया है।

🛡️ *सावधानी बरतें:*
• बालकनी व खिड़कियां पूरी तरह बंद रखें
• बेडरूम में एयर प्यूरीफायर चलाएं
• बुजुर्ग एवं बच्चे घर के अंदर रहें
• बाहर निकलते समय N95 मास्क अवश्य पहनें

अपना ध्यान रखें! 💨🏠`,
  },
};

export function ActionKitCard({ kit }: ActionKitCardProps) {
  const { t } = useTranslation();
  const [activeNoticeTab, setActiveNoticeTab] = useState<'rwa' | 'school' | 'whatsapp'>('whatsapp');
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [copied, setCopied] = useState(false);

  const hiData = HINDI_KIT_DATA[kit.issue] || HINDI_KIT_DATA.waste_burning;

  const currentTitle = lang === 'hi' ? hiData.title : kit.title;
  const currentDesc = lang === 'hi' ? hiData.description : kit.description;

  const getNoticeText = () => {
    if (lang === 'hi') {
      if (activeNoticeTab === 'rwa') return hiData.buildingNotice;
      if (activeNoticeTab === 'school') return hiData.schoolNotice || hiData.buildingNotice;
      return hiData.whatsAppMessage;
    }

    if (activeNoticeTab === 'rwa') return kit.buildingNotice;
    if (activeNoticeTab === 'school') return kit.schoolNotice || kit.buildingNotice;
    return kit.whatsAppMessage;
  };

  const copyToClipboard = async () => {
    const text = getNoticeText();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareToWhatsApp = () => {
    const text = getNoticeText();
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/?text=${encoded}`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-4 transition-all">
      {/* Title & Language Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--primary)]">
              {kit.issueLabel}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Cooperative Solution
            </span>
          </div>
          <h3 className="text-base font-bold text-[var(--text)]">
            {currentTitle}
          </h3>
        </div>

        {/* Language Toggle: EN / HI */}
        <div className="inline-flex items-center rounded-full p-1 bg-[var(--surface-2)] border border-[var(--border)] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              lang === 'en'
                ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang('hi')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              lang === 'hi'
                ? 'bg-[var(--primary)] text-[var(--on-primary)] shadow-xs'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            HI (हिंदी)
          </button>
        </div>
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed">
        {currentDesc}
      </p>

      {/* Practical Alternatives */}
      <div className="rounded-xl bg-[var(--surface-2)] p-3.5 space-y-2 border border-[var(--border)]">
        <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>{t('actionkit.alternatives')}</span>
        </div>
        <ul className="text-xs text-[var(--muted)] space-y-1.5 pl-4 list-disc marker:text-[var(--primary)]">
          {kit.practicalAlternatives.map((alt, idx) => (
            <li key={idx} className="leading-normal">{alt}</li>
          ))}
        </ul>
      </div>

      {/* What Changes Stats */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] text-xs border border-[var(--primary)]/20">
        <BarChart3 className="w-4 h-4 shrink-0" />
        <div>
          <span className="font-bold">{t('actionkit.what_changes')} </span>
          <span>{kit.whatChangesStats}</span>
        </div>
      </div>

      {/* Notice Switcher & Generator */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center gap-1.5 p-1 bg-[var(--surface-2)] rounded-xl text-xs font-medium border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setActiveNoticeTab('whatsapp')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
              activeNoticeTab === 'whatsapp'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Message</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveNoticeTab('rwa')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
              activeNoticeTab === 'rwa'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>RWA Notice</span>
          </button>

          {kit.schoolNotice && (
            <button
              type="button"
              onClick={() => setActiveNoticeTab('school')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all ${
                activeNoticeTab === 'school'
                  ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>School Circular</span>
            </button>
          )}
        </div>

        {/* Notice Preview Box */}
        <div className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-4 font-sans text-xs text-[var(--text)]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)] text-[11px] text-[var(--muted)]">
            <span className="font-semibold uppercase tracking-wider">
              {activeNoticeTab === 'whatsapp'
                ? 'WhatsApp Broadcast Draft'
                : activeNoticeTab === 'school'
                ? 'Official School Circular'
                : 'Society Notice Board Draft'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              {lang.toUpperCase()}
            </span>
          </div>

          <pre className="whitespace-pre-wrap font-sans text-[12px] leading-relaxed max-h-56 overflow-y-auto pr-1">
            {getNoticeText()}
          </pre>
        </div>

        {/* Two Required Buttons: "Copy text" (Copy icon) + "WhatsApp" (Share2 icon) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={copyToClipboard}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border shadow-xs ${
              copied
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied text!' : 'Copy text'}</span>
          </button>

          <button
            type="button"
            onClick={shareToWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
