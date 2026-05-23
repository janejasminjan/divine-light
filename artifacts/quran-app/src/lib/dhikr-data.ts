/* ──────────────────────────────────────────────────────────────────
   Dhikr & Dua content library
   All text is sourced from authenticated hadith collections (Bukhari,
   Muslim, Abu Dawud, Tirmidhi) and the Quran.  Aurad Fathiya sections
   that could not be extracted from the scanned PDF are flagged with
   flagged:true so they can be filled in from the printed source.
   ────────────────────────────────────────────────────────────────── */

export interface DhikrEntry {
  id: string;
  arabic: string;
  transliteration?: string;
  translation: string;
  count: number;
  source?: string;
  isQuran?: boolean;
  flagged?: boolean;
  flagNote?: string;
}

export interface DhikrSection {
  id: string;
  title: string;
  arabicTitle?: string;
  description?: string;
  entries: DhikrEntry[];
}

export interface DhikrCollection {
  id: string;
  title: string;
  arabicTitle: string;
  subtitle: string;
  description: string;
  icon: string;
  sections: DhikrSection[];
  /** If set, the reader renders an embedded PDF viewer instead of cards */
  pdfPath?: string;
}

/* ══════════════════════════════════════════════════════════════════
   AURAD FATHIYA  — Wird al-Lazim (Tijaniyya daily litany)
   Displayed as the original authenticated PDF booklet.
   ══════════════════════════════════════════════════════════════════ */
const auradFathiya: DhikrCollection = {
  id: "aurad-fathiya",
  title: "Aurad Fathiya",
  arabicTitle: "الأوراد الفاتحية",
  subtitle: "Wird al-Lazim · الورد اليومي",
  description:
    "The daily litany (Wird al-Lazim) recited morning and evening by the Tijaniyya order. The three core pillars — Istighfar, Salat al-Fatiha, and La ilaha illallah — are each recited 100 times. Read the original authenticated booklet below.",
  icon: "🕌",
  pdfPath: "/aurad-fathiya.pdf",
  sections: [],
};

/* ══════════════════════════════════════════════════════════════════
   MORNING ADHKAR — أذكار الصباح
   Sources: Hisnul Muslim, Bukhari, Muslim, Abu Dawud, Tirmidhi
   ══════════════════════════════════════════════════════════════════ */
