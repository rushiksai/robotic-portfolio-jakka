# Portrait cutout

Asset: `rushik-cutout.png` (transparent PNG)
Source: the existing `jakka_new.jpeg` portrait, converted to PNG for compatibility.
Method: built-in ImageGen, background extraction. The blue shape and white rim are SVG in `index.html`; the portrait has no hover animation.

## Edit prompt

Use case: background-extraction. Edit target: the attached original photograph of Rushik Sai Jakka (man with glasses, dark blazer and pink checked shirt). Remove ONLY the entire outdoor background, leaving an accurate, clean photographic cutout of the same person. Preserve the exact face, smile, glasses, hair including flyaways, beard, skin color, clothing, pose and natural lighting; do not redraw, beautify, stylize or change the person. Keep head, shoulders and the visible upper torso. The complete hair must be visible with a small transparent margin above it. All areas outside the person must be actual transparent alpha, including the background between hair wisps and around the shoulders. No replacement background, no colored shape, no border, no shadow, no text, no checkerboard baked into pixels. Output a high quality transparent PNG cutout for a website portrait. Crop the canvas reasonably close to the person's head and upper torso, maintaining enough shoulder width to use in an organic portrait frame.


## Vertical photo experiment (15 September 2026)

Source: `test.heic` (converted to PNG with macOS sips). Output: `rushik-vertical-cutout.png`. Background removed using the built-in imagegen tool; original alpha channel retained. The existing monkey-face sticker is preserved. The previous SVG portrait markup is commented in `index.html`, and `rushik-cutout.png` is kept as its backup asset. The blue frame and static pop-out crop remain SVG.

Final prompt:

> Use case: background-extraction. Asset type: transparent PNG cutout for a portfolio hero. Input image 1 is the edit target. Remove only the marina, boats, buildings, trees, railings and all other background. Keep the complete visible person including the large monkey-face sticker covering their face, all visible hair, both raised hands/arms, black coat, pink shirt, bag and trousers exactly as supplied. Preserve the monkey sticker exactly; do not replace it with a human face. Preserve original pose, proportions, clothing textures and warm photographic lighting. Crop away empty space so the person fills a vertical portrait canvas with a small transparent margin around their outline. Output a genuinely transparent alpha background, not a checkerboard, solid color or shadow. Do not add any shapes or graphic frame; those will be made in CSS. No beautification or reimagining.


## Portrait without sticker

Source: user-provided `test.jpeg`, converted losslessly to PNG with macOS sips because the JPEG contained MPO metadata. Saved asset: `rushik-portrait.png`. Built-in imagegen background extraction, retaining alpha. The earlier assets remain available as backups.

Final prompt:

> Use case: background-extraction. Asset type: transparent PNG portrait for this person's portfolio hero. Input image 1 is the edit target. Remove only the marina, boats, rails, trees, buildings and all other background. Keep the exact photographed person with his sunglasses, face, hairstyle, beard, raised hands, black coat, pink shirt, bag and trousers. Preserve his identity, facial geometry, expression, pose, clothing and original photographic lighting exactly; do not beautify or redraw his face. Crop away empty space so the complete visible person fills a portrait canvas, leaving a small transparent margin. Output a genuine transparent alpha background. No graphics, shapes, text, artificial shadow or checkerboard; the website will add the frame.
