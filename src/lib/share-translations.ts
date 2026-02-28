// ---------------------------------------------------------------------------
// Server-side translations for share emails and SMS messages.
// Covers all 23 supported locales. Falls back to Danish (da) for unknown locales.
// "Stem Palaestina" is kept as-is in every locale (it is the app name).
// ---------------------------------------------------------------------------

interface ShareEmail {
  subject: string;
  body: string;
}

// ---- Email translations ----------------------------------------------------

const emailTranslations: Record<string, (siteUrl: string) => ShareEmail> = {
  da: (siteUrl) => ({
    subject: "En vælger har delt Stem Palæstina med dig",
    body:
      `Hej,\n\n` +
      `En vælger på Stem Palæstina har valgt at dele appen med dig.\n\n` +
      `Stem Palæstina er en uafhængig afstemning hvor danske vælgere kan tage stilling til tre krav:\n\n` +
      `1. Anerkend Palæstina\n` +
      `2. Stop våbensalg til Israel\n` +
      `3. Stop ulovlige investeringer\n\n` +
      `Brug din stemme her:\n${siteUrl}\n\n` +
      `Med venlig hilsen\nStem Palæstina`,
  }),

  en: (siteUrl) => ({
    subject: "A vote from Stem Palaestina",
    body:
      `A voter on Stem Palaestina has chosen to share this with you.\n\n` +
      `It is an independent vote where Danish voters can take a stance on three demands:\n` +
      `1. Recognise Palestine\n` +
      `2. Stop arms sales to Israel\n` +
      `3. Stop illegal investments\n\n` +
      `Cast your vote here: ${siteUrl}\n\n` +
      `Kind regards,\nStem Palaestina`,
  }),

  zh: (siteUrl) => ({
    subject: "\u6765\u81EA Stem Palaestina \u7684\u6295\u7968\u9080\u8bf7",
    body:
      `Stem Palaestina \u4e0a\u7684\u4e00\u4f4d\u6295\u7968\u8005\u9009\u62e9\u4e0e\u60a8\u5206\u4eab\u6b64\u4fe1\u606f\u3002\n\n` +
      `\u8fd9\u662f\u4e00\u9879\u72ec\u7acb\u6295\u7968\uff0c\u4e39\u9ea6\u9009\u6c11\u53ef\u4ee5\u5c31\u4e09\u9879\u8981\u6c42\u8868\u660e\u7acb\u573a\uff1a\n` +
      `1. \u627f\u8ba4\u5df4\u52d2\u65af\u5766\n` +
      `2. \u505c\u6b62\u5411\u4ee5\u8272\u5217\u51fa\u552e\u6b66\u5668\n` +
      `3. \u505c\u6b62\u975e\u6cd5\u6295\u8d44\n\n` +
      `\u5728\u6b64\u6295\u7968\uff1a${siteUrl}\n\n` +
      `\u6b64\u81f4\uff0c\nStem Palaestina`,
  }),

  hi: (siteUrl) => ({
    subject: "Stem Palaestina \u0938\u0947 \u090f\u0915 \u0935\u094b\u091f",
    body:
      `Stem Palaestina \u092a\u0930 \u090f\u0915 \u092e\u0924\u0926\u093e\u0924\u093e \u0928\u0947 \u092f\u0939 \u0906\u092a\u0915\u0947 \u0938\u093e\u0925 \u0938\u093e\u091d\u093e \u0915\u0930\u0928\u0947 \u0915\u093e \u091a\u0941\u0928\u093e\u0935 \u0915\u093f\u092f\u093e \u0939\u0948\u0964\n\n` +
      `\u092f\u0939 \u090f\u0915 \u0938\u094d\u0935\u0924\u0902\u0924\u094d\u0930 \u092e\u0924\u0926\u093e\u0928 \u0939\u0948 \u091c\u0939\u093e\u0901 \u0921\u0947\u0928\u093f\u0936 \u092e\u0924\u0926\u093e\u0924\u093e \u0924\u0940\u0928 \u092e\u093e\u0902\u0917\u094b\u0902 \u092a\u0930 \u0905\u092a\u0928\u093e \u0930\u0941\u0916 \u0930\u0916 \u0938\u0915\u0924\u0947 \u0939\u0948\u0902:\n` +
      `1. \u092b\u093c\u093f\u0932\u093f\u0938\u094d\u0924\u0940\u0928 \u0915\u094b \u092e\u093e\u0928\u094d\u092f\u0924\u093e \u0926\u0947\u0902\n` +
      `2. \u0907\u0938\u094d\u0930\u093e\u0907\u0932 \u0915\u094b \u0939\u0925\u093f\u092f\u093e\u0930\u094b\u0902 \u0915\u0940 \u092c\u093f\u0915\u094d\u0930\u0940 \u092c\u0902\u0926 \u0915\u0930\u0947\u0902\n` +
      `3. \u0905\u0935\u0948\u0927 \u0928\u093f\u0935\u0947\u0936 \u092c\u0902\u0926 \u0915\u0930\u0947\u0902\n\n` +
      `\u092f\u0939\u093e\u0901 \u0905\u092a\u0928\u093e \u0935\u094b\u091f \u0926\u0947\u0902: ${siteUrl}\n\n` +
      `\u0938\u093e\u0926\u0930,\nStem Palaestina`,
  }),

  es: (siteUrl) => ({
    subject: "Un voto desde Stem Palaestina",
    body:
      `Un votante de Stem Palaestina ha decidido compartir esto contigo.\n\n` +
      `Es una votaci\u00f3n independiente en la que los votantes daneses pueden posicionarse sobre tres demandas:\n` +
      `1. Reconocer Palestina\n` +
      `2. Detener la venta de armas a Israel\n` +
      `3. Detener las inversiones ilegales\n\n` +
      `Emite tu voto aqu\u00ed: ${siteUrl}\n\n` +
      `Saludos cordiales,\nStem Palaestina`,
  }),

  ar: (siteUrl) => ({
    subject: "\u062a\u0635\u0648\u064a\u062a \u0645\u0646 Stem Palaestina",
    body:
      `\u0627\u062e\u062a\u0627\u0631 \u0623\u062d\u062f \u0627\u0644\u0645\u0635\u0648\u0651\u062a\u064a\u0646 \u0639\u0644\u0649 Stem Palaestina \u0645\u0634\u0627\u0631\u0643\u0629 \u0647\u0630\u0627 \u0645\u0639\u0643.\n\n` +
      `\u0625\u0646\u0647 \u062a\u0635\u0648\u064a\u062a \u0645\u0633\u062a\u0642\u0644 \u064a\u0645\u0643\u0646 \u0644\u0644\u0646\u0627\u062e\u0628\u064a\u0646 \u0627\u0644\u062f\u0627\u0646\u0645\u0627\u0631\u0643\u064a\u064a\u0646 \u0645\u0646 \u062e\u0644\u0627\u0644\u0647 \u0627\u062a\u062e\u0627\u0630 \u0645\u0648\u0642\u0641 \u0628\u0634\u0623\u0646 \u062b\u0644\u0627\u062b\u0629 \u0645\u0637\u0627\u0644\u0628:\n` +
      `1. \u0627\u0644\u0627\u0639\u062a\u0631\u0627\u0641 \u0628\u0641\u0644\u0633\u0637\u064a\u0646\n` +
      `2. \u0648\u0642\u0641 \u0628\u064a\u0639 \u0627\u0644\u0623\u0633\u0644\u062d\u0629 \u0644\u0625\u0633\u0631\u0627\u0626\u064a\u0644\n` +
      `3. \u0648\u0642\u0641 \u0627\u0644\u0627\u0633\u062a\u062b\u0645\u0627\u0631\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u0642\u0627\u0646\u0648\u0646\u064a\u0629\n\n` +
      `\u0623\u062f\u0644\u0650 \u0628\u0635\u0648\u062a\u0643 \u0647\u0646\u0627: ${siteUrl}\n\n` +
      `\u0645\u0639 \u062a\u062d\u064a\u0627\u062a\u064a\u060c\nStem Palaestina`,
  }),

  fr: (siteUrl) => ({
    subject: "Un vote depuis Stem Palaestina",
    body:
      `Un \u00e9lecteur sur Stem Palaestina a choisi de partager ceci avec vous.\n\n` +
      `Il s\u2019agit d\u2019un vote ind\u00e9pendant o\u00f9 les \u00e9lecteurs danois peuvent se prononcer sur trois revendications :\n` +
      `1. Reconna\u00eetre la Palestine\n` +
      `2. Arr\u00eater les ventes d\u2019armes \u00e0 Isra\u00ebl\n` +
      `3. Arr\u00eater les investissements ill\u00e9gaux\n\n` +
      `Votez ici : ${siteUrl}\n\n` +
      `Cordialement,\nStem Palaestina`,
  }),

  bn: (siteUrl) => ({
    subject: "Stem Palaestina \u09a5\u09c7\u0995\u09c7 \u098f\u0995\u099f\u09bf \u09ad\u09cb\u099f",
    body:
      `Stem Palaestina-\u098f\u09b0 \u098f\u0995\u099c\u09a8 \u09ad\u09cb\u099f\u09be\u09b0 \u098f\u099f\u09bf \u0986\u09aa\u09a8\u09be\u09b0 \u09b8\u09be\u09a5\u09c7 \u09b6\u09c7\u09af\u09bc\u09be\u09b0 \u0995\u09b0\u09a4\u09c7 \u099a\u09c7\u09af\u09bc\u09c7\u099b\u09c7\u09a8\u0964\n\n` +
      `\u098f\u099f\u09bf \u098f\u0995\u099f\u09bf \u09b8\u09cd\u09ac\u09be\u09a7\u09c0\u09a8 \u09ad\u09cb\u099f \u09af\u09c7\u0996\u09be\u09a8\u09c7 \u09a1\u09c7\u09a8\u09bf\u09b6 \u09ad\u09cb\u099f\u09be\u09b0\u09b0\u09be \u09a4\u09bf\u09a8\u099f\u09bf \u09a6\u09be\u09ac\u09bf\u09b0 \u09ac\u09bf\u09b7\u09af\u09bc\u09c7 \u09a4\u09be\u09a6\u09c7\u09b0 \u0985\u09ac\u09b8\u09cd\u09a5\u09be\u09a8 \u099c\u09be\u09a8\u09be\u09a4\u09c7 \u09aa\u09be\u09b0\u09c7\u09a8:\n` +
      `\u09e7. \u09ab\u09bf\u09b2\u09bf\u09b8\u09cd\u09a4\u09bf\u09a8\u0995\u09c7 \u09b8\u09cd\u09ac\u09c0\u0995\u09c3\u09a4\u09bf \u09a6\u09bf\u09a8\n` +
      `\u09e8. \u0987\u09b8\u09b0\u09be\u09af\u09bc\u09c7\u09b2\u09c7 \u0985\u09b8\u09cd\u09a4\u09cd\u09b0 \u09ac\u09bf\u0995\u09cd\u09b0\u09bf \u09ac\u09a8\u09cd\u09a7 \u0995\u09b0\u09c1\u09a8\n` +
      `\u09e9. \u0985\u09ac\u09c8\u09a7 \u09ac\u09bf\u09a8\u09bf\u09af\u09bc\u09cb\u0997 \u09ac\u09a8\u09cd\u09a7 \u0995\u09b0\u09c1\u09a8\n\n` +
      `\u098f\u0996\u09be\u09a8\u09c7 \u0986\u09aa\u09a8\u09be\u09b0 \u09ad\u09cb\u099f \u09a6\u09bf\u09a8: ${siteUrl}\n\n` +
      `\u09b6\u09c1\u09ad\u09c7\u099a\u09cd\u099b\u09be \u09b8\u09b9,\nStem Palaestina`,
  }),

  pt: (siteUrl) => ({
    subject: "Um voto de Stem Palaestina",
    body:
      `Um eleitor do Stem Palaestina escolheu partilhar isto consigo.\n\n` +
      `Trata-se de uma vota\u00e7\u00e3o independente onde os eleitores dinamarqueses podem tomar posi\u00e7\u00e3o sobre tr\u00eas exig\u00eancias:\n` +
      `1. Reconhecer a Palestina\n` +
      `2. Parar a venda de armas a Israel\n` +
      `3. Parar investimentos ilegais\n\n` +
      `Vote aqui: ${siteUrl}\n\n` +
      `Com os melhores cumprimentos,\nStem Palaestina`,
  }),

  ru: (siteUrl) => ({
    subject: "\u0413\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u043d\u0438\u0435 \u043e\u0442 Stem Palaestina",
    body:
      `\u0418\u0437\u0431\u0438\u0440\u0430\u0442\u0435\u043b\u044c \u043d\u0430 Stem Palaestina \u0440\u0435\u0448\u0438\u043b \u043f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f \u044d\u0442\u0438\u043c \u0441 \u0432\u0430\u043c\u0438.\n\n` +
      `\u042d\u0442\u043e \u043d\u0435\u0437\u0430\u0432\u0438\u0441\u0438\u043c\u043e\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u0430\u043d\u0438\u0435, \u0432 \u043a\u043e\u0442\u043e\u0440\u043e\u043c \u0434\u0430\u0442\u0441\u043a\u0438\u0435 \u0438\u0437\u0431\u0438\u0440\u0430\u0442\u0435\u043b\u0438 \u043c\u043e\u0433\u0443\u0442 \u0432\u044b\u0441\u043a\u0430\u0437\u0430\u0442\u044c\u0441\u044f \u043f\u043e \u0442\u0440\u0451\u043c \u0442\u0440\u0435\u0431\u043e\u0432\u0430\u043d\u0438\u044f\u043c:\n` +
      `1. \u041f\u0440\u0438\u0437\u043d\u0430\u0442\u044c \u041f\u0430\u043b\u0435\u0441\u0442\u0438\u043d\u0443\n` +
      `2. \u041f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c \u043f\u0440\u043e\u0434\u0430\u0436\u0443 \u043e\u0440\u0443\u0436\u0438\u044f \u0418\u0437\u0440\u0430\u0438\u043b\u044e\n` +
      `3. \u041f\u0440\u0435\u043a\u0440\u0430\u0442\u0438\u0442\u044c \u043d\u0435\u0437\u0430\u043a\u043e\u043d\u043d\u044b\u0435 \u0438\u043d\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0438\n\n` +
      `\u041f\u0440\u043e\u0433\u043e\u043b\u043e\u0441\u0443\u0439\u0442\u0435 \u0437\u0434\u0435\u0441\u044c: ${siteUrl}\n\n` +
      `\u0421 \u0443\u0432\u0430\u0436\u0435\u043d\u0438\u0435\u043c,\nStem Palaestina`,
  }),

  ur: (siteUrl) => ({
    subject: "Stem Palaestina \u0633\u06d2 \u0627\u06cc\u06a9 \u0648\u0648\u0679",
    body:
      `Stem Palaestina \u067e\u0631 \u0627\u06cc\u06a9 \u0648\u0648\u0679\u0631 \u0646\u06d2 \u06cc\u06c1 \u0622\u067e \u06a9\u06d2 \u0633\u0627\u062a\u06be \u0634\u06cc\u0626\u0631 \u06a9\u0631\u0646\u06d2 \u06a9\u0627 \u0641\u06cc\u0635\u0644\u06c1 \u06a9\u06cc\u0627 \u06c1\u06d2\u06d4\n\n` +
      `\u06cc\u06c1 \u0627\u06cc\u06a9 \u0622\u0632\u0627\u062f \u0648\u0648\u0679 \u06c1\u06d2 \u062c\u0633 \u0645\u06cc\u06ba \u0688\u06cc\u0646\u0634 \u0648\u0648\u0679\u0631\u0632 \u062a\u06cc\u0646 \u0645\u0637\u0627\u0644\u0628\u0627\u062a \u067e\u0631 \u0627\u067e\u0646\u0627 \u0645\u0624\u0642\u0641 \u0638\u0627\u06c1\u0631 \u06a9\u0631 \u0633\u06a9\u062a\u06d2 \u06c1\u06cc\u06ba:\n` +
      `1. \u0641\u0644\u0633\u0637\u06cc\u0646 \u06a9\u0648 \u062a\u0633\u0644\u06cc\u0645 \u06a9\u0631\u06cc\u06ba\n` +
      `2. \u0627\u0633\u0631\u0627\u0626\u06cc\u0644 \u06a9\u0648 \u06c1\u062a\u06be\u06cc\u0627\u0631\u0648\u06ba \u06a9\u06cc \u0641\u0631\u0648\u062e\u062a \u0628\u0646\u062f \u06a9\u0631\u06cc\u06ba\n` +
      `3. \u063a\u06cc\u0631 \u0642\u0627\u0646\u0648\u0646\u06cc \u0633\u0631\u0645\u0627\u06cc\u06c1 \u06a9\u0627\u0631\u06cc \u0628\u0646\u062f \u06a9\u0631\u06cc\u06ba\n\n` +
      `\u06cc\u06c1\u0627\u06ba \u0627\u067e\u0646\u0627 \u0648\u0648\u0679 \u062f\u06cc\u06ba: ${siteUrl}\n\n` +
      `\u0646\u06cc\u06a9 \u062e\u0648\u0627\u06c1\u0634\u0627\u062a\u060c\nStem Palaestina`,
  }),

  id: (siteUrl) => ({
    subject: "Sebuah suara dari Stem Palaestina",
    body:
      `Seorang pemilih di Stem Palaestina telah memilih untuk membagikan ini kepada Anda.\n\n` +
      `Ini adalah pemungutan suara independen di mana pemilih Denmark dapat menyatakan sikap terhadap tiga tuntutan:\n` +
      `1. Akui Palestina\n` +
      `2. Hentikan penjualan senjata ke Israel\n` +
      `3. Hentikan investasi ilegal\n\n` +
      `Berikan suara Anda di sini: ${siteUrl}\n\n` +
      `Salam hormat,\nStem Palaestina`,
  }),

  de: (siteUrl) => ({
    subject: "Eine Stimme von Stem Palaestina",
    body:
      `Ein W\u00e4hler auf Stem Palaestina hat sich entschieden, dies mit Ihnen zu teilen.\n\n` +
      `Es handelt sich um eine unabh\u00e4ngige Abstimmung, bei der d\u00e4nische W\u00e4hler zu drei Forderungen Stellung nehmen k\u00f6nnen:\n` +
      `1. Pal\u00e4stina anerkennen\n` +
      `2. Waffenverk\u00e4ufe an Israel stoppen\n` +
      `3. Illegale Investitionen stoppen\n\n` +
      `Geben Sie hier Ihre Stimme ab: ${siteUrl}\n\n` +
      `Mit freundlichen Gr\u00fc\u00dfen,\nStem Palaestina`,
  }),

  ja: (siteUrl) => ({
    subject: "Stem Palaestina \u304b\u3089\u306e\u6295\u7968\u306e\u304a\u77e5\u3089\u305b",
    body:
      `Stem Palaestina \u306e\u6295\u7968\u8005\u304c\u3042\u306a\u305f\u3068\u3053\u308c\u3092\u5171\u6709\u3059\u308b\u3053\u3068\u3092\u9078\u3073\u307e\u3057\u305f\u3002\n\n` +
      `\u3053\u308c\u306f\u30c7\u30f3\u30de\u30fc\u30af\u306e\u6709\u6a29\u8005\u304c\u4e09\u3064\u306e\u8981\u6c42\u306b\u3064\u3044\u3066\u614b\u5ea6\u3092\u8868\u660e\u3067\u304d\u308b\u72ec\u7acb\u3057\u305f\u6295\u7968\u3067\u3059\uff1a\n` +
      `1. \u30d1\u30ec\u30b9\u30c1\u30ca\u3092\u627f\u8a8d\u3059\u308b\n` +
      `2. \u30a4\u30b9\u30e9\u30a8\u30eb\u3078\u306e\u6b66\u5668\u58f2\u5374\u3092\u505c\u6b62\u3059\u308b\n` +
      `3. \u9055\u6cd5\u306a\u6295\u8cc7\u3092\u505c\u6b62\u3059\u308b\n\n` +
      `\u3053\u3061\u3089\u3067\u6295\u7968\u3057\u3066\u304f\u3060\u3055\u3044\uff1a${siteUrl}\n\n` +
      `\u3088\u308d\u3057\u304f\u304a\u9858\u3044\u3044\u305f\u3057\u307e\u3059\u3002\nStem Palaestina`,
  }),

  sw: (siteUrl) => ({
    subject: "Kura kutoka Stem Palaestina",
    body:
      `Mpiga kura kwenye Stem Palaestina amechagua kushiriki hii nawe.\n\n` +
      `Hii ni kura huru ambapo wapiga kura wa Denmark wanaweza kutoa msimamo wao kuhusu madai matatu:\n` +
      `1. Kutambua Palestina\n` +
      `2. Kusimamisha mauzo ya silaha kwa Israeli\n` +
      `3. Kusimamisha uwekezaji haramu\n\n` +
      `Piga kura yako hapa: ${siteUrl}\n\n` +
      `Salamu njema,\nStem Palaestina`,
  }),

  vi: (siteUrl) => ({
    subject: "M\u1ed9t phi\u1ebfu b\u1ea7u t\u1eeb Stem Palaestina",
    body:
      `M\u1ed9t c\u1eed tri tr\u00ean Stem Palaestina \u0111\u00e3 ch\u1ecdn chia s\u1ebb \u0111i\u1ec1u n\u00e0y v\u1edbi b\u1ea1n.\n\n` +
      `\u0110\u00e2y l\u00e0 m\u1ed9t cu\u1ed9c b\u1ecf phi\u1ebfu \u0111\u1ed9c l\u1eadp, n\u01a1i c\u1eed tri \u0110an M\u1ea1ch c\u00f3 th\u1ec3 b\u00e0y t\u1ecf l\u1eadp tr\u01b0\u1eddng v\u1ec1 ba y\u00eau c\u1ea7u:\n` +
      `1. C\u00f4ng nh\u1eadn Palestine\n` +
      `2. Ng\u1eebng b\u00e1n v\u0169 kh\u00ed cho Israel\n` +
      `3. Ng\u1eebng \u0111\u1ea7u t\u01b0 b\u1ea5t h\u1ee3p ph\u00e1p\n\n` +
      `B\u1ecf phi\u1ebfu t\u1ea1i \u0111\u00e2y: ${siteUrl}\n\n` +
      `Tr\u00e2n tr\u1ecdng,\nStem Palaestina`,
  }),

  tr: (siteUrl) => ({
    subject: "Stem Palaestina'dan bir oy",
    body:
      `Stem Palaestina'\u0131ndaki bir se\u00e7men bunu sizinle payla\u015fmay\u0131 se\u00e7ti.\n\n` +
      `Bu, Danimarkal\u0131 se\u00e7menlerin \u00fc\u00e7 talep hakk\u0131nda tavr\u0131n\u0131 ortaya koyabilece\u011fi ba\u011f\u0131ms\u0131z bir oylamad\u0131r:\n` +
      `1. Filistin'i tan\u0131y\u0131n\n` +
      `2. \u0130srail'e silah sat\u0131\u015f\u0131n\u0131 durdurun\n` +
      `3. Yasad\u0131\u015f\u0131 yat\u0131r\u0131mlar\u0131 durdurun\n\n` +
      `Oyunuzu burada kullan\u0131n: ${siteUrl}\n\n` +
      `Sayg\u0131larla,\nStem Palaestina`,
  }),

  ko: (siteUrl) => ({
    subject: "Stem Palaestina\uc5d0\uc11c \uc628 \ud22c\ud45c \uc548\ub0b4",
    body:
      `Stem Palaestina\uc758 \ud55c \ud22c\ud45c\uc790\uac00 \uc774\uac83\uc744 \uadc0\ud558\uc640 \uacf5\uc720\ud558\uae30\ub85c \ud588\uc2b5\ub2c8\ub2e4.\n\n` +
      `\uc774\uac83\uc740 \ub374\ub9c8\ud06c \uc720\uad8c\uc790\ub4e4\uc774 \uc138 \uac00\uc9c0 \uc694\uad6c\uc5d0 \ub300\ud574 \uc785\uc7a5\uc744 \ud45c\uba85\ud560 \uc218 \uc788\ub294 \ub3c5\ub9bd \ud22c\ud45c\uc785\ub2c8\ub2e4:\n` +
      `1. \ud314\ub808\uc2a4\ud0c0\uc778 \uc778\uc815\n` +
      `2. \uc774\uc2a4\ub77c\uc5d8\uc5d0 \ub300\ud55c \ubb34\uae30 \ud310\ub9e4 \uc911\ub2e8\n` +
      `3. \ubd88\ubc95 \ud22c\uc790 \uc911\ub2e8\n\n` +
      `\uc5ec\uae30\uc11c \ud22c\ud45c\ud558\uc138\uc694: ${siteUrl}\n\n` +
      `\uac10\uc0ac\ud569\ub2c8\ub2e4,\nStem Palaestina`,
  }),

  ta: (siteUrl) => ({
    subject: "Stem Palaestina \u0b87\u0bb2\u0bbf\u0bb0\u0bc1\u0ba8\u0bcd\u0ba4\u0bc1 \u0b92\u0bb0\u0bc1 \u0b93\u0b9f\u0bcd\u0b9f\u0bc1",
    body:
      `Stem Palaestina \u0b87\u0bb2\u0bcd \u0b92\u0bb0\u0bc1 \u0b93\u0b9f\u0bcd\u0b9f\u0bbe\u0bb3\u0bb0\u0bcd \u0b87\u0ba4\u0bc8 \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b9f\u0ba9\u0bcd \u0baa\u0b95\u0bbf\u0bb0\u0bcd\u0ba8\u0bcd\u0ba4\u0bc1\u0b95\u0bca\u0bb3\u0bcd\u0bb3 \u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0ba4\u0bbe\u0bb0\u0bcd.\n\n` +
      `\u0b87\u0ba4\u0bc1 \u0b92\u0bb0\u0bc1 \u0b9a\u0bc1\u0ba4\u0ba8\u0bcd\u0ba4\u0bbf\u0bb0\u0bae\u0bbe\u0ba9 \u0b93\u0b9f\u0bcd\u0b9f\u0bc6\u0b9f\u0bc1\u0baa\u0bcd\u0baa\u0bc1, \u0b87\u0ba4\u0bbf\u0bb2\u0bcd \u0b9f\u0bc7\u0ba9\u0bbf\u0bb7\u0bcd \u0b93\u0b9f\u0bcd\u0b9f\u0bbe\u0bb3\u0bb0\u0bcd\u0b95\u0bb3\u0bcd \u0bae\u0bc2\u0ba9\u0bcd\u0bb1\u0bc1 \u0b95\u0bcb\u0bb0\u0bbf\u0b95\u0bcd\u0b95\u0bc8\u0b95\u0bb3\u0bcd \u0baa\u0bb1\u0bcd\u0bb1\u0bbf \u0ba4\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0ba8\u0bbf\u0bb2\u0bc8\u0baa\u0bcd\u0baa\u0bbe\u0b9f\u0bcd\u0b9f\u0bc8 \u0ba4\u0bc6\u0bb0\u0bbf\u0bb5\u0bbf\u0b95\u0bcd\u0b95\u0bb2\u0bbe\u0bae\u0bcd:\n` +
      `1. \u0baa\u0bbe\u0bb2\u0bb8\u0bcd\u0ba4\u0bc0\u0ba9\u0ba4\u0bcd\u0ba4\u0bc8 \u0b85\u0b99\u0bcd\u0b95\u0bc0\u0b95\u0bb0\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd\n` +
      `2. \u0b87\u0bb8\u0bcd\u0bb0\u0bc7\u0bb2\u0bc1\u0b95\u0bcd\u0b95\u0bc1 \u0b86\u0baf\u0bc1\u0ba4 \u0bb5\u0bbf\u0bb1\u0bcd\u0baa\u0ba9\u0bc8\u0baf\u0bc8 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bb5\u0bc1\u0bae\u0bcd\n` +
      `3. \u0b9a\u0b9f\u0bcd\u0b9f\u0bb5\u0bbf\u0bb0\u0bcb\u0ba4 \u0bae\u0bc1\u0ba4\u0bb2\u0bc0\u0b9f\u0bc1\u0b95\u0bb3\u0bc8 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bb5\u0bc1\u0bae\u0bcd\n\n` +
      `\u0b87\u0b99\u0bcd\u0b95\u0bc7 \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bcd \u0b93\u0b9f\u0bcd\u0b9f\u0bc8 \u0baa\u0ba4\u0bbf\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd: ${siteUrl}\n\n` +
      `\u0ba8\u0ba9\u0bcd\u0bb1\u0bbf\u0b95\u0bb3\u0bc1\u0b9f\u0ba9\u0bcd,\nStem Palaestina`,
  }),

  th: (siteUrl) => ({
    subject: "\u0e01\u0e32\u0e23\u0e42\u0e2b\u0e27\u0e15\u0e08\u0e32\u0e01 Stem Palaestina",
    body:
      `\u0e1c\u0e39\u0e49\u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e1a\u0e19 Stem Palaestina \u0e40\u0e25\u0e37\u0e2d\u0e01\u0e17\u0e35\u0e48\u0e08\u0e30\u0e41\u0e1a\u0e48\u0e07\u0e1b\u0e31\u0e19\u0e2a\u0e34\u0e48\u0e07\u0e19\u0e35\u0e49\u0e01\u0e31\u0e1a\u0e04\u0e38\u0e13\n\n` +
      `\u0e19\u0e35\u0e48\u0e04\u0e37\u0e2d\u0e01\u0e32\u0e23\u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e2d\u0e34\u0e2a\u0e23\u0e30\u0e17\u0e35\u0e48\u0e1c\u0e39\u0e49\u0e21\u0e35\u0e2a\u0e34\u0e17\u0e18\u0e34\u0e4c\u0e40\u0e25\u0e37\u0e2d\u0e01\u0e15\u0e31\u0e49\u0e07\u0e0a\u0e32\u0e27\u0e40\u0e14\u0e19\u0e21\u0e32\u0e23\u0e4c\u0e01\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e41\u0e2a\u0e14\u0e07\u0e08\u0e38\u0e14\u0e22\u0e37\u0e19\u0e15\u0e48\u0e2d\u0e02\u0e49\u0e2d\u0e40\u0e23\u0e35\u0e22\u0e01\u0e23\u0e49\u0e2d\u0e07\u0e2a\u0e32\u0e21\u0e1b\u0e23\u0e30\u0e01\u0e32\u0e23:\n` +
      `1. \u0e23\u0e31\u0e1a\u0e23\u0e2d\u0e07\u0e1b\u0e32\u0e40\u0e25\u0e2a\u0e44\u0e15\u0e19\u0e4c\n` +
      `2. \u0e2b\u0e22\u0e38\u0e14\u0e01\u0e32\u0e23\u0e02\u0e32\u0e22\u0e2d\u0e32\u0e27\u0e38\u0e18\u0e43\u0e2b\u0e49\u0e2d\u0e34\u0e2a\u0e23\u0e32\u0e40\u0e2d\u0e25\n` +
      `3. \u0e2b\u0e22\u0e38\u0e14\u0e01\u0e32\u0e23\u0e25\u0e07\u0e17\u0e38\u0e19\u0e17\u0e35\u0e48\u0e1c\u0e34\u0e14\u0e01\u0e0e\u0e2b\u0e21\u0e32\u0e22\n\n` +
      `\u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48: ${siteUrl}\n\n` +
      `\u0e14\u0e49\u0e27\u0e22\u0e04\u0e27\u0e32\u0e21\u0e19\u0e31\u0e1a\u0e16\u0e37\u0e2d,\nStem Palaestina`,
  }),

  fa: (siteUrl) => ({
    subject: "\u06cc\u06a9 \u0631\u0623\u06cc \u0627\u0632 Stem Palaestina",
    body:
      `\u06cc\u06a9 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u0647 \u062f\u0631 Stem Palaestina \u062a\u0635\u0645\u06cc\u0645 \u06af\u0631\u0641\u062a\u0647 \u0627\u06cc\u0646 \u0631\u0627 \u0628\u0627 \u0634\u0645\u0627 \u0628\u0647 \u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u06af\u0630\u0627\u0631\u062f.\n\n` +
      `\u0627\u06cc\u0646 \u06cc\u06a9 \u0631\u0623\u06cc\u200c\u06af\u06cc\u0631\u06cc \u0645\u0633\u062a\u0642\u0644 \u0627\u0633\u062a \u06a9\u0647 \u062f\u0631 \u0622\u0646 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u06af\u0627\u0646 \u062f\u0627\u0646\u0645\u0627\u0631\u06a9\u06cc \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u0646\u062f \u062f\u0631\u0628\u0627\u0631\u0647 \u0633\u0647 \u062e\u0648\u0627\u0633\u062a\u0647 \u0645\u0648\u0636\u0639\u200c\u06af\u06cc\u0631\u06cc \u06a9\u0646\u0646\u062f:\n` +
      `\u06f1. \u0628\u0647 \u0631\u0633\u0645\u06cc\u062a \u0634\u0646\u0627\u062e\u062a\u0646 \u0641\u0644\u0633\u0637\u06cc\u0646\n` +
      `\u06f2. \u062a\u0648\u0642\u0641 \u0641\u0631\u0648\u0634 \u0633\u0644\u0627\u062d \u0628\u0647 \u0627\u0633\u0631\u0627\u0626\u06cc\u0644\n` +
      `\u06f3. \u062a\u0648\u0642\u0641 \u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc\u200c\u0647\u0627\u06cc \u063a\u06cc\u0631\u0642\u0627\u0646\u0648\u0646\u06cc\n\n` +
      `\u0631\u0623\u06cc \u062e\u0648\u062f \u0631\u0627 \u0627\u06cc\u0646\u062c\u0627 \u062b\u0628\u062a \u06a9\u0646\u06cc\u062f: ${siteUrl}\n\n` +
      `\u0628\u0627 \u0627\u062d\u062a\u0631\u0627\u0645\u060c\nStem Palaestina`,
  }),

  prs: (siteUrl) => ({
    subject: "\u06cc\u06a9 \u0631\u0623\u06cc \u0627\u0632 Stem Palaestina",
    body:
      `\u06cc\u06a9 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u0647 \u062f\u0631 Stem Palaestina \u062a\u0635\u0645\u06cc\u0645 \u06af\u0631\u0641\u062a\u0647 \u0627\u06cc\u0646 \u0631\u0627 \u0628\u0627 \u0634\u0645\u0627 \u0634\u0631\u06cc\u06a9 \u0633\u0627\u0632\u062f.\n\n` +
      `\u0627\u06cc\u0646 \u06cc\u06a9 \u0631\u0623\u06cc\u200c\u06af\u06cc\u0631\u06cc \u0645\u0633\u062a\u0642\u0644 \u0627\u0633\u062a \u06a9\u0647 \u062f\u0631 \u0622\u0646 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u06af\u0627\u0646 \u062f\u0627\u0646\u0645\u0627\u0631\u06a9\u06cc \u0645\u06cc\u200c\u062a\u0648\u0627\u0646\u0646\u062f \u062f\u0631\u0628\u0627\u0631\u0647\u0654 \u0633\u0647 \u062e\u0648\u0627\u0633\u062a \u0645\u0648\u0636\u0639\u200c\u06af\u06cc\u0631\u06cc \u06a9\u0646\u0646\u062f:\n` +
      `\u06f1. \u0628\u0647 \u0631\u0633\u0645\u06cc\u062a \u0634\u0646\u0627\u062e\u062a\u0646 \u0641\u0644\u0633\u0637\u06cc\u0646\n` +
      `\u06f2. \u062a\u0648\u0642\u0641 \u0641\u0631\u0648\u0634 \u0633\u0644\u0627\u062d \u0628\u0647 \u0627\u0633\u0631\u0627\u06cc\u06cc\u0644\n` +
      `\u06f3. \u062a\u0648\u0642\u0641 \u0633\u0631\u0645\u0627\u06cc\u0647\u200c\u06af\u0630\u0627\u0631\u06cc\u200c\u0647\u0627\u06cc \u063a\u06cc\u0631\u0642\u0627\u0646\u0648\u0646\u06cc\n\n` +
      `\u0631\u0623\u06cc \u062e\u0648\u062f \u0631\u0627 \u0627\u06cc\u0646\u062c\u0627 \u062b\u0628\u062a \u06a9\u0646\u06cc\u062f: ${siteUrl}\n\n` +
      `\u0628\u0627 \u0627\u062d\u062a\u0631\u0627\u0645\u060c\nStem Palaestina`,
  }),

  bs: (siteUrl) => ({
    subject: "Glas sa Stem Palaestina",
    body:
      `Jedan glasa\u010d na Stem Palaestina odlu\u010dio je podijeliti ovo s vama.\n\n` +
      `Ovo je nezavisno glasanje gdje danski glasa\u010di mogu zauzeti stav o tri zahtjeva:\n` +
      `1. Priznati Palestinu\n` +
      `2. Zaustaviti prodaju oru\u017eja Izraelu\n` +
      `3. Zaustaviti nezakonita ulaganja\n\n` +
      `Glasajte ovdje: ${siteUrl}\n\n` +
      `Srdačan pozdrav,\nStem Palaestina`,
  }),
};

