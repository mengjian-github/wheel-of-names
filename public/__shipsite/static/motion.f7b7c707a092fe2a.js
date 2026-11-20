(function () {
  "use strict";
  if (window.__shipsiteMotion) return;
  window.__shipsiteMotion = true;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Authored CSS keys its own resting state on .revealed
  // ([data-motion="scroll-reveal"]:not(.revealed) { opacity: 0 }), but the
  // class only came from the no-view() fallback, so in Chrome Key Finder's
  // example answer card stayed transparent on the first screen forever
  // (2026-11-10). Every scroll-reveal element now gets .revealed as it is
  // seen, in every browser, and at once under reduced motion or without an
  // observer.
  function revealAll() {
    var nodes = document.querySelectorAll('[data-motion="scroll-reveal"]');
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.add("revealed");
  }
  if (reduced || !("IntersectionObserver" in window)) {
    revealAll();
    window.addEventListener("load", revealAll);
    return;
  }

  var timelineSupported = false;
  try {
    timelineSupported = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");
  } catch (e) { timelineSupported = false; }

  var revealed = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add("revealed");
      revealed.unobserve(entries[i].target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

  // Seen at threshold 0, so a card taller than the screen or one only partly
  // in the first view still counts.
  var seen = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add("revealed");
      seen.unobserve(entries[i].target);
    }
  }, { threshold: 0 });
  function armSeen(scope) {
    var nodes = (scope || document).querySelectorAll('[data-motion="scroll-reveal"]:not(.revealed)');
    for (var i = 0; i < nodes.length; i++) seen.observe(nodes[i]);
  }

  var revealEngaged = false;
  function armFallback(scope) {
    if (timelineSupported) return;
    var nodes = (scope || document).querySelectorAll('[data-motion="scroll-reveal"]:not(.revealed):not(.motion-armed)');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var box = node.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.92 && box.bottom > 0) {
        node.classList.add("revealed");
        continue;
      }
      node.classList.add("motion-armed");
      revealed.observe(node);
    }
  }
  function engageReveals() {
    if (revealEngaged) return;
    if ((window.scrollY || window.pageYOffset || 0) <= 0) return;
    revealEngaged = true;
    document.documentElement.classList.add("motion-scrolled");
    armFallback(document);
  }
  function armReveals(scope) {
    if (!revealEngaged) return;
    armFallback(scope);
  }
  window.addEventListener("scroll", engageReveals, { passive: true });
  engageReveals();

  function armStagger(scope) {
    var nodes = (scope || document).querySelectorAll('[data-motion="stagger-reveal"]:not(.stagger-armed)');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      var box = node.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9) continue;
      node.classList.add("stagger-armed");
      revealed.observe(node);
    }
  }

  function rollCount(node) {
    if (node.__counted) return;
    node.__counted = true;
    var targets = node.classList.contains("status-count")
      ? [node]
      : node.querySelectorAll(".status-count");
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i];
      var final = parseFloat(String(el.textContent).replace(/[^0-9.]/g, ""));
      if (!isFinite(final) || final <= 0) continue;
      var start = null;
      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min((ts - start) / 900, 1);
        el.textContent = String(Math.round(final * (1 - Math.pow(1 - t, 3))));
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  }

  var counted = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].isIntersecting) { rollCount(entries[i].target); counted.unobserve(entries[i].target); }
    }
  }, { threshold: 0.4 });

  function armCounts(scope) {
    var nodes = (scope || document).querySelectorAll('[data-motion="count-up"]');
    for (var i = 0; i < nodes.length; i++) counted.observe(nodes[i]);
  }

  // tilt-glare: pointer position → CSS variables. Fine pointers only; the
  // CSS springs the card back when .tilting drops on leave.
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  function armTilts(scope) {
    if (!finePointer) return;
    var nodes = (scope || document).querySelectorAll('[data-motion="tilt-glare"]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.__tilt) continue;
      node.__tilt = true;
      node.addEventListener("pointermove", function (event) {
        var el = event.currentTarget;
        var box = el.getBoundingClientRect();
        var x = (event.clientX - box.left) / Math.max(box.width, 1);
        var y = (event.clientY - box.top) / Math.max(box.height, 1);
        el.style.setProperty("--tilt-x", ((x - 0.5) * 12).toFixed(2) + "deg");
        el.style.setProperty("--tilt-y", ((0.5 - y) * 12).toFixed(2) + "deg");
        el.style.setProperty("--glare-x", Math.round(x * 100) + "%");
        el.style.setProperty("--glare-y", Math.round(y * 100) + "%");
        el.classList.add("tilting");
      });
      node.addEventListener("pointerleave", function (event) {
        var el = event.currentTarget;
        el.classList.remove("tilting");
        el.style.setProperty("--tilt-x", "0deg");
        el.style.setProperty("--tilt-y", "0deg");
      });
    }
  }

  // value-tick: the text is already the new value; replay the roll class.
  function armTicks(scope) {
    if (!("MutationObserver" in window)) return;
    var nodes = (scope || document).querySelectorAll('[data-motion="value-tick"]');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.__tick) continue;
      node.__tick = true;
      new MutationObserver(function (records) {
        var el = records[0].target.nodeType === 1 ? records[0].target : records[0].target.parentElement;
        while (el && el.getAttribute && el.getAttribute("data-motion") !== "value-tick") el = el.parentElement;
        if (!el) return;
        el.classList.remove("ticked");
        void el.offsetWidth;
        el.classList.add("ticked");
      }).observe(node, { childList: true, characterData: true, subtree: true });
    }
  }

  // Every tool's answer settles in when it changes, whether or not the
  // authored page set value-tick on it: a silent swap reads as nothing
  // happened. The Web Animations API touches no attribute or text node React
  // renders, so React keeps owning the output.
  var settled = "MutationObserver" in window ? new MutationObserver(function (records) {
    var seen = [];
    for (var i = 0; i < records.length; i++) {
      var node = records[i].target.nodeType === 1 ? records[i].target : records[i].target.parentElement;
      var out = node && node.closest ? node.closest("[data-tool-output]") : null;
      if (!out || seen.indexOf(out) >= 0 || !out.animate) continue;
      seen.push(out);
      if (out.querySelector('[data-motion="value-tick"]') || out.getAttribute("data-motion") === "value-tick") continue;
      out.animate([{ opacity: 0.35, transform: "translateY(4px)" }, { opacity: 1, transform: "none" }], { duration: 240, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    }
  }) : null;
  function armOutputs(scope) {
    if (!settled) return;
    var nodes = (scope || document).querySelectorAll("[data-tool-output]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].__settle) continue;
      nodes[i].__settle = true;
      settled.observe(nodes[i], { childList: true, characterData: true, subtree: true });
    }
  }

  // line-reveal / draw-on: arm only what is below the first screen, so the
  // first frame never hides; draw-on measures each stroke for its dash.
  // Own observer at threshold 0: an armed heading is clipped to a 1% sliver,
  // and a ratio threshold never fires on a clipped target (the heading stayed
  // hidden in the first browser check).
  var drawn = new IntersectionObserver(function (entries) {
    for (var i = 0; i < entries.length; i++) {
      if (!entries[i].isIntersecting) continue;
      entries[i].target.classList.add("revealed");
      drawn.unobserve(entries[i].target);
    }
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
  function armDrawn(scope) {
    var nodes = (scope || document).querySelectorAll('[data-motion="line-reveal"]:not(.motion-armed), [data-motion="draw-on"]:not(.motion-armed)');
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.getBoundingClientRect().top < window.innerHeight * 0.9) continue;
      if (node.getAttribute("data-motion") === "draw-on") {
        var strokes = node.querySelectorAll("path, line, polyline, polygon, rect, circle, ellipse");
        for (var j = 0; j < strokes.length; j++) {
          var length = 0;
          try { length = strokes[j].getTotalLength ? strokes[j].getTotalLength() : 0; } catch (e) { length = 0; }
          if (length > 0) strokes[j].style.setProperty("--draw-len", String(Math.ceil(length)));
        }
      }
      node.classList.add("motion-armed");
      drawn.observe(node);
    }
  }

  // flip-list: when a sorted or filtered list reorders, every surviving item
  // glides from where it was to where it is (GSAP Flip's First-Last-Invert-
  // Play, without the library). React moves the same keyed nodes, so the
  // runtime keeps each child's offset inside its container and, the moment a
  // mutation lands, animates the difference with Web Animations — no attribute
  // or text write, so React keeps owning the list. New items fade in.
  var flipPositions = typeof WeakMap === "function" ? new WeakMap() : null;
  function measureFlip(list) {
    var base = list.getBoundingClientRect();
    for (var i = 0; i < list.children.length; i++) {
      var box = list.children[i].getBoundingClientRect();
      flipPositions.set(list.children[i], { x: box.left - base.left, y: box.top - base.top });
    }
  }
  function playFlip(list) {
    var base = list.getBoundingClientRect();
    for (var i = 0; i < list.children.length; i++) {
      var child = list.children[i];
      if (!child.animate) continue;
      var box = child.getBoundingClientRect();
      var before = flipPositions.get(child);
      if (!before) {
        child.animate([{ opacity: 0, transform: "scale(0.97)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        continue;
      }
      var dx = before.x - (box.left - base.left);
      var dy = before.y - (box.top - base.top);
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      child.animate([{ transform: "translate(" + dx + "px, " + dy + "px)" }, { transform: "none" }], { duration: 360, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
    }
    measureFlip(list);
  }
  function armFlips(scope) {
    if (!flipPositions || !("MutationObserver" in window)) return;
    var nodes = (scope || document).querySelectorAll('[data-motion="flip-list"]');
    for (var i = 0; i < nodes.length; i++) {
      var list = nodes[i];
      if (list.__flip) continue;
      list.__flip = true;
      measureFlip(list);
      new MutationObserver(function (records) { playFlip(records[0].target); }).observe(list, { childList: true });
    }
  }
  var flipResize = null;
  window.addEventListener("resize", function () {
    clearTimeout(flipResize);
    flipResize = setTimeout(function () {
      var lists = document.querySelectorAll('[data-motion="flip-list"]');
      for (var i = 0; i < lists.length; i++) if (lists[i].__flip) measureFlip(lists[i]);
    }, 150);
  });

  // step-track: scroll storytelling without pinning. The step crossing the
  // middle of the screen is marked active and the track beside the list fills
  // to it (ScrollTrigger scrub's feel). No step is ever dimmed: every step
  // stays at full contrast, the active one only gains an accent rule.
  function armSteps(scope) {
    var nodes = (scope || document).querySelectorAll('[data-motion="step-track"]:not(.steps-armed)');
    for (var i = 0; i < nodes.length; i++) {
      var track = nodes[i];
      track.classList.add("steps-armed");
      var steps = track.querySelectorAll(":scope > li, :scope > [data-step]");
      if (!steps.length) continue;
      (function (track, steps) {
        var watcher = new IntersectionObserver(function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (!entries[k].isIntersecting) continue;
            var index = Array.prototype.indexOf.call(steps, entries[k].target);
            for (var s = 0; s < steps.length; s++) steps[s].classList.toggle("step-active", s === index);
            track.style.setProperty("--step-progress", String((index + 1) / steps.length));
          }
        }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
        for (var s = 0; s < steps.length; s++) watcher.observe(steps[s]);
      })(track, steps);
    }
  }

  function arm(scope) { armSeen(scope); armReveals(scope); armStagger(scope); armCounts(scope); armTilts(scope); armTicks(scope); armOutputs(scope); armDrawn(scope); armFlips(scope); armSteps(scope); }
  arm(document);

  // Preview/runtime surfaces that swap DOM after load (tool shells, accordions)
  // get one late pass instead of a MutationObserver tax on every page.
  window.addEventListener("load", function () { arm(document); });
})();