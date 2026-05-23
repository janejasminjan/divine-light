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
}

const auradFathiya: DhikrCollection = {
  id: "aurad-fathiya",
  title: "Aurad Fathiya",
  arabicTitle: "الأوراد الفاتحية",
  subtitle: "Wird al-Lazim · Daily Litany",
  description: "The daily litany (Wird al-Lazim) recited morning and evening.",
  icon: "mosque",
  sections: [
    {
      id: "af-opening",
      title: "Opening",
      arabicTitle: "البسملة والفاتحة",
      entries: [
        {
          id: "af-bismillah",
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          transliteration: "Bismillāhi ar-Raḥmāni ar-Raḥīm",
          translation: "In the name of Allah, the Most Gracious, the Most Merciful.",
          count: 1,
          isQuran: true,
          source: "Quran 1:1",
        },
      ],
    },
    {
      id: "af-istighfar",
      title: "Istighfar",
      arabicTitle: "الاستغفار",
      description: "Seeking Allah's forgiveness. Recite 100 times.",
      entries: [
        {
          id: "af-istighfar-1",
          arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ",
          transliteration: "Astaghfiru Allāha al-'Aẓīm",
          translation: "I seek forgiveness from Allah, the Magnificent.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
    {
      id: "af-salat-fatiha",
      title: "Salat al-Fatiha",
      arabicTitle: "الصلاة الفاتحة",
      description: "The central salawat of the Wird. Recite 100 times.",
      entries: [
        {
          id: "af-salat-fatiha-1",
          arabic: "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ الْفَاتِحِ لِمَا أُغْلِقَ وَالْخَاتِمِ لِمَا سَبَقَ نَاصِرِ الْحَقِّ بِالْحَقِّ وَالْهَادِي إِلَى صِرَاطِكَ الْمُسْتَقِيمِ وَعَلَى آلِهِ حَقَّ قَدْرِهِ وَمِقْدَارِهِ الْعَظِيمِ",
          transliteration: "Allāhumma ṣalli wa sallim 'alā Sayyidinā Muḥammad al-Fātiḥi limā ughliq, wal-Khātimi limā sabaq, Nāṣiri al-ḥaqqi bil-ḥaqq, wal-Hādī ilā ṣirāṭika al-mustaqīm, wa 'alā ālihi ḥaqqa qadrihi wa miqdārihi al-'aẓīm.",
          translation: "O Allah, bestow blessings and peace upon our master Muhammad — the opener of what was closed, the seal of what preceded, the helper of truth by truth, and the guide to Your straight path — and upon his family, in accordance with his worth and his immense rank.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
    {
      id: "af-hailala",
      title: "La Ilaha Illallah",
      arabicTitle: "الهيللة",
      description: "The declaration of divine unity. Recite 100 times.",
      entries: [
        {
          id: "af-hailala-1",
          arabic: "لَا إِلَٰهَ إِلَّا اللَّهُ",
          transliteration: "Lā ilāha illallāh",
          translation: "There is no deity except Allah.",
          count: 100,
          source: "Wird al-Lazim — Tijaniyya",
        },
      ],
    },
  ],
};

const morningAdhkar: DhikrCollection = {
  id: "morning-adhkar",
  title: "Morning Adhkar",
  arabicTitle: "أذكار الصباح",
  subtitle: "After Fajr prayer",
  description: "Authenticated morning supplications from the Quran and Sunnah.",
  icon: "sunny",
  sections: [
    {
      id: "ma-opening",
      title: "Opening",
      arabicTitle: "البداية",
      entries: [
        {
          id: "ma-bika-asbahna",
          arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
          transliteration: "Allāhumma bika aṣbaḥnā wa bika amsaynā wa bika naḥyā wa bika namūtu wa ilayka an-nushūr",
          translation: "O Allah, by You we enter the morning, by You we enter the evening, by You we live, by You we die, and to You is the resurrection.",
          count: 1,
          source: "Abu Dawud 4/317",
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
          arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
          transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm. Lā ta'khudhuhu sinatun wa lā nawm.",
          translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep.",
          count: 1,
          isQuran: true,
          source: "Quran 2:255 — Ayat al-Kursi",
        },
        {
          id: "ma-ikhlas",
          arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ اللَّهُ الصَّمَدُ ۝ لَمْ يَلِدْ وَلَمْ يُولَدْ ۝ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",
          transliteration: "Qul huwallāhu aḥad. Allāhuṣ-ṣamad. Lam yalid wa lam yūlad. Wa lam yakun lahu kufuwan aḥad.",
          translation: "Say: He is Allah, One. Allah, the Eternal Refuge. He neither begets nor is born. Nor is there to Him any equivalent.",
          count: 3,
          isQuran: true,
          source: "Quran 112",
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
          source: "Muslim 4/2071",
        },
      ],
    },
  ],
};

const eveningAdhkar: DhikrCollection = {
  id: "evening-adhkar",
  title: "Evening Adhkar",
  arabicTitle: "أذكار المساء",
  subtitle: "After Asr prayer",
  description: "Authenticated evening supplications from the Quran and Sunnah.",
  icon: "moon",
  sections: [
    {
      id: "ea-opening",
      title: "Opening",
      arabicTitle: "البداية",
      entries: [
        {
          id: "ea-bika-amsayna",
          arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ",
          transliteration: "Allāhumma bika amsaynā wa bika aṣbaḥnā wa bika naḥyā wa bika namūtu wa ilayka al-maṣīr",
          translation: "O Allah, by You we enter the evening, by You we enter the morning, by You we live, by You we die, and to You is the final return.",
          count: 1,
          source: "Abu Dawud 4/317",
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
          arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
          transliteration: "Allāhu lā ilāha illā huwal-ḥayyul-qayyūm.",
          translation: "Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence.",
          count: 1,
          isQuran: true,
          source: "Quran 2:255",
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
      ],
    },
  ],
};

const dailyDuas: DhikrCollection = {
  id: "daily-duas",
  title: "Daily Duas",
  arabicTitle: "الأدعية اليومية",
  subtitle: "Quranic & Prophetic supplications",
  description: "Essential duas for everyday situations from the Quran and authentic Sunnah.",
  icon: "hand-left",
  sections: [
    {
      id: "dd-core",
      title: "Core Duas",
      arabicTitle: "الأدعية الأساسية",
      entries: [
        {
          id: "dd-rabbana-atina",
          arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          transliteration: "Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā 'adhāban-nār.",
          translation: "Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.",
          count: 1,
          isQuran: true,
          source: "Quran 2:201",
        },
        {
          id: "dd-rabbi-ishrah",
          arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
          transliteration: "Rabbi-shraḥ lī ṣadrī wa yassir lī amrī",
          translation: "My Lord, expand for me my chest and ease for me my task.",
          count: 1,
          isQuran: true,
          source: "Quran 20:25-26",
        },
        {
          id: "dd-hasbi",
          arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
          transliteration: "Ḥasbunallāhu wa ni'mal-wakīl",
          translation: "Allah is sufficient for us, and He is the best disposer of affairs.",
          count: 1,
          isQuran: true,
          source: "Quran 3:173",
        },
      ],
    },
    {
      id: "dd-situational",
      title: "Situational Duas",
      arabicTitle: "أدعية المواقف",
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
          id: "dd-before-sleep",
          arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
          transliteration: "Bismika Allāhumma amūtu wa aḥyā",
          translation: "In Your name, O Allah, I die and I live.",
          count: 1,
          source: "Bukhari 11/113 — Before sleeping",
        },
        {
          id: "dd-leaving-home",
          arabic: "بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ",
          transliteration: "Bismillāh, tawakkaltu 'alallāh, wa lā ḥawla wa lā quwwata illā billāh",
          translation: "In the name of Allah. I place my trust in Allah, and there is no might nor power except with Allah.",
          count: 1,
          source: "Abu Dawud 4/325 — Upon leaving the home",
        },
      ],
    },
  ],
};

export const DHIKR_COLLECTIONS: DhikrCollection[] = [
  auradFathiya,
  morningAdhkar,
  eveningAdhkar,
  dailyDuas,
];

export function getCollection(id: string): DhikrCollection | undefined {
  return DHIKR_COLLECTIONS.find((c) => c.id === id);
}
