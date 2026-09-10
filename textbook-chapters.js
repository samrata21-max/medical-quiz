const BRADLEY_BOOK = "Bradley and Daroff’s Neurology in Clinical Practice";
const DEJONG_BOOK = "DeJong’s The Neurologic Examination";

const chapterStyle = document.createElement("style");
chapterStyle.textContent = ".chapterPicker{position:relative}.chapterDropdownToggle{width:100%;height:42px;border:1px solid var(--border);border-radius:10px;background:#fff;color:var(--soft);font:14px var(--sans);padding:0 12px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;text-align:left}.chapterDropdownToggle:hover{border-color:var(--accent)}.chapterDropdownToggle.open{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft)}.chapterDropdownLabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chapterDropdownLabel.hasSelection{color:var(--ink);font-weight:500}.chapterDropdownCaret{flex:0 0 auto;color:var(--soft);font-size:11px;transition:transform .15s ease}.chapterDropdownToggle.open .chapterDropdownCaret{transform:rotate(180deg)}.chapterDropdownPanel{position:absolute;left:0;right:0;top:calc(100% + 6px);z-index:20;background:#fff;border:1px solid var(--border);border-radius:10px;box-shadow:0 10px 26px rgba(16,25,51,.14);padding:8px}.chapterDropdownPanel[hidden]{display:none}.chapterSearch{width:100%;height:38px;border:1px solid var(--border);border-radius:10px;padding:0 10px;background:#fff;color:var(--ink);font:14px var(--sans);margin-bottom:8px}.chapterSearch:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}.chapterOptions{display:grid;gap:6px;max-height:320px;overflow:auto;padding:2px}.chapterOption{display:flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:10px;padding:10px 12px;background:#fff;color:var(--ink);text-align:left;font:13px var(--sans);cursor:pointer}.chapterOption:hover{border-color:var(--accent);background:var(--accent-soft)}.chapterOption.selected{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);font-weight:500}.chapterOption .chapterCheck{flex:0 0 14px;width:14px;text-align:center}.chapterSection{padding:10px 4px 4px;color:var(--accent);font:600 13px var(--serif)}.chapterEmpty{padding:16px;text-align:center;color:var(--soft);font-size:13px}";
document.head.appendChild(chapterStyle);

let closeOpenChapterDropdown = null;

