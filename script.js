function initApp() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function refreshLucide() { window.lucide?.createIcons(); }
  refreshLucide();

  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  function closeNav() {
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('is-open');
    navLinks.inert = true;
  }
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);
    navLinks.inert = !open;
  });
  navLinks.addEventListener('click', event => { if (event.target.closest('a')) closeNav(); });
  document.addEventListener('click', event => { if (!event.target.closest('.navbar')) closeNav(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      closeNav(); navToggle.focus();
    }
  });

  const themeToggle = document.getElementById('theme-toggle');
  function updateThemeLabel() {
    const light = document.documentElement.dataset.theme === 'light';
    const de = document.documentElement.lang === 'de';
    document.getElementById('theme-label').textContent = de ? (light ? 'Dunkelmodus' : 'Weißmodus') : (light ? 'Dark mode' : 'White mode');
    themeToggle.setAttribute('aria-pressed', String(light));
    themeToggle.setAttribute('aria-label', de ? (light ? 'Zum dunklen Design wechseln' : 'Zum weißen Design wechseln') : (light ? 'Switch to dark mode' : 'Switch to white mode'));
    document.querySelector('meta[name="theme-color"]').content = light ? '#ffffff' : '#071230';
  }
  themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('portfolio-theme', theme); } catch { /* The toggle still works without persistence. */ }
    updateThemeLabel();
  });
  updateThemeLabel();

  const languageCards = [...document.querySelectorAll('.language-map-card')];
  function setLanguagePin(card, open) {
    card.classList.toggle('is-open', open);
    card.querySelector('.language-pin').setAttribute('aria-expanded', String(open));
  }
  languageCards.forEach(card => {
    const pin = card.querySelector('.language-pin');
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') setLanguagePin(card, true); });
    card.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse' && !pin.matches(':focus-visible')) setLanguagePin(card, false); });
    pin.addEventListener('focus', () => { if (pin.matches(':focus-visible')) setLanguagePin(card, true); });
    pin.addEventListener('blur', () => setLanguagePin(card, false));
    pin.addEventListener('click', () => setLanguagePin(card, !card.classList.contains('is-open')));
  });
  document.addEventListener('click', event => {
    languageCards.forEach(card => { if (!card.contains(event.target)) setLanguagePin(card, false); });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') languageCards.forEach(card => setLanguagePin(card, false));
  });

  const cadModal = document.getElementById('cadModal');
  const cadViewer = document.getElementById('cadViewer');
  const cadStatus = document.getElementById('cadStatus');
  const cadClose = cadModal.querySelector('.cad-modal-close');
  let cadTrigger;
  let viewerReady;
  function loadViewer() {
    // Load the existing 3D viewer only when someone opens a CAD model.
    if (!viewerReady) {
      viewerReady = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js';
        script.onload = resolve;
        script.onerror = () => { script.remove(); viewerReady = null; reject(new Error('Viewer unavailable')); };
        document.head.appendChild(script);
      });
    }
    return viewerReady;
  }
  document.querySelectorAll('.js-open-cad').forEach(button => {
    button.addEventListener('click', () => {
      cadTrigger = button;
      const de = document.documentElement.lang === 'de';
      const title = de ? button.dataset.titleDe : button.dataset.title;
      document.getElementById('cadModalTitle').textContent = title;
      document.getElementById('cadModalDesc').textContent = de ? button.dataset.descriptionDe : button.dataset.description;
      cadStatus.textContent = de ? '3D-Modell wird geladen …' : 'Loading 3D model …';
      cadViewer.setAttribute('src', button.dataset.model);
      cadViewer.setAttribute('poster', button.dataset.poster);
      cadViewer.setAttribute('alt', title);
      cadViewer.setAttribute('camera-orbit', button.dataset.orbit);
      cadViewer.setAttribute('field-of-view', button.dataset.fov);
      cadViewer.toggleAttribute('auto-rotate', !reducedMotion.matches);
      cadModal.inert = false;
      cadModal.classList.add('active');
      cadModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      cadClose.focus();
      loadViewer().catch(() => {
        if (cadModal.classList.contains('active')) cadStatus.textContent = de ? '3D-Ansicht nicht verfügbar. Bitte schließen und erneut versuchen.' : '3D viewer unavailable. Please close and try again.';
      });
    });
  });
  function closeCad() {
    cadModal.classList.remove('active');
    cadModal.setAttribute('aria-hidden', 'true');
    cadModal.inert = true;
    cadViewer.removeAttribute('src');
    cadViewer.removeAttribute('poster');
    document.body.style.overflow = '';
    cadTrigger?.focus({ preventScroll: true });
  }
  document.querySelectorAll('.js-close-cad').forEach(button => button.addEventListener('click', closeCad));
  cadModal.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeCad();
    if (event.key === 'Tab') {
      const focusable = [cadClose, ...(customElements.get('model-viewer') ? [cadViewer] : [])];
      // model-viewer delegates focus to its canvas inside the shadow root.
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  cadViewer.addEventListener('load', () => {
    cadStatus.textContent = document.documentElement.lang === 'de' ? 'Ziehen zum Drehen · Scrollen zum Zoomen' : 'Drag to orbit · Scroll to zoom';
  });
  cadViewer.addEventListener('error', () => {
    cadStatus.textContent = document.documentElement.lang === 'de' ? 'Modell konnte nicht geladen werden. Bitte erneut versuchen.' : 'Unable to load this model. Please try again.';
  });
  reducedMotion.addEventListener('change', () => cadViewer.toggleAttribute('auto-rotate', !reducedMotion.matches));

  const translations = {
    en: {
      "cinema-details-link": "Project details ↗",
      "cinema-scroll": "Scroll to explore ↓",
      "cinema-lens-title": "Start at the sensor.",
      "cinema-lens-text": "An Intel RealSense D455f brings depth into the picture.",
      "cinema-camera-label": "02 / PERCEPTION",
      "cinema-camera-title": "A moving point of view.",
      "cinema-camera-text": "The camera sits at the end of a two-axis robotic head.",
      "cinema-head-title": "See the whole mechanism.",
      "cinema-head-text": "A pan actuator at the base. A tilt actuator at the camera.",
      "cinema-structure-label": "04 / STRUCTURE",
      "cinema-structure-title": "Around the other side.",
      "cinema-structure-text": "The L-shaped support connects sensing, actuation and the fixed base.",
      "cinema-skip": "See the real prototype ↓",
      "cinema-project-title": "From CAD to the workbench.",
      "cinema-role": "My work on this project ↗",
      "cinema-note": "Scroll view: an illustration of the prototype. The photograph and CAD parts show the actual hardware.",
      'view-projects': 'View projects',
      'role-details': 'Responsibilities & tools',
      'prototype-caption': 'The physical prototype',
      "hero-current-role": "Robot Control Software · Yardstick Robotics",
      "hero-summary": "Working on 2-DOF and 6-DOF robotic arms, with experience in mobile robotics, ROS 2, and computer vision.",

      "lab-eyebrow": "01 / Master Project · 2 DOF",
      "lab-title": "Pan-Tilt Robotic Head",
      "lab-description": "Adjust Pan to rotate the head horizontally and Tilt to move the camera up or down.",
      "proj-label-arms": "Robotic arms",
      "proj-work": "Yardstick Robotics",
      "proj-experience": "Explore my role",
      "proj-title-6dof": "6-DOF motion & dynamics",
      "proj-desc-6dof": "Working with the control team on gravity compensation, friction analysis, and controller tuning for a 6-DOF arm.",
      'nav-about': 'About Me',
      'nav-education': 'Education',
      'nav-experience': 'Experience',
      'nav-projects': 'Projects',
      'nav-skills': 'Skills',
      'nav-languages': 'Languages',
      'nav-contact': 'Connect',

      "hero-greeting": "Hello, I am",
      'hero-subtitle': 'Sensors | Robotics | Microsystems',
      "hero-resume": "View Resume",
      "hero-contact": "Contact Information",

      "about-title": "A little about me",
      'about-p1': "I am currently pursuing my Master's in Control, Microelectronics and Microsystems at the University of Bremen, with a focus on robotics, embedded systems, and computer vision.",
      'about-p2': 'My work combines ROS 2, computer vision, sensor integration, and robotic control systems. I enjoy building systems that bridge hardware and intelligent software for real-world automation.',
      "about-p3": "At Yardstick Robotics, I work on 2-DOF and 6-DOF robotic arms. My experience also spans mobile robotics and a pan-tilt sensor head for robotic perception and gaze estimation.",
      'stat-text-1': 'Robotics Projects',
      'stat-text-2': 'Jazzy & Humble',
      'stat-text-3': 'OpenCV & Vision',
      'stat-text-4': 'Based in Germany',

      'edu-title': 'Education',
      'edu-degree-1': 'M.Sc. – Control, Microelectronics & Microsystems',
      'edu-focus-1': 'Focus: Robotics, Embedded Systems, Computer Vision, Deep Learning Accelerators, Cognitive Robotics',
      'edu-degree-2': 'B.Tech – Electronics & Instrumentation Engineering',
      'edu-focus-2': 'Focus: Sensors, Control Systems, Automation, Instrumentation Engineering, Embedded Electronics',

      'exp-title': 'Experience',
      'exp-label-coursework': 'Current Coursework',
      'exp-label-professional': 'Professional & Research',
      'exp-label-volunteer': 'Volunteer & Leadership',
      'chip-masterprojekt': 'Master Project',
      'chip-volunteer': 'Volunteer',

      'exp-role-coursework': 'M.Sc. – Control, Microelectronics & Microsystems',
      'exp-bullets-coursework': '<li><strong>Intelligent Systems for Marine Robotics</strong> — Autonomy, sensor fusion, and decision-making for underwater robotic platforms.</li><li><strong>Software Engineering for Cognitive Robotics</strong> — Architecture patterns, ROS-based design, and cognitive system integration.</li><li><strong>Architecture &amp; Design Methodologies for Deep Learning</strong> — Hardware-aware DL model design, accelerator architectures, and deployment pipelines.</li>',

      'exp-role-hiwi': 'Student Assistant – Computer Vision Engineer',
      'exp-bullets-hiwi': '<li><strong>Sensor Test Campaigns:</strong> Support preparation and execution of optical sensor measurement tasks; perform structured documentation and verification of findings.</li><li><strong>Data Acquisition &amp; Calibration:</strong> Design and validate camera calibration workflows for accurate spatial mapping and reproducible data logging.</li><li><strong>Algorithm Implementation:</strong> Implement subpixel-level edge detection to improve precision in vision-based measurement systems.</li><li><strong>Technical Troubleshooting:</strong> Evaluate robustness of vision algorithms through controlled lab experiments and systematic debugging of sensor setups.</li>',

      'exp-role-pantilt': 'Pan-Tilt Robotic Head for Gaze Estimation',
      'exp-bullets-pantilt': '<li><strong>Robot Programming:</strong> Programming a 2-DOF pan-tilt robotic sensor head using ROS 2 nodes for real-time sensor processing, coordinate transformations, and actuation control.</li><li><strong>Mechanical Design:</strong> Designing and modelling platform components in Fusion 360 for iterative prototyping and part fabrication.</li><li><strong>Hardware Assembly:</strong> Assembling and configuring the 2-DOF platform with Dynamixel XM430-W350-R servo actuators and integrating all electrical connections.</li><li><strong>Sensor Integration:</strong> Integrating the Intel RealSense D455f depth camera for real-time RGB-D data acquisition within the ROS 2 ecosystem.</li><li><strong>Simulation &amp; Visualisation:</strong> Simulated and validated platform behaviour in Gazebo; monitored real-time joint states and TF transforms in RViz prior to physical deployment.</li>',

      'exp-role-ieee': 'Student Branch Chair – IEEE',
      'exp-bullets-ieee': "<li><strong>Interdisciplinary Leadership:</strong> Led technical symposiums and international conferences (ICMACC'22); coordinated between engineering departments.</li><li><strong>Strategic Initiative:</strong> Founded the IEEE Robotics &amp; Automation Society (RAS) chapter, managing recruitment and technical roadmaps.</li>",

      "proj-title": "Selected projects",
      "proj-more": "More robotics & vision",
      "proj-context-tracking": "ROS 2 · Multi-agent coordination",
      "proj-context-vision": "Computer vision",
      "delivery-evidence": "Project recording & implementation",
      "proj-label-software": "Software Robotics",
      'proj-label-hardware': 'Hardware Robotics',
      'proj-label-cad': 'CAD & STEP',
      'proj-title-delivery': 'Autonomous Delivery Robot',
      "delivery-label": "02 / Mobile Robotics · ROS 2",
      "delivery-watch": "Watch recording ↗",
      "delivery-recording": "Watch the project recording ↗",
      "delivery-wait-label": "01 / SENSE",
      "delivery-wait-title": "A closed door. A waiting robot.",
      "delivery-wait-text": "LiDAR sees the door ahead. The TurtleBot stays still.",
      "delivery-open-label": "02 / DETECT",
      "delivery-open-title": "The way opens.",
      "delivery-open-text": "As the door swings away, the scan reveals a clear path through.",
      "delivery-move-label": "03 / MOVE",
      "delivery-move-title": "Through the doorway.",
      "delivery-move-text": "The robot moves forward, checking the space ahead with LiDAR.",
      "delivery-stop-label": "04 / STOP",
      "delivery-stop-title": "An obstacle. A reason to stop.",
      "delivery-stop-text": "LiDAR detects an obstacle ahead. The robot stops with space to spare.",
      "delivery-note": "An illustrated walkthrough of the behaviour. The project recording and ROS 2 implementation are below.",
      "delivery-bag": "Explore the /scan bag-analysis script ↗",
      'proj-desc-delivery': 'A TurtleBot door-passage project using ROS 2, LiDAR and Gazebo. The walkthrough shows the robot waiting for an open door, moving through, and stopping when LiDAR detects an obstacle.',
      'proj-title-turtlebot': 'ROS 2 Multi-Agent Tracking',
      'proj-desc-turtlebot': 'ROS 2 turtlesim project for multi-agent tracking using broadcaster and follower nodes with tf-based coordination.',
      'proj-title-opencv': 'OpenCV Image Processing',
      'proj-desc-opencv': 'OpenCV and Python image-processing workflows for feature detection, segmentation, and engineering measurement tasks.',
      'proj-title-pantilt': 'Pan-Tilt Robotic Head for Gaze Estimation',
      'proj-desc-pantilt': 'Developing a 2-DOF pan-tilt robotic sensor head for gaze estimation using ROS 2, Fusion 360, Dynamixel actuators, Intel RealSense D455f, and validation in Gazebo and RViz.',

      'cad-title-tplate': 'T Plate Mount',
      'cad-desc-tplate': 'Compact actuator support plate for robotic mounting.',
      'cad-title-xm430': 'XM430 Bracket',
      'cad-desc-xm430': 'Bracket concept for Dynamixel actuator integration.',
      'cad-title-motorplate': 'Motor Plate Final',
      'cad-desc-motorplate': 'Finalized motor support plate for actuator-side mounting and alignment.',
      'cad-title-lext': 'L Extension',
      'cad-desc-lext': 'L-shaped extension bracket for robotic frame connection and modular mounting.',
      'cad-btn-view': 'CAD',

      'skills-title': 'Skills',
      'skill-cat-1': 'Robotics & ROS',
      'skill-cat-2': 'Computer Vision & AI',
      'skill-cat-3': 'Programming',

      'lang-label': 'LANGUAGES',
      'lang-title': 'Languages',
      'lang-map-hint': 'Hover over a map or tap its flag to see my level.',
      'lang-en-region': 'United Kingdom',
      'lang-de-region': 'Germany',
      'lang-hi-region': 'India',
      'lang-te-region': 'Andhra Pradesh & Telangana',
      'lang-en': 'English',
      'lang-en-level': 'B2 — Professional',
      'lang-de': 'German',
      'lang-de-level': 'B1 — Intermediate',
      'lang-te': 'Telugu',
      'lang-te-level': 'Native',
      'lang-hi': 'Hindi',
      'lang-hi-level': 'A1 — Basic',

      'connect-title': 'Connect'
    },

    de: {
      "cinema-details-link": "Projektdetails ↗",
      "cinema-scroll": "Beim Scrollen entdecken ↓",
      "cinema-lens-title": "Am Sensor beginnt es.",
      "cinema-lens-text": "Eine Intel RealSense D455f bringt Tiefe ins Bild.",
      "cinema-camera-label": "02 / WAHRNEHMUNG",
      "cinema-camera-title": "Ein beweglicher Blickwinkel.",
      "cinema-camera-text": "Die Kamera sitzt am Ende eines zweiachsigen Roboterkopfs.",
      "cinema-head-title": "Der ganze Mechanismus.",
      "cinema-head-text": "Ein Pan-Aktuator an der Basis. Ein Tilt-Aktuator an der Kamera.",
      "cinema-structure-label": "04 / AUFBAU",
      "cinema-structure-title": "Von der anderen Seite.",
      "cinema-structure-text": "Die L-förmige Halterung verbindet Sensorik, Antrieb und die feste Basis.",
      "cinema-skip": "Zum echten Prototyp ↓",
      "cinema-project-title": "Vom CAD auf die Werkbank.",
      "cinema-role": "Meine Arbeit an diesem Projekt ↗",
      "cinema-note": "Scroll-Ansicht: eine Illustration des Prototyps. Das Foto und die CAD-Bauteile zeigen die tatsächliche Hardware.",
      'view-projects': 'Projekte ansehen',
      'role-details': 'Aufgaben & Werkzeuge',
      'prototype-caption': 'Der physische Prototyp',
      "hero-current-role": "Robotersteuerungssoftware · Yardstick Robotics",
      "hero-summary": "Arbeit an Roboterarmen mit 2 und 6 Freiheitsgraden sowie Erfahrung in mobiler Robotik, ROS 2 und Computer Vision.",

      "lab-eyebrow": "01 / Masterprojekt · 2 DOF",
      "lab-title": "Pan-Tilt-Roboterkopf",
      "lab-description": "Mit Pan drehst du den Kopf horizontal. Mit Tilt neigst du die Kamera nach oben oder unten.",
      "proj-label-arms": "Roboterarme",
      "proj-work": "Yardstick Robotics",
      "proj-experience": "Mehr zu meiner Tätigkeit",
      "proj-title-6dof": "6-DOF-Bewegung & Dynamik",
      "proj-desc-6dof": "Zusammenarbeit mit dem Regelungsteam an Gravitationskompensation, Reibungsanalyse und Reglerabstimmung für einen 6-DOF-Arm.",
      'nav-about': 'Über mich',
      'nav-education': 'Ausbildung',
      'nav-experience': 'Erfahrung',
      'nav-projects': 'Projekte',
      'nav-skills': 'Fähigkeiten',
      'nav-languages': 'Sprachen',
      'nav-contact': 'Kontakt',

      "hero-greeting": "Hallo, ich bin",
      'hero-subtitle': 'Sensoren | Robotik | Mikrosysteme',
      "hero-resume": "Lebenslauf ansehen",
      "hero-contact": "Kontaktinformationen",

      "about-title": "Über mich",
      'about-p1': 'Ich studiere derzeit meinen Master in Regelungstechnik, Mikroelektronik und Mikrosysteme an der Universität Bremen mit Schwerpunkt Robotik, eingebettete Systeme und Computer Vision.',
      'about-p2': 'Meine Arbeit verbindet ROS 2, Computer Vision, Sensorintegration und robotische Steuerungssysteme. Ich entwickle gerne Systeme, die Hardware und intelligente Software für die reale Automatisierung verbinden.',
      "about-p3": "Bei Yardstick Robotics arbeite ich an Roboterarmen mit 2 und 6 Freiheitsgraden. Meine Erfahrung umfasst auch mobile Robotik und einen Pan-Tilt-Sensorkopf für robotische Wahrnehmung und Blickschätzung.",
      'stat-text-1': 'Robotik-Projekte',
      'stat-text-2': 'Jazzy & Humble',
      'stat-text-3': 'OpenCV & Vision',
      'stat-text-4': 'In Deutschland',

      'edu-title': 'Ausbildung',
      'edu-degree-1': 'M.Sc. – Regelungstechnik, Mikroelektronik & Mikrosysteme',
      'edu-focus-1': 'Schwerpunkt: Robotik, Eingebettete Systeme, Computer Vision, Deep-Learning-Beschleuniger, Kognitive Robotik',
      'edu-degree-2': 'B.Tech – Elektronik & Messtechnik',
      'edu-focus-2': 'Schwerpunkt: Sensoren, Steuerungssysteme, Automatisierung, Messtechnik, Eingebettete Elektronik',

      'exp-title': 'Erfahrung',
      'exp-label-coursework': 'Aktuelles Studium',
      'exp-label-professional': 'Beruflich & Forschung',
      'exp-label-volunteer': 'Ehrenamt & Führung',
      'chip-masterprojekt': 'Masterprojekt',
      'chip-volunteer': 'Ehrenamt',

      'exp-role-coursework': 'M.Sc. – Regelungstechnik, Mikroelektronik & Mikrosysteme',
      'exp-bullets-coursework': '<li><strong>Intelligente Systeme für die Marine-Robotik</strong> — Autonomie, Sensorfusion und Entscheidungsfindung für Unterwasser-Robotikplattformen.</li><li><strong>Software Engineering für Kognitive Robotik</strong> — Architekturmuster, ROS-basiertes Design und Integration kognitiver Systeme.</li><li><strong>Architektur &amp; Designmethoden für Deep Learning</strong> — Hardware-orientiertes DL-Modelldesign, Beschleunigerarchitekturen und Deployment-Pipelines.</li>',

      'exp-role-hiwi': 'Studentische Hilfskraft – Computer Vision Ingenieur',
      'exp-bullets-hiwi': '<li><strong>Sensortestkampagnen:</strong> Unterstützung bei Vorbereitung und Durchführung optischer Sensormessaufgaben; strukturierte Dokumentation und Verifizierung der Ergebnisse.</li><li><strong>Datenerfassung &amp; Kalibrierung:</strong> Entwurf und Validierung von Kamerakalibrierungs-Workflows für präzise räumliche Kartierung und reproduzierbare Datenprotokollierung.</li><li><strong>Algorithmusimplementierung:</strong> Implementierung von Subpixel-Kantendetektion zur Verbesserung der Präzision in sichtbasierten Messsystemen.</li><li><strong>Technische Fehlerbehebung:</strong> Bewertung der Robustheit von Vision-Algorithmen durch kontrollierte Laborexperimente und systematisches Debugging von Sensor-Setups.</li>',

      'exp-role-pantilt': 'Pan-Tilt-Roboterkopf für Blickschätzung',
      'exp-bullets-pantilt': '<li><strong>Roboterprogrammierung:</strong> Programmierung eines 2-DOF Pan-Tilt-Robotersensorkopfs mit ROS 2-Knoten für Echtzeitsensorverarbeitung, Koordinatentransformationen und Aktuierungssteuerung.</li><li><strong>Mechanisches Design:</strong> Entwurf und Modellierung von Plattformkomponenten in Fusion 360 für iteratives Prototyping und Teilefertigung.</li><li><strong>Hardware-Montage:</strong> Montage und Konfiguration der 2-DOF-Plattform mit Dynamixel XM430-W350-R-Servoaktuatoren und Integration aller elektrischen Verbindungen.</li><li><strong>Sensorintegration:</strong> Integration der Intel RealSense D455f-Tiefenkamera für die Echtzeit-RGB-D-Datenerfassung im ROS 2-Ökosystem.</li><li><strong>Simulation &amp; Visualisierung:</strong> Simulation und Validierung des Plattformverhaltens in Gazebo; Überwachung von Gelenkzuständen und TF-Transformationen in RViz vor dem physischen Einsatz.</li>',

      'exp-role-ieee': 'Studentischer Zweigvorsitzender – IEEE',
      'exp-bullets-ieee': "<li><strong>Interdisziplinäre Führung:</strong> Leitung technischer Symposien und internationaler Konferenzen (ICMACC'22); Koordination zwischen Ingenieurabteilungen.</li><li><strong>Strategische Initiative:</strong> Gründung des IEEE Robotics &amp; Automation Society (RAS)-Kapitels, Verwaltung von Rekrutierung und technischen Roadmaps.</li>",

      "proj-title": "Ausgewählte Projekte",
      "proj-more": "Weitere Robotik- & Vision-Projekte",
      "proj-context-tracking": "ROS 2 · Multi-Agenten-Koordination",
      "proj-context-vision": "Computer Vision",
      "delivery-evidence": "Projektaufnahme & Implementierung",
      "proj-label-software": "Software-Robotik",
      'proj-label-hardware': 'Hardware-Robotik',
      'proj-label-cad': 'CAD & STEP',
      'proj-title-delivery': 'Autonomer Lieferroboter',
      "delivery-label": "02 / Mobile Robotik · ROS 2",
      "delivery-watch": "Aufnahme ansehen ↗",
      "delivery-recording": "Projektaufnahme ansehen ↗",
      "delivery-wait-label": "01 / ERFASSEN",
      "delivery-wait-title": "Geschlossene Tür. Wartender Roboter.",
      "delivery-wait-text": "Das LiDAR erkennt die Tür voraus. Der TurtleBot bleibt stehen.",
      "delivery-open-label": "02 / ERKENNEN",
      "delivery-open-title": "Der Weg wird frei.",
      "delivery-open-text": "Die Tür schwingt auf. Der Scan zeigt den freien Weg durch den Eingang.",
      "delivery-move-label": "03 / FAHREN",
      "delivery-move-title": "Durch die Tür.",
      "delivery-move-text": "Der Roboter fährt vorwärts und prüft den Raum vor sich mit LiDAR.",
      "delivery-stop-label": "04 / ANHALTEN",
      "delivery-stop-title": "Ein Hindernis. Zeit anzuhalten.",
      "delivery-stop-text": "Das LiDAR erkennt ein Hindernis. Der Roboter hält mit Abstand an.",
      "delivery-note": "Eine illustrative Darstellung des Verhaltens. Die Projektaufnahme und ROS 2-Implementierung folgen unten.",
      "delivery-bag": "Skript zur Analyse der /scan-Bag-Daten ansehen ↗",
      'proj-desc-delivery': 'Ein TurtleBot-Projekt zur Türdurchfahrt mit ROS 2, LiDAR und Gazebo. Die Darstellung zeigt, wie der Roboter auf eine offene Tür wartet, hindurchfährt und bei einem vom LiDAR erkannten Hindernis anhält.',
      'proj-title-turtlebot': 'ROS 2 Multi-Agenten-Tracking',
      'proj-desc-turtlebot': 'ROS 2 Turtlesim-Projekt für Multi-Agenten-Tracking mit Broadcaster- und Follower-Knoten und tf-basierter Koordination.',
      'proj-title-opencv': 'OpenCV Bildverarbeitung',
      'proj-desc-opencv': 'OpenCV- und Python-Bildverarbeitungs-Workflows für Merkmalsdetektion, Segmentierung und messtechnische Aufgaben.',
      'proj-title-pantilt': 'Pan-Tilt-Roboterkopf für Blickschätzung',
      'proj-desc-pantilt': 'Entwicklung eines 2-DOF Pan-Tilt-Robotersensorkopfs für die Blickschätzung mit ROS 2, Fusion 360, Dynamixel-Aktuatoren, Intel RealSense D455f und Validierung in Gazebo und RViz.',

      'cad-title-tplate': 'T-Platte Halterung',
      'cad-desc-tplate': 'Kompakte Aktuator-Trägerplatte für Robotermontage.',
      'cad-title-xm430': 'XM430 Halterung',
      'cad-desc-xm430': 'Halterungskonzept für Dynamixel-Aktuatorintegration.',
      'cad-title-motorplate': 'Motorplatte Final',
      'cad-desc-motorplate': 'Fertiggestellte Motorträgerplatte für aktuatorseitige Montage und Ausrichtung.',
      'cad-title-lext': 'L-Verlängerung',
      'cad-desc-lext': 'L-förmige Verlängerungshalterung für Roboterrahmenverbindung und modulare Montage.',
      'cad-btn-view': 'CAD',

      'skills-title': 'Fähigkeiten',
      'skill-cat-1': 'Robotik & ROS',
      'skill-cat-2': 'Computer Vision & KI',
      'skill-cat-3': 'Programmierung',

      'lang-label': 'SPRACHEN',
      'lang-title': 'Sprachen',
      'lang-map-hint': 'Mit der Maus über eine Karte fahren oder auf die Flagge tippen, um mein Sprachniveau zu sehen.',
      'lang-en-region': 'Vereinigtes Königreich',
      'lang-de-region': 'Deutschland',
      'lang-hi-region': 'Indien',
      'lang-te-region': 'Andhra Pradesh & Telangana',
      'lang-en': 'Englisch',
      'lang-en-level': 'B2 — Fachkundig',
      'lang-de': 'Deutsch',
      'lang-de-level': 'B1 — Mittelstufe',
      'lang-te': 'Telugu',
      'lang-te-level': 'Muttersprache',
      'lang-hi': 'Hindi',
      'lang-hi-level': 'A1 — Grundstufe',

      'connect-title': 'Kontakt'
    }
  };

  function setLang(lang) {
    if (!translations[lang]) return;
    document.documentElement.lang = lang;
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (t[el.dataset.i18n] !== undefined) el.textContent = t[el.dataset.i18n];
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      if (t[el.dataset.i18nHtml] !== undefined) el.innerHTML = t[el.dataset.i18nHtml];
    });
    for (const code of ['en', 'de']) {
      const button = document.getElementById(`btn-${code}`);
      button.classList.toggle('active', code === lang);
      button.setAttribute('aria-pressed', String(code === lang));
    }
    navToggle.setAttribute('aria-label', lang === 'de' ? 'Navigation öffnen oder schließen' : 'Toggle navigation');
    cadClose.setAttribute('aria-label', lang === 'de' ? 'CAD-Ansicht schließen' : 'Close CAD viewer');
    updateThemeLabel();
    refreshLucide();
  }
  window.setLang = setLang;
  document.getElementById('btn-en').addEventListener('click', () => setLang('en'));
  document.getElementById('btn-de').addEventListener('click', () => setLang('de'));
  setLang(document.documentElement.lang === 'de' ? 'de' : 'en');
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
  else initApp();
}