// ---- Share SMS translations ------------------------------------------------

const shareSmsTranslations: Record<string, (url: string) => string> = {
  da: (url) =>
    `Stem Palæstina: En vælger har delt appen med dig. Brug din stemme her: ${url}`,
  en: (url) =>
    `Stem Palaestina: A voter has shared the app with you. Cast your vote here: ${url}`,
  zh: (url) =>
    `Stem Palaestina: \u4e00\u4f4d\u6295\u7968\u8005\u4e0e\u60a8\u5206\u4eab\u4e86\u8be5\u5e94\u7528\u3002\u5728\u6b64\u6295\u7968\uff1a${url}`,
  hi: (url) =>
    `Stem Palaestina: \u090f\u0915 \u092e\u0924\u0926\u093e\u0924\u093e \u0928\u0947 \u0906\u092a\u0915\u0947 \u0938\u093e\u0925 \u0910\u092a \u0938\u093e\u091d\u093e \u0915\u0940 \u0939\u0948\u0964 \u092f\u0939\u093e\u0901 \u0935\u094b\u091f \u0915\u0930\u0947\u0902: ${url}`,
  es: (url) =>
    `Stem Palaestina: Un votante ha compartido la app contigo. Vota aqu\u00ed: ${url}`,
  ar: (url) =>
    `Stem Palaestina: \u0634\u0627\u0631\u0643\u0643 \u0623\u062d\u062f \u0627\u0644\u0645\u0635\u0648\u0651\u062a\u064a\u0646 \u0627\u0644\u062a\u0637\u0628\u064a\u0642. \u0635\u0648\u0651\u062a \u0647\u0646\u0627: ${url}`,
  fr: (url) =>
    `Stem Palaestina: Un \u00e9lecteur a partag\u00e9 l\u2019appli avec vous. Votez ici : ${url}`,
  bn: (url) =>
    `Stem Palaestina: \u098f\u0995\u099c\u09a8 \u09ad\u09cb\u099f\u09be\u09b0 \u0986\u09aa\u09a8\u09be\u09b0 \u09b8\u09be\u09a5\u09c7 \u0985\u09cd\u09af\u09be\u09aa\u099f\u09bf \u09b6\u09c7\u09af\u09bc\u09be\u09b0 \u0995\u09b0\u09c7\u099b\u09c7\u09a8\u0964 \u098f\u0996\u09be\u09a8\u09c7 \u09ad\u09cb\u099f \u09a6\u09bf\u09a8: ${url}`,
  pt: (url) =>
    `Stem Palaestina: Um eleitor partilhou a app consigo. Vote aqui: ${url}`,
  ru: (url) =>
    `Stem Palaestina: \u0418\u0437\u0431\u0438\u0440\u0430\u0442\u0435\u043b\u044c \u043f\u043e\u0434\u0435\u043b\u0438\u043b\u0441\u044f \u0441 \u0432\u0430\u043c\u0438 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435\u043c. \u041f\u0440\u043e\u0433\u043e\u043b\u043e\u0441\u0443\u0439\u0442\u0435 \u0437\u0434\u0435\u0441\u044c: ${url}`,
  ur: (url) =>
    `Stem Palaestina: \u0627\u06cc\u06a9 \u0648\u0648\u0679\u0631 \u0646\u06d2 \u0627\u06cc\u067e \u0622\u067e \u06a9\u06d2 \u0633\u0627\u062a\u06be \u0634\u06cc\u0626\u0631 \u06a9\u06cc\u06d4 \u06cc\u06c1\u0627\u06ba \u0648\u0648\u0679 \u06a9\u0631\u06cc\u06ba: ${url}`,
  id: (url) =>
    `Stem Palaestina: Seorang pemilih telah membagikan aplikasi ini kepada Anda. Berikan suara di sini: ${url}`,
  de: (url) =>
    `Stem Palaestina: Ein W\u00e4hler hat die App mit Ihnen geteilt. Stimmen Sie hier ab: ${url}`,
  ja: (url) =>
    `Stem Palaestina: \u6295\u7968\u8005\u304c\u3042\u306a\u305f\u3068\u30a2\u30d7\u30ea\u3092\u5171\u6709\u3057\u307e\u3057\u305f\u3002\u3053\u3061\u3089\u3067\u6295\u7968: ${url}`,
  sw: (url) =>
    `Stem Palaestina: Mpiga kura ameshiriki programu nawe. Piga kura hapa: ${url}`,
  vi: (url) =>
    `Stem Palaestina: M\u1ed9t c\u1eed tri \u0111\u00e3 chia s\u1ebb \u1ee9ng d\u1ee5ng v\u1edbi b\u1ea1n. B\u1ecf phi\u1ebfu t\u1ea1i \u0111\u00e2y: ${url}`,
  tr: (url) =>
    `Stem Palaestina: Bir se\u00e7men uygulamay\u0131 sizinle payla\u015ft\u0131. Oyunuzu burada kullan\u0131n: ${url}`,
  ko: (url) =>
    `Stem Palaestina: \ud55c \ud22c\ud45c\uc790\uac00 \uc571\uc744 \uacf5\uc720\ud588\uc2b5\ub2c8\ub2e4. \uc5ec\uae30\uc11c \ud22c\ud45c\ud558\uc138\uc694: ${url}`,
  ta: (url) =>
    `Stem Palaestina: \u0b92\u0bb0\u0bc1 \u0b93\u0b9f\u0bcd\u0b9f\u0bbe\u0bb3\u0bb0\u0bcd \u0b89\u0b99\u0bcd\u0b95\u0bb3\u0bc1\u0b9f\u0ba9\u0bcd \u0b85\u0baa\u0bcd\u0bb3\u0bbf\u0b95\u0bc7\u0bb7\u0ba9\u0bc8 \u0baa\u0b95\u0bbf\u0bb0\u0bcd\u0ba8\u0bcd\u0ba4\u0bbe\u0bb0\u0bcd. \u0b87\u0b99\u0bcd\u0b95\u0bc7 \u0b93\u0b9f\u0bcd\u0b9f\u0bb3\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd: ${url}`,
  th: (url) =>
    `Stem Palaestina: \u0e1c\u0e39\u0e49\u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e41\u0e1a\u0e48\u0e07\u0e1b\u0e31\u0e19\u0e41\u0e2d\u0e1b\u0e43\u0e2b\u0e49\u0e04\u0e38\u0e13 \u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48: ${url}`,
  fa: (url) =>
    `Stem Palaestina: \u06cc\u06a9 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u0647 \u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646 \u0631\u0627 \u0628\u0627 \u0634\u0645\u0627 \u0628\u0647 \u0627\u0634\u062a\u0631\u0627\u06a9 \u06af\u0630\u0627\u0634\u062a. \u0627\u06cc\u0646\u062c\u0627 \u0631\u0623\u06cc \u062f\u0647\u06cc\u062f: ${url}`,
  prs: (url) =>
    `Stem Palaestina: \u06cc\u06a9 \u0631\u0623\u06cc\u200c\u062f\u0647\u0646\u062f\u0647 \u0627\u067e\u0644\u06cc\u06a9\u06cc\u0634\u0646 \u0631\u0627 \u0628\u0627 \u0634\u0645\u0627 \u0634\u0631\u06cc\u06a9 \u0633\u0627\u062e\u062a. \u0627\u06cc\u0646\u062c\u0627 \u0631\u0623\u06cc \u062f\u0647\u06cc\u062f: ${url}`,
  bs: (url) =>
    `Stem Palaestina: Glasa\u010d je podijelio aplikaciju s vama. Glasajte ovdje: ${url}`,
};

