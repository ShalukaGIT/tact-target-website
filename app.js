// ═══════════════════════════════════════════════════════
// FIREBASE MODULES & CLIENT APP INITIALIZATION
// ═══════════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, doc, getDoc, setDoc, deleteDoc, 
  collection, onSnapshot, getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  projectId: "tact-target-website",
  appId: "1:808664740593:web:912bb134f6983e2ab16f50",
  storageBucket: "tact-target-website.firebasestorage.app",
  apiKey: "AIzaSyCrBeBUZdj6lLj_CDU-sU6GUlJCEw79Tjc",
  authDomain: "tact-target-website.firebaseapp.com",
  messagingSenderId: "808664740593",
  measurementId: "G-ZGCBQPFTLK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ═══════════════════════════════════════════════════════
// BACKGROUND PARTICLE SYSTEM
// Physics-based floating white dots with mouse repulsion
// ═══════════════════════════════════════════════════════
const BgParticles = (() => {
  // ── Config ────────────────────────────────────────────
  const COUNT        = 90;       // number of dots
  const SIZE_MIN     = 1.2;      // px min radius
  const SIZE_MAX     = 3.8;      // px max radius
  const OPACITY_MIN  = 0.10;     // base minimum opacity
  const OPACITY_MAX  = 0.50;     // base maximum opacity
  const DRIFT_SPEED  = 0.22;     // px/frame base drift
  const REPEL_RADIUS = 130;      // px — mouse influence zone
  const REPEL_FORCE  = 0.038;    // spring constant for repulsion
  const RETURN_FORCE = 0.012;    // spring constant pulling back to origin
  const DAMPING      = 0.88;     // velocity damping per frame

  let canvas, ctx, W, H, raf;
  const mouse = { x: -9999, y: -9999 };
  const dots  = [];

  // ── Dot factory ───────────────────────────────────────
  function makeDot() {
    const x  = Math.random() * (W || window.innerWidth);
    const y  = Math.random() * (H || window.innerHeight);
    const r  = SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN);
    const op = OPACITY_MIN + Math.random() * (OPACITY_MAX - OPACITY_MIN);

    // Drift direction — slow, random wander
    const angle = Math.random() * Math.PI * 2;
    const speed = DRIFT_SPEED * (0.4 + Math.random() * 0.8);

    return {
      ox: x, oy: y,          // origin (home) position
      x,  y,                  // current position
      r,  op,                 // radius, opacity
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      pulseOffset: Math.random() * Math.PI * 2,  // for breath animation
    };
  }

  // ── Resize handler ────────────────────────────────────
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ── Draw one frame ────────────────────────────────────
  function frame(ts) {
    ctx.clearRect(0, 0, W, H);

    for (const d of dots) {
      // ── Drift: nudge origin slowly so dots wander ──
      d.ox += d.vx;
      d.oy += d.vy;

      // Wrap origin through edges
      if (d.ox < -10)  d.ox = W + 10;
      if (d.ox > W+10) d.ox = -10;
      if (d.oy < -10)  d.oy = H + 10;
      if (d.oy > H+10) d.oy = -10;

      // ── Mouse repulsion ──────────────────────────────
      const dx   = d.x - mouse.x;
      const dy   = d.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPEL_RADIUS && dist > 0) {
        // Spring push away from cursor, stronger when closer
        const strength = (1 - dist / REPEL_RADIUS) * REPEL_FORCE * 60;
        d.vx += (dx / dist) * strength;
        d.vy += (dy / dist) * strength;
      }

      // ── Return spring: pull back toward drifting origin ──
      d.vx += (d.ox - d.x) * RETURN_FORCE;
      d.vy += (d.oy - d.y) * RETURN_FORCE;

      // ── Damping ──────────────────────────────────────
      d.vx *= DAMPING;
      d.vy *= DAMPING;

      // ── Integrate position ───────────────────────────
      d.x += d.vx;
      d.y += d.vy;

      // ── Breathing opacity pulse ───────────────────────
      const pulse = 0.5 + 0.5 * Math.sin(ts * 0.0006 + d.pulseOffset);
      const op    = OPACITY_MIN + (d.op - OPACITY_MIN) * pulse;

      // ── Draw dot ──────────────────────────────────────
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${op.toFixed(3)})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(frame);
  }

  // ── Public API ────────────────────────────────────────
  function init() {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    canvas = document.getElementById('bg-particle-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    resize();
    window.addEventListener('resize', resize, { passive: true });

    // Track mouse globally
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    // When mouse leaves window, push cursor off-screen
    document.addEventListener('mouseleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Spawn dots
    for (let i = 0; i < COUNT; i++) dots.push(makeDot());

    raf = requestAnimationFrame(frame);
  }

  return { init };
})();

// Factory Blueprints Database

const initialBlueprints = [
  {
    id: "sentry-target",
    title: "Sentry Target Mechanism",
    category: "Cardboard Craft",
    description: "A responsive cardboard target that falls backward and automatically swings back up when struck, powered by simple elastic tension.",
    difficulty: "Medium",
    buildTime: "45 mins",
    materials: "A4 Single-wall Cardboard, hot glue gun, 2x elastic rubber bands, wooden skewer, toothpicks",
    link: "https://sites.google.com/view/tack-target-crafts/blueprints/sentry-target",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    steps: [
      "Print or trace the PDF template onto thick corrugated cardboard sheets. Cut out all components carefully.",
      "Score along the dotted hinge lines to ensure smooth folds without breaking the outer paper layer.",
      "Construct the stable base and glue the two vertical target brackets to holds the central rotating frame.",
      "Run a wooden skewer through the axis holes. Anchor an elastic band inside to create a return-pull torque.",
      "Set the gravity trigger latch. Shoot with a darts or rubber bands to watch the automatic fall-and-reset motion."
    ],
    tags: ["Rubber-band", "Target", "Mechanical", "Automatic"],
    access: "Free"
  },
  {
    id: "mini-target-box",
    title: "Precision Target Game Box",
    category: "Cardboard Craft",
    description: "Turn a standard empty shoebox into an interactive target range featuring three suspended scoring plates with custom weights.",
    difficulty: "Easy",
    buildTime: "20 mins",
    materials: "Shoebox or small parcel delivery carton, paperclips, cotton string, scrap cardboard, marker pens",
    link: "https://sites.google.com/view/tack-target-crafts/blueprints/target-box",
    imageUrl: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80",
    steps: [
      "Cut three evenly spaced rectangular window bays on the long face of an open-top shoebox.",
      "Snip three circular targets from cardstock, color them with target rings, and assign score numbers (10, 25, 50).",
      "Straighten paperclips into hooks and embed them straight into the top edge of each circular card.",
      "Tie lengths of string to the paperclips and suspend them from a support rod glued inside the box roof.",
      "Line the back cabinet with cloth or felt to deaden impacts. Throw foam rounds to see targets spin and return!"
    ],
    tags: ["DIY", "Target", "Fun", "Eco-friendly"],
    access: "Free"
  },
  {
    id: "gravity-marble-drop",
    title: "Gravity-Fed Flag Drop",
    category: "Cardboard Craft",
    description: "An elementary entry-level physics craft where a rolling marble triggers a pivoting counter-weighted target flag.",
    difficulty: "Easy",
    buildTime: "15 mins",
    materials: "Cardboard tubes, paper cup, thin cereal board, tape, hot glue, marbles",
    link: "https://sites.google.com/view/tack-target-crafts/blueprints/marble-flag",
    imageUrl: "https://images.unsplash.com/photo-1601049676099-e7ed07d825b0?w=600&auto=format&fit=crop&q=80",
    steps: [
      "Cut a vertical display window out of one side of a sturdy paper towel cardboard tube.",
      "Cut a small rectangular flag and target lever out of thin cardstock and glue them onto a central toothpick pivot.",
      "Secure the toothpick pivot horizontally adjacent to your cardboard tube window, allowing it to toggle freely.",
      "Position an inclined track slope right above the target lever, aligning the channel with the paper cup base.",
      "Drop a marble down the gravity slide. The target lever flips on impact, spinning the target flag around."
    ],
    tags: ["Gravity", "Marble", "Pivoting", "Beginner"],
    access: "Free"
  },
  {
    id: "interceptor-starfighter",
    title: "Micro-Scale MOC Fleet Starfighter",
    category: "LEGO MOC",
    description: "A premium micro starfighter featuring adjustable sweep wings and an engine core optimized using sleek Technic connectors.",
    difficulty: "Hard",
    buildTime: "30 mins",
    materials: "34 standard Lego pieces (1x 2x4 Plate, 2x Angle 3x4 plate, Technic pin connectors, Translucent cone elements)",
    link: "https://rebrickable.com/mocs/tack-target-crafts/interceptor-starfighter",
    imageUrl: "https://images.unsplash.com/photo-1585366119957-e5733f399e7c?w=600&auto=format&fit=crop&q=80",
    steps: [
      "Assemble the central cockpit fuselage. Lay the grey 2x4 chassis plate flat and cap the front dome.",
      "Mount two modular sweep wings using friction technic pins to create functional variable wing geometry.",
      "Install dual auxiliary nose blasters and fit a blue translucent exhaust element to the engine core.",
      "Build the vertical stabilizer wings and snap them onto the rear brackets at a sleek 15-degree layout.",
      "Position your micro pilot element, adjust the thruster flaps, and display your finished interceptor!"
    ],
    tags: ["LEGO", "Space", "Technic", "Microscale"],
    access: "Premium"
  },
  {
    id: "mech-target-reset",
    title: "Mechanical Lego Reset Base",
    category: "LEGO MOC",
    description: "A smart modular Lego baseplate equipped with a crank-operated series of cam lobes to manually raise fallen score target panels.",
    difficulty: "Medium",
    buildTime: "25 mins",
    materials: "48 Lego pieces (11-hole Technic beam, gear wheels, 6L axle rods, connecting bushings, flat tiles)",
    link: "https://rebrickable.com/mocs/tack-target-crafts/mechanical-reset-base",
    imageUrl: "https://images.unsplash.com/photo-1560942485-b2a11cc13456?w=600&auto=format&fit=crop&q=80",
    steps: [
      "Lock together the heavy foundational plates using 1x12 stud beams to form a rigid structural base.",
      "Slide a steel-length technic axle rod through the holes of three vertical pivot hinges.",
      "Affix cam levers onto the secondary crank axle, staggering the directions to allow sequential target resets.",
      "Build three rectangular target panels in varying colors and snap them onto the hinges so they sit upright.",
      "Push down the target plaques to simulate hits. Rotate the hand-crank to make cams lift the targets back up!"
    ],
    tags: ["LEGO", "Mechanical", "Crank", "Technic"],
    access: "Premium"
  }
];

