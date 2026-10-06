# Content guide — writing disease cards and knowledge documents

This is for whoever is writing the plant disease content — no coding
knowledge required. You're writing plain text files with a small block
of structured info at the top (called "frontmatter"), then normal
prose underneath. The build script reads these and turns them into the
app's knowledge base.

**Never edit `ml/build/knowledge.db` directly.** It's regenerated
entirely from the files described here. Any change you want must go
into a `.md` file.

---

## Two kinds of files you'll write

1. **A disease card** — one per disease the app can diagnose. This is
   the app's core knowledge for that disease: what it looks like, what
   causes it, how to treat it. This gets loaded in full every time
   that disease comes up in the chat — write it as the complete,
   authoritative answer for that disease.

2. **Knowledge documents** — supporting material that goes beyond one
   disease's basics: treatment protocols in more depth, seasonal
   fertilizer advice, general care documents. These get searched and
   pulled in only when a farmer's question needs more than the disease
   card covers.

---

## 1. Disease cards

**Location:** `knowledge/diseases_cards/<class_label>.md`

`<class_label>` must exactly match the internal name of the disease
used by the detection model. **Ask the ML team for the exact spelling
before creating the file** — a typo here means the app can diagnose a
disease with no card to show for it, and the build will refuse to run
until it's fixed.

**Template:**

```markdown
---
class_label: olive_peacock_spot
plant: olive
name_fr: Œil de paon
name_ar: عين الطاووس
name_en: Peacock spot
scientific_name: Venturia oleaginea
severity: 3
lang: fr
suggested_questions:
  - Quels sont les symptômes ?
  - Quel traitement utiliser ?
  - Comment prévenir cette maladie ?
---

## Symptômes
[Describe what the disease looks like on the plant — leaves, fruit,
bark, wherever it shows. Be specific: color, shape, pattern, where on
the plant it starts.]

## Cause
[What causes it — fungus, bacteria, pest, environmental condition.]

## Traitement
[What the farmer should actually do. Be concrete: product names,
timing, method. This is the answer that matters most.]

## Prévention
[How to avoid it next season.]
```

**Field notes:**

| Field | What it means |
|---|---|
| `class_label` | Exact internal disease ID — get this from the ML team, don't guess |
| `plant` | Which crop, matching an `id` in `knowledge/plants.yaml` |
| `severity` | 0 = healthy, 1 = low, 2 = medium, 3 = high — a rough farmer-facing urgency signal |
| `suggested_questions` | The tappable question buttons shown in the app after this diagnosis — write these as a farmer would actually ask them, in `lang` |
| `lang` | Language of everything below the frontmatter |

**Writing style:** Write full sentences a farmer will actually read
aloud to themselves — not clinical shorthand. Say what to *do*, not
just what's true. "Apply copper-based fungicide in autumn before leaf
fall" is more useful than "cupric treatment is indicated."

Keep the whole card under roughly 600 words. It's loaded in full for
every question about that disease — long is worse, not more thorough.

---

## 2. Knowledge documents

**Location — pick one of two folders depending on scope:**

- **Specific to one disease** (a deeper treatment protocol, dosage
  guide, product comparison):
  `knowledge/corpus/diseases/<class_label>/your_file_name.md`
  — the folder name must exactly match an existing disease card's
  `class_label`.

- **General to a crop, not tied to any one disease** (fertilizer
  schedules, pruning, irrigation, soil care):
  `knowledge/corpus/plants/<plant_id>/your_file_name.md`
  — `<plant_id>` must match an `id` in `knowledge/plants.yaml`.

If you're not sure which folder a document belongs in, ask: "does this
only make sense once a specific disease is diagnosed?" If yes →
`diseases/`. If it's useful any time regardless of diagnosis → `plants/`.

**Template:**

```markdown
---
title: Fertilisation de l'olivier en automne
lang: fr
source: internal
license: internal
---

[The actual content. Write it as continuous prose or with subheadings
— whatever reads naturally. No need to structure it into sections like
a disease card; this gets automatically split into smaller pieces by
the build script, so write it as you would a normal document.]
```

**Field notes:**

| Field | What it means |
|---|---|
| `title` | Shown as the source name if this document ever gets cited to a farmer |
| `lang` | Required — the app filters retrieval by language |
| `source` | Where this came from (a report name, a website, "internal") — for the team's own tracking, not shown to farmers |
| `license` | Note if the source material has any usage restriction |

**Length:** No strict limit, but write in reasonably self-contained
paragraphs — the system searches for relevant *passages*, not whole
documents, so a paragraph should make sense on its own without relying
on something three paragraphs earlier.

---

## Before you commit

- [ ] `class_label` in a disease card matches what the ML team gave you, exactly (case and spelling)
- [ ] `plant` / folder name matches an entry in `plants.yaml`
- [ ] Every corpus document has `lang` set
- [ ] Disease card is under ~600 words
- [ ] Read it out loud once — does it sound like something you'd actually say to a farmer?

If you're unsure whether a file will build correctly, ask someone on
the app team to run `python scripts/build_knowledge_db.py` — it will
fail with a clear error message naming the exact file and problem if
something's wrong, rather than failing silently.