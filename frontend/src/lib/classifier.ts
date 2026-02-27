/**
 * Classificatore locale di problemi — italiano.
 *
 * Pipeline:
 *   1. normalize      — lowercase + strip accenti (NFD→ASCII) + pulizia
 *   2. tokenize       — split su whitespace
 *   3. softStem       — rimuove suffissi italiani comuni
 *   4. fuzzyMatch     — Jaro-Winkler (no dipendenze), soglia 0.85
 *   5. negation       — skippa keyword negate da "non/mai/nessun…"
 *   6. scoring        — frasi +3, keyword +1; threshold = max*0.4
 *   7. sentiment ctx  — modificatori positivi abbassano score BUGS_TECNICI
 *   8. confidence     — max_score / (wordCount * 0.1), capped a 1.0
 */

import type { ProblemCategory } from "@/types";

// ─── Normalize ────────────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Soft stemmer ─────────────────────────────────────────────────────────────

const SUFFIXES = [
  "azione","azioni","mente","abile","ibile",
  "ando","endo","ato","ata","ati","ate",
  "oso","osa","osi","ose",
  "are","ere","ire",
  "ico","ica","ici","iche",
  "ale","ali",
  "ivo","iva","ivi","ive",
];

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
  const len1 = s1.length, len2 = s2.length;
  if (!len1 || !len2) return 0;
  const win = Math.floor(Math.max(len1, len2) / 2) - 1;
  const m1 = new Array<boolean>(len1).fill(false);
  const m2 = new Array<boolean>(len2).fill(false);
  let matches = 0;
  for (let i = 0; i < len1; i++) {
    const lo = Math.max(0, i - win), hi = Math.min(i + win + 1, len2);
    for (let j = lo; j < hi; j++) {
      if (m2[j] || s1[i] !== s2[j]) continue;
      m1[i] = m2[j] = true; matches++; break;
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < len1; i++) {
    if (!m1[i]) continue;
    while (!m2[k]) k++;
    if (s1[i] !== s2[k]) t++;
    k++;
  }
  return (matches/len1 + matches/len2 + (matches - t/2)/matches) / 3;
}

function jaroWinkler(s1: string, s2: string): number {
  const j = jaro(s1, s2);
  let p = 0;
  for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
    if (s1[i] === s2[i]) p++; else break;
  }
  return j + p * 0.1 * (1 - j);
}

function fuzzyMatch(token: string, kw: string, threshold = 0.85): boolean {
  if (token === kw) return true;
  if (token.includes(kw) || kw.includes(token)) return true;
  return jaroWinkler(token, kw) >= threshold;
}

// ─── Negation & sentiment ────────────────────────────────────────────────────

const NEGATION_PATTERN = /(?:^|\s)(non|mai|nessun|nessuna|niente|senza)\s+(\w+)/g;

function extractNegatedTokens(text: string): Set<string> {
  const neg = new Set<string>();
  for (const m of text.matchAll(NEGATION_PATTERN)) neg.add(m[2]);
  return neg;
}

const POSITIVE_MODIFIERS = [
  "finalmente","ottimo","bene","benissimo","migliorato","perfetto",
  "eccellente","fantastico","ora funziona","adesso va","risolto","sistemato",
  "funziona bene","funziona perfettamente","ora va","adesso funziona",
];

const NEGATIVE_MODIFIERS = [
  "purtroppo","ancora","sempre","peggio","peggiorato","inutile",
  "pessimo","terribile","continua a","non funziona piu","sempre peggio",
];

function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const pos = POSITIVE_MODIFIERS.filter((m) => text.includes(m)).length;
  const neg = NEGATIVE_MODIFIERS.filter((m) => text.includes(m)).length;
  return pos > neg ? "positive" : neg > pos ? "negative" : "neutral";
}

// ─── Keyword dictionary ───────────────────────────────────────────────────────
// Frasi multi-word → substring match (+3 score)
// Parole singole (già stem-ridotte) → fuzzy token match (+1 score)
// Spec phrases merged with existing stems.

