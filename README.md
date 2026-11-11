# website
Personal website for Abhishek Indupally: a plain HTML/CSS/JS site with a race-weekend theme. There's no build step.

- `index.html`: home (Research, research-interest ticker, Garage + publications + skill radars, Journey timeline, Pit Radio)
- `about.html`: about page (driver profile, third-culture story, faith, photo gallery, hobbies, reaction game)
- `styles.css`: theme tokens live at the top in `:root`
- `script.js`: start lights, greeting rotator, lap progress bar, filters, skill radar charts, reaction game
- `assets/about/portrait.jpg`: portrait on the About page (optional; a placeholder shows until added)
- `assets/gallery/01.jpg` … `08.jpg`: gallery photos (edit captions in `about.html`)

**Editing tips**
- Skill radars: edit the `data-skills` JSON on each `.radar` figure in `index.html` (values 0–100).
- Timeline: each entry is an `<li class="ev" data-type="…">` in `#season`. Types are `edu`, `research`, `work`, `lead` and `award`.

**Preview locally:** open `index.html` in a browser, or run `python -m http.server` and visit http://localhost:8000.

**Deploy (GitHub Pages):** Settings → Pages → deploy from `main` / root. To use the custom domain, add a `CNAME` file containing `www.abhishekindupally.com`, then point the domain's DNS at GitHub Pages.