// ---- Ballot SMS translations -----------------------------------------------

const ballotSmsTranslations: Record<string, (url: string) => string> = {
  da: (url) => `Stem Palæstina: Afgiv din stemme her: ${url}`,
  en: (url) => `Stem Palaestina: Cast your vote here: ${url}`,
  zh: (url) => `Stem Palaestina: \u5728\u6b64\u6295\u7968\uff1a${url}`,
  hi: (url) => `Stem Palaestina: \u092f\u0939\u093e\u0901 \u0905\u092a\u0928\u093e \u0935\u094b\u091f \u0926\u0947\u0902: ${url}`,
  es: (url) => `Stem Palaestina: Emite tu voto aqu\u00ed: ${url}`,
  ar: (url) => `Stem Palaestina: \u0635\u0648\u0651\u062a \u0647\u0646\u0627: ${url}`,
  fr: (url) => `Stem Palaestina: Votez ici : ${url}`,
  bn: (url) => `Stem Palaestina: \u098f\u0996\u09be\u09a8\u09c7 \u0986\u09aa\u09a8\u09be\u09b0 \u09ad\u09cb\u099f \u09a6\u09bf\u09a8: ${url}`,
  pt: (url) => `Stem Palaestina: Vote aqui: ${url}`,
  ru: (url) => `Stem Palaestina: \u041f\u0440\u043e\u0433\u043e\u043b\u043e\u0441\u0443\u0439\u0442\u0435 \u0437\u0434\u0435\u0441\u044c: ${url}`,
  ur: (url) => `Stem Palaestina: \u06cc\u06c1\u0627\u06ba \u0627\u067e\u0646\u0627 \u0648\u0648\u0679 \u062f\u06cc\u06ba: ${url}`,
  id: (url) => `Stem Palaestina: Berikan suara Anda di sini: ${url}`,
  de: (url) => `Stem Palaestina: Stimmen Sie hier ab: ${url}`,
  ja: (url) => `Stem Palaestina: \u3053\u3061\u3089\u3067\u6295\u7968\u3057\u3066\u304f\u3060\u3055\u3044\uff1a${url}`,
  sw: (url) => `Stem Palaestina: Piga kura yako hapa: ${url}`,
  vi: (url) => `Stem Palaestina: B\u1ecf phi\u1ebfu t\u1ea1i \u0111\u00e2y: ${url}`,
  tr: (url) => `Stem Palaestina: Oyunuzu burada kullan\u0131n: ${url}`,
  ko: (url) => `Stem Palaestina: \uc5ec\uae30\uc11c \ud22c\ud45c\ud558\uc138\uc694: ${url}`,
  ta: (url) => `Stem Palaestina: \u0b87\u0b99\u0bcd\u0b95\u0bc7 \u0b93\u0b9f\u0bcd\u0b9f\u0bb3\u0bbf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd: ${url}`,
  th: (url) => `Stem Palaestina: \u0e25\u0e07\u0e04\u0e30\u0e41\u0e19\u0e19\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48: ${url}`,
  fa: (url) => `Stem Palaestina: \u0627\u06cc\u0646\u062c\u0627 \u0631\u0623\u06cc \u062f\u0647\u06cc\u062f: ${url}`,
  prs: (url) => `Stem Palaestina: \u0627\u06cc\u0646\u062c\u0627 \u0631\u0623\u06cc \u062f\u0647\u06cc\u062f: ${url}`,
  bs: (url) => `Stem Palaestina: Glasajte ovdje: ${url}`,
};