// App State
let blueprints = [];
let searchQuery = "";
let selectedCategory = "All";
let selectedDifficulty = "All";
let selectedAccess = "All";
let isAdminMode = false;
let showPictures = true;

// Modal & Sandbox States
let activeBlueprint = null;
let currentStepIndex = 0;
let currentScore = 0;
let highScore = Number(localStorage.getItem("tact_target_highscore") || "0");
let isModalSimulatorActive = false;

// Physics Simulator Engine Variables
let canvas, ctx;
let animationId = null;
const gravity = 0.16;
let launchAngle = 35;
let launchPower = 55;
let isProjectileActive = false;
let statusMessage = "Ready to test fire!";

const projectile = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  active: false,
  trail: []
};

const target = {
  x: 420,
  y: 130,
  width: 20,
  height: 70,
  isHit: false,
  fallAngle: 0,
  direction: 1,
  speed: 1.5
};

let particles = [];

// DOM Elements cache
const blueprintsGrid = document.getElementById("blueprints-grid");
const searchInput = document.getElementById("search-input");
const categoryTabs = document.querySelectorAll(".filter-tab");
const diffSelect = document.getElementById("filter-difficulty-select");
const accessSelect = document.getElementById("filter-access-select");
const catalogCountText = document.getElementById("catalog-count-text");
const btnTogglePictures = document.getElementById("btn-toggle-pictures-view");
const btnPicturesText = document.getElementById("btn-pictures-view-text");
const btnToggleAdmin = document.getElementById("btn-toggle-admin-mode");
const adminToggleText = document.getElementById("admin-toggle-text");
const btnFactoryReset = document.getElementById("btn-factory-reset");
const btnAddBlueprintHeader = document.getElementById("btn-add-blueprint-header");

// Modal Elements
const assemblyModal = document.getElementById("assembly-modal-overlay");
const modalTitle = document.getElementById("modal-title");
const modalSubtitle = document.getElementById("modal-subtitle");
const modalIconBox = document.getElementById("modal-header-icon-box");
const modalImage = document.getElementById("modal-image");
const modalImageContainer = document.getElementById("modal-image-container");
const modalDifficulty = document.getElementById("modal-difficulty");
const modalBuildTime = document.getElementById("modal-build-time");
const modalMaterialsContainer = document.getElementById("modal-materials");
const btnDownloadPdf = document.getElementById("btn-download-pdf-inside");
const btnDownloadText = document.getElementById("btn-download-text");
const stepsIndicator = document.getElementById("steps-indicator");
const stepDescText = document.getElementById("step-description-text");
const stepsProgressBar = document.getElementById("steps-progress-bar");
const btnStepPrev = document.getElementById("btn-step-prev");
const btnStepNext = document.getElementById("btn-step-next");
const btnCloseModal = document.getElementById("btn-close-modal");

// Tabs Elements
const tabGuide = document.getElementById("tab-guide-active");
const tabTest = document.getElementById("tab-test-active");
const tabContentGuide = document.getElementById("tab-content-guide");
const tabContentTest = document.getElementById("tab-content-test");

// Simulator Elements
const highscoreValue = document.getElementById("highscore-value");
const recentscoreValue = document.getElementById("recentscore-value");
const simulatorStatusText = document.getElementById("simulator-status-text");
const launchAngleSlider = document.getElementById("launch-angle-slider");
const launchPowerSlider = document.getElementById("launch-power-slider");
const anglePreview = document.getElementById("angle-value-preview");
const powerPreview = document.getElementById("power-value-preview");
const btnGameFire = document.getElementById("btn-game-fire");
const btnGameReset = document.getElementById("btn-game-reset");

// Admin Form Panel Elements
const adminModal = document.getElementById("admin-form-panel");
const adminForm = document.getElementById("admin-blueprint-form");
const adminModalTitle = document.getElementById("admin-modal-title");
const btnCloseAdmin = document.getElementById("btn-close-admin");
const btnAdminCancel = document.getElementById("btn-admin-cancel");
const formErrorBanner = document.getElementById("form-error-banner");
const formErrorMessage = document.getElementById("form-error-message");
const formWarningBanner = document.getElementById("form-warning-banner");
const formSuccessBanner = document.getElementById("form-success-banner");
const formSuccessMessage = document.getElementById("form-success-message");
const btnAddStep = document.getElementById("btn-add-step");
const formStepsList = document.getElementById("form-steps-list");

// AI Workshop Elements
const aiPromptInput = document.getElementById("ai-prompt-input");
const btnGenerateAi = document.getElementById("btn-generate-ai");
const aiLoadingOverlay = document.getElementById("ai-loading-overlay");
const aiLoadingText = document.getElementById("ai-loading-text");

// Form Fields
const fieldTitle = document.getElementById("project-title-input");
const fieldCategory = document.getElementById("project-category-select");
const fieldAccess = document.getElementById("project-access-select");
const fieldDesc = document.getElementById("project-desc-textarea");
const fieldImageUrl = document.getElementById("project-image-input");
const fieldDifficulty = document.getElementById("project-diff-select");
const fieldBuildTime = document.getElementById("project-time-input");
const fieldLink = document.getElementById("project-link-input");
const fieldMaterials = document.getElementById("project-materials-input");
const fieldTags = document.getElementById("project-tags-input");
const fileUploadInput = document.getElementById("file-upload-input");
const imageDropzone = document.getElementById("image-dropzone");
const dropzonePreview = document.getElementById("dropzone-preview");
const dropzonePrompt = document.getElementById("dropzone-prompt");
const imagePreviewImg = document.getElementById("image-preview-img");
const btnClearImage = document.getElementById("btn-clear-image");

// Authentication Elements
const authModalPanel = document.getElementById("auth-modal-panel");
const btnCloseAuth = document.getElementById("btn-close-auth");
const authForm = document.getElementById("auth-form");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const authErrorBanner = document.getElementById("auth-error-banner");
const authErrorMessage = document.getElementById("auth-error-message");
const btnAuthLogout = document.getElementById("btn-auth-logout");

