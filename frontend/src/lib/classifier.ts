/**
 * Classificatore locale di problemi — italiano.
 *
 * Pipeline:
 *   1. normalize   — lowercase + strip accenti (NFD→ASCII) + pulizia
 *   2. tokenize    — split su whitespace
 *   3. softStem    — rimuove suffissi italiani comuni
 *   4. fuzzyMatch  — Jaro-Winkler (no dipendenze esterne), soglia 0.85
 *
 * Le keyword nel dizionario sono già in forma stem-ridotta, quindi la
 * soglia alta cattura le forme flesse senza falsi positivi.
 */

import type { ProblemCategory } from "@/types";

// ─── Normalize ────────────────────────────────────────────────────────────────

/**
 * Lowercase + deaccent (NFD → keep only ASCII letters/digits/spaces).
 * Handles Italian accented chars: à è é ì ò ù → a e e i o u
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    // NFD decomposition: "à" → "a" + combining grave → strip combining chars
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Soft stemmer ─────────────────────────────────────────────────────────────

const SUFFIXES = [
  "azione", "azioni", "mente", "abile", "ibile",
  "ando", "endo", "ato", "ata", "ati", "ate",
  "oso", "osa", "osi", "ose",
  "are", "ere", "ire",
  "ico", "ica", "ici", "iche",
  "ale", "ali",
  "ivo", "iva", "ivi", "ive",
];

/** Rimuove il suffisso più lungo trovato (min 3 chars di stem residuo) */
function softStem(word: string): string {
  for (const suf of SUFFIXES) {
    if (word.endsWith(suf) && word.length - suf.length >= 3) {
      return word.slice(0, word.length - suf.length);
    }
  }
  return word;
}

// ─── Jaro-Winkler ─────────────────────────────────────────────────────────────

function jaro(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0 || len2 === 0) return 0;

  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;
  const s1Matches = new Array<boolean>(len1).fill(false);
  const s2Matches = new Array<boolean>(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
}

function jaroWinkler(s1: string, s2: string, p = 0.1): number {
  const j = jaro(s1, s2);
  let prefix = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) prefix++;
    else break;
  }
  return j + prefix * p * (1 - j);
}

// ─── Fuzzy match ──────────────────────────────────────────────────────────────

/** Vero se token è sufficientemente simile a keyword (Jaro-Winkler ≥ soglia) */
function fuzzyMatch(token: string, keyword: string, threshold = 0.85): boolean {
  if (token === keyword) return true;
  // Substring esatta prima (gestisce keyword multi-word già unite)
  if (token.includes(keyword) || keyword.includes(token)) return true;
  return jaroWinkler(token, keyword) >= threshold;
}

// ─── Keyword dictionary (stem-ridotto, italiano) ──────────────────────────────

/**
 * Keyword già ridotte alla forma stem/radice.
 * Le frasi multi-parola sono stringhe separate da spazio e vengono cercate
 * come sotto-sequenza nel testo normalizzato; le parole singole vengono
 * confrontate token per token con fuzzyMatch.
 */
