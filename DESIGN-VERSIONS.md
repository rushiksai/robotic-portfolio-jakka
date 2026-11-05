# Portfolio versions

Version 1 lives in `personal-portfolio-robotics`. Version 2 is an independent sibling project, `personal-portfolio-robotics-v2`.

- Version 1 keeps the existing page order and royal-blue styling. The actual experience cards move along a 3D arc on page scroll. There is no spring, duplicate representation, internal scrollbar, or forced card height.
- Version 2 uses the same information, colors and Inter typeface, with selected work near the top, the original font weights, compact project rows, and native expandable experience details. It is the selected direction for further edits.
- Both consolidate the 2-DOF master's project, remove the bachelor's wheelchair project and duplicate 2-DOF project card, and keep 3+ robotics projects.
- Version 1 retains the illustrated autoplay pan/tilt study. Version 2 uses the camera presentation described below; both retain the actual prototype photograph.
- CAD cards contain only a preview and CAD/STEP actions. The 3D viewer still opens the original GLB assets.
- `assets/robot-arm-loop.webm` is an approximately 1 MB, 12-second, muted rendered pick-and-place loop. It is an original procedural animation, not workplace footage. Its editable source is `assets/robot-arm-scene.html`; the poster is stored alongside it.
- Video and demo animation pause when outside the viewport or when the tab is hidden. Reduced motion disables autoplay and card rotation. Small screens use the full readable experience list.
- `rushik-portrait.png` is the background-removed version of the new user-provided `test.jpeg`. See `portrait-edit.md` for the imagegen prompt and earlier portrait backups.

No build or package installation is required. Run `python3 -m http.server 4173 --bind 127.0.0.1` in Version 1, or use port 4176 in Version 2. Run `node test.cjs` in either folder for the pure geometry, motion, content and local-asset checks.

Browser verification covered both themes, EN/DE, desktop/mobile, actual-card scroll, video playback, demo autoplay/pause/manual/reset, CAD actions, keyboard navigation and reduced motion. Nothing has been published or deployed.

## Version 2 refinements — 17 September 2026

- Restored the original Inter weights: 700 for the hero/project titles, 800 for section headings, 600 for experience roles and skill tags. Buttons share consistent padding and a 44 px minimum height; skill tags remain compact labels with stable hover bounds.
- White mode reduces the hero overlay and keeps video opacity at 0.72 so the arm remains visible while the text stays readable.
- Four local SVG maps represent English (UK, B2), German (Germany, B1), Hindi (India, A1), and Telugu (Andhra Pradesh and Telangana, native). Flag pins reveal the levels on hover, keyboard focus or tap; Escape and a second tap dismiss them. EN/DE and reduced motion remain supported.
- UK and Germany outlines are from [Natural Earth](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), public domain. Andhra Pradesh and Telangana outlines are from DataMeet India community / Election Commission of India through [geoBoundaries](https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/), [CC BY 2.5 IN](https://creativecommons.org/licenses/by/2.5/in/). Outlines were simplified and styled as SVGs; attribution is shown below the maps. No runtime map service or additional dependency is used.

## India boundary correction

The Hindi card now uses the [Survey of India official international boundary vector](https://surveyofindia.gov.in/pages/outline-maps-of-india), downloaded from https://surveyofindia.gov.in/documents/Outline_of_India.zip on 17 September 2026. It replaces the Natural Earth India geometry. The SVG preserves the source Lambert conformal conic projection and all 1,151 polygon rings, with a maximum geometric simplification tolerance of 0.08 SVG units before three-decimal coordinate rounding. The tricolor styling and flag-pin interaction are unchanged. Copyright belongs to Survey of India; the site's [vector usage notice](https://www.surveyofindia.gov.in/documents/ibd-vectorformat.pdf) permits individual and website purposes and restricts commercial usage. Attribution is included in the language section and SVG metadata.

## Version 2 camera presentation — 17 September 2026

Replaces the rejected exploded assembly controls, separate build-step panels, and obstacle-navigation playground. The actual ROS 2 delivery project and its recording remain.

- A single intact 3D illustration fills a sticky stage. Native page scroll moves the viewpoint from a lens close-up to the camera, pulls back to the full mechanism, then rotates more than 180 degrees around the structure. Scrolling upward reverses that same sequence.
- `cinematic.js` defines the illustrative geometry, continuous camera poses, and a small native WebGL renderer with depth testing. It adds no runtime library, asset download, wheel handler, nested scrollbar, or timer-driven animation. Rendering runs on scroll/resize only, at a capped device pixel ratio of 2.
- `cinematic.css` provides the large stage, short captions, royal-blue/white themes and mobile framing. The original Inter font and sidebar remain. EN/DE captions are in `script.js`.
- Project details and See the real prototype links skip the sequence. The photo, project description, experience link and four compact CAD/STEP cards follow it. The model is explicitly labelled as an illustration, not an exact CAD assembly.
- Reduced-motion preferences and short viewports show a static overview without the extended scroll section. WebGL unavailability or context loss uses the actual prototype photo. The hero video retains its visibility and reduced-motion controls in `motion.js`.
- `node test.cjs` checks camera continuity, finite mesh geometry, removal of the previous experiment, anchors, assets and existing experience geometry. The previous experiment is backed up locally in `Documents/New project/portfolio-v2-before-cinematic`.

## Delivery robot walkthrough — 18 September 2026

- `#delivery-lab` adds a second continuous scroll scene: a rooftop LiDAR close-up, a closed-door reveal, the door opening, the TurtleBot passing through, and a closer orbit as it stops before an obstacle. The same page scroll controls the camera, door and robot; there is no nested scroll, game or timed autoplay.
- Both projects share the native WebGL renderer and mesh primitives in `cinematic.js`. Delivery parts have separate transforms for the door, chassis and rolling wheels. Scan rays intersect the illustrated wall, door and obstacle geometry. They are not measurements from a bag file. The TurtleBot is a generic illustration, not an exact hardware model.
- The latest user clarification determines the walkthrough's stop: LiDAR detects an obstacle, rather than an elapsed three or four seconds. Travel is capped at the obstacle's clearance boundary. The checked-in [door node](https://github.com/rushiksai/ros-2/blob/main/rpwr-assignments/internship/group5_ws/src/door_control_pkg/door_control_pkg/door_lidar_node.py) currently uses a timed three-second forward phase; the illustration is not claimed to execute or replay that code. The source repository is unchanged.
- The existing [project recording](https://www.youtube.com/watch?v=6ao7w6dNs8w), GitHub project and [rosbag2/MCAP scan-analysis script](https://github.com/rushiksai/ros-2/blob/main/rpwr-assignments/internship/group5_ws/scripts/analyze_door.py) remain linked below the sequence. No bag data was available or used in the animation.
- EN/DE, dark/white themes, mobile framing, reduced-motion static overview and a local SVG fallback are supported. `test.cjs` verifies door-first movement, the obstacle clearance, scan intersections, camera continuity and mesh validity. The previous V2 files are backed up in `Documents/New project/portfolio-v2-before-delivery`.


## Project order and menu refinement — 18 September 2026

- Featured project 01 groups the pan–tilt scroll presentation, prototype, description and CAD/STEP parts. Featured project 02 follows with the delivery scroll presentation, recording, source and bag analysis.
- A separate More robotics & vision list follows: Yardstick 6-DOF work, ROS 2 multi-agent tracking, then OpenCV. These share compact row layouts and context labels. The tracking title now identifies the ROS 2 simulation clearly, separate from the delivery TurtleBot.
- Sidebar hover and keyboard-focus underlines are centered and limited to 32 px; the full menu-link hit area remains.
