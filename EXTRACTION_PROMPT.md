# Prompt for Extracting Wall & Morgan (1958) Navajo-English Dictionary

Use this prompt when uploading the PDF to Gemini or ChatGPT for extraction.
Process in batches of ~10 pages at a time to avoid quality degradation.

---

## PROMPT (copy everything below this line)

I'm uploading pages from the **Wall & Morgan (1958) Navajo-English Dictionary**. This is a scanned book with 3-column layout. I need you to extract every dictionary entry into JSON.

### Entry format in the source
Each entry looks like:
**'headword,** definition text that may span multiple lines.

The headword is typically bold. Entries are separated by line breaks. Some definitions contain example phrases in bold italic.

### Output format
Return a JSON array. Each entry:
```json
{
  "navaho": "'áádóó",
  "english": "from there on; and then; and; from that point on; from there."
}
```

### CRITICAL — Diacritics must be exact

This dictionary uses Navajo orthography with these special characters. You MUST preserve them exactly using these Unicode code points:

| Character | Meaning | Unicode |
|-----------|---------|---------|
| á | high tone a | U+00E1 |
| é | high tone e | U+00E9 |
| í | high tone i | U+00ED |
| ó | high tone o | U+00F3 |
| ą | nasal a (a with ogonek) | U+0105 |
| ę | nasal e (e with ogonek) | U+0119 |
| į | nasal i (i with ogonek) | U+012F |
| ǫ | nasal o (o with ogonek) | U+01EB |
| ą́ | nasal + high tone a | U+0105 U+0301 (TWO code points) |
| ę́ | nasal + high tone e | U+0119 U+0301 (TWO code points) |
| į́ | nasal + high tone i | U+012F U+0301 (TWO code points) |
| ǫ́ | nasal + high tone o | U+01EB U+0301 (TWO code points) |
| ł | barred L (voiceless L) | U+0142 |
| Ł | capital barred L | U+0141 |
| ń | nasal n | U+0144 |
| ' | glottal stop / ejective | U+0027 (apostrophe) |

**WARNINGS:**
- The nasal+high tone vowels (ą́ ę́ į́ ǫ́) require TWO Unicode code points — the ogonek vowel PLUS combining acute accent U+0301. Do NOT drop the combining accent. Do NOT substitute a single precomposed character.
- Long vowels are doubled letters: aa, áá, ee, éé, ii, íí, oo, óó, ąą, ęę, etc.
- Falling tone = first vowel has accent: áa, ée, etc. Rising tone = second vowel has accent: aá, eé, etc.
- The glottal stop (') appears very frequently — at the start of words, between vowels, and after consonants (k', t', ts', tł', ch'). Do NOT strip these.
- ł (barred L) is NOT regular l. They are distinct consonants.

### Validation
After each batch, include a `_check` object:
```json
{
  "_check": {
    "page_range": "7-8",
    "entry_count": 156,
    "first_entry": "'áádóó",
    "last_entry": "'ádaqh",
    "sample_nasals": ["bizeęs", "'ąą"],
    "sample_high_tone_nasals": ["'áchį́shtan", "dlǫ́ǫ́'"],
    "sample_glottals": ["k'aa'", "ts'ah"]
  }
}
```

### Process pages in order
- Start from the first page with **-A-** section header
- Go through each column left to right, top to bottom
- Preserve the EXACT headword spelling — do not "correct" or normalize anything
- If you cannot read a character clearly, put [?] after your best guess
- Definitions can be joined into a single string, preserving semicolons and commas as in the original

### Do NOT:
- Skip entries
- Merge entries
- "Fix" or modernize spellings
- Replace ł with l
- Drop apostrophes/glottal stops
- Use curly/smart quotes — use straight apostrophe U+0027 only
- Flatten the two-codepoint nasal+tone vowels into single characters