let editingBlueprintId = null;
let currentUser = null;

// Initialize Application
function init() {
  loadData();
  setupEventListeners();
  initScrollReveal();
  renderGrid();
}

// Load blueprints and state from Firestore with localStorage highscore
function loadData() {
  highscoreValue.textContent = `${highScore} pts`;

  // Real-time listener for blueprints
  const blueprintsCol = collection(db, "blueprints");
  onSnapshot(blueprintsCol, async (snapshot) => {
    if (snapshot.empty) {
      console.log("Firestore blueprints collection is empty. Seeding defaults...");
      try {
        for (const bp of initialBlueprints) {
          const docRef = doc(db, "blueprints", bp.id);
          await setDoc(docRef, bp);
        }
      } catch (err) {
        console.error("Error seeding initial blueprints:", err);
      }
    } else {
      const items = [];
      snapshot.forEach((doc) => {
        items.push(doc.data());
      });
      blueprints = items;
      renderGrid();
    }
  }, (error) => {
    console.error("Firestore listener error:", error);
  });
}

// Save blueprints: No-op since we write directly to Firestore in saveBlueprint/deleteBlueprint
function saveData() {}

// Setup Event Listeners
function setupEventListeners() {
  // Filters
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderGrid();
  });

  categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      categoryTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      selectedCategory = tab.getAttribute("data-category");
      renderGrid();
    });
  });

  diffSelect.addEventListener("change", (e) => {
    selectedDifficulty = e.target.value;
    renderGrid();
  });

  accessSelect.addEventListener("change", (e) => {
    selectedAccess = e.target.value;
    renderGrid();
  });

  // Toolbar Actions
  btnTogglePictures.addEventListener("click", () => {
    showPictures = !showPictures;
    btnTogglePictures.classList.toggle("active", showPictures);
    btnPicturesText.textContent = showPictures ? "Pictures: Shown" : "Pictures: Hidden";
    renderGrid();
  });

  btnToggleAdmin.addEventListener("click", () => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    isAdminMode = !isAdminMode;
    btnToggleAdmin.classList.toggle("active", isAdminMode);
    adminToggleText.textContent = isAdminMode ? "CREATOR VIEW: ON" : "ENTER CREATOR VIEW";
    btnFactoryReset.classList.toggle("hidden", !isAdminMode);
    btnAddBlueprintHeader.classList.toggle("hidden", !isAdminMode);
    if (isAdminMode) HeroEditor.activate();
    else HeroEditor.deactivate();
    renderGrid();
  });

  btnAuthLogout.addEventListener("click", () => {
    signOut(auth).catch(err => console.error("Sign out error", err));
  });

  btnFactoryReset.addEventListener("click", async () => {
    if (confirm("Reset catalog to factory blueprints? This will wipe your custom cardboard crafts.")) {
      try {
        const querySnapshot = await getDocs(collection(db, "blueprints"));
        for (const docSnap of querySnapshot.docs) {
          await deleteDoc(docSnap.ref);
        }
        for (const bp of initialBlueprints) {
          await setDoc(doc(db, "blueprints", bp.id), bp);
        }
      } catch (err) {
        console.error("Error resetting factory blueprints:", err);
      }
    }
  });

  btnAddBlueprintHeader.addEventListener("click", () => {
    openAdminForm();
  });

  // Auth Modal Listeners & Firebase Login
  btnCloseAuth.addEventListener("click", closeAuthModal);
  authModalPanel.addEventListener("click", (e) => {
    if (e.target === authModalPanel) closeAuthModal();
  });

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = authEmailInput.value.trim();
    const password = authPasswordInput.value.trim();
    try {
      authErrorBanner.classList.add("hidden");
      await signInWithEmailAndPassword(auth, email, password);
      closeAuthModal();
      isAdminMode = true;
      btnToggleAdmin.classList.add("active");
      adminToggleText.textContent = "CREATOR VIEW: ON";
      btnFactoryReset.classList.remove("hidden");
      btnAddBlueprintHeader.classList.remove("hidden");
      HeroEditor.activate();
      renderGrid();
    } catch (error) {
      console.error("Login failed", error);
      authErrorMessage.textContent = error.message.replace("Firebase: ", "");
      authErrorBanner.classList.remove("hidden");
    }
  });

  // Listen to Auth State Changes
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
      btnAuthLogout.classList.remove("hidden");
    } else {
      btnAuthLogout.classList.add("hidden");
      if (isAdminMode) {
        isAdminMode = false;
        btnToggleAdmin.classList.remove("active");
        adminToggleText.textContent = "ENTER CREATOR VIEW";
        btnFactoryReset.classList.add("hidden");
        btnAddBlueprintHeader.classList.add("hidden");
        HeroEditor.deactivate();
        renderGrid();
      }
    }
  });

  // Modal Assembly Events
  btnCloseModal.addEventListener("click", closeModal);
  assemblyModal.addEventListener("click", (e) => {
    if (e.target === assemblyModal) closeModal();
  });

  tabGuide.addEventListener("click", () => switchModalTab("guide"));
  tabTest.addEventListener("click", () => switchModalTab("test"));

  btnStepPrev.addEventListener("click", () => navigateStep(-1));
  btnStepNext.addEventListener("click", () => navigateStep(1));

  // Sandbox Game controls
  launchAngleSlider.addEventListener("input", (e) => {
    launchAngle = Number(e.target.value);
    anglePreview.textContent = `${launchAngle}°`;
  });

  launchPowerSlider.addEventListener("input", (e) => {
    launchPower = Number(e.target.value);
    powerPreview.textContent = `${launchPower}%`;
  });

  btnGameFire.addEventListener("click", fireProjectile);
  btnGameReset.addEventListener("click", resetTargetHinge);

  // Admin Form Events
  btnCloseAdmin.addEventListener("click", closeAdminForm);
  btnAdminCancel.addEventListener("click", closeAdminForm);
  adminModal.addEventListener("click", (e) => {
    if (e.target === adminModal) closeAdminForm();
  });

  btnAddStep.addEventListener("click", () => addFormStepField(""));
  adminForm.addEventListener("submit", saveBlueprint);

  // Image upload managers
  imageDropzone.addEventListener("click", () => fileUploadInput.click());
  fileUploadInput.addEventListener("change", handleFileSelection);

  imageDropzone.addEventListener("dragenter", handleDragEvents);
  imageDropzone.addEventListener("dragover", handleDragEvents);
  imageDropzone.addEventListener("dragleave", handleDragEvents);
  imageDropzone.addEventListener("drop", handleDropEvent);

  btnClearImage.addEventListener("click", clearSelectedImage);

  document.querySelectorAll(".preset-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      fieldImageUrl.value = url;
      updateImagePreview(url);
    });
  });

  fieldImageUrl.addEventListener("input", (e) => {
    updateImagePreview(e.target.value);
  });

  // AI Prompt Helper
  btnGenerateAi.addEventListener("click", generateAiCraftDraft);

  // Keybind listener to trigger Creator Mode login (Ctrl + Shift + E or Cmd + Shift + E)
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "e") {
      e.preventDefault();
      btnToggleAdmin.click();
    }
  });
}

// Drag & Drop event handlers
function handleDragEvents(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.type === "dragenter" || e.type === "dragover") {
    imageDropzone.classList.add("dragover");
  } else if (e.type === "dragleave") {
    imageDropzone.classList.remove("dragover");
  }
}

function handleDropEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  imageDropzone.classList.remove("dragover");
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    processImageFile(e.dataTransfer.files[0]);
  }
}

function handleFileSelection(e) {
  if (e.target.files && e.target.files[0]) {
    processImageFile(e.target.files[0]);
  }
}

function processImageFile(file) {
  if (!file.type.startsWith("image/")) {
    showFormError("Selected file must be an image.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      fieldImageUrl.value = e.target.result;
      updateImagePreview(e.target.result);
      showFormSuccess("Photo successfully loaded!");
    }
  };
  reader.onerror = () => {
    showFormError("Failed to read image file.");
  };
  reader.readAsDataURL(file);
}

