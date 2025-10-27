// script.js - fills placeholders, countdown, gallery, music toggle, scroll animations

// wait until DOM ready
document.addEventListener("DOMContentLoaded", () => {
  // SAFELY read config; fallback to empty object to avoid errors
  const cfg = window.debutConfig || {};

  // Fill simple text placeholders
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el && text !== undefined && text !== null) el.textContent = text;
  };

  setText("debutName", cfg.name || "The Debutante");
  setText("heroDate", formatReadableDate(cfg.date, cfg.time));
  setText("eventDate", formatReadableDate(cfg.date, cfg.time));
  setText("eventTime", formatTime(cfg.time));
  setText("eventVenue", cfg.venue || "TBA");
  setText("eventAttire", cfg.attire || "TBA");
  setText("debutMessage", cfg.message || "");
  setText("signatureName", cfg.name || "");
  setText("eventHashtag", cfg.hashtag ? `#${cfg.hashtag}` : "");

  // ScrollDown button behaviour + autoplay music + update icon
  const scrollBtn = document.getElementById("scrollDown");
  const audio = document.getElementById("bgMusic");
  const musicToggle = document.getElementById("musicToggle");

  if (scrollBtn) {
    scrollBtn.addEventListener("click", () => {
      // Smooth scroll
      const el = document.getElementById("countdown");
      if (el) el.scrollIntoView({ behavior: "smooth" });

      // Try to play music (autoplay allowed because of user gesture)
      if (audio) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("🎵 Music started automatically after scroll");
              // Update icon to "playing"
              if (musicToggle) musicToggle.textContent = "🔊";
            })
            .catch(err => console.warn("Autoplay blocked:", err));
        }
      }
    });
  }


  // GALLERY: render images
  const galleryContainer = document.getElementById("galleryContainer");
  if (galleryContainer) {
    const imgs = (cfg.gallery && cfg.gallery.length) ? cfg.gallery : [];
    if (imgs.length === 0) {
      const p = document.createElement("p");
      p.textContent = "Gallery coming soon.";
      p.style.opacity = "0.8";
      galleryContainer.appendChild(p);
    } else {
      imgs.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.alt = cfg.name ? `${cfg.name} - gallery` : "gallery image";
        galleryContainer.appendChild(img);
      });

      // Add fade-in animation when scrolling into view
      const obs = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      }, { threshold: 0.2 });

      document.querySelectorAll("#galleryContainer img").forEach(el => obs.observe(el));
    }
  }

  // --- LIGHTBOX FEATURE with navigation ---
  const lightboxOverlay = document.getElementById("lightboxOverlay");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.getElementById("lightboxClose");
  const btnPrev = document.getElementById("lightboxPrev");
  const btnNext = document.getElementById("lightboxNext");

  if (galleryContainer && lightboxOverlay && lightboxImage) {
    const galleryImages = Array.from(galleryContainer.querySelectorAll("img"));
    let currentIndex = 0;

    // Open lightbox
    galleryContainer.addEventListener("click", (e) => {
      if (e.target.tagName === "IMG") {
        currentIndex = galleryImages.indexOf(e.target);
        showImage(currentIndex);
        lightboxOverlay.classList.add("active");
      }
    });

    // Close lightbox
    lightboxClose.addEventListener("click", () => {
      lightboxOverlay.classList.remove("active");
    });

    // Navigate
    btnNext.addEventListener("click", () => changeImage(1));
    btnPrev.addEventListener("click", () => changeImage(-1));

    // Close when clicking outside image
    lightboxOverlay.addEventListener("click", (e) => {
      if (e.target === lightboxOverlay) {
        lightboxOverlay.classList.remove("active");
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!lightboxOverlay.classList.contains("active")) return;
      if (e.key === "ArrowRight") changeImage(1);
      if (e.key === "ArrowLeft") changeImage(-1);
      if (e.key === "Escape") lightboxOverlay.classList.remove("active");
    });

    function showImage(index) {
      if (index < 0) index = galleryImages.length - 1;
      if (index >= galleryImages.length) index = 0;
      currentIndex = index;
      lightboxImage.style.opacity = 0;
      setTimeout(() => {
        lightboxImage.src = galleryImages[currentIndex].src;
        lightboxImage.style.opacity = 1;
      }, 200);
    }

    function changeImage(direction) {
      showImage(currentIndex + direction);
    }
  }



  // COUNTDOWN
  setupCountdown(cfg.date, cfg.time);

  // MUSIC: configure audio + toggle
  // const audio = document.getElementById("bgMusic");
  const musicSrc = document.getElementById("musicSource");
  // const musicToggle = document.getElementById("musicToggle");

  if (musicSrc && cfg.music) {
    musicSrc.src = cfg.music;
    // reload audio element in case src changed
    if (audio) audio.load();
  }

  // Initially show muted icon; browsers often block autoplay so we start paused
  if (musicToggle && audio) {
    musicToggle.textContent = "🔇";
    let isPlaying = false;

    const updateButton = () => {
      musicToggle.textContent = isPlaying ? "🔊" : "🔇";
    };

    musicToggle.addEventListener("click", () => {
      if (!audio) return;
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
      } else {
        // Try to play (may fail if browser needs gesture)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            isPlaying = true;
            updateButton();
          }).catch(err => {
            // Autoplay blocked — still flip the icon to indicate attempt
            console.warn("Audio play blocked:", err);
            // show a temporary notice? For simplicity, just keep icon as is
            alert("Your browser blocked autoplay. Tap the 🔊 button again to allow audio.");
          });
        } else {
          // older browsers
          isPlaying = true;
          updateButton();
        }
      }
      updateButton();
    });
  } else if (musicToggle) {
    // if no audio source, hide toggle
    musicToggle.style.display = "none";
  }

  // SCROLL ANIMATIONS using IntersectionObserver
  const obsOptions = { threshold: 0.12 };
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, obsOptions);

  document.querySelectorAll("section, #galleryContainer img").forEach(el => obs.observe(el));

  /* --- Helper functions --- */
  function formatReadableDate(dateISO, timeStr) {
    if (!dateISO) return "";
    try {
      // create date using YYYY-MM-DD and time if provided
      const d = timeStr ? new Date(`${dateISO}T${timeStr}:00`) : new Date(dateISO);
      const opts = { year: "numeric", month: "long", day: "numeric" };
      return d.toLocaleDateString(undefined, opts); // uses user's locale
    } catch (e) {
      return dateISO;
    }
  }

  function formatTime(timeStr) {
    if (!timeStr) return "";
    try {
      // parse HH:MM and format to locale time
      const [hh, mm] = timeStr.split(":").map(Number);
      const tmp = new Date();
      tmp.setHours(hh || 0, mm || 0, 0, 0);
      return tmp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch (e) {
      return timeStr;
    }
  }

  function setupCountdown(dateISO, timeStr) {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minsEl = document.getElementById("minutes");
    const secsEl = document.getElementById("seconds");

    if (!dateISO) {
      if (daysEl) daysEl.textContent = "--";
      return;
    }
    // build target Date (use local timezone)
    const target = timeStr ? new Date(`${dateISO}T${timeStr}:00`) : new Date(`${dateISO}T00:00:00`);
    if (isNaN(target.getTime())) return;

    function tick() {
      const now = new Date();
      let diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * (1000 * 60 * 60 * 24);
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * (1000 * 60);
      const seconds = Math.floor(diff / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, "0");
    }

    tick(); // initial
    setInterval(tick, 1000);
  }

    // --- 18ths TABS ---
  const tabContent = document.getElementById("tabContent");
  const tabs = document.querySelectorAll(".tab");

  const all18ths = {
    roses: cfg.roses || [],
    candles: cfg.candles || [],
    treasures: cfg.treasures || [],
    bears: cfg.bears || [],
    gifts: cfg.gifts || [],
    chocolates: cfg.chocolates || [],
    bills: cfg.bills || [],
    shots: cfg.shots || []
  };

  function renderTab(tabName) {
    const list = all18ths[tabName] || [];
    if (!tabContent) return;

    tabContent.classList.remove("show"); // remove para reset transition

    setTimeout(() => {
      if (list.length === 0) {
        tabContent.innerHTML = `<p>No data yet for ${tabName}.</p>`;
      } else {
        tabContent.innerHTML = `<ul>${list.map(name => `<li>${name}</li>`).join("")}</ul>`;
      }
      tabContent.classList.add("show"); // trigger fade-in
    }, 100);
  }

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTab(btn.dataset.tab);
    });
  });

  renderTab("roses"); // default tab

  // RSVP button open Google Form link
  const rsvpBtn = document.getElementById("rsvpButton");
  if (rsvpBtn && cfg.rsvpLink) {
    rsvpBtn.addEventListener("click", () => {
      window.open(cfg.rsvpLink, "_blank");
    });
  }



});


