import type { Book } from '../types';

/**
 * Intelligent Pakistani Bookstore Keyword & Quickcode Engine
 * Designed specifically for sales managers and cashiers at UrduBazars.
 * Generates rich, bilingual, Roman Urdu, grade-alias, and quickcode search tags.
 */

const CLASS_KEYWORDS: Record<string, string[]> = {
  'Playgroup': ['playgroup', 'pg', 'play', 'play group', 'pre-nursery', 'prenursery', 'baby class', 'early years', 'eyfs', 'montessori'],
  'Nursery': ['nursery', 'nur', 'kg1', 'kg-1', 'kg 1', 'kindergarten', 'kindergarten 1'],
  'Prep': ['prep', 'kg2', 'kg-2', 'kg 2', 'kindergarten 2', 'prep class', 'preparatory'],
  'Pre 1': ['pre 1', 'pre-1', 'pre1', 'prep 1', 'junior prep'],
  '1st': ['1st', 'class 1', 'grade 1', 'one', 'first', 'pehli', 'primary', '1'],
  '2nd': ['2nd', 'class 2', 'grade 2', 'two', 'second', 'dosri', 'primary', '2'],
  '3rd': ['3rd', 'class 3', 'grade 3', 'three', 'third', 'teesri', 'primary', '3'],
  '4th': ['4th', 'class 4', 'grade 4', 'four', 'fourth', 'chothi', 'primary', '4'],
  '5th': ['5th', 'class 5', 'grade 5', 'five', 'fifth', 'panchween', 'primary', '5'],
  '6th': ['6th', 'class 6', 'grade 6', 'six', 'sixth', 'chhati', 'middle', '6'],
  '7th': ['7th', 'class 7', 'grade 7', 'seven', 'seventh', 'satween', 'middle', '7'],
  '8th': ['8th', 'class 8', 'grade 8', 'eight', 'eighth', 'aathween', 'middle', '8'],
  '9th': ['9th', 'class 9', 'grade 9', 'nine', 'ninth', 'nawen', 'matric', 'matriculation', 'ssc', 'ssc 1', 'ssc-1', 'ssc1', 'part 1', 'part-1', '9'],
  '10th': ['10th', 'class 10', 'grade 10', 'ten', 'tenth', 'dasween', 'matric', 'matriculation', 'ssc', 'ssc 2', 'ssc-2', 'ssc2', 'part 2', 'part-2', '10'],
  '11th': ['11th', 'class 11', 'grade 11', 'eleven', 'eleventh', 'gyarween', 'inter', 'intermediate', 'fsc', 'fsc 1', 'fsc-1', 'ics', 'icom', 'fa', 'hssc', 'hssc 1', 'hssc-1', '1st year', 'first year', 'part 1', '11'],
  '12th': ['12th', 'class 12', 'grade 12', 'twelve', 'twelfth', 'barween', 'inter', 'intermediate', 'fsc', 'fsc 2', 'fsc-2', 'ics', 'icom', 'fa', 'hssc', 'hssc 2', 'hssc-2', '2nd year', 'second year', 'part 2', '12'],
  'O/A-Level': ['olevel', 'o-level', 'o level', 'alevel', 'a-level', 'a level', 'cambridge', 'caie', 'igcse', 'edexcel', 'british'],
  'General': ['general', 'literature', 'library', 'adab', 'general reading', 'novel', 'history', 'islamic']
};