function updateImagePreview(url) {
  if (url) {
    imagePreviewImg.src = url;
    dropzonePreview.classList.remove("hidden");
    dropzonePrompt.classList.add("hidden");
    btnClearImage.classList.remove("hidden");
    
    // Highlight matching preset button if any
    document.querySelectorAll(".preset-btn").forEach(btn => {
      btn.classList.toggle("selected", btn.getAttribute("data-url") === url);
    });
  } else {
    clearSelectedImage();
  }
}

function clearSelectedImage() {
  fieldImageUrl.value = "";
  fileUploadInput.value = "";
  dropzonePreview.classList.add("hidden");
  dropzonePrompt.classList.remove("hidden");
  btnClearImage.classList.add("hidden");
  document.querySelectorAll(".preset-btn").forEach(btn => btn.classList.remove("selected"));
}

// Renders the Grid of blueprint cards
function renderGrid() {
  blueprintsGrid.innerHTML = "";
  
  // Filter blueprints
  const filtered = blueprints.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || b.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || b.difficulty === selectedDifficulty;
    const matchesAccess = selectedAccess === "All" || (b.access || "Free") === selectedAccess;
    
    return matchesSearch && matchesCategory && matchesDifficulty && matchesAccess;
  });

  catalogCountText.textContent = `Blueprints Catalog (${filtered.length})`;

  // If Creator view is on, add the "Publish New Project" card first
  if (isAdminMode) {
    const addCard = document.createElement("div");
    addCard.id = "btn-add-card";
    addCard.className = "blueprint-card blueprint-card-add reveal-on-scroll";
    addCard.innerHTML = `
      <div class="add-circle-btn">
        <svg viewBox="0 0 24 24" width="24" height="24" class="icon animate-pulse"><path d="M12 5v14M5 12h14" /></svg>
      </div>
      <h4>Publish New Project</h4>
      <p>Instantly draft templates manually, or leverage client-side simulated AI generations!</p>
    `;
    addCard.addEventListener("click", () => openAdminForm());
    blueprintsGrid.appendChild(addCard);
  }

  if (filtered.length === 0 && !isAdminMode) {
    const emptyState = document.createElement("div");
    emptyState.className = "catalog-empty-state";
    emptyState.innerHTML = `
      <svg viewBox="0 0 24 24" class="icon text-muted" width="40" height="40" style="margin: 0 auto;">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
      <h4>No blueprints found</h4>
      <p>There are no target crafts answering those filter configurations. Try typing something else or click "ENTER CREATOR VIEW" to build one.</p>
    `;
    blueprintsGrid.appendChild(emptyState);
    return;
  }

  filtered.forEach(b => {
    const card = document.createElement("article");
    card.id = `craft-card-${b.id}`;
    card.className = "blueprint-card reveal-on-scroll";
    
    const isLego = b.category === "LEGO MOC";
    const accessLabel = b.access || "Free";
    
    let imageHtml = "";
    if (showPictures && b.imageUrl) {
      imageHtml = `
        <div class="card-image-box">
          <img src="${b.imageUrl}" alt="${b.title}" referrerpolicy="no-referrer">
        </div>
      `;
    }

    let adminActionsHtml = "";
    if (isAdminMode) {
      adminActionsHtml = `
        <div class="card-admin-actions">
          <button class="icon-btn edit-btn" title="Edit Blueprint" onclick="event.stopPropagation(); openAdminForm('${b.id}')">
            <svg viewBox="0 0 24 24" width="14" height="14" class="icon"><path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z"/></svg>
          </button>
          <button class="icon-btn delete-btn" title="Delete Blueprint" onclick="event.stopPropagation(); deleteBlueprint('${b.id}')">
            <svg viewBox="0 0 24 24" width="14" height="14" class="icon"><path d="M10 11v6M14 11v6M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;
    }

    let tagsHtml = "";
    if (b.tags && b.tags.length > 0) {
      tagsHtml = `
        <div class="card-tags">
          ${b.tags.map(t => `<span class="card-tag">#${t}</span>`).join("")}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-categories">
        <span class="card-category-badge">
          <span>${isLego ? "🧩" : "✂️"}</span>
          <span>${b.category}</span>
        </span>
        <span class="card-category-badge">
          <span>${accessLabel === "Premium" ? "🔒" : "🔓"}</span>
          <span style="text-transform: uppercase; font-size: 8px; font-weight: 800;">${accessLabel}</span>
        </span>
        ${b.isCustom ? `<span class="card-category-badge" style="color: var(--color-violet); background-color: var(--color-violet-soft);">Custom</span>` : ""}
      </div>
      
      ${imageHtml}
      ${adminActionsHtml}

      <div class="card-body">
        <h3>${b.title}</h3>
        <p>${b.description}</p>
      </div>

      <div class="card-specs">
        <div class="spec-block">
          <span class="spec-title">Diff:</span>
          <span class="spec-val-badge">${b.difficulty}</span>
        </div>
        <div class="spec-block">
          <span class="spec-title">Est. Time:</span>
          <span class="spec-time-val">${b.buildTime}</span>
        </div>
      </div>

      ${tagsHtml}

      <div class="card-actions">
        <button id="btn-guide-${b.id}" class="btn btn-guide">
          <svg viewBox="0 0 24 24" width="14" height="14" class="icon"><path d="m15 12-9.373 9.373a1 1 0 0 1-3.001-3L12 9M18 15l4-4"/></svg>
          <span>Assembly Guide</span>
        </button>
        <a id="link-pdf-${b.id}" href="${b.link}" target="_blank" class="btn btn-resource" title="${isLego ? 'View Lego MOC Instructions' : 'Download Blueprint Template'}">
          <span>Resource</span>
          <svg viewBox="0 0 24 24" class="icon" width="12" height="12"><path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
        </a>
      </div>
    `;

    card.querySelector(".btn-guide").addEventListener("click", () => openWalkthrough(b.id));

    blueprintsGrid.appendChild(card);
  });

  observeNewElements();
}

// Open Walkthrough Modal
function openWalkthrough(id) {
  activeBlueprint = blueprints.find(b => b.id === id);
  if (!activeBlueprint) return;
  
  currentStepIndex = 0;
  isModalSimulatorActive = false;
  currentScore = 0;
  recentscoreValue.textContent = "0 pts";

  // Modal text bindings
  modalTitle.textContent = activeBlueprint.title;
  modalSubtitle.textContent = `${activeBlueprint.category} • Blueprint Walkthrough`;
  
  const isLego = activeBlueprint.category === "LEGO MOC";
  assemblyModal.classList.toggle("theme-blue", isLego);

  // Load custom header icon
  modalIconBox.innerHTML = isLego 
    ? `<svg viewBox="0 0 24 24" class="icon text-secondary" width="20" height="20"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>` // target icon
    : `<svg viewBox="0 0 24 24" class="icon text-secondary" width="20" height="20"><path d="M15.707 21.293a1 1 0 0 1-1.414 0l-1.586-1.586a1 1 0 0 1 0-1.414l5.586-5.586a1 1 0 0 1 1.414 0l1.586 1.586a1 1 0 0 1 0 1.414z"/><path d="m18 13-1.375-6.874a1 1 0 0 0-.746-.776L3.235 2.028a1 1 0 0 0-1.207 1.207L5.35 15.879a1 1 0 0 0 .776.746L13 18"/><path d="m2.3 2.3 7.286 7.286"/><circle cx="11" cy="11" r="2"/></svg>`; // pen tool icon

  // Sidebar bindings
  if (activeBlueprint.imageUrl) {
    modalImage.src = activeBlueprint.imageUrl;
    modalImageContainer.classList.remove("hidden");
  } else {
    modalImageContainer.classList.add("hidden");
  }

  modalDifficulty.textContent = activeBlueprint.difficulty;
  modalDifficulty.className = "spec-value";
  if (activeBlueprint.difficulty === "Easy") modalDifficulty.classList.add("text-emerald");
  if (activeBlueprint.difficulty === "Medium") modalDifficulty.classList.add("text-orange");
  if (activeBlueprint.difficulty === "Hard") modalDifficulty.classList.add("text-rose");

  modalBuildTime.textContent = activeBlueprint.buildTime;
  
  // Materials pills
  modalMaterialsContainer.innerHTML = "";
  if (activeBlueprint.materials) {
    activeBlueprint.materials.split(",").forEach(m => {
      const pill = document.createElement("span");
      pill.className = "materials-pill";
      pill.textContent = m.trim();
      modalMaterialsContainer.appendChild(pill);
    });
  }

  // Action Resource URL
  btnDownloadPdf.href = activeBlueprint.link;
  btnDownloadText.textContent = isLego 
    ? (activeBlueprint.access === "Premium" ? "Get Premium LEGO MOC" : "LEGO building instructions")
    : (activeBlueprint.access === "Premium" ? "Download Premium PDF Template" : "Download Free PDF Template");

  // Load Assembly steps
  renderStepsInstructions();
  switchModalTab("guide");
  
  assemblyModal.classList.remove("hidden");
}

function closeModal() {
  assemblyModal.classList.add("hidden");
  stopSimulator();
}

function switchModalTab(tab) {
  if (tab === "guide") {
    tabGuide.classList.add("active");
    tabTest.classList.remove("active");
    tabContentGuide.classList.add("active");
    tabContentTest.classList.remove("active");
    stopSimulator();
  } else {
    tabGuide.classList.remove("active");
    tabTest.classList.add("active");
    tabContentGuide.classList.remove("active");
    tabContentTest.classList.add("active");
    startSimulator();
  }
}

// Render Step instructions in modal
function renderStepsInstructions() {
  const steps = activeBlueprint.steps || [];
  
  if (steps.length === 0) {
    stepsIndicator.textContent = "No Steps Defined";
    stepDescText.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem;">This blueprint does not contain progressive guides.</p>
        <p style="font-size: 0.8rem;">Click <strong>Resource</strong> to view standard schematics directly.</p>
      </div>
    `;
    stepsProgressBar.innerHTML = "";
    btnStepPrev.disabled = true;
    btnStepNext.disabled = true;
    return;
  }

  stepsIndicator.textContent = `Step ${currentStepIndex + 1} of ${steps.length}`;
  stepDescText.textContent = steps[currentStepIndex];
  
  btnStepPrev.disabled = currentStepIndex === 0;
  btnStepNext.disabled = currentStepIndex === steps.length - 1;

  // Render dots
  stepsProgressBar.innerHTML = "";
  steps.forEach((_, index) => {
    const dot = document.createElement("div");
    dot.className = "progress-dot";
    if (index === currentStepIndex) dot.classList.add("active");
    else if (index < currentStepIndex) dot.classList.add("completed");
    
    dot.addEventListener("click", () => {
      currentStepIndex = index;
      renderStepsInstructions();
    });
    stepsProgressBar.appendChild(dot);
  });
}

function navigateStep(direction) {
  const stepsCount = activeBlueprint.steps ? activeBlueprint.steps.length : 0;
  currentStepIndex += direction;
  currentStepIndex = Math.max(0, Math.min(stepsCount - 1, currentStepIndex));
  renderStepsInstructions();
}

function openAuthModal() {
  authModalPanel.classList.remove("hidden");
  authEmailInput.value = "";
  authPasswordInput.value = "";
  authErrorBanner.classList.add("hidden");
  authEmailInput.focus();
}

function closeAuthModal() {
  authModalPanel.classList.add("hidden");
}

window.openAdminForm = openAdminForm;
window.deleteBlueprint = deleteBlueprint;

// Open administrative project form
function openAdminForm(id = null) {
  editingBlueprintId = id;
  clearSelectedImage();
  
  // Clear error status
  formErrorBanner.classList.add("hidden");
  formWarningBanner.classList.add("hidden");
  formSuccessBanner.classList.add("hidden");
  formStepsList.innerHTML = "";

  if (editingBlueprintId) {
    // Editing existing blueprint
    const bp = blueprints.find(b => b.id === editingBlueprintId);
    if (!bp) return;

    adminModalTitle.textContent = "Edit Blueprint Details";
    fieldTitle.value = bp.title;
    fieldCategory.value = bp.category;
    fieldAccess.value = bp.access || "Free";
    fieldDesc.value = bp.description;
    
    if (bp.imageUrl) {
      fieldImageUrl.value = bp.imageUrl;
      updateImagePreview(bp.imageUrl);
    }
    
    fieldDifficulty.value = bp.difficulty;
    fieldBuildTime.value = bp.buildTime;
    fieldLink.value = bp.link || "";
    fieldMaterials.value = bp.materials;
    fieldTags.value = bp.tags ? bp.tags.join(", ") : "";

    // Set steps
    if (bp.steps && bp.steps.length > 0) {
      bp.steps.forEach(s => addFormStepField(s));
    } else {
      addFormStepField("");
    }
  } else {
    // Publishing new blueprint
    adminModalTitle.textContent = "Publish New Craft Project";
    adminForm.reset();
    fieldCategory.value = "Cardboard Craft";
    fieldAccess.value = "Free";
    fieldDifficulty.value = "Medium";
    
    addFormStepField("");
  }

  adminModal.classList.remove("hidden");
}

function closeAdminForm() {
  adminModal.classList.add("hidden");
  editingBlueprintId = null;
}

// Add step input field in Admin Modal Form
function addFormStepField(value = "") {
  const stepContainer = document.createElement("div");
  stepContainer.className = "form-step-item";
  
  const stepIndex = formStepsList.children.length + 1;
  stepContainer.innerHTML = `
    <span class="step-number-circle">${stepIndex}</span>
    <input type="text" class="step-input" required maxlength="140" placeholder="Step ${stepIndex} action instruction..." value="${value}">
    <button type="button" class="remove-step-btn">Remove</button>
  `;
  
  stepContainer.querySelector(".remove-step-btn").addEventListener("click", () => {
    stepContainer.remove();
    recalculateStepNumbers();
  });
  
  formStepsList.appendChild(stepContainer);
}

function recalculateStepNumbers() {
  Array.from(formStepsList.children).forEach((child, index) => {
    child.querySelector(".step-number-circle").textContent = index + 1;
    child.querySelector(".step-input").placeholder = `Step ${index + 1} action instruction...`;
  });
}

// Save Admin Form changes
async function saveBlueprint(e) {
  e.preventDefault();
  
  const title = fieldTitle.value.trim();
  const desc = fieldDesc.value.trim();
  const materials = fieldMaterials.value.trim();
  
  if (!title || !desc || !materials) {
    showFormError("Please satisfy all primary fields: Title, Description, and Materials.");
    return;
  }

  // Collect step inputs
  const steps = [];
  formStepsList.querySelectorAll(".step-input").forEach(input => {
    const val = input.value.trim();
    if (val) steps.push(val);
  });

  const category = fieldCategory.value;
  const access = fieldAccess.value;
  const difficulty = fieldDifficulty.value;
  const buildTime = fieldBuildTime.value.trim() || "30 mins";
  const link = fieldLink.value.trim() || (category === "LEGO MOC" ? "https://rebrickable.com/" : "https://sites.google.com/view/tack-target-crafts/");
  const imageUrl = fieldImageUrl.value.trim() || undefined;

  // Split tags
  const tagsStr = fieldTags.value.trim();
  let tags = [];
  if (tagsStr) {
    tags = tagsStr.split(",").map(t => t.trim()).filter(t => t.length > 0);
  } else {
    tags = [category === "LEGO MOC" ? "LEGO" : "Cardboard", "Blueprint"];
  }

  const id = editingBlueprintId || `craft-${Date.now()}`;
  const isCustom = true;

  const blueprintData = {
    id,
    title,
    category,
    description: desc,
    difficulty,
    buildTime,
    materials,
    link,
    imageUrl,
    steps,
    tags,
    isCustom,
    access
  };

  try {
    const docRef = doc(db, "blueprints", id);
    await setDoc(docRef, blueprintData);
    closeAdminForm();
  } catch (err) {
    console.error("Error saving blueprint:", err);
    showFormError("Failed to save blueprint: " + err.message);
  }
}

async function deleteBlueprint(id) {
  if (confirm("Are you sure you want to delete this blueprint from your workspace?")) {
    try {
      const docRef = doc(db, "blueprints", id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting blueprint:", err);
      alert("Failed to delete blueprint: " + err.message);
    }
  }
}

// Client-Side Simulated Gemini AI Blueprint generation
function generateAiCraftDraft() {
  const prompt = aiPromptInput.value.trim();
  if (!prompt) {
    showFormError("Please enter an idea prompt first so the AI can assist.");
    return;
  }

  // Start loader sequence
  aiLoadingOverlay.classList.remove("hidden");
  formErrorBanner.classList.add("hidden");
  formWarningBanner.classList.add("hidden");

  const loaderPhases = [
    "Initializing drafting boards...",
    "Analyzing structural physics and leverage...",
    "Formulating clean cutting/brick dimensions...",
    "Structuring fully dynamic build steps...",
    "Finalizing creative blueprint metadata..."
  ];

  let currentPhase = 0;
  aiLoadingText.textContent = loaderPhases[0];

  const timer = setInterval(() => {
    currentPhase++;
    if (currentPhase < loaderPhases.length) {
      aiLoadingText.textContent = loaderPhases[currentPhase];
    } else {
      clearInterval(timer);
      aiLoadingOverlay.classList.add("hidden");
      
      // Perform Mock AI draft based on user prompt
      fillFormWithMockAiData(prompt);
    }
  }, 700);
}

function fillFormWithMockAiData(prompt) {
  const category = fieldCategory.value;
  const isLego = category === "LEGO MOC";
  
  let title = "";
  let description = "";
  let difficulty = "Medium";
  let buildTime = "30 mins";
  let materials = "";
  let steps = [];
  let tags = [];

  // Creative drafting using prompt keywords
  const promptLower = prompt.toLowerCase();
  
  if (isLego) {
    if (promptLower.includes("dart") || promptLower.includes("gun") || promptLower.includes("foam")) {
      title = "Kinematic Foam-Dart Lego Board";
      description = "A Technic-geared target rack where direct dart impacts drive mechanical linkages to toggle score panels automatically.";
      difficulty = "Medium";
      buildTime = "35 mins";
      materials = "LEGO Technic studs, 2x 12T gear wheels, counter-balance plates, 8-hole pivot frames";
      steps = [
        "Construct the foundational stand using two parallel 1x12 stud beams.",
        "Mount pivot axles on the upper deck and balance target panels using flat plates.",
        "Integrate 12T gear meshes underneath to coordinate automatic reset rotations.",
        "Attach elastic bands on auxiliary pegs to build mechanical spring torque.",
        "Trigger the target panels with foam projectiles to verify pivot reset loops."
      ];
      tags = ["LEGO", "Technic", "Foam-Dart", "Kinematic"];
    } else if (promptLower.includes("crank") || promptLower.includes("reset")) {
      title = "Cam-Operated Lego Reset Tower";
      description = "A high-leverage MOC featuring staggered cam lobes on a central axle, allowing a single crank rotation to reset multiple targets.";
      difficulty = "Hard";
      buildTime = "40 mins";
      materials = "Lego 40T gears, crankshaft rods, Technic cam connectors, modular vertical columns";
      steps = [
        "Build the vertical frame housing utilizing sturdy technic columns.",
        "Construct a crank-operated main axle and fit offset cam lobes.",
        "Insert three independent pivot indicators that rest lightly on the cams.",
        "Connect the crank axle with a 40T gear reduction assembly to ease turning tension.",
        "Rotate the hand crank to ensure cams lift the indicators back to attention."
      ];
      tags = ["LEGO", "Cam-Lobes", "Mechanical", "Crank"];
    } else {
      title = `MOC Target: ${prompt.substring(0, 30)}`;
      description = "An AI-drafted MOC concept optimized for mechanical feedback, designed entirely with common builder elements.";
      difficulty = "Hard";
      buildTime = "30 mins";
      materials = "Technic frame elements, connector pins, colored indicator tiles, axle sleeves";
      steps = [
        "Layout the base framework to avoid target slides during impacts.",
        "Anchor central hinges and test pivot rotations.",
        "Assemble custom indicator signs using colored tiles.",
        "Integrate safety lock pins to prevent over-rotation.",
        "Test manual resets and adjust clearances."
      ];
      tags = ["LEGO", "MOC", "AI-Drafted", "Target"];
    }
  } else {
    // Cardboard Craft Mock AI templates
    if (promptLower.includes("foam") || promptLower.includes("catch") || promptLower.includes("dart")) {
      title = "Cardboard Foam-Dart Funnel Catch";
      description = "A large cardboard trap featuring a sloped target face that directs strikes down a central ramp to collect ammo easily.";
      difficulty = "Easy";
      buildTime = "25 mins";
      materials = "Medium parcel box, scoring knife, paper funnel, mesh fabric, hot glue gun";
      steps = [
        "Cut open the top flaps of a medium shipping container box.",
        "Install internal cardboard channels slanted at a 45-degree angle.",
        "Insert a net or mesh fabric backing to cushion impacts and trap projectiles.",
        "Add a collection pocket at the bottom exit slide for easy reload retrievals.",
        "Color target rings on the front panel and test fire with a foam blaster."
      ];
      tags = ["Cardboard", "Foam-Dart", "Funnel", "Catch"];
    } else if (promptLower.includes("pendulum") || promptLower.includes("swing")) {
      title = "Oscillating Pendulum Cardboard Target";
      description = "A suspended cardboard system featuring weighted counterbalances that creates a swinging movement to test target accuracy.";
      difficulty = "Medium";
      buildTime = "30 mins";
      materials = "Rigid shoe box, wooden dowel rod, thick copper wire, card stock targets, coins for weights";
      steps = [
        "Construct a large rectangular open-face cabinet from a shoebox.",
        "Mount a horizontal dowel rod across the top width of the cabinet.",
        "Suspen cardstock targets from the dowel using copper wire loops.",
        "Attach heavy coins to the bottom of the wire assemblies to build momentum.",
        "Nudge targets to trigger oscillation loops and shoot to stall the swing."
      ];
      tags = ["Cardboard", "Pendulum", "Oscillating", "Skill"];
    } else {
      title = `Cardboard Craft: ${prompt.substring(0, 30)}`;
      description = "A custom cardboard targets blueprint utilizing templates, elastic return tracks, and scoring face plates.";
      difficulty = "Medium";
      buildTime = "30 mins";
      materials = "Corrugated cardboard board, utility knife, hot glue, elastic rubber bands";
      steps = [
        "Cut out the target backing shield and support brace slots.",
        "Assemble the vertical hinges using toothpicks or skewer rods.",
        "Anchor elastic tension loops to pull targets back upright.",
        "Affix the front target plate containing printed ring visuals.",
        "Test target toggle mechanics and check hinge clearance."
      ];
      tags = ["Cardboard", "DIY", "AI-Drafted", "Hinge"];
    }
  }

  // Auto fill form fields
  fieldTitle.value = title;
  fieldDesc.value = description;
  fieldDifficulty.value = difficulty;
  fieldBuildTime.value = buildTime;
  fieldMaterials.value = materials;
  
  // Set steps
  formStepsList.innerHTML = "";
  steps.forEach(s => addFormStepField(s));

  fieldTags.value = tags.join(", ");
  
  // Activate form warning notice (replaces prompt API warning in original React application)
  formWarningBanner.classList.remove("hidden");
  showFormSuccess("AI has successfully authored details! You can review and adjust them below.");
}

function showFormError(msg) {
  formErrorMessage.textContent = msg;
  formErrorBanner.classList.remove("hidden");
  formSuccessBanner.classList.add("hidden");
}

function showFormSuccess(msg) {
  formSuccessMessage.textContent = msg;
  formSuccessBanner.classList.remove("hidden");
  formErrorBanner.classList.add("hidden");
}

// -------------------------------------------------------------
// VIRTUAL TARGET PHYSICS SIMULATION GAME
// -------------------------------------------------------------
function startSimulator() {
  canvas = document.getElementById("simulator-canvas");
  ctx = canvas.getContext("2d");
  
  isModalSimulatorActive = true;
  isProjectileActive = false;
  projectile.active = false;
  
  // Reset targets
  target.isHit = false;
  target.fallAngle = 0;
  target.x = 420;
  target.speed = 1.2 + Math.random() * 1.5;
  particles = [];
  
  statusMessage = "Ready to test fire!";
  simulatorStatusText.textContent = statusMessage;
  
  btnGameFire.disabled = false;

  // Run update loop
  if (animationId) cancelAnimationFrame(animationId);
  animationLoop();
}

function stopSimulator() {
  isModalSimulatorActive = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function animationLoop() {
  if (!isModalSimulatorActive) return;
  
  updatePhysics();
  drawScene();
  
  animationId = requestAnimationFrame(animationLoop);
}

function updatePhysics() {
  const isLego = activeBlueprint.category === "LEGO MOC";

  // 1. Move target (if not hit)
  if (!target.isHit) {
    target.x += target.direction * target.speed;
    if (target.x > 500) {
      target.x = 500;
      target.direction = -1;
    } else if (target.x < 320) {
      target.x = 320;
      target.direction = 1;
    }
  }

  // 2. Move Projectile
  if (projectile.active) {
    projectile.trail.push({ x: projectile.x, y: projectile.y });
    if (projectile.trail.length > 25) projectile.trail.shift();
    
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.vy += gravity; // Gravity pull

    // Check hit collision
    if (!target.isHit) {
      const hitX = projectile.x >= target.x && projectile.x <= target.x + target.width;
      const hitY = projectile.y >= target.y && projectile.y <= target.y + target.height;
      
      if (hitX && hitY) {
        target.isHit = true;
        projectile.active = false;
        isProjectileActive = false;
        btnGameFire.disabled = false;
        
        spawnExplosionParticles(projectile.x, projectile.y);
        incrementScore();

        statusMessage = "🎯 DIRECT HIT! Target flipped down. Click Reset to continue!";
        simulatorStatusText.textContent = statusMessage;
      }
    }

    // Check boundary failures
    if (projectile.y >= canvas.height - 30) {
      // Ground impact
      projectile.active = false;
      isProjectileActive = false;
      btnGameFire.disabled = false;
      spawnExplosionParticles(projectile.x, canvas.height - 30);
      statusMessage = "Missed! Impacted ground floor.";
      simulatorStatusText.textContent = statusMessage;
    } else if (projectile.x > canvas.width) {
      projectile.active = false;
      isProjectileActive = false;
      btnGameFire.disabled = false;
      statusMessage = "Missed! Projectile flew too far.";
      simulatorStatusText.textContent = statusMessage;
    }
  }

  // 3. Move Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life++;
    if (p.life > p.maxLife) {
      particles.splice(i, 1);
    }
  }
}

function drawScene() {
  // Monochrome / grayscale theme canvas
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid lines — subtle zinc grid
  ctx.strokeStyle = "rgba(63, 63, 70, 0.35)";
  ctx.lineWidth = 1;
  const gridSpacing = 25;
  for (let x = 0; x < canvas.width; x += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSpacing) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Ground level line
  ctx.strokeStyle = "rgba(113, 113, 122, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 30);
  ctx.lineTo(canvas.width, canvas.height - 30);
  ctx.stroke();

  ctx.fillStyle = "#18181b";
  ctx.fillRect(0, canvas.height - 28, canvas.width, 28);

  // Projectile trail — crisp white dashes
  if (projectile.trail.length > 1) {
    ctx.beginPath();
    ctx.strokeStyle = "rgba(228, 228, 231, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 5]);
    ctx.moveTo(projectile.trail[0].x, projectile.trail[0].y);
    for (let i = 1; i < projectile.trail.length; i++) {
      ctx.lineTo(projectile.trail[i].x, projectile.trail[i].y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Cannon base
  ctx.save();
  ctx.translate(50, 195);
  ctx.fillStyle = "#3f3f46";  // zinc-700
  ctx.fillRect(-15, 10, 30, 25);

  // Barrel
  ctx.rotate(-launchAngle * Math.PI / 180);
  ctx.fillStyle = "#71717a";  // zinc-500
  ctx.fillRect(-5, -6, 28, 12);

  // Pivot pin
  ctx.fillStyle = "#a1a1aa"; // zinc-400
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Target hinge
  ctx.save();
  ctx.translate(target.x + target.width / 2, target.y + target.height);
  if (target.isHit) {
    if (target.fallAngle < 85) target.fallAngle += 4;
    ctx.rotate(target.fallAngle * Math.PI / 180);
  }

  // Stand rod
  ctx.fillStyle = "#52525b"; // zinc-600
  ctx.fillRect(-3, -target.height, 6, target.height);

  // Bullseye — white ring on dark circle
  const targetCircleY = -target.height + 15;
  const radius = 22;
  ctx.fillStyle = "#27272a"; // zinc-800 outer
  ctx.beginPath();
  ctx.arc(0, targetCircleY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#e4e4e7"; // zinc-200 ring
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, targetCircleY, radius - 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#a1a1aa"; // zinc-400 inner ring
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, targetCircleY, radius - 12, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#f4f4f5"; // zinc-100 bullseye dot
  ctx.beginPath();
  ctx.arc(0, targetCircleY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Active projectile — bright white sphere
  if (projectile.active) {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
    ctx.fill();
    // Glow halo
    const grd = ctx.createRadialGradient(projectile.x, projectile.y, 2, projectile.x, projectile.y, 10);
    grd.addColorStop(0, "rgba(255,255,255,0.35)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Explosion particles
  for (const p of particles) {
    ctx.fillStyle = p.color;
    const size = Math.max(0.5, 3 * (1 - p.life / p.maxLife));
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function fireProjectile() {
  if (projectile.active) return;

  const startX = 50;
  const startY = 195;
  const rad = launchAngle * Math.PI / 180;
  
  // Map power slider into physical speed
  const speed = 4 + (launchPower / 100) * 10;

  projectile.x = startX;
  projectile.y = startY;
  projectile.vx = speed * Math.cos(rad);
  projectile.vy = -speed * Math.sin(rad);
  projectile.active = true;
  projectile.trail = [];
  
  isProjectileActive = true;
  btnGameFire.disabled = true;

  statusMessage = "Projectile launched! Watching trajectory...";
  simulatorStatusText.textContent = statusMessage;
}

function spawnExplosionParticles(x, y) {
  // Monochrome silver / white sparks
  const palette = ["#ffffff", "#e4e4e7", "#a1a1aa", "#71717a", "#d4d4d8"];

  for (let i = 0; i < 18; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.2 + Math.random() * 3.5;

    particles.push({
      x, y,
      vx: speed * Math.cos(angle),
      vy: speed * Math.sin(angle) - 1.2,
      life: 0,
      maxLife: 20 + Math.random() * 35,
      color: palette[Math.floor(Math.random() * palette.length)]
    });
  }
}

function incrementScore() {
  currentScore += 100;
  recentscoreValue.textContent = `${currentScore} pts`;
  
  if (currentScore > highScore) {
    highScore = currentScore;
    localStorage.setItem("tact_target_highscore", String(highScore));
    highscoreValue.textContent = `${highScore} pts`;
  }
}

function resetTargetHinge() {
  target.isHit = false;
  target.fallAngle = 0;
  projectile.active = false;
  isProjectileActive = false;
  btnGameFire.disabled = false;
  target.speed = 1 + Math.random() * 2;
  
  statusMessage = "Target reset! Try to hit it again.";
  simulatorStatusText.textContent = statusMessage;
}

// Intersection Observer for scroll-reveal and staggered entry animation
let revealObserver;

function initScrollReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('revealed'));
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    let delayCounter = 0;
    const staggerInterval = 80;

    const enteringEntries = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => {
        const rectA = a.target.getBoundingClientRect();
        const rectB = b.target.getBoundingClientRect();
        return (rectA.top - rectB.top) || (rectA.left - rectB.left);
      });

    enteringEntries.forEach((entry) => {
      const el = entry.target;
      const currentDelay = delayCounter * staggerInterval;
      el.style.setProperty('--reveal-delay', `${currentDelay}ms`);
      el.classList.add('revealed');
      revealObserver.unobserve(el);
      delayCounter++;

      setTimeout(() => {
        el.classList.remove('reveal-on-scroll', 'revealed');
        el.style.removeProperty('--reveal-delay');
      }, 800 + currentDelay + 100);
    });
  }, {
    root: null,
    rootMargin: '0px 0px -40px 0px',
    threshold: 0.05
  });

  observeNewElements();
}

function observeNewElements() {
  if (!revealObserver) return;
  document.querySelectorAll('.reveal-on-scroll:not(.revealed)').forEach(el => {
    revealObserver.observe(el);
  });
}

// ─────────────────────────────────────────────────────────
// NEWSLETTER CONTROLLER
// Handles form validation, Formspree AJAX, and localStorage
// ─────────────────────────────────────────────────────────
const NewsletterController = {
  STORAGE_KEY: 'tact_target_newsletter_subscriptions',

  init() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Live validation on email field
    const emailInput = document.getElementById('newsletter-email');
    if (emailInput) {
      emailInput.addEventListener('input', () => this.clearValidationUI());
    }
  },

  isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  },

  clearValidationUI() {
    const emailInput = document.getElementById('newsletter-email');
    const errorEl = document.getElementById('newsletter-email-error');
    if (emailInput) emailInput.classList.remove('invalid', 'valid');
    if (errorEl) errorEl.classList.add('hidden');
  },

  showError(message) {
    const emailInput = document.getElementById('newsletter-email');
    const errorEl = document.getElementById('newsletter-email-error');
    if (emailInput) emailInput.classList.add('invalid');
    if (errorEl) {
      errorEl.textContent = message || '⚠️ Please enter a valid email address.';
      errorEl.classList.remove('hidden');
    }
    this.hideBanner();
  },

  showBanner(type, message) {
    const banner = document.getElementById('newsletter-status-banner');
    if (!banner) return;
    banner.className = `banner banner-${type}`;
    banner.textContent = message;
    banner.classList.remove('hidden');
  },

  hideBanner() {
    const banner = document.getElementById('newsletter-status-banner');
    if (banner) banner.classList.add('hidden');
  },

  setSubmitState(loading) {
    const btn = document.getElementById('btn-newsletter-submit');
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    btn.disabled = loading;
    if (text) text.textContent = loading ? 'SENDING...' : 'SUBSCRIBE';
    if (spinner) spinner.classList.toggle('hidden', !loading);
  },

  saveToLocalStorage(email) {
    const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
    if (!existing.includes(email)) {
      existing.push(email);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
    }
  },

  async handleSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput ? emailInput.value.trim() : '';

    // Client-side validation
    if (!this.isValidEmail(email)) {
      this.showError('⚠️ Please enter a valid email address.');
      return;
    }

    emailInput.classList.add('valid');
    this.clearValidationUI();
    emailInput.classList.add('valid');
    this.setSubmitState(true);
    this.hideBanner();

    const actionUrl = form.action;
    const isRealEndpoint = actionUrl && !actionUrl.includes('YOUR_FORM_ID_HERE');

    if (isRealEndpoint) {
      // AJAX POST to Formspree
      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });

        if (response.ok) {
          this.saveToLocalStorage(email);
          this.showBanner('success', '✅ You\'re subscribed! Craft updates coming your way.');
          form.reset();
          emailInput.classList.remove('valid');
        } else {
          const data = await response.json().catch(() => ({}));
          const msg = data.errors ? data.errors.map(err => err.message).join(', ') : 'Submission failed.';
          this.showBanner('error', `❌ ${msg}`);
        }
      } catch (_err) {
        // Network error — fall back to localStorage
        this.saveToLocalStorage(email);
        this.showBanner('success', `✅ Saved locally! Will sync when you're back online.`);
        form.reset();
      }
    } else {
      // No real endpoint — store in localStorage only
      await new Promise(r => setTimeout(r, 900)); // simulate latency
      this.saveToLocalStorage(email);
      this.showBanner('success', '✅ Interest noted! Connect a Formspree endpoint to send to your inbox.');
      form.reset();
    }

    this.setSubmitState(false);
  }
};

