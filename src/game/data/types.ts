// Oyun icerik ve level veri modeli

export type Content =
  | { kind: "image"; src: string }
  | { kind: "shadow"; src?: string; char?: string } // gorseli/emojiyi siyah siluet cizer (golge)
  | { kind: "emoji"; char: string }
  | { kind: "shape"; shape: "circle" | "square" | "triangle" | "star" | "rectangle"; color: string }
  | { kind: "number"; value: number; color?: string }
  | { kind: "numapple"; value: number } // uzerinde rakam yazan elma (sayilar: elma agaci oyunu)
  | { kind: "tree" } // elma agaci arka plan gorseli
  | { kind: "group"; char: string; n: number; jar?: boolean } // n adet emoji; jar=kavanoz icinde
  | { kind: "dots"; n: number; color?: string } // zar benzeri nokta deseni (subitizing / nokta say)
  | {
      kind: "puzzle"; // 2x2 izgarada eksik parcali sekil ya da tek parca
      shape: "circle" | "square" | "triangle" | "star" | "heart";
      color: string;
      missing: 0 | 1 | 2 | 3; // eksik/gosterilen ceyrek (0=SolUst,1=SagUst,2=SolAlt,3=SagAlt)
      piece: boolean; // true = sadece eksik parca
    }
  | { kind: "picture"; emoji: string; bg: string } // yapboz icin tam resim (arka plan + buyuk emoji)
  | {
      kind: "piece"; // yapbozun tek bir parcasi (resmin bir alt dikdortgeni)
      emoji: string;
      bg: string;
      rows: number; // toplam satir sayisi
      row: number; // bu parcanin satiri
      cols: number; // bu satirdaki sutun sayisi
      col: number; // bu parcanin sutunu
    };

export type GameKind =
  | "match" // solu sag hedefine surukle (esleme)
  | "select" // dogru olanlari sepete surukle
  | "sort" // nesneleri dogru kutuya ayir
  | "sequence" // dogru siraya diz
  | "pattern" // oruntudeki eksigi tamamla
  | "count" // say ve dogru rakama surukle
  | "compare" // fazla/buyuk/kisa olani sec
  | "spot" // farklari bul (dokunma)
  | "puzzle" // eksik parcayi sekle tam yerlestir
  | "jigsaw" // resmi parcalara ayir, parcalari birlestir
  | "memory" // kapali kartlari cevir, ayni cifti bul (hafiza)
  | "maze" // hayvani parmakla yol boyunca surukleyip hedefe goturme (yol takibi)
  | "seriate" // nesneleri kucukten buyuge sirala (boyut seriation)
  | "weight" // terazide agir/hafif olani sec, kefe iner (agirlik kavrami)
  | "trace" // parmakla rakamin uzerinden gecerek yaz (rakam izleme)
  | "place" // nesneyi kabin ICINE/USTUNE/ALTINA/YANINA surukle (mekansal kavramlar)
  | "draw" // parmakla serbest cizim/boyama (yaraticilik)
  | "story" // anlatimli resimli hikaye: sahne sahne, dokun-ilerle (dinleme/anlama, sosyal-duygusal)
  | "breathe"; // nefes/oz-duzenleme: buyuyup kuculen daire ile sakinlesme (oz-regulasyon)

// Farkli bul (spot): bir sahnedeki tek bir nesne (emoji + konum + boyut)
export interface SpotItem {
  e: string; // emoji
  x: number; // 0..1 (panel-goreli merkez)
  y: number;
  s: number; // font boyutu (panel oranina gore)
}

export interface Level {
  id: string;
  section: string;
  title: string;
  kind: GameKind;
  instr: string; // sesli yonerge (naif ton)
  icon?: string; // level kartinda gosterilecek emoji

  // match
  pairs?: { drag: Content; target: Content }[];

  // select
  prompt?: string;
  items?: { content: Content; correct: boolean }[];
  // sekiller: turun ustunde gosterilecek SAF sekil referansi (cihaz bagimsiz, canvas cizim)
  refShape?: { shape: "circle" | "square" | "triangle" | "star" | "rectangle"; color: string };
  // sayilar: select ogelerini bir ELMA AGACI uzerinde rakamli elmalar olarak goster
  appleTree?: boolean;

  // compare (her satirda bir dogru)
  compareRows?: { items: Content[]; correctIndex: number; itemScales?: number[] }[];
  comparePrompt?: string;
  compareBySize?: boolean; // true: kartlar gercek boyut oraniyla gosterilir (buyuk/kisa)

