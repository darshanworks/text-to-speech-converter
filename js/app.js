/* ── State ── */
let voices = [];
let currentUtterance = null;
let state = "idle"; // idle | speaking | paused | stopped

/* ── Elements ── */
const textInput = document.getElementById("textInput");
const voiceSelect = document.getElementById("voiceSelect");
const rateRange = document.getElementById("rateRange");
const pitchRange = document.getElementById("pitchRange");
const volumeRange = document.getElementById("volumeRange");
const rateVal = document.getElementById("rateVal");
const pitchVal = document.getElementById("pitchVal");
const volumeVal = document.getElementById("volumeVal");
const btnPlay = document.getElementById("btnPlay");
const btnPause = document.getElementById("btnPause");
const btnResume = document.getElementById("btnResume");
const btnStop = document.getElementById("btnStop");
const btnCopy = document.getElementById("btnCopy");
const btnDownload = document.getElementById("btnDownload");
const btnSample = document.getElementById("btnSample");
const btnClear = document.getElementById("btnClear");
const charCount = document.getElementById("charCount");
const wordCountEl = document.getElementById("wordCount");
const readTimeEl = document.getElementById("readTime");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const visualizer = document.getElementById("visualizer");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

const SAMPLE_TEXT = `The future belongs to those who believe in the beauty of their dreams. Every great advance in science has issued from a new audacity of imagination. We are all connected — to each other, biologically; to the earth, chemically; to the rest of the universe, atomically.`;

/* ── Voice Loading ── */
function loadVoices() {
  voices = window.speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  if (voices.length === 0) {
    voiceSelect.innerHTML = "<option>No voices found</option>";
    return;
  }
  voices.forEach((v, i) => {
    const opt = new Option(`${v.name} (${v.lang})`, i);
    voiceSelect.appendChild(opt);
  });
  // prefer an English voice
  const engIdx = voices.findIndex((v) => v.lang.startsWith("en"));
  if (engIdx >= 0) voiceSelect.value = engIdx;
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

/* ── Status ── */
function setStatus(s) {
  state = s;
  statusBadge.className = "status-badge";
  visualizer.classList.remove("active");
  if (s === "speaking") {
    statusBadge.classList.add("speaking");
    statusText.textContent = "Speaking";
    visualizer.classList.add("active");
  } else if (s === "paused") {
    statusBadge.classList.add("paused");
    statusText.textContent = "Paused";
  } else if (s === "stopped") {
    statusBadge.classList.add("stopped");
    statusText.textContent = "Stopped";
  } else {
    statusText.textContent = "Ready";
  }
  updateButtons();
}

function updateButtons() {
  const speaking = state === "speaking";
  const paused = state === "paused";
  const idle = state === "idle" || state === "stopped";

  btnPlay.disabled = speaking || paused;
  btnPause.disabled = !speaking;
  btnResume.disabled = !paused;
  btnStop.disabled = idle;
}

/* ── Speech ── */
function speak() {
  const text = textInput.value.trim();
  if (!text) {
    showToast(
      "error",
      "ri-error-warning-line",
      "Nothing to speak. Type some text first.",
    );
    return;
  }

  window.speechSynthesis.cancel(); // prevent overlap

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.voice = voices[voiceSelect.value] || null;
  currentUtterance.rate = parseFloat(rateRange.value);
  currentUtterance.pitch = parseFloat(pitchRange.value);
  currentUtterance.volume = parseFloat(volumeRange.value);

  currentUtterance.onstart = () => setStatus("speaking");
  currentUtterance.onpause = () => setStatus("paused");
  currentUtterance.onresume = () => setStatus("speaking");
  currentUtterance.onend = () => setStatus("idle");
  currentUtterance.onerror = () => setStatus("idle");

  window.speechSynthesis.speak(currentUtterance);
}

function pause() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    setStatus("paused");
  }
}

function resume() {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    setStatus("speaking");
  }
}

function stop() {
  window.speechSynthesis.cancel();
  setStatus("stopped");
  setTimeout(() => setStatus("idle"), 1200);
}