function renderChapterPicker(chapters, withParts) {
    if (closeOpenChapterDropdown) closeOpenChapterDropdown();

    const picker = document.createElement("div");
    picker.className = "chapterPicker";
    picker.innerHTML = '<button type="button" class="chapterDropdownToggle" aria-haspopup="listbox" aria-expanded="false"><span class="chapterDropdownLabel">Select chapters</span><span class="chapterDropdownCaret">▾</span></button><div class="chapterDropdownPanel" hidden><input class="chapterSearch" type="search" placeholder="Search chapters" aria-label="Search chapters"><div class="chapterOptions" role="listbox" aria-multiselectable="true"></div></div>';
    chapterGrid.replaceChildren(picker);

    const toggle = picker.querySelector(".chapterDropdownToggle");
    const label = picker.querySelector(".chapterDropdownLabel");
    const panel = picker.querySelector(".chapterDropdownPanel");
    const search = picker.querySelector(".chapterSearch");
    const options = picker.querySelector(".chapterOptions");
    const chapterItems = chapters.filter(chapter => !withParts || chapter.indexOf("Part ") !== 0);
    const parts = withParts ? chapters.filter(chapter => chapter.indexOf("Part ") === 0) : [];

    // Only one chapter can be selected per section (per Part, or the whole book when it has no Parts).
    const chapterSection = {};
    if (withParts) {
        parts.forEach((part, partPos) => {
            const partIndex = chapters.indexOf(part);
            const nextPartIndex = partPos === parts.length - 1 ? Infinity : chapters.indexOf(parts[partPos + 1]);
            chapterItems.forEach(chapter => {
                const idx = chapters.indexOf(chapter);
                if (idx > partIndex && idx < nextPartIndex) chapterSection[chapter] = part;
            });
        });
    } else {
        chapterItems.forEach(chapter => { chapterSection[chapter] = "__all__"; });
    }

    function setChapterSelected(chapter, checked) {
        let input = chapterGrid.querySelector('input[data-chapter="' + CSS.escape(chapter) + '"]');
        if (checked) {
            if (!input) {
                input = document.createElement("input");
                input.type = "checkbox";
                input.hidden = true;
                input.dataset.chapter = chapter;
                chapterGrid.appendChild(input);
            }
            input.value = chapter;
            input.checked = true;
        } else if (input) {
            input.checked = false;
        }
        const button = options.querySelector('.chapterOption[data-chapter="' + CSS.escape(chapter) + '"]');
        if (button) {
            button.classList.toggle("selected", checked);
            button.setAttribute("aria-selected", String(checked));
            button.querySelector(".chapterCheck").textContent = checked ? "✓" : "";
        }
    }

    function openPanel() {
        panel.hidden = false;
        toggle.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        search.focus();
    }
    function closePanel() {
        panel.hidden = true;
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
    }
    closeOpenChapterDropdown = closePanel;

    toggle.addEventListener("click", () => {
        if (panel.hidden) openPanel(); else closePanel();
    });
    document.addEventListener("click", event => {
        if (!picker.contains(event.target)) closePanel();
    });
    picker.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closePanel();
            toggle.focus();
        }
    });

    function updateLabel() {
        const count = chapterGrid.querySelectorAll("input[data-chapter]:checked").length;
        label.textContent = count ? count + " chapter" + (count === 1 ? "" : "s") + " selected" : "Select chapters";
        label.classList.toggle("hasSelection", count > 0);
    }

    function renderOptions() {
        const query = search.value.trim().toLowerCase();
        options.innerHTML = "";
        parts.forEach(part => {
            const partIndex = chapters.indexOf(part);
            const partPos = parts.indexOf(part);
            const nextPartIndex = partPos === parts.length - 1 ? Infinity : chapters.indexOf(parts[partPos + 1]);
            const chaptersInPart = chapterItems.filter(chapter => {
                const idx = chapters.indexOf(chapter);
                return idx > partIndex && idx < nextPartIndex;
            });
            const partMatches = part.toLowerCase().includes(query);
            const matchingChapters = partMatches ? chaptersInPart : chaptersInPart.filter(chapter => chapter.toLowerCase().includes(query));
            if (!matchingChapters.length) return;
            const heading = document.createElement("div");
            heading.className = "chapterSection";
            heading.textContent = part;
            options.appendChild(heading);
            matchingChapters.forEach(addOption);
        });
        if (!withParts) chapterItems.filter(chapter => chapter.toLowerCase().includes(query)).forEach(addOption);
        if (!options.children.length) {
            const empty = document.createElement("div");
            empty.className = "chapterEmpty";
            empty.textContent = "No chapters found.";
            options.appendChild(empty);
        }
    }

    function addOption(chapter) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "chapterOption";
        button.setAttribute("role", "option");
        button.innerHTML = '<span class="chapterCheck"></span><span class="chapterLabel"></span>';
        button.querySelector(".chapterLabel").textContent = chapter;
        button.setAttribute("aria-selected", "false");
        button.dataset.chapter = chapter;
        button.addEventListener("click", () => {
            const checked = !button.classList.contains("selected");
            if (checked) {
                const section = chapterSection[chapter];
                chapterItems.forEach(other => {
                    if (other !== chapter && chapterSection[other] === section) setChapterSelected(other, false);
                });
            }
            setChapterSelected(chapter, checked);
            updateLabel();
            update();
        });
        const selected = chapterGrid.querySelector('input[data-chapter="' + CSS.escape(chapter) + '"]');
        if (selected?.checked) {
            button.classList.add("selected");
            button.setAttribute("aria-selected", "true");
            button.querySelector(".chapterCheck").textContent = "✓";
        }
        options.appendChild(button);
    }

    search.addEventListener("input", renderOptions);
    renderOptions();
    updateLabel();
    update();
}

function isChapterBook(bookName) {
    return bookName === BRADLEY_BOOK || bookName === DEJONG_BOOK;
}

function renderBradleyChapters() {
    if (bookSelect.value === BRADLEY_BOOK) {
        renderChapterPicker(bradleyChapters, true);
        return true;
    }
    if (bookSelect.value === DEJONG_BOOK) {
        renderChapterPicker(dejongChapters, false);
        return true;
    }
    renderChapterPicker([...new Set(facts.map(f => f.category))].sort(), false);
    return false;
}

bookSelect.addEventListener("change", renderBradleyChapters);

document.getElementById("startButton").addEventListener("click", () => {
    if (!isChapterBook(bookSelect.value)) return;
    const chosen = [...chapterGrid.querySelectorAll("input:checked")].map(input => input.value);
    if (!chosen.length) return;
    document.getElementById("factList").innerHTML = chosen.map(chapter =>
        '<article class="fact"><div class="factMeta">' + escapeHtml(bookSelect.value) + '</div><div class="factText">' + escapeHtml(chapter) + '</div></article>'
    ).join("");
});

renderBradleyChapters();