  // sort
  bins?: { id: string; label: string; content?: Content; color: string }[];
  sortItems?: { content: Content; bin: string }[];

  // sequence
  order?: Content[];

  // pattern (birden fazla satir; null = bos yuva)
  patternRows?: (Content | null)[][];
  patternAnswers?: Content[]; // bos yuvalarin dogru cevaplari (satir-once sirada)
  options?: Content[];

  // count
  groups?: { content: Content; n: number }[];
  numbers?: number[];

  // spot (farklari bul) - prosedurel sahne cifti
  panels?: [string, string]; // (eski) hazir gorsel panelleri - artik kullanilmiyor
  diffs?: { x: number; y: number }[]; // 0..1 panel-goreli fark konumlari
  spot?: { bg: string; a: SpotItem[]; b: SpotItem[]; diffs: { x: number; y: number }[] };

  // puzzle (eksik parca)
  puzzles?: { shape: "circle" | "square" | "triangle" | "star" | "heart"; color: string; missing: 0 | 1 | 2 | 3 }[];

  // jigsaw (resim yapbozu): emoji+arka plan resmi, layout = her satirdaki sutun sayisi
  jigsaw?: { emoji: string; bg: string; layout: number[] };

  // memory (hafiza): her char icin 2 kart uretilir, karistirilip kapali dizilir.
  // chars.length = cift sayisi (3=6 kart, 4=8, 5=10, 6=12)
  memory?: { chars: string[] };

  // maze (yol takibi): baslangictaki 'start' hayvani, yol (path, 0..100 kare koordinat)
  // boyunca parmakla suruklenip 'end' hedefine ulastirilir. tol = isabet toleransi (0..1).
  maze?: { start: string; end: string; path: { x: number; y: number }[]; bg: string; tol: number };

  // seriate (kucukten buyuge sirala): ayni emojinin n adedi farkli boyutlarda gosterilir,
  // cocuk en kucukten en buyuge dogru siralar (dokunma sirasi).
  seriate?: { emoji: string; n: number };

  // weight (terazi): iki nesne terazi kefelerinde; cocuk mode'a gore (agir/hafif)
  // olani secer, dogruysa o kefe iner (nedensel geri bildirim).
  weight?: { mode: "heavy" | "light"; heavy: string; light: string };

  // trace (rakam izleme): parmakla rakam sekilli yolun uzerinden gec. path = 0..100 noktalar.
  trace?: { digit: string; path: { x: number; y: number }[] };

  // place (mekansal): nesneyi kabin ICINE/USTUNE/ALTINA/YANINA surukle. rel = dogru konum.
  spatial?: { object: string; container: string; rel: "in" | "on" | "under" | "beside" };

  // story (hikaye): sahneler. Her sahne: arka plan rengi, buyuk emoji(ler), anlatim metni.
  // Cocuk "Ileri" ile ilerler; son sahnede bitince odul akisina girer. StoryGame her sahneyi seslendirir.
  story?: { scenes: { bg: string; emoji: string; emoji2?: string; text: string }[] };

  // breathe (nefes/oz-duzenleme): kac nefes dongusu. Gorsel + metin; ust uste ses YOK ([[single-voice-source]]).
  breathe?: { cycles: number };

  // derinlik: ek bölümler (ilk bölüm level'in kendi alanlarıdır, bunlar sonrakiler)
  rounds?: Round[];

  // derinlik (rastgele): her level acilisinda buyuk havuzdan TAZE bölümler uretir.
  // Varsa 'rounds' yerine bu kullanilir; boylece her oyun farkli/ezberlenemez olur.
  // band: uyarlanir zorluk (0=kolay,1=orta,2=zor) — skills.ts difficultyBand'inden gelir.
  // Bandi kullanmayan ureticiler argumani yoksayar.
  makeRounds?: (band?: number) => Round[];
}

// Bir ek bölümün içeriği (level ile aynı içerik alanlarının bir alt kümesi, hepsi opsiyonel)
export type Round = Partial<Pick<
  Level,
  | "pairs"
  | "items"
  | "compareRows"
  | "comparePrompt"
  | "compareBySize"
  | "bins"
  | "sortItems"
  | "order"
  | "patternRows"
  | "patternAnswers"
  | "options"
  | "groups"
  | "numbers"
  | "puzzles"
  | "jigsaw"
  | "memory"
  | "maze"
  | "seriate"
  | "weight"
  | "spatial"
  | "spot"
  | "diffs"
  | "instr"
>>;

export interface Section {
  id: string;
  title: string;
  emoji: string;
  color: string;
  levels: string[]; // level id listesi
}