// ---- Ballot candidate SMS translations -------------------------------------

const ballotCandidateSmsTranslations: Record<string, (url: string) => string> = {
  da: (url) => `Stem Palæstina: Registrér dig som kandidat her: ${url}`,
  en: (url) => `Stem Palaestina: Register as a candidate here: ${url}`,
  zh: (url) => `Stem Palaestina: \u5728\u6b64\u6ce8\u518c\u4e3a\u5019\u9009\u4eba\uff1a${url}`,
  hi: (url) => `Stem Palaestina: \u092f\u0939\u093e\u0901 \u0909\u092e\u094d\u092e\u0940\u0926\u0935\u093e\u0930 \u0915\u0947 \u0930\u0942\u092a \u092e\u0947\u0902 \u092a\u0902\u091c\u0940\u0915\u0930\u0923 \u0915\u0930\u0947\u0902: ${url}`,
  es: (url) => `Stem Palaestina: Reg\u00edstrate como candidato aqu\u00ed: ${url}`,
  ar: (url) => `Stem Palaestina: \u0633\u062c\u0651\u0644 \u0643\u0645\u0631\u0634\u062d \u0647\u0646\u0627: ${url}`,
  fr: (url) => `Stem Palaestina: Inscrivez-vous comme candidat ici : ${url}`,
  bn: (url) => `Stem Palaestina: \u098f\u0996\u09be\u09a8\u09c7 \u09aa\u09cd\u09b0\u09be\u09b0\u09cd\u09a5\u09c0 \u09b9\u09bf\u09b8\u09c7\u09ac\u09c7 \u09a8\u09bf\u09ac\u09a8\u09cd\u09a7\u09a8 \u0995\u09b0\u09c1\u09a8: ${url}`,
  pt: (url) => `Stem Palaestina: Registe-se como candidato aqui: ${url}`,
  ru: (url) => `Stem Palaestina: \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u0443\u0439\u0442\u0435\u0441\u044c \u043a\u0430\u043a \u043a\u0430\u043d\u0434\u0438\u0434\u0430\u0442 \u0437\u0434\u0435\u0441\u044c: ${url}`,
  ur: (url) => `Stem Palaestina: \u06cc\u06c1\u0627\u06ba \u0627\u0645\u06cc\u062f\u0648\u0627\u0631 \u06a9\u06d2 \u0637\u0648\u0631 \u067e\u0631 \u0631\u062c\u0633\u0679\u0631 \u06a9\u0631\u06cc\u06ba: ${url}`,
  id: (url) => `Stem Palaestina: Daftar sebagai kandidat di sini: ${url}`,
  de: (url) => `Stem Palaestina: Registrieren Sie sich hier als Kandidat: ${url}`,
  ja: (url) => `Stem Palaestina: \u3053\u3061\u3089\u3067\u5019\u88dc\u8005\u3068\u3057\u3066\u767b\u9332\u3057\u3066\u304f\u3060\u3055\u3044\uff1a${url}`,
  sw: (url) => `Stem Palaestina: Jiandikishe kama mgombea hapa: ${url}`,
  vi: (url) => `Stem Palaestina: \u0110\u0103ng k\u00fd l\u00e0m \u1ee9ng vi\u00ean t\u1ea1i \u0111\u00e2y: ${url}`,
  tr: (url) => `Stem Palaestina: Buradan aday olarak kaydolun: ${url}`,
  ko: (url) => `Stem Palaestina: \uc5ec\uae30\uc11c \ud6c4\ubcf4\ub85c \ub4f1\ub85d\ud558\uc138\uc694: ${url}`,
  ta: (url) => `Stem Palaestina: \u0b87\u0b99\u0bcd\u0b95\u0bc7 \u0b89\u0bae\u0bcd\u0bae\u0bc0\u0ba4\u0bb5\u0bb0\u0bbe\u0b95 \u0baa\u0ba4\u0bbf\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0baf\u0bc1\u0b99\u0bcd\u0b95\u0bb3\u0bcd: ${url}`,
  th: (url) => `Stem Palaestina: \u0e25\u0e07\u0e17\u0e30\u0e40\u0e1a\u0e35\u0e22\u0e19\u0e40\u0e1b\u0e47\u0e19\u0e1c\u0e39\u0e49\u0e2a\u0e21\u0e31\u0e04\u0e23\u0e17\u0e35\u0e48\u0e19\u0e35\u0e48: ${url}`,
  fa: (url) => `Stem Palaestina: \u0627\u06cc\u0646\u062c\u0627 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u0646\u0627\u0645\u0632\u062f \u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u06a9\u0646\u06cc\u062f: ${url}`,
  prs: (url) => `Stem Palaestina: \u0627\u06cc\u0646\u062c\u0627 \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u0646\u0627\u0645\u0632\u062f \u062b\u0628\u062a\u200c\u0646\u0627\u0645 \u06a9\u0646\u06cc\u062f: ${url}`,
  bs: (url) => `Stem Palaestina: Registrirajte se kao kandidat ovdje: ${url}`,
};

// ---- Public API ------------------------------------------------------------

/**
 * Get translated email subject + body for sharing the app.
 * Falls back to Danish (da) when the locale is not supported.
 */
export function getShareEmail(locale: string, siteUrl: string): ShareEmail {
  const fn = emailTranslations[locale] ?? emailTranslations.da;
  return fn(siteUrl);
}

/**
 * Get translated SMS text for sharing the app with a friend.
 * Falls back to Danish (da) when the locale is not supported.
 */
export function getShareSms(locale: string, url: string): string {
  const fn = shareSmsTranslations[locale] ?? shareSmsTranslations.da;
  return fn(url);
}

/**
 * Get translated ballot SMS (short "cast your vote" message).
 * Falls back to Danish (da) when the locale is not supported.
 */
export function getBallotSms(locale: string, url: string): string {
  const fn = ballotSmsTranslations[locale] ?? ballotSmsTranslations.da;
  return fn(url);
}

/**
 * Get translated ballot candidate SMS ("register as candidate" message).
 * Falls back to Danish (da) when the locale is not supported.
 */
export function getBallotCandidateSms(locale: string, url: string): string {
  const fn =
    ballotCandidateSmsTranslations[locale] ??
    ballotCandidateSmsTranslations.da;
  return fn(url);
}
