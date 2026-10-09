/**
 * recorder.js – Direkte Aufnahme im Browser + Dateiupload
 */

(function () {
  "use strict";

  // ── State ──────────────────────────────────────────────────────────────
  let mediaRecorder = null;
  let audioChunks   = [];
  let timerInterval = null;
  let elapsed       = 0;          // Sekunden seit Aufnahmestart
  let maxDuration   = 90 * 60;    // Standard: 90 Minuten
  let animFrameId   = null;
  let analyserNode  = null;
  let dataArray     = null;
  let wakeLock      = null;

  // ── FAB-Menü ───────────────────────────────────────────────────────────
  const fab     = document.getElementById("fab-main");
  const fabMenu = document.getElementById("fab-options");

  function toggleFabMenu() {
    const open = fabMenu.style.display !== "none" && fabMenu.style.display !== "";
    fabMenu.style.display = open ? "none" : "flex";
  }

  fab?.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording();
    } else {
      toggleFabMenu();
    }
  });

  // Menü schließen bei Klick außerhalb
  document.addEventListener("click", e => {
    if (!fab?.contains(e.target) && !fabMenu?.contains(e.target)) {
      fabMenu && (fabMenu.style.display = "none");
    }
  });

  // ── Direkt aufnehmen ───────────────────────────────────────────────────
  document.getElementById("btn-record")?.addEventListener("click", () => {
    fabMenu.style.display = "none";
    openRecordModal();
  });

  // ── Datei hochladen ────────────────────────────────────────────────────
  document.getElementById("btn-upload")?.addEventListener("click", () => {
    fabMenu.style.display = "none";
    openUploadModal();
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  AUFNAHME-MODAL
  // ═══════════════════════════════════════════════════════════════════════

  function openRecordModal() {
    document.getElementById("record-modal").classList.remove("hidden");
    resetRecordUI();
  }
  function closeRecordModal() {
    document.getElementById("record-modal").classList.add("hidden");
    if (mediaRecorder && mediaRecorder.state !== "inactive") stopRecording(true);
  }
  document.getElementById("record-modal-close")?.addEventListener("click", closeRecordModal);
  document.getElementById("record-modal")?.addEventListener("click", function(e) {
    if (e.target === this) closeRecordModal();
  });

  function resetRecordUI() {
    elapsed = 0;
    updateTimerDisplay();
    setRecordingState(false);
    document.getElementById("rec-stop-btn")?.classList.add("hidden");
    document.getElementById("rec-start-btn")?.classList.remove("hidden");
    renderBars(new Uint8Array(12).fill(20));
  }

  // Aufnahme starten
  document.getElementById("rec-start-btn")?.addEventListener("click", startRecording);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

      // Audio-Analyse für Visualizer
      const ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      analyserNode = ctx.createAnalyser();
      analyserNode.fftSize = 64;
      src.connect(analyserNode);
      dataArray = new Uint8Array(analyserNode.frequencyBinCount);

      // Max-Dauer aus Eingabe lesen
      const mins = parseInt(document.getElementById("rec-max-duration")?.value || "90", 10);
      maxDuration = (isNaN(mins) || mins < 1 ? 90 : Math.min(mins, 180)) * 60;

      // MediaRecorder
      const mimeType = getSupportedMime();
      mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      audioChunks = [];
      mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        saveRecording();
      };
      mediaRecorder.start(1000); // Chunks alle 1s

      // Timer
      elapsed = 0;
      timerInterval = setInterval(() => {
        elapsed++;
        updateTimerDisplay();
        if (elapsed >= maxDuration) stopRecording();
      }, 1000);

      // Visualizer
      animFrameId = requestAnimationFrame(drawVisualizer);

      // Screen Wake Lock (hält Bildschirm an, wenn gewünscht)
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch (_) {}

      setRecordingState(true);
      document.getElementById("rec-start-btn")?.classList.add("hidden");
      document.getElementById("rec-stop-btn")?.classList.remove("hidden");

    } catch (err) {
      showToast("Mikrofon-Zugriff verweigert: " + err.message, "error");
    }
  }

  document.getElementById("rec-stop-btn")?.addEventListener("click", () => stopRecording());

  function stopRecording(discard = false) {
    clearInterval(timerInterval);
    cancelAnimationFrame(animFrameId);
    wakeLock?.release();
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      if (discard) {
        audioChunks = [];
        mediaRecorder.onstop = null;
      }
      mediaRecorder.stop();
    }
    setRecordingState(false);
  }

  async function saveRecording() {
    if (audioChunks.length === 0) return;
    const mimeType = mediaRecorder?.mimeType || "audio/webm";
    const blob = new Blob(audioChunks, { type: mimeType });
    const ext  = mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : "webm";

    const title     = document.getElementById("rec-title")?.value.trim() || "Aufnahme";
    const subjectId = document.getElementById("rec-subject")?.value || "";

    const fd = new FormData();
    fd.append("file", blob, `aufnahme.${ext}`);
    fd.append("title", title);
    fd.append("subject_id", subjectId);
    fd.append("recorded_at", new Date().toISOString());

    try {
      const res = await fetch("/api/recordings/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      showToast("Aufnahme gespeichert! ✓", "success");
      closeRecordModal();
      window.CalendarApp?.reload();
    } catch (e) {
      showToast("Fehler beim Speichern: " + e.message, "error");
    }
  }

  // ── Visualizer ─────────────────────────────────────────────────────────
  function drawVisualizer() {
    if (!analyserNode) return;
    analyserNode.getByteFrequencyData(dataArray);
    renderBars(dataArray);
    animFrameId = requestAnimationFrame(drawVisualizer);
  }

  function renderBars(data) {
    const container = document.getElementById("rec-visualizer");
    if (!container) return;
    const bars = container.querySelectorAll(".rec-bar");
    const step = Math.floor(data.length / bars.length);
    bars.forEach((bar, i) => {
      const val = data[i * step] || 10;
      bar.style.height = Math.max(4, (val / 255) * 40) + "px";
    });
  }

  // ── Timer-Anzeige ──────────────────────────────────────────────────────
  function updateTimerDisplay() {
    const remaining = Math.max(0, maxDuration - elapsed);
    const h = Math.floor(remaining / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    const display = h > 0
      ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
      : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    const el = document.getElementById("rec-timer");
    if (el) el.textContent = display;
  }

  function setRecordingState(recording) {
    fab?.classList.toggle("recording", recording);
    const icon = document.getElementById("fab-icon");
    if (icon) icon.textContent = recording ? "■" : "+";
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  UPLOAD-MODAL (Datei hochladen)
  // ═══════════════════════════════════════════════════════════════════════

  function openUploadModal() {
    document.getElementById("upload-modal").classList.remove("hidden");
    document.getElementById("upload-form")?.reset();
    document.getElementById("upload-filename").textContent = "";
  }
  function closeUploadModal() {
    document.getElementById("upload-modal").classList.add("hidden");
  }
  document.getElementById("upload-modal-close")?.addEventListener("click", closeUploadModal);
  document.getElementById("upload-modal")?.addEventListener("click", function(e) {
    if (e.target === this) closeUploadModal();
  });

  // Drag & Drop
  const uploadZone = document.getElementById("upload-zone");
  uploadZone?.addEventListener("dragover",  e => { e.preventDefault(); uploadZone.classList.add("drag-over"); });
  uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("drag-over"));
  uploadZone?.addEventListener("drop", e => {
    e.preventDefault();
    uploadZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) setUploadFile(file);
  });
  uploadZone?.addEventListener("click", () => document.getElementById("upload-file-input")?.click());

  document.getElementById("upload-file-input")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) setUploadFile(file);
  });

  let selectedFile = null;
  function setUploadFile(file) {
    selectedFile = file;
    document.getElementById("upload-filename").textContent = `📎 ${file.name} (${(file.size / 1e6).toFixed(1)} MB)`;
    // Titel vorausfüllen (Dateiname ohne Endung)
    const titleEl = document.getElementById("upload-title");
    if (titleEl && !titleEl.value) {
      titleEl.value = file.name.replace(/\.[^/.]+$/, "");
    }
  }

  document.getElementById("upload-submit")?.addEventListener("click", async () => {
    if (!selectedFile) { showToast("Bitte erst eine Datei auswählen.", "error"); return; }
    const title     = document.getElementById("upload-title")?.value.trim() || selectedFile.name;
    const subjectId = document.getElementById("upload-subject")?.value || "";
    const dateVal   = document.getElementById("upload-date")?.value || "";

    const fd = new FormData();
    fd.append("file", selectedFile, selectedFile.name);
    fd.append("title", title);
    fd.append("subject_id", subjectId);
    fd.append("recorded_at", dateVal ? new Date(dateVal).toISOString() : new Date().toISOString());

    const btn = document.getElementById("upload-submit");
    btn.textContent = "Lädt hoch…";
    btn.disabled = true;

    try {
      const res = await fetch("/api/recordings/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      showToast("Datei hochgeladen! ✓", "success");
      closeUploadModal();
      window.CalendarApp?.reload();
    } catch (e) {
      showToast("Fehler: " + e.message, "error");
    } finally {
      btn.textContent = "Hochladen";
      btn.disabled = false;
    }
  });

  // ── Hilfsfunktionen ────────────────────────────────────────────────────
  function getSupportedMime() {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
    return types.find(t => MediaRecorder.isTypeSupported(t)) || "";
  }

  window.showToast = function(msg, type = "") {
    const container = document.getElementById("toast-container");
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  window.playAudio = function(id, title) {
    const modal  = document.getElementById("player-modal");
    const player = document.getElementById("audio-player");
    const lbl    = document.getElementById("player-title");
    if (!modal || !player) return;
    lbl.textContent = title;
    player.src = `/api/recordings/${id}/audio`;
    player.play();
    modal.classList.remove("hidden");
  };

  document.getElementById("player-modal-close")?.addEventListener("click", () => {
    document.getElementById("player-modal").classList.add("hidden");
    document.getElementById("audio-player").pause();
  });

})();
