import re
import logging
import spacy

logger = logging.getLogger(__name__)

_nlp = None


def get_nlp():
    global _nlp
    if _nlp is None:
        logger.info("Loading spaCy model...")
        _nlp = spacy.load("en_core_web_sm")
        logger.info("spaCy model loaded.")
    return _nlp


# Regex patterns for payment-domain fields
PATTERNS = {
    "Invoice Number": [
        r"(?i)inv(?:oice)?\s*(?:no|number|#)?[\s:\-]*([A-Z]{2,5}[\-]?\d[\w\-]{2,20})",
    ],
    "Purchase Order": [
        r"(?i)(?:^|\s)p\.?o\.?\s*(?:no|number|#)[\s:\-]+([A-Z0-9][\w\-]{2,20})",
    ],
    "Check Number": [
        r"(?i)check\s*(?:no|number|#)?[\s:\-]*(\d{3,10})",
    ],
    "Account Number": [
        r"(?i)acct?\.?\s*(?:no|number|#)?[\s:\-]*(\d{4,20})",
    ],
    "Routing Number": [
        r"(?i)routing\s*(?:no|number|#)?[\s:\-]*(\d{9})",
    ],
    "Phone": [
        r"(?:(?:\+1[\s\-]?)?(?:\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}))",
    ],
    "Email": [
        r"[a-zA-Z0-9._%+\-]{2,}@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    ],
}

MONEY_PATTERN = re.compile(
    r"\$\s?[\d,]+\.\d{2}"
)

# Labeled money: "Total: $X" or "Total Due: $X" etc.
# Requires $ sign to avoid matching percentages like "Tax (8.875%)"
LABELED_MONEY_PATTERN = re.compile(
    r"(?i)(total\s*(?:due)?|subtotal|amount\s*(?:due)?|balance|paid)\s*[:\-]\s*\$?\s?([\d,]+\.\d{2})"
    r"|(?i)(tax)\s*(?:\([^)]*\))?\s*[:\-]\s*\$?\s?([\d,]+\.\d{2})",
)

DATE_PATTERN = re.compile(
    r"(?<!\d)\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}(?!\d)"
    r"|(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}"
    r"|(?<!\d)(?:19|20)\d{2}[/\-]\d{2}[/\-]\d{2}(?!\d)",
    re.IGNORECASE,
)

# Short words that spaCy often misidentifies as PERSON
FALSE_PERSON_NAMES = {"bill", "due", "pay", "net", "tax", "total", "cash", "check", "memo", "void"}

# Common product/item words that spaCy misidentifies as ORG/PERSON
PRODUCT_NOISE_WORDS = {
    "paper", "pen", "pens", "folder", "folders", "clip", "clips", "marker", "markers",
    "note", "notes", "sticky", "binder", "tape", "stapler", "organizer", "desk",
    "copy", "whiteboard", "manila", "ballpoint", "eraser", "toner", "cartridge",
}


def extract_fields(text: str) -> list[dict]:
    """Extract structured fields from OCR text using spaCy NER + regex."""
    nlp = get_nlp()
    fields = []
    seen_values: dict[str, set[str]] = {}

    def normalize_amount(val: str) -> str:
        return re.sub(r"[^\d.]", "", val)

    def add_field(name: str, value: str, confidence: float):
        value = value.strip()
        if not value:
            return

        if name not in seen_values:
            seen_values[name] = set()

        # For amounts, deduplicate by numeric value
        if name in ("Amount", "Total", "Subtotal", "Tax"):
            norm = normalize_amount(value)
            if norm in seen_values.get("Amount", set()) | seen_values.get("Total", set()) | seen_values.get("Subtotal", set()) | seen_values.get("Tax", set()):
                return
            seen_values.setdefault(name, set()).add(norm)
        elif name in ("Organization", "Person"):
            norm = value.lower().strip(".")
            existing = seen_values.get(name, set())
            if norm in existing or any(norm in e or e in norm for e in existing):
                return
            seen_values.setdefault(name, set()).add(norm)
        else:
            if value in seen_values[name]:
                return
            seen_values[name].add(value)

        fields.append({"field": name, "value": value, "confidence": confidence})

    # --- Labeled money amounts (highest priority — "Total: $X") ---
    for match in LABELED_MONEY_PATTERN.finditer(text):
        # Groups 1,2 are for non-tax labels; groups 3,4 are for tax
        if match.group(1):
            label_raw = match.group(1).strip().lower()
            amount = match.group(2).strip()
        else:
            label_raw = match.group(3).strip().lower()
            amount = match.group(4).strip()

        if not amount.startswith("$"):
            amount = "$" + amount

        if "subtotal" in label_raw:
            add_field("Subtotal", amount, 0.96)
        elif "tax" in label_raw:
            add_field("Tax", amount, 0.96)
        elif "total" in label_raw:
            add_field("Total", amount, 0.97)
        else:
            add_field("Amount", amount, 0.95)

    # Unlabeled money amounts (line items)
    for match in MONEY_PATTERN.finditer(text):
        val = match.group().strip()
        add_field("Amount", val, 0.90)

    # Dates
    for match in DATE_PATTERN.finditer(text):
        add_field("Date", match.group(), 0.92)

    # Domain-specific patterns
    for field_name, patterns in PATTERNS.items():
        for pattern in patterns:
            for match in re.finditer(pattern, text):
                value = match.group(1) if match.lastindex else match.group()
                add_field(field_name, value, 0.90)

    # --- spaCy NER (for names, organizations, etc.) ---
    doc = nlp(text[:10000])

    for ent in doc.ents:
        if "\n" in ent.text or len(ent.text) > 50:
            continue

        ent_lower = ent.text.lower()
        ent_words = set(ent_lower.split())

        # Skip if it looks like a product/item description
        if ent_words & PRODUCT_NOISE_WORDS:
            continue

        if ent.label_ == "ORG":
            if len(ent.text) > 3 and ":" not in ent.text and "&" not in ent.text:
                noise_words = {"invoice", "date", "number", "total", "subtotal", "tax", "amount", "payment", "account"}
                if not any(w in ent_lower for w in noise_words):
                    add_field("Organization", ent.text, 0.80)
        elif ent.label_ == "PERSON":
            if (ent_lower not in FALSE_PERSON_NAMES
                    and len(ent.text.split()) >= 2
                    and not any(w in ent_lower for w in {"drive", "street", "floor", "suite", "ave", "blvd"})):
                add_field("Person", ent.text, 0.78)
        elif ent.label_ == "GPE" and len(ent.text) > 2:
            add_field("Location", ent.text, 0.75)

    # Sort: labeled fields first (Total, Subtotal, Tax), then by confidence
    priority = {"Total": 0, "Subtotal": 1, "Tax": 2, "Date": 3, "Invoice Number": 4}
    fields.sort(key=lambda f: (priority.get(f["field"], 10), -f["confidence"]))

    return fields