const SUBJECT_KEYWORDS: Record<string, string[]> = {
  'Mathematics': ['math', 'maths', 'mathematics', 'riazi', 'hisab', 'hisaab', 'geometry', 'algebra', 'arithmetic', 'numbers'],
  'Math Activity': ['math', 'maths', 'riazi', 'activity', 'math activity', 'workbook', 'counting', 'shapes'],
  'Physics': ['physics', 'physic', 'fzk', 'fizix', 'fsc physics', 'mechanics', 'thermodynamics', 'optics'],
  'Chemistry': ['chemistry', 'chem', 'keemiya', 'kemiya', 'organic', 'inorganic', 'chemical', 'reactions'],
  'Biology': ['biology', 'bio', 'hayatyaat', 'hayat', 'zoology', 'botany', 'cells', 'physiology'],
  'Computer': ['computer', 'comp', 'cs', 'computer science', 'it', 'informatics', 'coding', 'programming', 'basics'],
  'Computer Science': ['computer', 'comp', 'cs', 'computer science', 'it', 'informatics', 'coding', 'programming'],
  'English': ['english', 'eng', 'angrezi', 'grammar', 'composition', 'comprehension', 'vocabulary', 'spelling'],
  'English Activity': ['english', 'eng', 'english activity', 'phonics', 'handwriting', 'alphabet', 'spelling'],
  'Urdu': ['urdu', 'adab', 'qawaid', 'insha', 'urdu zaban', 'shairi', 'nazm', 'ghazal', 'insha pardazi'],
  'Urdu Activity': ['urdu', 'urdu activity', 'khushkhati', 'huroof', 'abjad', 'urdu amli'],
  'Islamiat': ['islamiat', 'islamiyat', 'islamic studies', 'islamic', 'deenyat', 'diniyat', 'quran', 'tarjuma', 'sunnah', 'hadees', 'hadith'],
  'Tarjuma Tul Quran': ['tarjuma tul quran', 'tarjuma', 'quran', 'quranic', 'islamiat', 'translation', 'surah', 'ayat', 'tafseer'],
  'Tarjuma-tul-Quran': ['tarjuma tul quran', 'tarjuma', 'quran', 'quranic', 'islamiat', 'translation', 'surah', 'ayat', 'tafseer'],
  'Pakistan Studies': ['pakistan studies', 'pak studies', 'mutalia pakistan', 'mutalia', 'ps', 'pak study', 'tareekh pakistan'],
  'Science': ['science', 'sci', 'gen science', 'general science', 'snc science', 'qudrat'],
  'Social Studies': ['social studies', 'sst', 'muashrati uloom', 'muashra', 'history', 'geography', 'citizenship'],
  'General Knowledge': ['general knowledge', 'gk', 'maloomat e aama', 'maloomat', 'aam maloomat'],
  'Geography': ['geography', 'geo', 'jugrafia', 'naqsha', 'maps', 'earth'],
  'History': ['history', 'tareekh', 'tarikh', 'past', 'civilization'],
  'Drawing': ['drawing', 'art', 'sketching', 'coloring', 'rang', 'tasweer', 'colors'],
  'Art & Craft': ['art', 'craft', 'art & craft', 'paper craft', 'drawing', 'colors', 'creative'],
  'Rhymes & Poems': ['rhymes', 'poems', 'nazmein', 'nazm', 'nursery rhymes', 'singing', 'songs'],
  'Urdu Literature': ['urdu literature', 'urdu adab', 'novel', 'afsaana', 'classic', 'kahani'],
  'Poetry': ['poetry', 'shairi', 'kulliyat', 'diwan', 'iqbal', 'shayari', 'ghazal', 'nazm', 'kalam'],
  'Stationery': ['stationery', 'register', 'notebook', 'copy', 'khata', 'pen', 'pencil', 'ballpoint', 'geometry box']
};

const FAST_CODE_PREFIX: Record<string, string> = {
  'Mathematics': 'M',
  'Math Activity': 'M',
  'Physics': 'P',
  'Chemistry': 'C',
  'Biology': 'B',
  'Computer': 'CS',
  'Computer Science': 'CS',
  'English': 'E',
  'English Activity': 'E',
  'Urdu': 'U',
  'Urdu Activity': 'U',
  'Islamiat': 'IS',
  'Tarjuma Tul Quran': 'TQ',
  'Tarjuma-tul-Quran': 'TQ',
  'Pakistan Studies': 'PS',
  'Science': 'SCI',
  'Social Studies': 'SST',
  'General Knowledge': 'GK',
  'Drawing': 'ART',
  'Art & Craft': 'ART',
  'Rhymes & Poems': 'RHY'
};

