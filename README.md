# Diné Bizaad — Navajo Dictionary

A web-based Navajo-English dictionary with over 8,600 words and phrases, built to help preserve and promote the Diné language.

## About

This dictionary is based on the 1958 Wall & Morgan Navajo-English Dictionary. It provides a fast, searchable interface for learners, speakers, and researchers to explore the Navajo language.

**Our Language. Our Heritage.**

## Features

- **Bidirectional search** — Search Navajo to English or English to Navajo
- **Smart matching** — Diacritics are optional (searching "hozho" finds "hózhó")
- **Browse by letter** — Explore all entries alphabetically, including Navajo-specific characters (Ł, ʼ)
- **Word of the Day** — A featured word changes daily
- **Favorites** — Save words for quick reference (stored locally in your browser)
- **Recent searches** — Quickly revisit previous lookups
- **Responsive design** — Works on desktop and mobile with a native app feel

## Tech Stack

- **Frontend** — Vanilla HTML, CSS, and JavaScript (no frameworks)
- **Database** — [Supabase](https://supabase.com) (PostgreSQL) with Row Level Security
- **Design** — Southwest-inspired UI with Navajo geometric patterns

## Data

The full dictionary dataset (8,600+ entries) is stored privately in Supabase and is not included in this repository. See [`sample_data.json`](sample_data.json) for the data format:

```json
[
  { "navajo": "yá'át'ééh", "english": "hello; greetings" },
  { "navajo": "Hágoóneeʼ", "english": "goodbye; bye; see you later" },
  { "navajo": "ahéhee'", "english": "thank you" },
  { "navajo": "hózhó", "english": "beauty; harmony; balance" },
  { "navajo": "tó", "english": "water" }
]
```

## Setup

To run this project locally you will need your own Supabase instance with the dictionary data loaded.

1. Create a [Supabase](https://supabase.com) project
2. Create a `words` table with `navajo` (text) and `english` (text) columns
3. Enable Row Level Security with a read-only policy
4. Update `SUPABASE_URL` and `SUPABASE_KEY` in `app.js` with your project credentials
5. Open `index.html` in a browser

## License

Dictionary data compiled for educational and reference purposes. Built with respect for the Navajo language and culture.
