/* deck-edit-mode: in-browser edit mode for static HTML decks. Vanilla JS, no dependencies. */
(function () {
  if (window.__demInitialized) return;
  window.__demInitialized = true;

  var EDITABLE_SELECTOR = "h1,h2,h3,h4,h5,h6,p,span,li,blockquote,a,figcaption,td,th";
  var DRAGGABLE_SELECTOR = ".slide,[data-slide],section";

  function isLeafText(el) {
    if (!el.textContent || !el.textContent.trim()) return false;
    for (var i = 0; i < el.children.length; i++) {
      var child = el.children[i];
      if (child.textContent && child.textContent.trim()) return false;
    }
    return true;
  }

  function markEditableTargets(root) {
    var nodes = root.querySelectorAll(EDITABLE_SELECTOR);
    nodes.forEach(function (el) {
      if (el.closest("#dem-toolbar")) return;
      if (isLeafText(el)) el.setAttribute("data-dem-editable", "true");
    });
  }

  function markDraggableTargets(root) {
    var nodes = root.querySelectorAll(DRAGGABLE_SELECTOR);
    nodes.forEach(function (el) {
      if (el.closest("#dem-toolbar")) return;
      el.setAttribute("data-dem-draggable", "true");
    });
  }

  function addDragHandle(el) {
    if (el.querySelector(":scope > .dem-drag-handle")) return;
    var handle = document.createElement("div");
    handle.className = "dem-drag-handle";
    handle.title = "Drag to move";
    handle.textContent = "✥";
    handle.addEventListener("mousedown", function (e) {
      startDrag(e, el);
    });
    el.appendChild(handle);
  }

  function removeDragHandles(root) {
    root.querySelectorAll(".dem-drag-handle").forEach(function (h) {
      h.remove();
    });
  }

  var dragState = null;

  function startDrag(e, el) {
    e.preventDefault();
    e.stopPropagation();
    var rect = el.getBoundingClientRect();
    var style = window.getComputedStyle(el);
    var matrix = new DOMMatrixReadOnly(style.transform === "none" ? "" : style.transform);
    dragState = {
      el: el,
      startX: e.clientX,
      startY: e.clientY,
      originX: matrix.m41,
      originY: matrix.m42,
    };
    el.setAttribute("data-dem-dragging", "true");
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }

  function onDragMove(e) {
    if (!dragState) return;
    var dx = e.clientX - dragState.startX;
    var dy = e.clientY - dragState.startY;
    var x = dragState.originX + dx;
    var y = dragState.originY + dy;
    dragState.el.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  function onDragEnd() {
    if (dragState) dragState.el.removeAttribute("data-dem-dragging");
    dragState = null;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
  }

  function setEditMode(active) {
    document.body.classList.toggle("dem-edit-active", active);
    var toggleBtn = document.getElementById("dem-toggle");
    if (toggleBtn) toggleBtn.setAttribute("data-active", String(active));

    document.querySelectorAll("[data-dem-editable]").forEach(function (el) {
      el.setAttribute("contenteditable", active ? "true" : "false");
    });

    document.querySelectorAll("[data-dem-draggable]").forEach(function (el) {
      if (active) addDragHandle(el);
    });
    if (!active) removeDragHandles(document);
  }

  function exportDeck() {
    var clone = document.documentElement.cloneNode(true);
    var toolbar = clone.querySelector("#dem-toolbar");
    if (toolbar) toolbar.remove();
    clone.querySelectorAll(".dem-drag-handle").forEach(function (h) {
      h.remove();
    });
    clone.querySelectorAll("[data-dem-editable]").forEach(function (el) {
      el.removeAttribute("contenteditable");
    });
    clone.querySelectorAll("[data-dem-dragging]").forEach(function (el) {
      el.removeAttribute("data-dem-dragging");
    });
    var cloneBody = clone.querySelector("body");
    if (cloneBody) cloneBody.classList.remove("dem-edit-active");

    var html = "<!DOCTYPE html>\n" + clone.outerHTML;
    var blob = new Blob([html], { type: "text/html" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = (document.title || "deck") + ".edited.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function buildToolbar() {
    var bar = document.createElement("div");
    bar.id = "dem-toolbar";

    var toggleBtn = document.createElement("button");
    toggleBtn.id = "dem-toggle";
    toggleBtn.type = "button";
    toggleBtn.textContent = "Edit Mode";
    toggleBtn.setAttribute("data-active", "false");
    toggleBtn.addEventListener("click", function () {
      setEditMode(!document.body.classList.contains("dem-edit-active"));
    });

    var saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save / Export";
    saveBtn.addEventListener("click", exportDeck);

    var hint = document.createElement("span");
    hint.className = "dem-hint";
    hint.textContent = "press E to toggle";

    bar.appendChild(toggleBtn);
    bar.appendChild(saveBtn);
    bar.appendChild(hint);
    document.body.appendChild(bar);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "e" && e.key !== "E") return;
    var target = e.target;
    var isTyping =
      target &&
      (target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA");
    if (isTyping) return;
    setEditMode(!document.body.classList.contains("dem-edit-active"));
  });

  function init() {
    markEditableTargets(document);
    markDraggableTargets(document);
    buildToolbar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
