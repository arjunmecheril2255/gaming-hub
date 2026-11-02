# Kuttan's Gaming Hub — Secure Version

This version uses Supabase Auth + Row Level Security instead of the old hardcoded `admin123` password and browser-only localStorage.

## One-time Supabase step

Because the website uses one fixed row (`id = 1`), insert the initial content once in Supabase SQL Editor:

```sql
insert into public.site_data (id, data)
values (
  1,
  '{
    "profile": {
      "name": "Kuttan PP",
      "image": "",
      "bio": "Gaming • FiveM RP • VALORANT",
      "instagram": "",
      "youtube": ""
    },
    "games": [
      {
        "id": "valorant",
        "name": "VALORANT",
        "image": "",
        "description": "Competitive tactical shooter.",
        "subdivisions": [
          {"id": "ranked", "name": "Ranked", "image": "", "description": "Competitive ranked gameplay."},
          {"id": "esports", "name": "Esports", "image": "", "description": "Teams, tournaments and competitive play."}
        ]
      },
      {
        "id": "fivem",
        "name": "GTA V — FiveM",
        "image": "",
        "description": "Roleplay, characters and custom servers.",
        "subdivisions": [
          {"id": "characters", "name": "Characters", "image": "", "description": "My FiveM characters and profiles."},
          {"id": "gang-rp", "name": "Gang RP", "image": "", "description": "Gang roleplay and stories."},
          {"id": "pd-rp", "name": "PD RP", "image": "", "description": "Police Department roleplay."},
          {"id": "citizen-rp", "name": "Citizen RP", "image": "", "description": "Citizen roleplay and everyday stories."}
        ]
      },
      {
        "id": "gta-v",
        "name": "GTA V",
        "image": "",
        "description": "Grand Theft Auto V.",
        "subdivisions": [
          {"id": "story", "name": "Story Mode", "image": "", "description": "Story mode gameplay."},
          {"id": "online", "name": "GTA Online", "image": "", "description": "Online gameplay."}
        ]
      }
    ]
  }'::jsonb
)
on conflict (id) do nothing;
```

## Security
- Supabase Auth handles the admin email/password.
- RLS allows public reading but only your authenticated UID can update.
- The browser contains only a publishable key, which is designed to be public when RLS is configured correctly.
- Never put a `sb_secret_...` key in this website.

## Deploy
Upload `index.html`, `style.css`, `script.js`, and this README to your GitHub repository and enable GitHub Pages when ready.