const PHRASES: Record<ProblemCategory, string[]> = {
  BUGS_TECNICI: [
    "si blocca","non funziona","non va","non parte","non si apre",
    "non carica","chiusura improvvisa","errore di sistema","crash continui",
    "schermata nera","schermata bianca","schermo nero","caricamento infinito",
    "non riesco ad accedere","non mi fa entrare","login fallito",
    "password non accettata","non sincronizza","dati non aggiornati",
    "non si aggiorna","aggiornamento fallito","troppo lento","lentissimo",
    "molto lento","non funzion","non si connett","errore di connession",
    "ha smesso di funzion","continua a chiudersi","si blocca continuamente",
    "perdita di dati","dati persi",
  ],
  ONBOARDING_SETUP: [
    "primo accesso","prima volta","creazione account","nuovo account",
    "apertura conto","verifica identita","riconoscimento facciale",
    "carta identita","difficile da configurare","complicato da usare",
    "non intuitivo all inizio","setup iniziale","registrazione complicata",
    "processo di registrazione","configurazione iniziale","attivazione account",
    "non so come iniziare","non capisco come funziona",
    "non riesco a registr","non riesco ad acceder",
    "configurazion difficil","difficile da configurar","difficile da installar",
    "non riesco ad entrar","non riesco a far partir",
    "codice di verific","verifica email","verifica telefon",
    "account non verific",
  ],
  UX_USABILITA: [
    "interfaccia confusa","difficile da navigare","non trovo","dove si trova",
    "troppi passaggi","troppo complicato","poco intuitivo","mal organizzato",
    "disordinato","testo troppo piccolo","difficile da leggere",
    "grafica brutta","design vecchio","interfaccia antiquata",
    "menu confusionario","facile da usare","molto intuitivo",
    "interfaccia chiara","ben organizzato","design moderno",
    "difficile da usar","difficile da navigar","non intuitiv",
    "non user friendly","difficile da capir","difficile trovare",
    "non si trova","grafica brutta","design brutto","layout confuso",
    "troppo complicat","poco chiaro",
  ],
  FEATURES_FUNZIONALITA: [
    "manca la funzione","non c e","vorrei che","sarebbe utile",
    "aggiungete per favore","quando arriva","implementate",
    "funzione assente","apple pay non disponibile","google pay mancante",
    "bonifico istantaneo","notifiche push","widget mancante",
    "face id non funziona","touch id","impronta digitale",
    "non posso fare","non permette di","funzione limitata",
    "ha tutto quello","ricco di funzioni",
    "funzionalita mancante","funzione mancante","non c e la funzione",
    "non ha la funzione","manca la possibilita","manca l opzione",
    "vorrei che ci fosse","sarebbe utile avere","non si puo",
    "impossibile fare","feature mancante",
  ],
  CUSTOMER_SUPPORT: [
    "assistenza clienti","servizio clienti","customer care",
    "nessuna risposta","non rispondono","mai risposto",
    "problema risolto","hanno risolto","hanno aiutato",
    "assistenza veloce","assistenza lenta","tempo di attesa",
    "operatore scortese","operatore gentile","supporto inutile",
    "supporto efficiente","chat lenta","risposta immediata","attesa infinita",
    "non rispondono","non mi hanno risposto","supporto inutile",
    "assistenza pessima","supporto lento","rimborso negato",
    "non rimborsano","non vogliono rimborsare",
    "account sospeso","account bannato","account bloccato","account cancellat",
  ],
};

const SINGLE_KEYWORDS: Record<ProblemCategory, string[]> = {
  BUGS_TECNICI: [
    "crash","crashato","crashat","bloccat","blocc",
    "errore","errat","bug","glitch","freezat","congelat",
    "rott","guast","instabil","difett",
    // spec single keywords
    "lento","lagga","lag","scatta",
  ],
  ONBOARDING_SETUP: [
    "registrazion","onboard","configurazion","installazion",
    "account","accessibil","acceder","autenticazion",
    "setup","configurar","attivar",
    // spec
    "iscrizione","spid","cie","documento","selfie",
  ],
  UX_USABILITA: [
    "interfaccia","usabilita","naviga","grafic",
    "design","layout","intuitiv","semplicita",
    "complicat","confus","disorientant","accessibil","leggibilita",
    // spec
    "menu","brutto","bello","moderno","obsoleto","disordinato",
  ],
  FEATURES_FUNZIONALITA: [
    "mancant","assent","funzionalita","funzion",
    "opzion","possibilita","aggiunger","miglior",
    "aggiornament","sviluppar","implementar","richiesta","necessari",
    // spec
    "manca","bonifico","pagamento","ricarica","carta","prelievo",
    "versamento","notifiche","widget","cashback","contactless",
  ],
  CUSTOMER_SUPPORT: [
    "assistenza","support","rimborso","risposta","contatto","operatore",
    "lamentela","reclamo","segnalazion","ignor","abbandono",
    // spec
    "chat","telefono","email","ticket","gentile","scortese",
  ],
};