const KEYWORDS: Record<ProblemCategory, string[]> = {
  BUGS_TECNICI: [
    // frasi multi-word (substring nel testo normalizzato)
    "non funzion", "non si apre", "non caric", "non si connett",
    "schermata nera", "schermo nero", "schermata bianca", "errore di connession",
    "ha smesso di funzion", "continua a chiudersi", "si blocca continuamente",
    "perdita di dati", "dati persi",
    // parole singole (fuzzy token match)
    "crash", "crashato", "crashat", "bloccat", "blocc",
    "errore", "errat", "bug",
    "glitch", "freezat", "congelat",
    "rott", "guast",
    "instabil", "difett",
  ],
  ONBOARDING_SETUP: [
    // frasi
    "primo accesso", "prima volta", "non riesco a registr", "non riesco ad acceder",
    "configurazion difficil", "difficile da configurar", "difficile da installar",
    "non riesco ad entrar", "non riesco a far partir",
    "codice di verific", "verifica email", "verifica telefon",
    "account non verific",
    // token
    "registrazion", "onboard", "configurazion", "installazion",
    "account", "accessibil", "acceder", "autenticazion",
    "setup", "configurar", "attivar",
  ],
  UX_USABILITA: [
    // frasi
    "difficile da usar", "difficile da navigar", "interfaccia confusa",
    "non intuitiv", "non user friendly", "difficile da capir",
    "difficile trovare", "non si trova", "dove si trova",
    "grafica brutta", "design brutto", "layout confuso",
    "troppo complicat", "poco chiaro",
    // token
    "interfaccia", "usabilita", "naviga", "grafic",
    "design", "layout", "intuitiv", "semplicita",
    "complicat", "confus", "disorientant",
    "accessibil", "leggibilita",
  ],
  FEATURES_FUNZIONALITA: [
    // frasi
    "funzionalita mancante", "funzione mancante", "non c e la funzione",
    "non ha la funzione", "manca la possibilita", "manca l opzione",
    "vorrei che ci fosse", "sarebbe utile avere", "non si puo",
    "impossibile fare", "non permette di",
    "funzione assente", "feature mancante",
    // token
    "mancant", "assent", "funzionalita", "funzion",
    "opzion", "possibilita", "aggiunger", "miglior",
    "aggiornament", "sviluppar", "implementar",
    "richiesta", "necessari",
  ],
  CUSTOMER_SUPPORT: [
    // frasi
    "assistenza clienti", "servizio clienti", "customer care",
    "nessuna risposta", "non rispondono", "non mi hanno risposto",
    "supporto inutile", "assistenza pessima", "supporto lento",
    "rimborso negato", "non rimborsano", "non vogliono rimborsare",
    "account sospeso", "account bannato", "account bloccato",
    "account cancellat",
    // token
    "assistenza", "support", "rimborso",
    "risposta", "contatto", "operatore",
    "lamentela", "reclamo", "segnalazion",
    "ignor", "abbandono",
  ],
};

// ─── Classifier ───────────────────────────────────────────────────────────────

/** Controlla se una frase multi-word è presente come substring nel testo */
function hasPhrase(text: string, phrase: string): boolean {
  return text.includes(phrase);
}

/**
 * Controlla se almeno un token nel testo fa fuzzy-match con la keyword stem.
 * Per keyword multi-parola (spazio) usa substring check diretto.
 */
function matchesKeyword(tokens: string[], stemmedTokens: string[], kw: string): boolean {
  if (kw.includes(" ")) {
    // multi-word: già gestite da hasPhrase sopra, ma le gestiamo anche qui
    return false; // handled separately via hasPhrase
  }
  for (const stemTok of stemmedTokens) {
    if (fuzzyMatch(stemTok, kw)) return true;
  }
  // also try raw tokens for exact/substring matches
  for (const tok of tokens) {
    if (tok === kw || tok.startsWith(kw) || kw.startsWith(tok)) return true;
  }
  return false;
}

/** Result including matched keywords for highlight */
export interface ClassifyEvidence {
  categories: ProblemCategory[];
  /** Normalized keyword stems/phrases that triggered classification, per category */
  matchedKeywords: Partial<Record<ProblemCategory, string[]>>;
}

export function classifyReviewProblems(
  title: string,
  body: string
): ProblemCategory[] {
  return classifyWithEvidence(title, body).categories;
}

export function classifyWithEvidence(
  title: string,
  body: string
): ClassifyEvidence {
  const raw = normalize(`${title} ${body}`);
  const tokens = raw.split(" ").filter(Boolean);
  const stemmedTokens = tokens.map(softStem);

  const categories: ProblemCategory[] = [];
  const matchedKeywords: Partial<Record<ProblemCategory, string[]>> = {};

  for (const [category, keywords] of Object.entries(KEYWORDS) as [ProblemCategory, string[]][]) {
    const hits: string[] = [];

    for (const kw of keywords) {
      if (kw.includes(" ")) {
        if (hasPhrase(raw, kw)) hits.push(kw);
      } else {
        if (matchesKeyword(tokens, stemmedTokens, kw)) hits.push(kw);
      }
    }

    if (hits.length > 0) {
      categories.push(category);
      matchedKeywords[category] = hits;
    }
  }

  return { categories, matchedKeywords };
}

/** Classifica un array di { title, review } in modo sincrono */
export function classifyBatch(
  reviews: { title: string; review: string }[]
): ProblemCategory[][] {
  return reviews.map((r) => classifyReviewProblems(r.title, r.review));
}

/** Classifica e restituisce anche le keyword matched per evidenziare il testo */
export function classifyBatchWithEvidence(
  reviews: { title: string; review: string }[]
): ClassifyEvidence[] {
  return reviews.map((r) => classifyWithEvidence(r.title, r.review));
}