const FAST_CODE_CLASS: Record<string, string> = {
  'Playgroup': 'PG',
  'Nursery': 'NUR',
  'Prep': 'PREP',
  'Pre 1': 'PRE1',
  '1st': '1',
  '2nd': '2',
  '3rd': '3',
  '4th': '4',
  '5th': '5',
  '6th': '6',
  '7th': '7',
  '8th': '8',
  '9th': '9',
  '10th': '10',
  '11th': '11',
  '12th': '12',
  'O/A-Level': 'AL'
};

/**
 * Generates the primary POS Quickcode for cashiers (e.g. M-10, P-12, U-9, etc.)
 */
export function getQuickCode(book: Partial<Book>): string | null {
  const subj = book.subject || '';
  const cls = book.class || '';
  const pfx = FAST_CODE_PREFIX[subj];
  const cfx = FAST_CODE_CLASS[cls];
  if (pfx && cfx) {
    return `${pfx}-${cfx}`;
  }
  return null;
}

/**
 * Generates a comprehensive, deduplicated set of search keywords for any book.
 */
export function generateBookKeywords(book: Partial<Book>): string[] {
  const keywords = new Set<string>();

  const add = (w: string | undefined | null) => {
    if (!w) return;
    const clean = String(w).trim().toLowerCase();
    if (clean.length > 1 && !keywords.has(clean)) {
      keywords.add(clean);
    }
  };

  // 1. Class-based tags
  const cls = book.class || '';
  add(cls);
  if (CLASS_KEYWORDS[cls]) {
    CLASS_KEYWORDS[cls].forEach(add);
  }

  // 2. Subject-based tags
  const subj = book.subject || '';
  add(subj);
  if (SUBJECT_KEYWORDS[subj]) {
    SUBJECT_KEYWORDS[subj].forEach(add);
  }

  // 3. Fast Quickcodes (e.g., M10, M-10, P12, P-12, etc.)
  const qc = getQuickCode(book);
  if (qc) {
    add(qc);
    add(qc.replace('-', ''));
    add(qc.replace('-', ' '));
  }

  // 4. Publisher aliases
  const pub = (book.publisher || '').toLowerCase();
  add(pub);
  if (pub.includes('punjab') || pub.includes('pctb') || pub.includes('curriculum')) {
    ['ptb', 'pctb', 'punjab board', 'punjab textbook board', 'punjab board book', 'lahore board', 'govt board', 'bise'].forEach(add);
  }
  if (pub.includes('cambridge') || pub.includes('az')) {
    ['az', 'az cambridge', 'az international', 'cambridge'].forEach(add);
  }
  if (pub.includes('booktime')) {
    ['booktime', 'book time', 'btp'].forEach(add);
  }
  if (pub.includes('ilmi')) {
    ['ilmi', 'ilmi kitab khana', 'ilmi notes', 'ilmi keybook'].forEach(add);
  }
  if (pub.includes('iqbal')) {
    ['iqbal academy', 'allama iqbal', 'iqbaliyat'].forEach(add);
  }
  if (pub.includes('alif')) {
    ['alif', 'alif publishers'].forEach(add);
  }
  if (pub.includes('oxford')) {
    ['oxford', 'oup', 'oxford press'].forEach(add);
  }
  if (pub.includes('caravan')) {
    ['caravan', 'caravan book house'].forEach(add);
  }
  if (pub.includes('kips')) {
    ['kips', 'kips notes', 'kips prep'].forEach(add);
  }
  if (pub.includes('dogar')) {
    ['dogar', 'dogar brothers', 'dogars'].forEach(add);
  }

  // 5. Category aliases
  const cat = book.category || '';
  add(cat);
  if (cat === 'Textbook') {
    ['textbook', 'darsi kitab', 'nisabi kitab', 'course', 'syllabus', 'text book'].forEach(add);
  } else if (cat === 'Notes') {
    ['notes', 'keybook', 'khulasa', 'handbook', 'guide', 'solutions'].forEach(add);
  } else if (cat === 'Guide') {
    ['guide', 'solution', 'solved', 'rehnuma', 'helper'].forEach(add);
  } else if (cat === 'Activity Book') {
    ['activity', 'activity book', 'workbook', 'exercise book', 'work book'].forEach(add);
  } else if (cat === 'Novel') {
    ['novel', 'urdu novel', 'fiction', 'afsaana', 'dastaan', 'kahani'].forEach(add);
  } else if (cat === 'Urdu Literature') {
    ['urdu literature', 'urdu adab', 'classic', 'adabiyat'].forEach(add);
  } else if (cat === 'Islamic') {
    ['islamic', 'islami', 'deeni', 'rohani', 'quranic'].forEach(add);
  } else if (cat === 'Stationery') {
    ['stationery', 'office', 'school supplies', 'khata', 'register', 'copy'].forEach(add);
  }

  // 6. Language & Medium tags
  const lang = book.language || '';
  if (lang === 'Urdu') {
    ['urdu medium', 'um', 'urdu'].forEach(add);
  } else if (lang === 'English') {
    ['english medium', 'em', 'english'].forEach(add);
  } else if (lang === 'Bilingual') {
    ['bilingual', 'urdu english', 'both'].forEach(add);
  }

  // 7. Title & Series Tokens
  const title = book.title || '';
  const titleLower = title.toLowerCase();

  if (titleLower.includes('snc')) {
    ['snc', 'single national curriculum', 'national curriculum'].forEach(add);
  }
  if (titleLower.includes('standard series')) {
    ['standard series', 'standard'].forEach(add);
  }
  if (titleLower.includes('supreme series')) {
    ['supreme series', 'supreme'].forEach(add);
  }
  if (titleLower.includes('capital hybrid') || titleLower.includes('hybrid')) {
    ['hybrid', 'hybrid series', 'capital hybrid'].forEach(add);
  }
  if (titleLower.includes('science group')) {
    ['science group', 'science stream'].forEach(add);
  }
  if (titleLower.includes('arts') || titleLower.includes('general group')) {
    ['arts group', 'general group', 'humanities'].forEach(add);
  }
  if (titleLower.includes('pir-e-kamil') || titleLower.includes('pir e kamil')) {
    ['pir e kamil', 'peer e kamil', 'umera ahmed', 'salar', 'imama'].forEach(add);
  }
  if (titleLower.includes('kulliyat-e-iqbal') || titleLower.includes('kulliyat')) {
    ['kulliyat e iqbal', 'kulliyat', 'allama iqbal', 'sharah', 'bang e dara', 'bal e jibreel'].forEach(add);
  }

  // Extract clean words from English title
  const words = title
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
  words.forEach(add);

  // 8. Urdu Title Tokens (Bilingual Support)
  if (book.urduTitle) {
    add(book.urduTitle);
    const urduWords = book.urduTitle
      .replace(/[^\u0600-\u06FF\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
    urduWords.forEach(add);
  }

  // 9. Author keywords
  if (book.author) {
    add(book.author);
    const authorWords = book.author
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !['prof', 'dr', 'and', 'team', 'the'].includes(w.toLowerCase()));
    authorWords.forEach(add);
  }

  // 10. Rack / Shelf location
  if (book.rackShelf) {
    add(book.rackShelf);
    const shelfParts = book.rackShelf.toLowerCase().split(/[-/]/);
    shelfParts.forEach(add);
  }

  // 11. Barcode & ISBN partial
  if (book.barcode) {
    add(book.barcode);
    if (book.barcode.length > 4) {
      add(book.barcode.slice(-4));
    }
  }
  if (book.isbn) {
    add(book.isbn);
    add(book.isbn.replace(/-/g, ''));
  }

  // Return sorted keywords list for deterministic and clean indexing
  return Array.from(keywords).sort();
}
