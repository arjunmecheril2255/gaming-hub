# Arjun's Gaming Hub

## Included
- VALORANT
- GTA V — FiveM
  - Characters
  - Gang RP
  - PD RP
  - Citizen RP
- GTA V
- Rounded image cards
- Add/edit/delete games
- Add/edit/delete subdivisions
- Export/import JSON data
- Responsive mobile/desktop design

## Test
Open `index.html` in a browser.

## Admin
Click **Admin**.
Demo password: `admin123`

Change the password inside `script.js` before publishing:
if($("adminPassword").value === "admin123")

## Important
This version stores edits in browser `localStorage`. That means it is excellent for testing and personal use, but edits do NOT automatically sync to every visitor.

For a real public website where you can log in from your phone and change content for everyone, connect the admin panel to a backend such as Supabase or Firebase.

## Publish free with GitHub Pages
1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js`.
3. Repository Settings → Pages.
4. Select Deploy from branch → `main` → `/root`.
5. GitHub will give you a public URL.



## Profile section
The site now has a creator profile at the top with:
- OG username: Kuttan PP
- Profile photo URL
- Bio
- Instagram link
- YouTube link
- Admin-only Edit Profile button

You can change these from Admin → Edit Profile.