// ─────────────────────────────────────────────────────────
// HERO EDITOR CONTROLLER
// Inline contenteditable for hero text when Creator Mode on
// ─────────────────────────────────────────────────────────
const HeroEditor = {
  STORAGE_KEY: 'tact_target_hero_content',

  // All editable fields: [id, label shown in tooltip, singleLine?]
  FIELDS: [
    { id: 'hero-eyebrow-text',   label: 'Eyebrow Tag',        single: true  },
    { id: 'hero-heading-main',   label: 'Heading Line 1',     single: true  },
    { id: 'hero-heading-accent', label: 'Heading Line 2',     single: true  },
    { id: 'hero-desc',           label: 'Description',        single: false },
    { id: 'hero-badge-1',        label: 'Badge 1',            single: true  },
    { id: 'hero-badge-2',        label: 'Badge 2',            single: true  },
    { id: 'hero-badge-3',        label: 'Badge 3',            single: true  },
    { id: 'stat-num-1',          label: 'Stat 1 — Number',    single: true  },
    { id: 'stat-label-1',        label: 'Stat 1 — Label',     single: true  },
    { id: 'stat-num-2',          label: 'Stat 2 — Number',    single: true  },
    { id: 'stat-label-2',        label: 'Stat 2 — Label',     single: true  },
    { id: 'stat-num-3',          label: 'Stat 3 — Number',    single: true  },
    { id: 'stat-label-3',        label: 'Stat 3 — Label',     single: true  },
    { id: 'stat-num-4',          label: 'Stat 4 — Number',    single: true  },
    { id: 'stat-label-4',        label: 'Stat 4 — Label',     single: true  },
  ],

  _saveTimer: null,
  _toastTimer: null,
  _editBanner: null,

  init() {
    // Mark all elements with the data attr so CSS selector can target them
    this.FIELDS.forEach(({ id, label, single }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.setAttribute('data-hero-editable', '');
      el.setAttribute('data-label', `✏️  ${label}`);
      if (single) el.setAttribute('data-single-line', 'true');
    });

    // Listen to settings/hero in Firestore
    onSnapshot(doc(db, "settings", "hero"), (docSnap) => {
      if (docSnap.exists()) {
        const saved = docSnap.data();
        Object.entries(saved).forEach(([id, text]) => {
          const el = document.getElementById(id);
          if (el && text) el.textContent = text;
        });
      } else {
        // Seed initial values to database if settings/hero doesn't exist
        const currentData = {};
        this.FIELDS.forEach(({ id }) => {
          const el = document.getElementById(id);
          if (el) currentData[id] = el.textContent.trim();
        });
        setDoc(doc(db, "settings", "hero"), currentData).catch(err => console.error("Error seeding hero settings:", err));
      }
    }, (err) => {
      console.error("Hero content Firestore listener error:", err);
    });
  },

  activate() {
    const heroSection = document.querySelector('.hero-section');

    // Show "EDITING HERO" banner
    if (!this._editBanner) {
      this._editBanner = document.createElement('div');
      this._editBanner.className = 'hero-edit-banner';
      this._editBanner.innerHTML = `
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        Editing Hero Content — click any text to edit
      `;
    }

    const heroContent = document.querySelector('.hero-content');
    if (heroContent && !heroContent.contains(this._editBanner)) {
      heroContent.prepend(this._editBanner);
    }

    heroSection && heroSection.classList.add('creator-edit-active');

    // Enable contenteditable on all fields
    this.FIELDS.forEach(({ id, single }) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.contentEditable = 'true';
      el.spellcheck = false;

      // Prevent newlines in single-line fields
      if (single) {
        el.addEventListener('keydown', this._blockNewlines);
      }

      // Auto-save on every input
      el.addEventListener('input', () => this._scheduleAutoSave());
    });
  },

  deactivate() {
    const heroSection = document.querySelector('.hero-section');
    heroSection && heroSection.classList.remove('creator-edit-active');

    // Remove edit banner
    if (this._editBanner && this._editBanner.parentNode) {
      this._editBanner.parentNode.removeChild(this._editBanner);
    }

    // Disable contenteditable
    this.FIELDS.forEach(({ id, single }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.contentEditable = 'false';
      if (single) el.removeEventListener('keydown', this._blockNewlines);
    });

    // Save immediately on deactivate
    this._saveContent();
  },

  _blockNewlines(e) {
    if (e.key === 'Enter') e.preventDefault();
  },

  _scheduleAutoSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveContent(), 700);
  },

  _saveContent() {
    const data = {};
    this.FIELDS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) data[id] = el.textContent.trim();
    });
    setDoc(doc(db, "settings", "hero"), data).catch(err => console.error("Error saving hero content:", err));
    this._showToast('Changes saved');
  },

  _showToast(message) {
    // Remove existing toast
    const existing = document.getElementById('hero-save-toast');
    if (existing) existing.remove();
    clearTimeout(this._toastTimer);

    const toast = document.createElement('div');
    toast.id = 'hero-save-toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${message}
    `;
    document.body.appendChild(toast);

    this._toastTimer = setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 320);
    }, 2000);
  }
};

// Start Application on Load
window.addEventListener('DOMContentLoaded', () => {
  BgParticles.init();
  init();
  NewsletterController.init();
  HeroEditor.init();
});