/* ── Button events ── */
btnPlay.addEventListener("click", speak);
btnPause.addEventListener("click", pause);
btnResume.addEventListener("click", resume);
btnStop.addEventListener("click", stop);

/* ── Copy ── */
btnCopy.addEventListener("click", async () => {
  const t = textInput.value.trim();
  if (!t) {
    showToast("error", "ri-error-warning-line", "Nothing to copy.");
    return;
  }
  try {
    await navigator.clipboard.writeText(t);
    showToast(
      "success",
      "ri-clipboard-check-line",
      "Text copied to clipboard!",
    );
  } catch {
    showToast("error", "ri-error-warning-line", "Copy failed. Try manually.");
  }
});

/* ── Download ── */
btnDownload.addEventListener("click", () => {
  const t = textInput.value.trim();
  if (!t) {
    showToast("error", "ri-error-warning-line", "Nothing to download.");
    return;
  }
  const blob = new Blob([t], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "voicecraft-text.txt";
  a.click();
  URL.revokeObjectURL(url);
  showToast("success", "ri-download-2-line", "File downloaded!");
});

/* ── Sample ── */
btnSample.addEventListener("click", () => {
  textInput.value = SAMPLE_TEXT;
  updateStats();
  showToast("info", "ri-magic-line", "Sample text loaded.");
});

/* ── Clear ── */
btnClear.addEventListener("click", () => {
  if (!textInput.value.trim()) return;
  stop();
  textInput.value = "";
  updateStats();
  showToast("info", "ri-delete-bin-line", "Text cleared.");
});

/* ── Sliders ── */
/* ── Rate ── */
rateRange.addEventListener("input", () => {
  const rate = parseFloat(rateRange.value);

  let label = "";

  if (rate < 0.9) {
    label = "Slow";
  } else if (rate <= 1.1) {
    label = "Normal";
  } else {
    label = "Fast";
  }

  rateVal.textContent = `${rate.toFixed(1)} ${label}`;
});

/* ── Pitch ── */
pitchRange.addEventListener("input", () => {
  const pitch = parseFloat(pitchRange.value);

  let label = "";

  if (pitch < 0.9) {
    label = "Low";
  } else if (pitch <= 1.1) {
    label = "Normal";
  } else {
    label = "High";
  }

  pitchVal.textContent = `${pitch.toFixed(1)} ${label}`;
});

/* ── Volume ── */
volumeRange.addEventListener("input", () => {
  const volume = parseFloat(volumeRange.value);

  let label = "";

  if (volume < 0.4) {
    label = "Low";
  } else if (volume < 0.8) {
    label = "Medium";
  } else {
    label = "High";
  }

  volumeVal.textContent = `${volume.toFixed(1)} ${label}`;
});
/* ── Stats ── */
function updateStats() {
  const text = textInput.value;
  const len = text.length;
  charCount.textContent = `${len} / 5000`;
  charCount.classList.toggle("warn", len > 4500);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCountEl.textContent = `${words} word${words !== 1 ? "s" : ""}`;

  const mins = Math.max(1, Math.ceil(words / 200));
  readTimeEl.textContent = words > 0 ? `~${mins} min read` : "~0 min read";
}
textInput.addEventListener("input", updateStats);

/* ── Toast ── */
let toastTimer;
function showToast(type, icon, msg) {
  toast.className = `${type}`;
  toast.querySelector("i").className = `ri ${icon}`;
  toastMsg.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

/* ── Theme ── */
themeToggle.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "light" : "dark",
  );
  themeIcon.className = isDark ? "ri-sun-line" : "ri-moon-line";
});

/* ── Keyboard shortcut: Space to pause/resume while playing ── */
document.addEventListener("keydown", (e) => {
  if (e.target === textInput) return;
  if (e.code === "Space") {
    e.preventDefault();
    if (state === "speaking") pause();
    else if (state === "paused") resume();
  }
  if (e.code === "Escape") stop();
});

updateStats();
updateButtons();
