# website
Personal website for Abhishek Indupally: a single-page site in plain HTML, CSS and JS with a race-weekend theme. There's no build step.

- `index.html`: all content. S1 Research → S2 Garage (projects, publications, skill radars) → S3 Journey (timeline) → S4 About (profile, passport, faith, photo carousel, hobbies, reaction game) → Pit Radio (contact)
- `styles.css`: theme tokens live at the top in `:root`
- `script.js`: start lights, greeting rotator, lap progress, project tags, timeline filters, carousel, skill radars, reaction game
- `assets/about/portrait.jpg`: portrait in S4 (optional; a placeholder shows until added)
- `assets/gallery/01.jpg` … `08.jpg`: carousel photos. Edit captions in `index.html`, and add or remove `<figure class="slide">` blocks freely
- `robots.txt`, `sitemap.xml`: for search engines

**Editing tips**
- Project tags: edit the `<ul class="ptags">` list on each project card. The tag bar above the projects is built automatically from tags shared by two or more projects.
- Skill radars: edit the `data-skills` JSON on each `.radar` figure (values 0–100).
- Timeline: each entry is an `<li class="ev" data-type="…">` in `#season`. Types are `edu`, `research`, `work`, `lead` and `award`.
- Photos: export at about 1200 px on the long side as JPG/WebP (under ~250 KB each) to keep the page fast.

**Preview locally:** open `index.html` in a browser, or run `python -m http.server` and visit http://localhost:8000.

**Deploy (GitHub Pages):** Settings → Pages → deploy from `main` / root. To use the custom domain, add a `CNAME` file containing `www.abhishekindupally.com`, then point the domain's DNS at GitHub Pages.