const morningAdhkar: DhikrCollection = {
  id: "morning-adhkar",
  title: "Morning Adhkar",
  arabicTitle: "أذكار الصباح",
  subtitle: "After Fajr prayer",
  description:
    "Authenticated morning supplications from the Quran and Sunnah, compiled from Hisnul Muslim and primary hadith sources.",
  icon: "🌅",
  sections: [
    {
      id: "ma-opening",
      title: "Opening",
      arabicTitle: "البداية",
      entries: [
        {
          id: "ma-bismillah",
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          transliteration: "Bismillāhi ar-Raḥmāni ar-Raḥīm",
          translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 1:1 — Begin every action with Bismillah",
        },
        {
          id: "ma-fatiha",
          arabic:
            "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
          transliteration:
            "Al-ḥamdu lillāhi rabbil-'ālamīn. Ar-raḥmānir-raḥīm. Māliki yawmid-dīn. Iyyāka na'budu wa iyyāka nasta'īn. Ihdinaṣ-ṣirāṭal-mustaqīm. Ṣirāṭal-ladhīna an'amta 'alayhim, ghayril-maghḍūbi 'alayhim wa laḍ-ḍāllīn.",
          translation:
            "All praise is for Allah, Lord of all worlds, the Most Gracious, the Most Merciful, Master of the Day of Judgment. You alone we worship and You alone we ask for help. Guide us to the straight path — the path of those You have blessed, not of those against whom there is anger, nor of those who are astray.",
          count: 1,
          isQuran: true,
          source: "Quran 1:1-7 — Al-Fatiha, recited in every rak'ah",
        },
        {
          id: "ma-bika-asbahna",
          arabic:
            "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
          transliteration:
            "Allāhumma bika aṣbaḥnā wa bika amsaynā wa bika naḥyā wa bika namūtu wa ilayka an-nushūr",
          translation:
            "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.",
          count: 1,
          source: "Abu Dawud 4/317, Tirmidhi 5/466 — Hasan",
        },
        {
          id: "ma-asbahna-mulk",
          arabic:
            "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
          transliteration:
            "Aṣbaḥnā wa aṣbaḥa al-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli shay'in qadīr",
          translation:
            "We have entered the morning and so has all dominion of Allah. Praise be to Allah. None has the right to be worshipped except Allah, alone, with no partner. His is the dominion, His is all praise, and He is Able to do all things.",
          count: 1,
          source: "Muslim 4/2088, Abu Dawud 4/317",
        },
      ],
    },
    {
      id: "ma-quran",
      title: "Quranic Verses",
      arabicTitle: "آيات قرآنية",
      entries: [
        {
          id: "ma-ayat-kursi",
          arabic:
            "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
          transliteration:
            "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm. Lā ta'khudhuhu sinatun wa lā nawm…",
          translation:
            "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission? He knows what is before them and what will be after them, and they encompass not a thing of His knowledge except for what He wills. His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Highest, the Greatest.",
          count: 1,
          isQuran: true,
          source: "Quran 2:255 — Ayat al-Kursi",
        },
        {
          id: "ma-ikhlas",
          arabic:
            "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
          transliteration:
            "Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahu kufuwan aḥad.",
          translation:
            "Say: He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",
          count: 3,
          isQuran: true,
          source: "Quran 112 — Abu Dawud 4/322, Tirmidhi 5/567",
        },
        {
          id: "ma-falaq",
          arabic:
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
          transliteration:
            "Qul a'ūdhu bi-rabbil-falaq. Min sharri mā khalaq. Wa min sharri ghāsiqin idhā waqab. Wa min sharrin-naffāthāti fil-'uqad. Wa min sharri ḥāsidin idhā ḥasad.",
          translation:
            "Say: I seek refuge in the Lord of daybreak from the evil of what He has created, and from the evil of darkness when it settles, and from the evil of those who blow on knots, and from the evil of an envier when he envies.",
          count: 3,
          isQuran: true,
          source: "Quran 113 — Abu Dawud 4/322",
        },
        {
          id: "ma-nas",
          arabic:
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
          transliteration:
            "Qul a'ūdhu bi-rabbin-nās. Malikin-nās. Ilāhin-nās. Min sharril-waswāsil-khannās. Alladhī yuwaswisu fī ṣudūrin-nās. Minal-jinnati wan-nās.",
          translation:
            "Say: I seek refuge in the Lord of mankind, the Sovereign of mankind, the God of mankind, from the evil of the retreating whisperer who whispers in the breasts of mankind — from among the jinn and mankind.",
          count: 3,
          isQuran: true,
          source: "Quran 114 — Abu Dawud 4/322",
        },
      ],
    },
    {
      id: "ma-wird-istighfar",
      title: "Istighfar — Wird",
      arabicTitle: "الاستغفار — الورد",
      description: "The first pillar of the Wird al-Lazim. Recite 100 times morning and evening.",
      entries: [
        {
          id: "ma-astaghfirullah",
          arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ",
          transliteration: "Astaghfiru Allāha al-'Aẓīm",
          translation: "I seek forgiveness from Allah, the Magnificent.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
    {
      id: "ma-istighfar",
      title: "Sayyid al-Istighfar",
      arabicTitle: "سيد الاستغفار",
      description: "The master of seeking forgiveness. Recite once in the morning.",
      entries: [
        {
          id: "ma-sayyid",
          arabic:
            "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
          transliteration:
            "Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa ana 'abduka, wa ana 'alā 'ahdika wa wa'dika mas-taṭa't. A'ūdhu bika min sharri mā ṣana't. Abū'u laka bini'matika 'alayya wa abū'u bidhanbī, faghfir lī, fa'innahu lā yaghfirudhdhunūba illā ant.",
          translation:
            "O Allah, You are my Lord. None has the right to be worshipped except You. You created me and I am Your servant. I uphold Your covenant and promise to the best of my ability. I seek refuge in You from the evil I have done. I acknowledge Your favour upon me and I acknowledge my sin. So forgive me, for indeed none forgives sins except You.",
          count: 1,
          source: "Bukhari 8/311 — Sayyid al-Istighfar",
        },
      ],
    },
    {
      id: "ma-tasbih",
      title: "Tasbih",
      arabicTitle: "التسبيح",
      entries: [
        {
          id: "ma-subhanallah",
          arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
          transliteration: "Subḥānallāhi wa biḥamdih",
          translation: "Glory be to Allah and all praise is His.",
          count: 100,
          source: "Muslim 4/2071 — removes sins as foam of the sea",
        },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   DUA-E-SUBAH — دُعَاءُ الصَّبَاح
   Morning supplication — 3-page dua with tasbih counter
   ══════════════════════════════════════════════════════════════════ */
const duaSubah: DhikrCollection = {
  id: "dua-e-subah",
  title: "Dua-e-Subah",
  arabicTitle: "دُعَاءُ الصَّبَاح",
  subtitle: "Dua-e-Subah | Morning Supplication",
  description:
    "A comprehensive morning supplication combining tasbih, durood, and supplications for forgiveness, guidance, and spiritual illumination. Recited after Fajr prayer.",
  icon: "🌄",
  sections: [
    {
      id: "des-page1",
      title: "Page 1",
      arabicTitle: "صفحہ ۱",
      entries: [
        {
          id: "des-p1-bismillah",
          arabic: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ",
          transliteration: "Bismillāhir-raḥmānir-raḥīm",
          translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
          count: 1,
        },
        {
          id: "des-p1-tasbih",
          arabic:
            "سُبْحَانَ اللّٰهِ وَبِحَمْدِهٖ سُبْحَانَ اللّٰهِ الْعَظِيْمِ وَبِحَمْدِهٖ\nاسْتَغْفِرُ اللّٰهَ وَاَتُوْبُ اِلَيْهِ",
          transliteration:
            "Subḥānallāhi wa biḥamdih, subḥānallāhil-'aẓīmi wa biḥamdih. Astaghfirullāha wa atūbu ilayh.",
          translation:
            "Glory be to Allah and all praise is His; glory be to Allah the Magnificent and all praise is His. I seek forgiveness from Allah and repent to Him.",
          count: 100,
          source: "تسبیح — recite 100 times",
        },
        {
          id: "des-p1-istighfar",
          arabic:
            "اَسْتَغْفِرُ اللّٰهَ اَسْتَغْفِرُ اللّٰهَ اَسْتَغْفِرُ اللّٰهَ تَعَالٰى رَبِّي مِنْ كُلِّ ذَنْبٍ وَاَتُوْبُ اِلَيْهِ وَاَسْاَلُهُ التَّوْبَةَ",
          translation:
            "I seek forgiveness from Allah (×3), the Exalted, my Lord, from every sin, and I repent to Him and ask Him for repentance.",
          count: 1,
        },
        {
          id: "des-p1-durood",
          arabic:
            "اَللّٰهُمَّ صَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ كُلَّمَا ذَكَرَهُ الذَّاكِرُوْنَ وَصَلِّ عَلٰى مُحَمَّدٍ كُلَّمَا غَفَلَ عَنْ ذِكْرِهِ الْغَافِلُوْنَ",
          translation:
            "O Allah, send blessings upon our master Muhammad as often as those who remember him do so, and send blessings upon Muhammad as often as those who are heedless fail to remember him.",
          count: 1,
        },
        {
          id: "des-p1-ridha",
          arabic:
            "رَضِيْنَا بِاللّٰهِ تَعَالٰى رَبًّا بِالْاِسْلَامِ دِيْنًا وَبِمُحَمَّدٍ صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا وَرَسُوْلًا",
          translation:
            "We are pleased with Allah the Exalted as our Lord, with Islam as our religion, and with Muhammad ﷺ as our Prophet and Messenger.",
          count: 3,
        },
        {
          id: "des-p1-quran-kaba",
          arabic:
            "وَبِالْقُرْآنِ اِمَامًا وَبِالْكَعْبَةِ قِبْلَةً وَبِالصَّلٰوةِ فَرِيْضَةً وَبِالْمُؤْمِنِيْنَ اِخْوَانًا وَبِالصِّدِّيْقِ وَبِالْفَارُوْقِ وَبِذِي النُّوْرَيْنِ وَبِالْمُرْتَضٰى اَئِمَّةً رِضْوَانُ اللّٰهِ تَعَالٰى عَلَيْهِمْ اَجْمَعِيْنَ",
          translation:
            "And with the Quran as our guide, the Ka'bah as our qibla, prayer as our obligation, the believers as our brothers, and with al-Ṣiddīq, al-Fārūq, Dhū al-Nūrayn, and al-Murtaḍā as our imams — may Allah's pleasure be upon them all.",
          count: 1,
        },
      ],
    },
    {
      id: "des-page2",
      title: "Page 2",
      arabicTitle: "صفحہ ۲",
      entries: [
        {
          id: "des-p2-hazar-durood",
          arabic:
            "ہَزَار ہا دُرُوْد وَہَزَار ہا سَلَام بِرُوْحِ مُحَمَّدٍ عَلَيْهِ السَّلَام\nبُوْد وَرُوْد جَان وَدِلَم صُبْح وَشَام\nعَلَيْكَ الصَّلٰوةُ عَلَيْكَ السَّلَام",
          translation:
            "A thousand salutations and a thousand greetings upon the soul of Muhammad ﷺ — morning and evening from my heart and soul. Upon you be blessings, upon you be peace.",
          count: 1,
        },
        {
          id: "des-p2-poetry",
          arabic:
            "اِنْ تَلَتْ يَا رِيْحَ الصَّبَاحِ يَوْمًا اِلٰى اَرْضِ الْحَرَمِ بَلِّغْ سَلَامِيْ رَوْضَةً فِيْهَا النَّبِيُّ الْمُحْتَرَمِ\nمِنْ وَّجْهِهٖ شَمْسُ الضُّحٰى مِنْ خَدِّهٖ بَدْرُ الدُّجٰى مِنْ ذَاتِهٖ نُوْرُ الْهُدٰى مِنْ كَفِّهٖ بَحْرُ الْهِمَمِ\nيَا رَحْمَةً لِّلْعَالَمِيْنَ اَنْتَ شَفِيْعُ الْمُذْنِبِيْنَ اِشْفَعْ لَنَا يَوْمَ الْحَزِيْنِ فَضْلًا وَجُوْدًا وَالْكَرَمِ",
          translation:
            "O morning breeze, if you pass one day to the land of the Haram, convey my salutations to the sacred garden where the noble Prophet rests. From his face shines the morning sun; from his cheek, the full moon; from his being, the light of guidance; from his hand, the ocean of generosity. O mercy to all the worlds, you are the intercessor of sinners — intercede for us on the day of grief, with grace, generosity, and nobility.",
          count: 1,
        },
        {
          id: "des-p2-wasalla",
          arabic:
            "وَصَلَّى اللّٰهُ تَعَالٰى عَلَيْهِ وَعَلٰى آلِهٖ وَاَصْحَابِهٖ وَسَلَّمَ",
          translation:
            "And may Allah the Exalted send His blessings and peace upon him, his family, and his companions.",
          count: 1,
        },
        {
          id: "des-p2-afw",
          arabic:
            "اَللّٰهُمَّ اِنَّا نَسْاَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدِّيْنِ وَالدُّنْيَا وَالْآخِرَةِ",
          translation:
            "O Allah, we ask You for pardon and well-being in religion, in this world, and in the Hereafter.",
          count: 1,
        },
        {
          id: "des-p2-ya-hayyu",
          arabic: "يَا حَيُّ يَا قَيُّوْمُ",
          transliteration: "Yā Ḥayyu yā Qayyūm",
          translation: "O Ever-Living, O Self-Sustaining.",
          count: 3,
        },
        {
          id: "des-p2-jalal",
          arabic:
            "يَا ذَا الْجَلَالِ وَالْاِكْرَامِ يَا بَدِيْعَ السَّمٰوَاتِ وَالْاَرْضِ وَيَا غِيَاثَ الْمُسْتَغِيْثِيْنَ اَغِثْنَا نَسْاَلُكَ بِنُوْرِ وَجْهِكَ الْكَرِيْمِ اَنْ تُحْيِيَ",
          translation:
            "O Lord of Majesty and Honour! O Originator of the heavens and the earth! O Helper of those who seek help — help us! We ask You by the light of Your noble Face to give life to…",
          count: 1,
        },
      ],
    },
    {
      id: "des-page3",
      title: "Page 3",
      arabicTitle: "صفحہ ۳",
      entries: [
        {
          id: "des-p3-qulub",
          arabic:
            "قُلُوْبَنَا وَأَجْسَامَنَا وَاَجْسَادَنَا أَرْوَاحَنَا وَاَبْصَارَنَا بِنُوْرِ مَعْرِفَتِكَ وَمَحَبَّتِكَ اَبَدًا",
          translation:
            "…our hearts, our bodies, our souls, and our eyes — with the light of Your knowledge and love, forever.",
          count: 1,
        },
        {
          id: "des-p3-ighfir",
          arabic: "يَآ اللّٰهُ اِغْفِرْ ذُنُوْبَنَا يَا غَفَّارُ الذُّنُوْبِ",
          translation: "O Allah, forgive our sins! O Forgiver of sins!",
          count: 1,
        },
        {
          id: "des-p3-ustur",
          arabic: "يَا اللّٰهُ أُسْتُرْ عُيُوْبَنَا يَا سَتَّارَ الْعُيُوْبِ",
          translation: "O Allah, conceal our faults! O Concealer of faults!",
          count: 1,
        },
        {
          id: "des-p3-irham",
          arabic: "يَا اللّٰهُ اِرْحَمْ حَالَنَا يَا رَحْمٰنُ",
          translation: "O Allah, have mercy on our state! O Most Merciful!",
          count: 1,
        },
        {
          id: "des-p3-closing",
          arabic:
            "وَصَلِّ عَلٰى سَيِّدِنَا مُحَمَّدٍ وَعَلٰى آلِهٖ وَاَصْحَابِهٖ اَجْمَعِيْنَ بِرَحْمَتِكَ يَا اَرْحَمَ الرَّاحِمِيْنَ",
          translation:
            "And send blessings upon our master Muhammad and upon all his family and companions, by Your mercy, O Most Merciful of the merciful.",
          count: 1,
        },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   EVENING ADHKAR — أذكار المساء
   ══════════════════════════════════════════════════════════════════ */
const eveningAdhkar: DhikrCollection = {
  id: "evening-adhkar",
  title: "Evening Adhkar",
  arabicTitle: "أذكار المساء",
  subtitle: "After Asr prayer",
  description:
    "Authenticated evening supplications from the Quran and Sunnah, compiled from Hisnul Muslim and primary hadith sources.",
  icon: "🌙",
  sections: [
    {
      id: "ea-opening",
      title: "Opening",
      arabicTitle: "البداية",
      entries: [
        {
          id: "ea-bika-amsayna",
          arabic:
            "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
          transliteration:
            "Allāhumma bika amsaynā wa bika aṣbaḥnā wa bika naḥyā wa bika namūtu wa ilayka al-maṣīr",
          translation:
            "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is the final return.",
          count: 1,
          source: "Abu Dawud 4/317, Tirmidhi 5/466",
        },
        {
          id: "ea-amsayna-mulk",
          arabic:
            "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
          transliteration:
            "Amsaynā wa amsal-mulku lillāh, wal-ḥamdu lillāh, lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli shay'in qadīr",
          translation:
            "We have entered the evening and so has all dominion of Allah. Praise be to Allah. None has the right to be worshipped except Allah, alone, with no partner. His is the dominion, His is all praise, and He is Able to do all things.",
          count: 1,
          source: "Muslim 4/2088",
        },
      ],
    },
    {
      id: "ea-quran",
      title: "Quranic Verses",
      arabicTitle: "آيات قرآنية",
      entries: [
        {
          id: "ea-ayat-kursi",
          arabic:
            "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
          transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm…",
          translation:
            "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep…",
          count: 1,
          isQuran: true,
          source: "Quran 2:255 — Ayat al-Kursi",
        },
        {
          id: "ea-ikhlas",
          arabic:
            "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
          transliteration: "Qul huwallāhu aḥad. Allāhuṣ-ṣamad…",
          translation: "Say: He is Allah, One. Allah, the Eternal Refuge…",
          count: 3,
          isQuran: true,
          source: "Quran 112 — Abu Dawud 4/322",
        },
        {
          id: "ea-falaq",
          arabic:
            "قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ مِن شَرِّ مَا خَلَقَ ۝ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۝ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۝ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",
          transliteration: "Qul a'ūdhu bi-rabbil-falaq…",
          translation: "Say: I seek refuge in the Lord of daybreak…",
          count: 3,
          isQuran: true,
          source: "Quran 113",
        },
        {
          id: "ea-nas",
          arabic:
            "قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۝ مَلِكِ النَّاسِ ۝ إِلَٰهِ النَّاسِ ۝ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۝ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۝ مِنَ الْجِنَّةِ وَالنَّاسِ",
          transliteration: "Qul a'ūdhu bi-rabbin-nās…",
          translation: "Say: I seek refuge in the Lord of mankind…",
          count: 3,
          isQuran: true,
          source: "Quran 114",
        },
      ],
    },
    {
      id: "ea-wird-hailala",
      title: "La Ilaha Illallah — Wird",
      arabicTitle: "الهيللة — الورد",
      description: "The third pillar of the Wird al-Lazim. Recite 100 times morning and evening.",
      entries: [
        {
          id: "ea-hailala",
          arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
          transliteration: "Lā ilāha illallāh",
          translation: "There is no deity except Allah.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
    {
      id: "ea-tasbih",
      title: "Closing Tasbih",
      arabicTitle: "التسبيح الختامي",
      description: "Post-prayer tasbih — 33 times each.",
      entries: [
        {
          id: "ea-subhanallah",
          arabic: "سُبْحَانَ اللَّهِ",
          transliteration: "Subḥānallāh",
          translation: "Glory be to Allah.",
          count: 33,
          source: "Muslim 1/418",
        },
        {
          id: "ea-alhamdulillah",
          arabic: "الْحَمْدُ لِلَّهِ",
          transliteration: "Al-ḥamdu lillāh",
          translation: "All praise is for Allah.",
          count: 33,
          source: "Muslim 1/418",
        },
        {
          id: "ea-allahuakbar",
          arabic: "اللَّهُ أَكْبَرُ",
          transliteration: "Allāhu akbar",
          translation: "Allah is the Greatest.",
          count: 33,
          source: "Muslim 1/418",
        },
        {
          id: "ea-la-ilaha",
          arabic:
            "لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
          transliteration:
            "Lā ilāha illallāhu waḥdahu lā sharīka lah, lahul-mulku wa lahul-ḥamdu wa huwa 'alā kulli shay'in qadīr",
          translation:
            "None has the right to be worshipped except Allah, alone, with no partner. His is the dominion, His is all praise, and He is Able to do all things.",
          count: 1,
          source: "Muslim 1/418",
        },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   DAILY DUAS — Quranic & Prophetic supplications
   Sources: Quran, Bukhari, Muslim, Abu Dawud, Tirmidhi, Ibn Majah,
            Nasa'i, Ahmad — compiled from Hisnul Muslim
   ══════════════════════════════════════════════════════════════════ */
const dailyDuas: DhikrCollection = {
  id: "daily-duas",
  title: "Daily Duas",
  arabicTitle: "الأدعية اليومية",
  subtitle: "Quranic & Prophetic supplications",
  description:
    "Essential duas from the Quran and authentic Sunnah — suitable for recitation at any time of day.",
  icon: "📿",
  sections: [
    /* ── 1. Rabbana Duas ──────────────────────────────────────── */
    {
      id: "dd-rabbana",
      title: "Rabbana Duas",
      arabicTitle: "أدعية ربنا",
      description: "Supplications from the Quran that begin with 'Our Lord' (Rabbanā).",
      entries: [
        {
          id: "dd-2-127",
          arabic: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ",
          transliteration: "Rabbanā taqabbal minnā innaka anta as-samī'ul-'alīm",
          translation: "Our Lord, accept from us. Indeed, You are the Hearing, the Knowing.",
          count: 1,
          isQuran: true,
          source: "Quran 2:127 — Dua of Ibrahim and Ismail ﷺ while building the Ka'bah",
        },
        {
          id: "dd-2-128",
          arabic:
            "رَبَّنَا وَاجْعَلْنَا مُسْلِمَيْنِ لَكَ وَمِن ذُرِّيَّتِنَا أُمَّةً مُّسْلِمَةً لَّكَ وَأَرِنَا مَنَاسِكَنَا وَتُبْ عَلَيْنَا ۖ إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ",
          transliteration:
            "Rabbanā waj'alnā muslimayni laka wa min dhurriyyatinā ummatan muslimatan lak, wa arinā manāsikanā wa tub 'alaynā, innaka anta at-tawwābur-raḥīm",
          translation:
            "Our Lord, make us Muslims submitting to You, and from our descendants a Muslim nation submitting to You. Show us our rites and accept our repentance. Indeed, You are the Accepting of Repentance, the Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 2:128 — Dua of Ibrahim and Ismail ﷺ",
        },
        {
          id: "dd-2-201",
          arabic:
            "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          transliteration:
            "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā 'adhāban-nār",
          translation:
            "Our Lord, give us in this world good and in the Hereafter good, and protect us from the punishment of the Fire.",
          count: 1,
          isQuran: true,
          source: "Quran 2:201 — Most comprehensive dua (Bukhari, Muslim)",
        },
        {
          id: "dd-2-250",
          arabic:
            "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
          transliteration:
            "Rabbanā afrigh 'alaynā ṣabran wa thabbit aqdāmanā wanṣurnā 'alal-qawmil-kāfirīn",
          translation:
            "Our Lord, pour upon us patience and plant firmly our feet and give us victory over the disbelieving people.",
          count: 1,
          isQuran: true,
          source: "Quran 2:250 — Dua of Talut's army",
        },
        {
          id: "dd-2-286",
          arabic:
            "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا ۚ رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِن قَبْلِنَا ۚ رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ ۖ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا ۚ أَنتَ مَوْلَانَا فَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
          transliteration:
            "Rabbanā lā tu'ākhidhnā in nasīnā aw akhṭa'nā. Rabbanā wa lā taḥmil 'alaynā iṣran kamā ḥamaltahu 'alal-ladhīna min qablinā. Rabbanā wa lā tuḥammilnā mā lā ṭāqata lanā bih. Wa'fu 'annā waghfir lanā warḥamnā. Anta mawlānā fanṣurnā 'alal-qawmil-kāfirīn.",
          translation:
            "Our Lord, do not impose blame upon us if we forget or err. Our Lord, lay not upon us a burden like that which You laid upon those before us. Our Lord, burden us not with what we cannot bear. Pardon us, forgive us, and have mercy upon us. You are our Protector, so give us victory over the disbelieving people.",
          count: 1,
          isQuran: true,
          source: "Quran 2:286",
        },
        {
          id: "dd-3-8",
          arabic:
            "رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً ۚ إِنَّكَ أَنتَ الْوَهَّابُ",
          transliteration:
            "Rabbanā lā tuzigh qulūbanā ba'da idh hadaytanā wa hab lanā min ladunka raḥmah, innaka antal-wahhāb",
          translation:
            "Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy. Indeed, You are the Bestower.",
          count: 1,
          isQuran: true,
          source: "Quran 3:8",
        },
        {
          id: "dd-3-16",
          arabic:
            "رَبَّنَا إِنَّنَا آمَنَّا فَاغْفِرْ لَنَا ذُنُوبَنَا وَقِنَا عَذَابَ النَّارِ",
          transliteration:
            "Rabbanā innanā āmannā faghfir lanā dhunūbanā wa qinā 'adhāban-nār",
          translation:
            "Our Lord, indeed we have believed, so forgive us our sins and protect us from the punishment of the Fire.",
          count: 1,
          isQuran: true,
          source: "Quran 3:16",
        },
        {
          id: "dd-3-147",
          arabic:
            "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا وَثَبِّتْ أَقْدَامَنَا وَانصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ",
          transliteration:
            "Rabbanā-ghfir lanā dhunūbanā wa isrāfanā fī amrinā wa thabbit aqdāmanā wanṣurnā 'alal-qawmil-kāfirīn",
          translation:
            "Our Lord, forgive us our sins and the excess in our affairs and plant firmly our feet and give us victory over the disbelieving people.",
          count: 1,
          isQuran: true,
          source: "Quran 3:147",
        },
        {
          id: "dd-3-191-194",
          arabic:
            "رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ ۝ رَبَّنَا إِنَّكَ مَن تُدْخِلِ النَّارَ فَقَدْ أَخْزَيْتَهُ ۖ وَمَا لِلظَّالِمِينَ مِنْ أَنصَارٍ ۝ رَبَّنَا إِنَّنَا سَمِعْنَا مُنَادِيًا يُنَادِي لِلْإِيمَانِ أَنْ آمِنُوا بِرَبِّكُمْ فَآمَنَّا ۚ رَبَّنَا فَاغْفِرْ لَنَا ذُنُوبَنَا وَكَفِّرْ عَنَّا سَيِّئَاتِنَا وَتَوَفَّنَا مَعَ الْأَبْرَارِ",
          transliteration:
            "Rabbanā mā khalaqta hādhā bāṭilan subḥānaka faqinā 'adhāban-nār. Rabbanā innaka man tudkhilin-nāra faqad akhzaytah, wa mā liẓ-ẓālimīna min anṣār. Rabbanā innanā sami'nā munādiyān yunādī lil-īmāni an āminū bi-rabbikum fa-āmannā. Rabbanā faghfir lanā dhunūbanā wa kaffir 'annā sayyi'ātinā wa tawaffanā ma'al-abrār.",
          translation:
            "Our Lord, You did not create all this in vain; glory be to You. So protect us from the punishment of the Fire. Our Lord, whoever You admit to the Fire, You have disgraced. For the wrongdoers there are no helpers. Our Lord, we have heard the call of one calling to faith: 'Believe in your Lord.' So we have believed. Our Lord, forgive us our sins, remove from us our misdeeds, and take us in death with the righteous.",
          count: 1,
          isQuran: true,
          source: "Quran 3:191-193 — Dua of the People of Understanding",
        },
        {
          id: "dd-7-23",
          arabic:
            "رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ",
          transliteration:
            "Rabbanā ẓalamnā anfusanā wa in lam taghfir lanā wa tarḥamnā lanakūnanna minal-khāsirīn",
          translation:
            "Our Lord, we have wronged ourselves, and if You do not forgive us and have mercy upon us, we will surely be among the losers.",
          count: 1,
          isQuran: true,
          source: "Quran 7:23 — Dua of Adam and Hawwa ﷺ",
        },
        {
          id: "dd-18-10",
          arabic: "رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
          transliteration:
            "Rabbanā ātinā min ladunka raḥmatan wa hayyi' lanā min amrinā rashadā",
          translation:
            "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.",
          count: 1,
          isQuran: true,
          source: "Quran 18:10 — Dua of the People of the Cave",
        },
        {
          id: "dd-23-118",
          arabic: "رَّبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ",
          transliteration: "Rabbi-ghfir warḥam wa anta khayru ar-rāḥimīn",
          translation: "My Lord, forgive and have mercy, and You are the best of the merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 23:118",
        },
        {
          id: "dd-25-65",
          arabic:
            "رَبَّنَا اصْرِفْ عَنَّا عَذَابَ جَهَنَّمَ ۖ إِنَّ عَذَابَهَا كَانَ غَرَامًا",
          transliteration:
            "Rabbanā-ṣrif 'annā 'adhāba jahannama inna 'adhābahā kāna gharāmā",
          translation:
            "Our Lord, avert from us the punishment of Hell. Indeed, its punishment is ever adhering.",
          count: 1,
          isQuran: true,
          source: "Quran 25:65 — Dua of 'Ibad ar-Rahman",
        },
        {
          id: "dd-25-74",
          arabic:
            "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا",
          transliteration:
            "Rabbanā hab lanā min azwājinā wa dhurriyyātinā qurrata a'yunin waj'alnā lil-muttaqīna imāmā",
          translation:
            "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
          count: 1,
          isQuran: true,
          source: "Quran 25:74",
        },
        {
          id: "dd-59-10",
          arabic:
            "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ",
          transliteration:
            "Rabbanā-ghfir lanā wa li-ikhwāninadhdhīna sabaqūnā bil-īmān wa lā taj'al fī qulūbinā ghillan lilladhīna āmanū, rabbanā innaka ra'ūfun raḥīm",
          translation:
            "Our Lord, forgive us and our brothers who preceded us in faith and put not in our hearts any resentment toward those who have believed. Our Lord, indeed You are Kind and Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 59:10",
        },
        {
          id: "dd-60-4",
          arabic:
            "رَبَّنَا عَلَيْكَ تَوَكَّلْنَا وَإِلَيْكَ أَنَبْنَا وَإِلَيْكَ الْمَصِيرُ",
          transliteration:
            "Rabbanā 'alayka tawakkalnā wa ilayka anabnā wa ilayk al-maṣīr",
          translation:
            "Our Lord, upon You we have relied, and to You we have returned, and to You is the destination.",
          count: 1,
          isQuran: true,
          source: "Quran 60:4",
        },
        {
          id: "dd-66-8",
          arabic:
            "رَبَّنَا أَتْمِمْ لَنَا نُورَنَا وَاغْفِرْ لَنَا ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
          transliteration:
            "Rabbanā atmim lanā nūranā waghfir lanā, innaka 'alā kulli shay'in qadīr",
          translation:
            "Our Lord, perfect for us our light and forgive us. Indeed, You are over all things competent.",
          count: 1,
          isQuran: true,
          source: "Quran 66:8",
        },
        {
          id: "dd-3-38",
          arabic:
            "رَبِّ هَبْ لِي مِن لَّدُنكَ ذُرِّيَّةً طَيِّبَةً ۖ إِنَّكَ سَمِيعُ الدُّعَاءِ",
          transliteration:
            "Rabbi hab lī min ladunka dhurriyyatan ṭayyibah, innaka samī'ud-du'ā'",
          translation:
            "My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.",
          count: 1,
          isQuran: true,
          source: "Quran 3:38 — Dua of Zakariyya ﷺ asking for a child",
        },
        {
          id: "dd-3-53",
          arabic:
            "رَبَّنَا آمَنَّا بِمَا أَنزَلْتَ وَاتَّبَعْنَا الرَّسُولَ فَاكْتُبْنَا مَعَ الشَّاهِدِينَ",
          transliteration:
            "Rabbanā āmannā bimā anzalta wattaba'nar-rasūla faktubna ma'ash-shāhidīn",
          translation:
            "Our Lord, we have believed in what You revealed and we have followed the messenger, so record us among the witnesses.",
          count: 1,
          isQuran: true,
          source: "Quran 3:53 — Dua of the disciples of Isa ﷺ",
        },
        {
          id: "dd-3-194",
          arabic:
            "رَبَّنَا وَآتِنَا مَا وَعَدتَّنَا عَلَىٰ رُسُلِكَ وَلَا تُخْزِنَا يَوْمَ الْقِيَامَةِ ۗ إِنَّكَ لَا تُخْلِفُ الْمِيعَادَ",
          transliteration:
            "Rabbanā wa ātinā mā wa'adtanā 'alā rusulika wa lā tukhzinā yawmal-qiyāmah, innaka lā tukhliful-mī'ād",
          translation:
            "Our Lord, and grant us what You promised us through Your messengers, and do not disgrace us on the Day of Resurrection. Indeed, You do not break Your promise.",
          count: 1,
          isQuran: true,
          source: "Quran 3:194 — Continuation of the dua of the People of Understanding",
        },
        {
          id: "dd-7-126",
          arabic:
            "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَتَوَفَّنَا مُسْلِمِينَ",
          transliteration:
            "Rabbanā afrigh 'alaynā ṣabran wa tawaffanā muslimīn",
          translation:
            "Our Lord, pour upon us patience and let us die as Muslims.",
          count: 1,
          isQuran: true,
          source: "Quran 7:126 — Dua of the sorcerers of Fir'awn who believed in Musa ﷺ",
        },
        {
          id: "dd-7-155",
          arabic:
            "أَنتَ وَلِيُّنَا فَاغْفِرْ لَنَا وَارْحَمْنَا ۖ وَأَنتَ خَيْرُ الْغَافِرِينَ ۝ وَاكْتُبْ لَنَا فِي هَٰذِهِ الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ",
          transliteration:
            "Anta waliyyunā faghfir lanā warḥamnā wa anta khayrul-ghāfirīn. Waktub lanā fī hādhihid-dunyā ḥasanatan wa fil-ākhirah.",
          translation:
            "You are our Protector, so forgive us and have mercy upon us; and You are the best of the forgivers. And decree for us good in this world and in the Hereafter.",
          count: 1,
          isQuran: true,
          source: "Quran 7:155-156 — Dua of Musa ﷺ interceding for his people",
        },
        {
          id: "dd-10-85",
          arabic:
            "رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلْقَوْمِ الظَّالِمِينَ ۝ وَنَجِّنَا بِرَحْمَتِكَ مِنَ الْقَوْمِ الْكَافِرِينَ",
          transliteration:
            "Rabbanā lā taj'alnā fitnatan lil-qawmiẓ-ẓālimīn, wa najjinā bi-raḥmatika minal-qawmil-kāfirīn",
          translation:
            "Our Lord, do not make us a trial for the wrongdoing people, and save us by Your mercy from the disbelieving people.",
          count: 1,
          isQuran: true,
          source: "Quran 10:85-86 — Dua of those who believed from the people of Musa ﷺ",
        },
        {
          id: "dd-14-35",
          arabic:
            "رَبِّ اجْعَلْ هَٰذَا الْبَلَدَ آمِنًا وَاجْنُبْنِي وَبَنِيَّ أَن نَّعْبُدَ الْأَصْنَامَ",
          transliteration:
            "Rabbi-j'al hādhal-balada āminan wajnubnī wa baniyya an na'budal-aṣnām",
          translation:
            "My Lord, make this city secure and keep me and my sons away from worshipping idols.",
          count: 1,
          isQuran: true,
          source: "Quran 14:35 — Dua of Ibrahim ﷺ for Makkah",
        },
        {
          id: "dd-40-7",
          arabic:
            "رَبَّنَا وَسِعْتَ كُلَّ شَيْءٍ رَّحْمَةً وَعِلْمًا فَاغْفِرْ لِلَّذِينَ تَابُوا وَاتَّبَعُوا سَبِيلَكَ وَقِهِمْ عَذَابَ الْجَحِيمِ ۝ رَبَّنَا وَأَدْخِلْهُمْ جَنَّاتِ عَدْنٍ الَّتِي وَعَدتَّهُمْ وَمَن صَلَحَ مِنْ آبَائِهِمْ وَأَزْوَاجِهِمْ وَذُرِّيَّاتِهِمْ ۚ إِنَّكَ أَنتَ الْعَزِيزُ الْحَكِيمُ ۝ وَقِهِمُ السَّيِّئَاتِ",
          transliteration:
            "Rabbanā wasi'ta kulla shay'in raḥmatan wa 'ilman faghfir lilladhīna tābū wattaba'ū sabīlaka wa qihim 'adhābal-jaḥīm. Rabbanā wa adkhilhum jannāti 'adninillatī wa'adtahum wa man ṣalaḥa min ābā'ihim wa azwājihim wa dhurriyyātihim, innaka antal-'azīzul-ḥakīm. Wa qihimus-sayyi'āt.",
          translation:
            "Our Lord, You have encompassed all things in mercy and knowledge, so forgive those who repented and followed Your way and protect them from the punishment of Hellfire. Our Lord, admit them to the gardens of eternal residence which You have promised them and whoever was righteous among their fathers, their spouses, and their offspring. Indeed, it is You who is the Exalted in Might, the Wise. And protect them from the evil consequences.",
          count: 1,
          isQuran: true,
          source: "Quran 40:7-9 — Dua of the angels interceding for the believers",
        },
        {
          id: "dd-44-12",
          arabic:
            "رَبَّنَا اكْشِفْ عَنَّا الْعَذَابَ إِنَّا مُؤْمِنُونَ",
          transliteration:
            "Rabbanā-kshif 'annal-'adhāba innā mu'minūn",
          translation:
            "Our Lord, remove from us the torment; indeed, we are believers.",
          count: 1,
          isQuran: true,
          source: "Quran 44:12 — The prayer of those who seek relief",
        },
        {
          id: "dd-46-15",
          arabic:
            "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَصْلِحْ لِي فِي ذُرِّيَّتِي ۖ إِنِّي تُبْتُ إِلَيْكَ وَإِنِّي مِنَ الْمُسْلِمِينَ",
          transliteration:
            "Rabbi awzi'nī an ashkura ni'mataka allatī an'amta 'alayya wa 'alā wālidayya wa an a'mala ṣāliḥan tarḍāh, wa aṣliḥ lī fī dhurriyyatī, innī tubtu ilayka wa innī minal-muslimīn",
          translation:
            "My Lord, inspire me to be grateful for Your favour which You have bestowed upon me and my parents, and to do righteousness of which You approve. And make righteous for me my offspring. Indeed, I have repented to You, and indeed I am of the Muslims.",
          count: 1,
          isQuran: true,
          source: "Quran 46:15 — Dua of the righteous believer at maturity",
        },
        {
          id: "dd-60-5",
          arabic:
            "رَبَّنَا لَا تَجْعَلْنَا فِتْنَةً لِّلَّذِينَ كَفَرُوا وَاغْفِرْ لَنَا رَبَّنَا ۖ إِنَّكَ أَنتَ الْعَزِيزُ الْحَكِيمُ",
          transliteration:
            "Rabbanā lā taj'alnā fitnatan lilladhīna kafarū waghfir lanā rabbanā, innaka antal-'azīzul-ḥakīm",
          translation:
            "Our Lord, do not make us a trial for those who disbelieve, and forgive us, our Lord. Indeed, You are the Exalted in Might, the Wise.",
          count: 1,
          isQuran: true,
          source: "Quran 60:5 — Dua of Ibrahim ﷺ and those with him",
        },
      ],
    },

    /* ── 2. Prophetic Duas (from the Quran) ──────────────────── */
    {
      id: "dd-prophetic",
      title: "Duas of the Prophets",
      arabicTitle: "أدعية الأنبياء",
      description: "Supplications made by prophets in the Quran.",
      entries: [
        {
          id: "dd-21-87",
          arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
          transliteration: "Lā ilāha illā anta subḥānaka innī kuntu mina aẓ-ẓālimīn",
          translation:
            "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
          count: 1,
          isQuran: true,
          source: "Quran 21:87 — Dua of Yunus ﷺ in the whale",
        },
        {
          id: "dd-20-25",
          arabic:
            "رَبِّ اشْرَحْ لِي صَدْرِي ۝ وَيَسِّرْ لِي أَمْرِي ۝ وَاحْلُلْ عُقْدَةً مِّن لِّسَانِي ۝ يَفْقَهُوا قَوْلِي",
          transliteration:
            "Rabbi ashraḥ lī ṣadrī, wa yassir lī amrī, waḥlul 'uqdatan min lisānī, yafqahū qawlī",
          translation:
            "My Lord, expand for me my breast, ease for me my task, and untie the knot from my tongue, that they may understand my speech.",
          count: 1,
          isQuran: true,
          source: "Quran 20:25-28 — Dua of Musa ﷺ",
        },
        {
          id: "dd-14-40",
          arabic:
            "رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ",
          transliteration:
            "Rabbi-j'alnī muqīmaṣ-ṣalāti wa min dhurriyyatī, rabbanā wa taqabbal du'ā'",
          translation:
            "My Lord, make me an establisher of prayer, and from my descendants. Our Lord, and accept my supplication.",
          count: 1,
          isQuran: true,
          source: "Quran 14:40 — Dua of Ibrahim ﷺ",
        },
        {
          id: "dd-14-41",
          arabic:
            "رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ",
          transliteration:
            "Rabbanā-ghfir lī wa liwālidayya wa lil-mu'minīna yawma yaqūmul-ḥisāb",
          translation:
            "Our Lord, forgive me and my parents and the believers the Day the account is established.",
          count: 1,
          isQuran: true,
          source: "Quran 14:41 — Dua of Ibrahim ﷺ",
        },
        {
          id: "dd-27-19",
          arabic:
            "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ وَأَدْخِلْنِي بِرَحْمَتِكَ فِي عِبَادِكَ الصَّالِحِينَ",
          transliteration:
            "Rabbi awzi'nī an ashkura ni'mataka allatī an'amta 'alayya wa 'alā wālidayya wa an a'mala ṣāliḥan tarḍāh, wa adkhilnī bi-raḥmatika fī 'ibādika aṣ-ṣāliḥīn",
          translation:
            "My Lord, enable me to be grateful for Your favor which You have bestowed upon me and upon my parents and to do righteousness of which You approve. And admit me by Your mercy into the ranks of Your righteous servants.",
          count: 1,
          isQuran: true,
          source: "Quran 27:19 — Dua of Sulayman ﷺ",
        },
        {
          id: "dd-21-89",
          arabic: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ",
          transliteration: "Rabbi lā tadharni fardan wa anta khayrul-wārithīn",
          translation:
            "My Lord, do not leave me alone, and You are the best of inheritors.",
          count: 1,
          isQuran: true,
          source: "Quran 21:89 — Dua of Zakariyya ﷺ",
        },
        {
          id: "dd-12-101",
          arabic:
            "رَبِّ قَدْ آتَيْتَنِي مِنَ الْمُلْكِ وَعَلَّمْتَنِي مِن تَأْوِيلِ الْأَحَادِيثِ ۚ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ أَنتَ وَلِيِّي فِي الدُّنْيَا وَالْآخِرَةِ ۖ تَوَفَّنِي مُسْلِمًا وَأَلْحِقْنِي بِالصَّالِحِينَ",
          transliteration:
            "Rabbi qad ātaytanī minal-mulki wa 'allamtanī min ta'wīlil-aḥādīth. Fāṭiras-samāwāti wal-arḍi anta waliyyī fid-dunyā wal-ākhirah. Tawaffanī musliman wa alḥiqnī biṣ-ṣāliḥīn.",
          translation:
            "My Lord, You have given me sovereignty and taught me of the interpretation of dreams. Creator of the heavens and earth, You are my protector in this world and in the Hereafter. Cause me to die as a Muslim and join me with the righteous.",
          count: 1,
          isQuran: true,
          source: "Quran 12:101 — Dua of Yusuf ﷺ",
        },
        {
          id: "dd-38-35",
          arabic:
            "رَبِّ اغْفِرْ لِي وَهَبْ لِي مُلْكًا لَّا يَنبَغِي لِأَحَدٍ مِّن بَعْدِي ۖ إِنَّكَ أَنتَ الْوَهَّابُ",
          transliteration:
            "Rabbi-ghfir lī wa hab lī mulkan lā yanbaghī li-aḥadin min ba'dī, innaka antal-wahhāb",
          translation:
            "My Lord, forgive me and grant me a kingdom such as will not belong to anyone after me. Indeed, You are the Bestower.",
          count: 1,
          isQuran: true,
          source: "Quran 38:35 — Dua of Sulayman ﷺ",
        },
        {
          id: "dd-3-173",
          arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
          transliteration: "Ḥasbunallāhu wa ni'mal-wakīl",
          translation: "Sufficient for us is Allah, and He is the best Disposer of affairs.",
          count: 1,
          isQuran: true,
          source: "Quran 3:173 — said by Ibrahim ﷺ in the fire (Bukhari)",
        },
        {
          id: "dd-65-3",
          arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
          transliteration: "Wa man yatawakkal 'alallāhi fa-huwa ḥasbuh",
          translation: "Whoever relies upon Allah — then He is sufficient for him.",
          count: 1,
          isQuran: true,
          source: "Quran 65:3",
        },
        {
          id: "dd-20-114",
          arabic: "رَّبِّ زِدْنِي عِلْمًا",
          transliteration: "Rabbi zidnī 'ilmā",
          translation: "My Lord, increase me in knowledge.",
          count: 1,
          isQuran: true,
          source: "Quran 20:114",
        },
        {
          id: "dd-17-80",
          arabic:
            "رَّبِّ أَدْخِلْنِي مُدْخَلَ صِدْقٍ وَأَخْرِجْنِي مُخْرَجَ صِدْقٍ وَاجْعَل لِّي مِن لَّدُنكَ سُلْطَانًا نَّصِيرًا",
          transliteration:
            "Rabbi adkhilnī mudkhala ṣidqin wa akhrijnī mukhraja ṣidqin waj'al lī min ladunka sulṭānan naṣīrā",
          translation:
            "My Lord, cause me to enter a sound entrance and to exit a sound exit and grant me from Yourself a supporting authority.",
          count: 1,
          isQuran: true,
          source: "Quran 17:80",
        },
        {
          id: "dd-23-97-98",
          arabic:
            "رَّبِّ أَعُوذُ بِكَ مِنْ هَمَزَاتِ الشَّيَاطِينِ ۝ وَأَعُوذُ بِكَ رَبِّ أَن يَحْضُرُونِ",
          transliteration:
            "Rabbi a'ūdhu bika min hamazātish-shayāṭīn, wa a'ūdhu bika rabbi an yaḥḍurūn",
          translation:
            "My Lord, I seek refuge with You from the incitements of the devils, and I seek refuge with You, my Lord, lest they be present with me.",
          count: 1,
          isQuran: true,
          source: "Quran 23:97-98",
        },
        {
          id: "dd-19-4",
          arabic:
            "رَبِّ إِنِّي وَهَنَ الْعَظْمُ مِنِّي وَاشْتَعَلَ الرَّأْسُ شَيْبًا وَلَمْ أَكُن بِدُعَائِكَ رَبِّ شَقِيًّا",
          transliteration:
            "Rabbi innī wahana al-'aẓmu minnī wASHTa'alar-ra'su shayban wa lam akun bidu'ā'ika rabbi shaqiyyā",
          translation:
            "My Lord, indeed my bones have weakened and my head has filled with white, and never have I been in my supplication to You, my Lord, unhappy.",
          count: 1,
          isQuran: true,
          source: "Quran 19:4 — The opening of Zakariyya's ﷺ night prayer, imploring Allah for a child",
        },
        {
          id: "dd-21-83",
          arabic:
            "أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ",
          transliteration:
            "Annī massaniyaḍ-ḍurru wa anta arḥamur-rāḥimīn",
          translation:
            "Indeed, adversity has touched me, and You are the Most Merciful of the merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 21:83 — Dua of Ayyub ﷺ in his illness",
        },
        {
          id: "dd-26-83",
          arabic:
            "رَبِّ هَبْ لِي حُكْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ ۝ وَاجْعَل لِّي لِسَانَ صِدْقٍ فِي الْآخِرِينَ ۝ وَاجْعَلْنِي مِن وَرَثَةِ جَنَّةِ النَّعِيمِ",
          transliteration:
            "Rabbi hab lī ḥukman wa alḥiqnī biṣ-ṣāliḥīn. Waj'al lī lisāna ṣidqin fil-ākhirīn. Waj'alnī min warathati jannatin-na'īm.",
          translation:
            "My Lord, grant me wisdom and join me with the righteous. And grant me a mention of honour among later generations. And place me among the inheritors of the Garden of Bliss.",
          count: 1,
          isQuran: true,
          source: "Quran 26:83-85 — Dua of Ibrahim ﷺ",
        },
        {
          id: "dd-37-100",
          arabic:
            "رَبِّ هَبْ لِي مِنَ الصَّالِحِينَ",
          transliteration: "Rabbi hab lī minas-ṣāliḥīn",
          translation: "My Lord, grant me a child from the righteous.",
          count: 1,
          isQuran: true,
          source: "Quran 37:100 — Dua of Ibrahim ﷺ asking for a righteous son",
        },
        {
          id: "dd-71-28",
          arabic:
            "رَّبِّ اغْفِرْ لِي وَلِوَالِدَيَّ وَلِمَن دَخَلَ بَيْتِيَ مُؤْمِنًا وَلِلْمُؤْمِنِينَ وَالْمُؤْمِنَاتِ",
          transliteration:
            "Rabbi-ghfir lī wa liwālidayya wa liman dakhala baytiya mu'minan wa lil-mu'minīna wal-mu'mināt",
          translation:
            "My Lord, forgive me and my parents and whoever enters my house a believer, and the believing men and believing women.",
          count: 1,
          isQuran: true,
          source: "Quran 71:28 — Dua of Nuh ﷺ",
        },
        {
          id: "dd-3-26",
          arabic:
            "قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ تُؤْتِي الْمُلْكَ مَن تَشَاءُ وَتَنزِعُ الْمُلْكَ مِمَّن تَشَاءُ وَتُعِزُّ مَن تَشَاءُ وَتُذِلُّ مَن تَشَاءُ ۖ بِيَدِكَ الْخَيْرُ ۖ إِنَّكَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
          transliteration:
            "Qulil-lāhumma mālikal-mulki tu'til-mulka man tashā', wa tanzi'ul-mulka mimman tashā', wa tu'izzu man tashā', wa tudhillu man tashā', bi-yadikal-khayr, innaka 'alā kulli shay'in qadīr",
          translation:
            "Say: O Allah, Owner of Sovereignty, You give sovereignty to whom You will and You take sovereignty away from whom You will. You honour whom You will and You humble whom You will. In Your hand is all good. Indeed, You are over all things competent.",
          count: 1,
          isQuran: true,
          source: "Quran 3:26 — Taught by Allah to the Prophet ﷺ",
        },
      ],
    },

    /* ── 3. Quranic Invocations ───────────────────────────────── */
    {
      id: "dd-quranic-invocations",
      title: "Quranic Invocations",
      arabicTitle: "أدعية قرآنية",
      description:
        "Powerful short verses from the Quran used as dhikr and invocation — recited in reflection and remembrance.",
      entries: [
        {
          id: "dd-6-162",
          arabic:
            "قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ ۝ لَا شَرِيكَ لَهُ ۖ وَبِذَٰلِكَ أُمِرْتُ وَأَنَا أَوَّلُ الْمُسْلِمِينَ",
          transliteration:
            "Qul inna ṣalātī wa nusukī wa maḥyāya wa mamātī lillāhi rabbil-'ālamīn. Lā sharīka lah, wa bidhālika umirtu wa ana awwalul-muslimīn.",
          translation:
            "Say: Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds. No partner has He. And this I have been commanded, and I am the first of the Muslims.",
          count: 1,
          isQuran: true,
          source: "Quran 6:162-163 — The declaration of total devotion",
        },
        {
          id: "dd-2-163",
          arabic:
            "وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ ۖ لَّا إِلَٰهَ إِلَّا هُوَ الرَّحْمَٰنُ الرَّحِيمُ",
          transliteration:
            "Wa ilāhukum ilāhun wāḥid, lā ilāha illā huwar-raḥmānur-raḥīm",
          translation:
            "And your God is one God. There is no deity except Him, the Entirely Merciful, the Especially Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 2:163 — Affirmation of divine unity",
        },
        {
          id: "dd-2-255-short",
          arabic:
            "وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ",
          transliteration:
            "Wasi'a kursiyyuhus-samāwāti wal-arḍ, wa lā ya'ūduhu ḥifẓuhumā, wa huwal-'aliyyul-'aẓīm",
          translation:
            "His Throne extends over the heavens and the earth, and their preservation tires Him not. And He is the Highest, the Greatest.",
          count: 1,
          isQuran: true,
          source: "Quran 2:255 — Closing of Ayat al-Kursi",
        },
        {
          id: "dd-57-3",
          arabic:
            "هُوَ الْأَوَّلُ وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ ۖ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ",
          transliteration:
            "Huwal-awwalu wal-ākhiru waẓ-ẓāhiru wal-bāṭin, wa huwa bikulli shay'in 'alīm",
          translation:
            "He is the First and the Last, the Ascendant and the Intimate, and He is, of all things, Knowing.",
          count: 1,
          isQuran: true,
          source: "Quran 57:3 — The attributes of Allah's eternity and encompassment",
        },
        {
          id: "dd-59-22",
          arabic:
            "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ ۖ عَالِمُ الْغَيْبِ وَالشَّهَادَةِ ۖ هُوَ الرَّحْمَٰنُ الرَّحِيمُ",
          transliteration:
            "Huwal-lāhulladhī lā ilāha illā huw, 'ālimu al-ghaybi wash-shahādah, huwar-raḥmānur-raḥīm",
          translation:
            "He is Allah, other than whom there is no deity, Knower of the unseen and the witnessed. He is the Entirely Merciful, the Especially Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 59:22 — Divine names and attributes",
        },
        {
          id: "dd-59-23",
          arabic:
            "هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ ۚ سُبْحَانَ اللَّهِ عَمَّا يُشْرِكُونَ",
          transliteration:
            "Huwal-lāhulladhī lā ilāha illā huwal-malikul-quddūsus-salāmul-mu'minul-muhayminul-'azīzul-jabbārul-mutakabbir, subḥānallāhi 'ammā yushrikūn",
          translation:
            "He is Allah, other than whom there is no deity — the Sovereign, the Pure, the Perfection, the Bestower of Faith, the Overseer, the Exalted in Might, the Compeller, the Superior. Exalted is Allah above whatever they associate with Him.",
          count: 1,
          isQuran: true,
          source: "Quran 59:23 — The names of Allah (Al-Asma al-Husna)",
        },
        {
          id: "dd-59-24",
          arabic:
            "هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ ۖ لَهُ الْأَسْمَاءُ الْحُسْنَىٰ ۚ يُسَبِّحُ لَهُ مَا فِي السَّمَاوَاتِ وَالْأَرْضِ ۖ وَهُوَ الْعَزِيزُ الْحَكِيمُ",
          transliteration:
            "Huwal-lāhul-khāliqul-bāri'ul-muṣawwir, lahul-asmā'ul-ḥusnā, yusabbiḥu lahū mā fis-samāwāti wal-arḍ, wa huwal-'azīzul-ḥakīm",
          translation:
            "He is Allah, the Creator, the Originator, the Fashioner; to Him belong the best names. Whatever is in the heavens and earth exalts Him. And He is the Exalted in Might, the Wise.",
          count: 1,
          isQuran: true,
          source: "Quran 59:24 — Allah as the Creator and Fashioner",
        },
        {
          id: "dd-55-78",
          arabic:
            "تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ",
          transliteration:
            "Tabāraka-smu rabbika dhil-jalāli wal-ikrām",
          translation:
            "Blessed is the name of your Lord, Owner of Majesty and Honour.",
          count: 1,
          isQuran: true,
          source: "Quran 55:78 — Closing of Surah ar-Rahman",
        },
        {
          id: "dd-87-1",
          arabic:
            "سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى",
          transliteration: "Sabbiḥisma rabbikal-a'lā",
          translation: "Exalt the name of your Lord, the Most High.",
          count: 1,
          isQuran: true,
          source: "Quran 87:1 — Opening of Surah Al-A'la — said in sujud: Subhana Rabbiyal A'la",
        },
        {
          id: "dd-10-10",
          arabic:
            "دَعْوَاهُمْ فِيهَا سُبْحَانَكَ اللَّهُمَّ وَتَحِيَّتُهُمْ فِيهَا سَلَامٌ ۚ وَآخِرُ دَعْوَاهُمْ أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
          transliteration:
            "Da'wāhum fīhā subḥānaka allāhumma wa taḥiyyatuhum fīhā salām, wa ākhiru da'wāhum anil-ḥamdu lillāhi rabbil-'ālamīn",
          translation:
            "Their call therein will be: 'Glory to You, O Allah!' and their greeting therein will be: 'Peace!' and the last of their call will be: 'Praise to Allah, Lord of the worlds.'",
          count: 1,
          isQuran: true,
          source: "Quran 10:10 — The glorification of the people of Jannah",
        },
      ],
    },

    /* ── 4. Sunnah Duas — Daily Life ─────────────────────────── */
    {
      id: "dd-sunnah",
      title: "Sunnah Duas",
      arabicTitle: "أدعية السنة",
      description:
        "Authenticated supplications from the Prophet ﷺ compiled from Hisnul Muslim.",
      entries: [
        {
          id: "dd-anxiety",
          arabic:
            "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ وَأَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَأَعُوذُ بِكَ مِنَ الْجُبْنِ وَالْبُخْلِ وَأَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ",
          transliteration:
            "Allāhumma innī a'ūdhu bika minal-hammi wal-ḥazan, wa a'ūdhu bika minal-'ajzi wal-kasal, wa a'ūdhu bika minal-jubni wal-bukhl, wa a'ūdhu bika min ghalabatid-dayni wa qahrir-rijāl",
          translation:
            "O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from cowardice and miserliness, and from the overpowering of debt and the oppression of people.",
          count: 1,
          source: "Bukhari 7/158 — Dua for anxiety and grief",
        },
        {
          id: "dd-guidance",
          arabic:
            "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
          transliteration:
            "Allāhumma innī as'alukal-hudā wat-tuqā wal-'afāfa wal-ghinā",
          translation:
            "O Allah, I ask You for guidance, righteousness, chastity, and self-sufficiency.",
          count: 1,
          source: "Muslim 4/2087",
        },
        {
          id: "dd-good-character",
          arabic:
            "اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
          transliteration:
            "Allāhumma kamā ḥassanta khalqī fa-ḥassin khuluqī",
          translation:
            "O Allah, just as You have made my physical form good, make my character good too.",
          count: 1,
          source: "Ahmad 1/403 — Hasan",
        },
        {
          id: "dd-protection-comprehensive",
          arabic:
            "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ",
          transliteration:
            "Allāhumma innī as'alukal-'afwa wal-'āfiyata fid-dunyā wal-ākhirah",
          translation:
            "O Allah, I ask You for pardon and well-being in this world and in the Hereafter.",
          count: 1,
          source: "Abu Dawud 4/324, Ibn Majah 2/332 — Sahih",
        },
        {
          id: "dd-heart-quran",
          arabic:
            "اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي وَنُورَ صَدْرِي وَجَلَاءَ حُزْنِي وَذَهَابَ هَمِّي",
          transliteration:
            "Allāhumma-j'alil-qur'āna rabī'a qalbī wa nūra ṣadrī wa jalā'a ḥuznī wa dhahāba hammī",
          translation:
            "O Allah, make the Quran the spring of my heart, the light of my chest, the departure of my sorrow, and the release of my anxiety.",
          count: 1,
          source: "Ahmad 1/391 — Sahih",
        },
        {
          id: "dd-salawat-ibrahim",
          arabic:
            "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ ۝ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَّجِيدٌ",
          transliteration:
            "Allāhumma ṣalli 'alā Muḥammadin wa 'alā āli Muḥammadin kamā ṣallayta 'alā Ibrāhīma wa 'alā āli Ibrāhīm. Allāhumma bārik 'alā Muḥammadin wa 'alā āli Muḥammadin kamā bārakta 'alā Ibrāhīma wa 'alā āli Ibrāhīma, innaka ḥamīdun majīd.",
          translation:
            "O Allah, send prayers upon Muhammad and upon the family of Muhammad, just as You sent prayers upon Ibrahim and upon the family of Ibrahim. O Allah, bless Muhammad and the family of Muhammad, just as You blessed Ibrahim and the family of Ibrahim. Indeed, You are the Most Praiseworthy, the Most Glorious.",
          count: 1,
          source: "Bukhari 6/408 — Salawat Ibrahimiyya (recited in tashahhud)",
        },
        {
          id: "dd-kaffarat-majlis",
          arabic:
            "سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ أَشْهَدُ أَن لَا إِلَٰهَ إِلَّا أَنتَ أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ",
          transliteration:
            "Subḥānaka Allāhumma wa biḥamdika ashhadu an lā ilāha illā anta astaghfiruka wa atūbu ilayk",
          translation:
            "Glory be to You, O Allah, and all praise. I bear witness that there is no deity except You. I seek Your forgiveness and repent to You.",
          count: 1,
          source: "Abu Dawud 4/264, Tirmidhi 5/495 — Kaffarat al-Majlis (expiation for gatherings)",
        },
        {
          id: "dd-distress",
          arabic:
            "لَا إِلَٰهَ إِلَّا اللَّهُ الْعَظِيمُ الْحَلِيمُ لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ الْعَرْشِ الْعَظِيمِ لَا إِلَٰهَ إِلَّا اللَّهُ رَبُّ السَّمَاوَاتِ وَرَبُّ الْأَرْضِ وَرَبُّ الْعَرْشِ الْكَرِيمِ",
          transliteration:
            "Lā ilāha illallāhul-'aẓīmul-ḥalīm, lā ilāha illallāhu rabbul-'arshil-'aẓīm, lā ilāha illallāhu rabbus-samāwāti wa rabbul-arḍi wa rabbul-'arshil-karīm",
          translation:
            "There is no deity except Allah, the Magnificent, the Forbearing. There is no deity except Allah, the Lord of the Magnificent Throne. There is no deity except Allah, the Lord of the heavens, the Lord of the earth, and the Lord of the Noble Throne.",
          count: 1,
          source: "Bukhari 8/154, Muslim 4/2092 — Dua for distress",
        },
        {
          id: "dd-la-hawla",
          arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
          transliteration: "Lā ḥawla wa lā quwwata illā billāh",
          translation:
            "There is no might and no power except with Allah.",
          count: 1,
          source: "Bukhari 11/213 — 'A treasure from the treasures of Paradise' (Muslim)",
        },
        {
          id: "dd-inna-lillah",
          arabic:
            "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا",
          transliteration:
            "Innā lillāhi wa innā ilayhi rāji'ūn. Allāhumma-j'urnī fī muṣībatī wa akhlif lī khayran minhā",
          translation:
            "Indeed, we belong to Allah and to Him we shall return. O Allah, recompense me in my affliction and replace it for me with something better.",
          count: 1,
          source: "Muslim 3/919 — Dua upon calamity or loss",
        },
        {
          id: "dd-adhan-response",
          arabic:
            "اللَّهُمَّ رَبَّ هَٰذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
          transliteration:
            "Allāhumma rabba hādhihid-da'watit-tāmmati waṣ-ṣalātil-qā'imati āti Muḥammadanil-wasīlata wal-faḍīlata wab'athhu maqāman maḥmūdanil-ladhī wa'adtah",
          translation:
            "O Allah, Lord of this perfect call and the established prayer, grant Muhammad the privilege of intercession and the excellence, and resurrect him to the praised station which You have promised him.",
          count: 1,
          source: "Bukhari 1/152 — Dua after the adhan",
        },
      ],
    },

    /* ── 4. Situational Duas ─────────────────────────────────── */
    {
      id: "dd-situational",
      title: "Situational Duas",
      arabicTitle: "أدعية المواقف",
      description: "Duas for specific daily occasions — eating, sleeping, traveling, and more.",
      entries: [
        {
          id: "dd-before-eating",
          arabic: "بِسْمِ اللَّهِ",
          transliteration: "Bismillāh",
          translation: "In the name of Allah.",
          count: 1,
          source: "Abu Dawud 3/347 — Before eating",
        },
        {
          id: "dd-after-eating",
          arabic:
            "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
          transliteration:
            "Al-ḥamdu lillāhil-ladhī aṭ'amanā wa saqānā wa ja'alanā muslimīn",
          translation:
            "All praise is for Allah who gave us food and drink and made us Muslims.",
          count: 1,
          source: "Abu Dawud 3/345, Tirmidhi 5/507 — After eating",
        },
        {
          id: "dd-before-sleep",
          arabic:
            "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
          transliteration: "Bismika Allāhumma amūtu wa aḥyā",
          translation: "In Your name, O Allah, I die and I live.",
          count: 1,
          source: "Bukhari 11/113 — Before sleeping",
        },
        {
          id: "dd-upon-waking",
          arabic:
            "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
          transliteration:
            "Al-ḥamdu lillāhil-ladhī aḥyānā ba'da mā amātanā wa ilayhin-nushūr",
          translation:
            "All praise is for Allah who gave us life after causing us to die, and to Him is the resurrection.",
          count: 1,
          source: "Bukhari 11/113 — Upon waking",
        },
        {
          id: "dd-leaving-home",
          arabic:
            "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
          transliteration:
            "Bismillāh, tawakkaltu 'alallāh, wa lā ḥawla wa lā quwwata illā billāh",
          translation:
            "In the name of Allah. I place my trust in Allah, and there is no might nor power except with Allah.",
          count: 1,
          source: "Abu Dawud 4/325, Tirmidhi 5/490 — Upon leaving the home",
        },
        {
          id: "dd-entering-home",
          arabic:
            "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا",
          transliteration:
            "Allāhumma innī as'aluka khayral-mawlaji wa khayral-makhraji. Bismillāhi walajnā wa bismillāhi kharajnā wa 'alallāhi rabbinā tawakkalnā",
          translation:
            "O Allah, I ask You for the best entry and the best exit. In Allah's name we enter and in Allah's name we leave, and upon Allah, our Lord, we rely.",
          count: 1,
          source: "Abu Dawud 4/325 — Upon entering the home",
        },
        {
          id: "dd-entering-masjid",
          arabic:
            "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
          transliteration: "Allāhumma-ftaḥ lī abwāba raḥmatik",
          translation: "O Allah, open the gates of Your mercy for me.",
          count: 1,
          source: "Muslim 1/494 — Upon entering the masjid",
        },
        {
          id: "dd-leaving-masjid",
          arabic:
            "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِن فَضْلِكَ",
          transliteration: "Allāhumma innī as'aluka min faḍlik",
          translation: "O Allah, I ask You of Your bounty.",
          count: 1,
          source: "Muslim 1/494 — Upon leaving the masjid",
        },
        {
          id: "dd-traveling",
          arabic:
            "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ",
          transliteration:
            "Subḥānal-ladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā rabbinā lamunqalibūn",
          translation:
            "Glory to the One who has subjected this to us, and we could not have [otherwise] subdued it, and indeed, to our Lord we shall return.",
          count: 1,
          isQuran: true,
          source: "Quran 43:13-14 — Dua upon riding or traveling",
        },
        {
          id: "dd-mirror",
          arabic:
            "اللَّهُمَّ أَنتَ حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي",
          transliteration: "Allāhumma anta ḥassanta khalqī fa-ḥassin khuluqī",
          translation:
            "O Allah, You have made my physical form good, so make my character good too.",
          count: 1,
          source: "Ahmad 1/403 — Upon looking in the mirror",
        },
        {
          id: "dd-parents",
          arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
          transliteration: "Rabbi-rḥamhumā kamā rabbayānī ṣaghīrā",
          translation:
            "My Lord, have mercy upon them as they raised me when I was small.",
          count: 1,
          isQuran: true,
          source: "Quran 17:24 — Dua for parents",
        },
        {
          id: "dd-when-angry",
          arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
          transliteration: "A'ūdhu billāhi minash-shayṭānir-rajīm",
          translation: "I seek refuge in Allah from the accursed Satan.",
          count: 1,
          source: "Bukhari 6/336, Muslim 4/2015 — When feeling anger",
        },
        {
          id: "dd-rain",
          arabic: "اللَّهُمَّ صَيِّبًا نَافِعًا",
          transliteration: "Allāhumma ṣayyiban nāfi'ā",
          translation: "O Allah, make it a beneficial rain.",
          count: 1,
          source: "Bukhari 2/518 — Upon rain falling",
        },
        {
          id: "dd-after-rain",
          arabic: "مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ",
          transliteration: "Muṭirnā bi-faḍlillāhi wa raḥmatih",
          translation: "We have been given rain by the grace and mercy of Allah.",
          count: 1,
          source: "Bukhari 1/203 — After rain falls",
        },
      ],
    },
    /* ── 5. Salat al-Fatiha (Wird) ──────────────────────────────── */
    {
      id: "dd-salat-fatiha",
      title: "Salat al-Fatiha",
      arabicTitle: "الصلاة الفاتحة",
      description:
        "The central salawat of the Wird al-Lazim. Recite 100 times morning and evening as the second pillar of the Wird.",
      entries: [
        {
          id: "dd-salat-fatiha-1",
          arabic:
            "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ نَاصِرِ الْحَقِّ بِالْحَقِّ وَالْهَادِي إِلَى صِرَاطِكَ الْمُسْتَقِيمِ وَعَلَى آلِهِ حَقَّ قَدْرِهِ وَمِقْدَارِهِ الْعَظِيمِ",
          transliteration:
            "Allāhumma ṣalli wa sallim 'alā Sayyidinā Muḥammad al-Fātiḥi limā ughliq, wal-Khātimi limā sabaq, Nāṣiri al-ḥaqqi bil-ḥaqq, wal-Hādī ilā ṣirāṭika al-mustaqīm, wa 'alā ālihi ḥaqqa qadrihi wa miqdārihi al-'aẓīm.",
          translation:
            "O Allah, bestow blessings and peace upon our master Muhammad — the opener of what was closed, the seal of what preceded, the helper of truth by truth, and the guide to Your straight path — and upon his family, in accordance with his worth and his immense rank.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
  ],
};

/* ══════════════════════════════════════════════════════════════════
   Export
   ══════════════════════════════════════════════════════════════════ */
export const DHIKR_COLLECTIONS: DhikrCollection[] = [
  auradFathiya,
  duaSubah,
  morningAdhkar,
  eveningAdhkar,
  dailyDuas,
];

export function getCollection(id: string): DhikrCollection | undefined {
  return DHIKR_COLLECTIONS.find((c) => c.id === id);
}
