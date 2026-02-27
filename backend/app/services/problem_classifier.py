"""
LLM-based problem category classifier using DeepSeek.
Uses the OpenAI-compatible DeepSeek API with concurrent batch processing
to stay well within HTTP timeout limits.
"""
import os
import json
import asyncio
from openai import OpenAI

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")

VALID_CATEGORIES = {
    "BUGS_TECNICI",
    "ONBOARDING_SETUP",
    "UX_USABILITA",
    "FEATURES_FUNZIONALITA",
    "CUSTOMER_SUPPORT",
}

SYSTEM_PROMPT = """Sei un assistente che classifica recensioni di app mobile in categorie di problemi.

Categorie disponibili:
- BUGS_TECNICI: crash, errori tecnici, bug, funzionalità rotte, schermata bianca, loop infinito, errori di accesso
- ONBOARDING_SETUP: difficoltà di registrazione, primo accesso, attivazione account, configurazione iniziale, verifica identità
- UX_USABILITA: navigazione confusa, layout difficile, flussi poco intuitivi, accessibilità, interfaccia non chiara
- FEATURES_FUNZIONALITA: funzionalità mancanti, feature non funzionanti come atteso, funzioni rimosse, limitazioni eccessive
- CUSTOMER_SUPPORT: supporto clienti assente o scadente, nessuna risposta, rimborsi negati, account bloccato

Regole:
- Una recensione può avere massimo 2 categorie
- Se la recensione è positiva o non descrive problemi specifici, l'array è vuoto []
- Restituisci SOLO l'oggetto JSON richiesto, nient'altro"""

BATCH_SIZE = 30
MAX_CONCURRENT = 10  # max parallel DeepSeek calls


def _classify_chunk(texts: list[str]) -> list[list[str]]:
    """Send one chunk of reviews to DeepSeek synchronously, return categories for each."""
    if not DEEPSEEK_API_KEY:
        return [[] for _ in texts]

    client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com")

    numbered = "\n".join(f'{i + 1}. "{t}"' for i, t in enumerate(texts))
    user_msg = (
        f"Classifica queste {len(texts)} recensioni.\n"
        f'Restituisci un oggetto JSON: {{"results": [array1, array2, ...]}} '
        f"dove ogni elemento è l'array di categorie per quella recensione (o [] se nessun problema).\n\n"
        f"{numbered}"
    )

    try:
        resp = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_msg},
            ],
            max_tokens=800,
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content.strip()
        data = json.loads(raw)

        # Extract the results list from the JSON object
        result_list = None
        if isinstance(data, list):
            result_list = data
        elif isinstance(data, dict):
            for key in ("results", "classifications", "categories", "data"):
                if key in data and isinstance(data[key], list):
                    result_list = data[key]
                    break
            if result_list is None:
                for v in data.values():
                    if isinstance(v, list):
                        result_list = v
                        break

        if result_list is None:
            return [[] for _ in texts]

        # Pad to correct length, filter to valid categories only
        padded = (result_list + [[] for _ in texts])[: len(texts)]
        return [
            [c for c in (item if isinstance(item, list) else []) if c in VALID_CATEGORIES]
            for item in padded
        ]
    except Exception:
        return [[] for _ in texts]


async def classify_batch_async(review_texts: list[str]) -> list[list[str]]:
    """
    Classify all reviews with concurrent DeepSeek calls.
    All batches run in parallel via a thread pool — total time ≈ time of one batch
    regardless of how many reviews there are.
    """
    if not review_texts:
        return []

    chunks = [
        review_texts[i : i + BATCH_SIZE]
        for i in range(0, len(review_texts), BATCH_SIZE)
    ]

    # Limit concurrency to avoid rate-limit issues
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    async def classify_with_semaphore(chunk: list[str]) -> list[list[str]]:
        async with semaphore:
            return await asyncio.to_thread(_classify_chunk, chunk)

    results_nested = await asyncio.gather(
        *[classify_with_semaphore(chunk) for chunk in chunks]
    )
    return [item for sublist in results_nested for item in sublist]


def classify_batch(review_texts: list[str]) -> list[list[str]]:
    """Sync fallback — kept for compatibility."""
    if not review_texts:
        return []
    results: list[list[str]] = []
    for i in range(0, len(review_texts), BATCH_SIZE):
        chunk = review_texts[i : i + BATCH_SIZE]
        results.extend(_classify_chunk(chunk))
    return results
