# Ochre Morocco

Tourism website for Ochre Morocco — private excursions, desert circuits and airport transfers from Marrakech.

**Website:** [ochremorocco.com](https://ochremorocco.com)

---

## Pages

| File | Description |
|------|-------------|
| `index.html` | Homepage |
| `excursions.html` | Excursions catalogue |
| `circuits.html` | Multi-day circuits |
| `desert-agafay.html` | Agafay Desert page |
| `transferts.html` | Airport transfers |
| `about.html` | About us |
| `contact.html` | Contact |
| `blog.html` | Blog |

## Admin

Access at `/admin/` — requires a Supabase account set up as admin.  
Run `supabase-setup.sql` once in the Supabase SQL editor to create tables and RLS policies.

## Assets

```
assets/
  css/style.css       — main stylesheet
  css/booking.css     — booking modal styles
  js/main.js          — interactions, language & currency switchers
  js/booking.js       — booking modal
  js/data-loader.js   — loads excursions from Supabase or JSON fallback
  js/supabase-client.js
data/
  excursions.json     — fallback data
  settings.json       — site config
```

## Languages

English · Français · Español

## Contact

- **WhatsApp:** +212 694 170 004
- **Email:** ochremorocco@gmail.com
- **Location:** Marrakech, Morocco

---

© 2026 Ochre Morocco. All rights reserved.