// ─── Core scoring helpers ─────────────────────────────────────────────────────

function matchesKeyword(
  tokens: string[],
  stemmedTokens: string[],
  kw: string
): boolean {
  for (const st of stemmedTokens) {
    if (fuzzyMatch(st, kw)) return true;
  }
  for (const tok of tokens) {
    if (tok === kw || tok.startsWith(kw) || kw.startsWith(tok)) return true;
  }
  return false;
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ClassifyEvidence {
  categories: ProblemCategory[];
  matchedKeywords: Partial<Record<ProblemCategory, string[]>>;
  confidence: number;
  needsReview: boolean;
  sentiment: "positive" | "negative" | "neutral";
}

// ─── Main classifier ──────────────────────────────────────────────────────────

export function classifyWithEvidence(title: string, body: string): ClassifyEvidence {
  const raw = normalize(`${title} ${body}`);
  const tokens = raw.split(" ").filter(Boolean);
  const stemmedTokens = tokens.map(softStem);
  const wordCount = tokens.length;

  const negated = extractNegatedTokens(raw);
  const sentiment = detectSentiment(raw);

  // ── Score accumulation ────────────────────────────────────────────────────
  const scores: Partial<Record<ProblemCategory, number>> = {};
  const matchedKeywords: Partial<Record<ProblemCategory, string[]>> = {};

  const allCategories = Object.keys(PHRASES) as ProblemCategory[];

  for (const cat of allCategories) {
    let score = 0;
    const hits: string[] = [];

    // Phrases (+3 each)
    for (const phrase of PHRASES[cat]) {
      if (!raw.includes(phrase)) continue;
      // Check if phrase words are negated
      const phraseWords = phrase.split(" ");
      const isNegated = phraseWords.some((w) => negated.has(w));
      if (!isNegated) {
        score += 3;
        hits.push(phrase);
      }
    }

    // Single keywords (+1 each)
    for (const kw of SINGLE_KEYWORDS[cat]) {
      if (!matchesKeyword(tokens, stemmedTokens, kw)) continue;
      if (negated.has(kw)) continue;
      score += 1;
      hits.push(kw);
    }

    if (score > 0) {
      scores[cat] = score;
      matchedKeywords[cat] = hits;
    }
  }

  // ── Sentiment adjustment ──────────────────────────────────────────────────
  if (sentiment === "positive" && scores.BUGS_TECNICI) {
    scores.BUGS_TECNICI *= 0.5;
    if (scores.BUGS_TECNICI < 1) {
      delete scores.BUGS_TECNICI;
      delete matchedKeywords.BUGS_TECNICI;
    }
  }

  // ── Threshold selection ───────────────────────────────────────────────────
  const maxScore = Math.max(...Object.values(scores), 0);
  const threshold = Math.max(maxScore * 0.4, 0.5);

  const categories = (Object.entries(scores) as [ProblemCategory, number][])
    .filter(([, s]) => s >= threshold)
    .map(([c]) => c);

  // ── Confidence ────────────────────────────────────────────────────────────
  const confidence = wordCount > 0
    ? Math.min(maxScore / Math.max(wordCount * 0.1, 1), 1.0)
    : 0;
  const needsReview = confidence < 0.3 || categories.length === 0;

  // Only keep matched keywords for selected categories
  const finalMatchedKeywords: Partial<Record<ProblemCategory, string[]>> = {};
  for (const cat of categories) {
    if (matchedKeywords[cat]) finalMatchedKeywords[cat] = matchedKeywords[cat];
  }

  return { categories, matchedKeywords: finalMatchedKeywords, confidence, needsReview, sentiment };
}

export function classifyReviewProblems(title: string, body: string): ProblemCategory[] {
  return classifyWithEvidence(title, body).categories;
}

export function classifyBatch(
  reviews: { title: string; review: string }[]
): ProblemCategory[][] {
  return reviews.map((r) => classifyReviewProblems(r.title, r.review));
}

export function classifyBatchWithEvidence(
  reviews: { title: string; review: string }[]
): ClassifyEvidence[] {
  return reviews.map((r) => classifyWithEvidence(r.title, r.review));
}
