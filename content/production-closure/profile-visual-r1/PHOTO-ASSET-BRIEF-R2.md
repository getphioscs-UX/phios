# Profile Visual R1 — Independent Image Production Brief

**Authority:** owner-approved four design concepts, not reusable image sources.  
**Status:** eight independently usable photographic compositions remain `PENDING_GENERATION_AND_HUMAN_APPROVAL`.  
**Current PR:** #11, visual-only draft. Do not invent raw scores, change report/scorer logic, merge, deploy, or use screenshot crops.

## Shared art direction

Refined PHI OS editorial: warm ivory, sunrise champagne light, dark pine green, teal-blue water, soft slate-blue shadows, and understated gold accents. Photorealistic landscape and fine editorial composition; avoid aggressive orange saturation, branded stock watermarks, logos, icons, text, UI or numbers embedded in the photos. Images should remain usable in both Chinese and English interfaces. Leave intentional calm negative space for HTML headings, buttons, or cards. No artificial claims, charts or measurements inside the photography.

### Required eight standalone WebP exports

| Asset ID | Intended master size | Composition / crop | Essential rule |
| --- | --- | --- | --- |
| `PROFILE-HERO-LANDING-DESKTOP.webp` | 2400 × 1350 | Quiet highland lake at dawn; foreground stone and distant soft hills. Subject and horizon toward right third; left 40% low-detail warm mist supports heading. Central wheel is HTML/CSS and must be visible without image-baked wheel. | No built-in PHI OS logo, text, icon, figure, UI or fake data |
| `PROFILE-HERO-LANDING-MOBILE.webp` | 1080 × 1440 | Purpose-composed narrow sunrise lake/valley scene; light atmospheric horizon above middle; mobile hero text and wheel remain separate HTML. | Mobile composition, not automatic center-crop of desktop |
| `PROFILE-CARD-IDENTITY.webp` | 960 × 640 | Soft rising sun over distant mountains, a stable personal starting point. | No human portrait inference or text |
| `PROFILE-CARD-EXPRESSION.webp` | 960 × 640 | Warm forest trail with subtle light through trees, inviting exploration. | Clear natural texture, teal/gold grading |
| `PROFILE-CARD-RELATIONSHIP.webp` | 960 × 640 | Three distant people walking together at golden hour, no identifiable faces. | Not a claim about someone's real relationships |
| `PROFILE-CARD-ENVIRONMENT.webp` | 960 × 640 | Blue-green lake with mountain landscape; calm surroundings. | Different composition from the Hero |
| `PROFILE-CARD-GROWTH.webp` | 960 × 640 | Small seedling in rich soil with soft morning backlight. | Gentle, natural—not a staged scientific claim |
| `PROFILE-CARD-POSSIBILITY.webp` | 960 × 640 | Wide evening sky with fine distant starlight and mountains. | No astrology chart or prediction elements |

**Export guidance:** Create/approve native original images separately. Convert accepted masters to high-quality WebP, keep original source/master, verify real pixel dimensions, ICC color, sharpness and mobile responsive crop. Provide CSS `object-fit:cover` on photo banners (not on PHI OS diagrams or verified Figures). All text/icon overlays must be accessible native HTML/SVG.

### Existing assets that must be reused

- `PHIOS-LOGO-MARK-v1.png` and approved global PHI OS wordmark.
- Existing approved `PHIOS-HERO-PERSONAL-EVIDENCE-v2.webp` (preserve original bytes).
- All seven existing Profile explanatory Figures and their full-resolution detail access.
- `assets/icons/profile-r1/`: six lens icons + seven real method icons + five account icons + six state icons (24 original independent SVGs total). Keep the signed-off concept mockups as visual references only.
- The six-sector wheel stays an interactive HTML/CSS + Logo implementation, not a flattened PNG.

### Image acceptance checklist

- [ ] Each of the eight photos has one unique approved master identity and SHA-256
- [ ] No duplicate or missing photo, text, Logo, fake value, face details or watermark baked in
- [ ] Chosen Desktop and Mobile Hero are visually consistent with each other
- [ ] Complete visuals stay valid in zh-Hans and English
- [ ] Compare against concept references at 390 / 768 / 1024 / 1440 px
- [ ] Do not hide the native Profile form, result, Account sign-in or explicit save consent
- [ ] Owner signs off before PR #11 stops being Draft

## Static wheel PNG decision

`PROFILE-SIX-DIMENSION-WHEEL-FULL.png` is an **optional export** for media/print only. Do not create it as a runtime prerequisite. The current six-sector wheel already has separate buttons, keyboard navigation, focus and accessible descriptions.

## Unneeded eighth mode

`ICON-MODE-STRUCTURED-ASSESSMENT.svg` is a concept category, not an eighth product or scoring method. Reuse the appropriate Big Five / Full Self-Assessment icon as needed; the production runtime remains exactly seven methods.
