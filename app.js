// ===== SUPABASE CONFIG =====
var SUPABASE_URL = "https://uktgfkilctwgmkdhoutl.supabase.co";
var SUPABASE_KEY = "sb_publishable_WvOlikgv9CHS7u_qeemflQ_3rAOOuaR";

// ===== APP =====
;(function() {
  "use strict";

  var PAGE_SIZE = 50;
  var LETTERS = "A B C D E F G H I J K L Ł M N O P Q R S T U V W X Y Z".split(" ");
  var FAV_KEY = "dinebizaad_favorites";
  var RECENT_KEY = "dinebizaad_recent";

  var D = [];
  var direction = "nav";
  var currentResults = [];
  var shownCount = 0;
  var browseResults = [];
  var browseShown = 0;
  var favorites = loadFavorites();

  var $input = document.getElementById("search-input");
  var $clearBtn = document.getElementById("clear-btn");
  var $resultsArea = document.getElementById("results-area");
  var $resultsList = document.getElementById("results-list");
  var $resultsCount = document.getElementById("results-count");
  var $loadMore = document.getElementById("load-more");
  var $alphaStrip = document.getElementById("alpha-strip");
  var $browseGrid = document.getElementById("browse-grid");
  var $browseResults = document.getElementById("browse-results");
  var $browseList = document.getElementById("browse-list");
  var $browseMore = document.getElementById("browse-more");
  var $browseHeading = document.getElementById("browse-letter-heading");
  var $favList = document.getElementById("fav-list");
  var $favEmpty = document.getElementById("fav-empty");
  var $featuredNav = document.getElementById("featured-navajo");
  var $featuredEng = document.getElementById("featured-english");
  var $featuredFav = document.getElementById("featured-fav");
  var $featuredCard = document.getElementById("featured-card");
  var $browseInline = document.querySelector(".browse-section-inline");
  var $infoCards = document.getElementById("info-cards");
  var $recentSearches = document.getElementById("recent-searches");
  var $recentList = document.getElementById("recent-list");

  // ===== LOAD DATA FROM SUPABASE =====
  function loadDictionary() {
    var allRows = [];
    var batchSize = 1000;

    function fetchBatch(from) {
      return fetch(
        SUPABASE_URL + "/rest/v1/words?select=navajo,english&order=navajo.asc&offset=" + from + "&limit=" + batchSize,
        { headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY } }
      )
      .then(function(res) {
        if (!res.ok) throw new Error("Failed to load dictionary: " + res.status);
        return res.json();
      })
      .then(function(rows) {
        allRows = allRows.concat(rows);
        if (rows.length === batchSize) {
          return fetchBatch(from + batchSize);
        }
        D = allRows.map(function(row) {
          return {
            n: row.navajo,
            e: row.english,
            sn: normalize(row.navajo),
            se: normalize(row.english)
          };
        });
      });
    }

    return fetchBatch(0);
  }

  // ===== NAVIGATION =====
  function navigate(section) {
    document.querySelectorAll(".section").forEach(function(s) { s.classList.remove("active"); });
    document.getElementById("section-" + section).classList.add("active");
    document.querySelectorAll("[data-nav]").forEach(function(el) {
      el.classList.toggle("active", el.dataset.nav === section);
    });
    if (section === "favorites") renderFavorites();
    if (section === "search") $input.focus();
  }

  document.querySelectorAll("[data-nav]").forEach(function(el) {
    el.addEventListener("click", function(e) {
      e.preventDefault();
      navigate(this.dataset.nav);
      var menu = document.getElementById("mobile-menu");
      if (menu) menu.classList.remove("open");
    });
  });

  var hamburger = document.getElementById("hamburger-btn");
  var mobileMenu = document.getElementById("mobile-menu");
  if (hamburger && mobileMenu) {
    hamburger.addEventListener("click", function() {
      mobileMenu.classList.toggle("open");
    });
    document.addEventListener("click", function(e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove("open");
      }
    });
  }

  // ===== SEARCH =====
  function normalize(str) {
    return str.toLowerCase()
      .replace(/ł/g, "l").replace(/Ł/g, "l")
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
  }

  function search(query) {
    var q = normalize(query);
    if (!q) return [];

    var words = q.split(/\s+/);
    var scored = [];

    for (var i = 0; i < D.length; i++) {
      var entry = D[i];
      var field = direction === "nav" ? entry.sn : entry.se;
      var score = 0;

      if (field === q) { score = 100; }
      else if (field.startsWith(q)) { score = 80; }
      else if (field.indexOf(" " + q) !== -1) { score = 60; }
      else if (field.indexOf(q) !== -1) { score = 40; }
      else {
        var allMatch = true;
        for (var w = 0; w < words.length; w++) {
          if (field.indexOf(words[w]) === -1) { allMatch = false; break; }
        }
        if (allMatch) score = 20;
      }

      if (score > 0) {
        scored.push({ idx: i, score: score });
      }
    }

    scored.sort(function(a, b) { return b.score - a.score || a.idx - b.idx; });
    return scored.map(function(s) { return s.idx; });
  }

  function highlightText(text, query) {
    if (!query) return escapeHtml(text);
    var q = normalize(query);
    var nText = normalize(text);
    var idx = nText.indexOf(q);
    if (idx === -1) return escapeHtml(text);
    var before = escapeHtml(text.substring(0, idx));
    var match = escapeHtml(text.substring(idx, idx + q.length));
    var after = escapeHtml(text.substring(idx + q.length));
    return before + "<mark>" + match + "</mark>" + after;
  }

  function escapeHtml(s) {
    return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  function renderResults(query) {
    $resultsList.innerHTML = "";
    shownCount = 0;
    var toShow = currentResults.slice(0, PAGE_SIZE);
    shownCount = toShow.length;

    for (var i = 0; i < toShow.length; i++) {
      $resultsList.appendChild(createResultItem(D[toShow[i]], toShow[i], query));
    }

    $resultsCount.textContent = currentResults.length + " result" + (currentResults.length !== 1 ? "s" : "");
    $resultsArea.hidden = false;
    $loadMore.hidden = currentResults.length <= shownCount;
  }

  function createResultItem(entry, idx, query) {
    var li = document.createElement("li");
    li.className = "result-item";

    var navHighlight = direction === "nav" && query ? highlightText(entry.n, query) : escapeHtml(entry.n);
    var engHighlight = direction === "eng" && query ? highlightText(entry.e, query) : escapeHtml(entry.e);

    var isFav = favorites.has(entry.n);
    li.innerHTML =
      '<div class="result-text">' +
        '<div class="result-navajo">' + navHighlight + '</div>' +
        '<div class="result-english">' + engHighlight + '</div>' +
      '</div>' +
      '<button class="result-fav' + (isFav ? ' saved' : '') + '" data-word="' + escapeHtml(entry.n) + '" aria-label="' + (isFav ? 'Remove from' : 'Save to') + ' favorites">' +
        (isFav ? '&#9829;' : '&#9825;') +
      '</button>';

    li.querySelector(".result-text").addEventListener("click", function() {
      addRecent(entry);
    });

    li.querySelector(".result-fav").addEventListener("click", function() {
      toggleFavorite(entry.n);
      this.classList.toggle("saved");
      var saved = favorites.has(entry.n);
      this.innerHTML = saved ? "&#9829;" : "&#9825;";
      this.setAttribute("aria-label", (saved ? "Remove from" : "Save to") + " favorites");
    });

    return li;
  }

  $loadMore.addEventListener("click", function() {
    var query = $input.value;
    var next = currentResults.slice(shownCount, shownCount + PAGE_SIZE);
    shownCount += next.length;
    for (var i = 0; i < next.length; i++) {
      $resultsList.appendChild(createResultItem(D[next[i]], next[i], query));
    }
    $loadMore.hidden = currentResults.length <= shownCount;
  });

  var searchTimer;
  $input.addEventListener("input", function() {
    clearTimeout(searchTimer);
    var val = this.value;
    $clearBtn.hidden = !val;
    if (!val) {
      $resultsArea.hidden = true;
      $featuredCard.style.display = "";
      $browseInline.style.display = "";
      $infoCards.style.display = "";
      $recentSearches.style.display = "";
      return;
    }
    $featuredCard.style.display = "none";
    $browseInline.style.display = "none";
    $infoCards.style.display = "none";
    $recentSearches.style.display = "none";
    searchTimer = setTimeout(function() {
      currentResults = search(val);
      renderResults(val);
    }, 150);
  });

  $clearBtn.addEventListener("click", function() {
    $input.value = "";
    $clearBtn.hidden = true;
    $resultsArea.hidden = true;
    $featuredCard.style.display = "";
    $browseInline.style.display = "";
    $infoCards.style.display = "";
    $recentSearches.style.display = "";
    $input.focus();
  });

  document.querySelectorAll(".toggle-btn").forEach(function(btn) {
    btn.addEventListener("click", function() {
      direction = this.dataset.dir;
      document.querySelectorAll(".toggle-btn").forEach(function(b) { b.classList.remove("active"); });
      this.classList.add("active");
      $input.placeholder = direction === "nav"
        ? "Type a Navajo word or English meaning…"
        : "Type an English word…";
      if ($input.value) {
        currentResults = search($input.value);
        renderResults($input.value);
      }
    });
  });

  // ===== ALPHABET STRIP =====
  LETTERS.forEach(function(letter) {
    var btn = document.createElement("button");
    btn.className = "alpha-btn";
    btn.textContent = letter;
    btn.addEventListener("click", function() {
      document.querySelectorAll(".alpha-btn").forEach(function(b) { b.classList.remove("active"); });
      this.classList.add("active");
      browseLetter(letter);
    });
    $alphaStrip.appendChild(btn);
  });

  function stripLeadingGlottal(word) {
    var s = word;
    while (s.length > 0 && (s[0] === "'" || s[0] === "‘" || s[0] === "’" || s[0] === "ʼ")) {
      s = s.substring(1);
    }
    return s.length > 0 ? s : word;
  }

  function normalizeChar(ch) {
    var c = ch.toLowerCase();
    if (c === "ł") return "ł";
    return c.normalize("NFKD").replace(/[̀-ͯ]/g, "");
  }

  function getLetterForWord(word) {
    var stripped = stripLeadingGlottal(word);
    return normalizeChar(stripped.charAt(0));
  }

  function browseLetter(letter) {
    var lLower = letter.toLowerCase();
    var results = [];
    for (var i = 0; i < D.length; i++) {
      if (getLetterForWord(D[i].n) === lLower) results.push(i);
    }
    currentResults = results;
    shownCount = 0;
    $input.value = "";
    $clearBtn.hidden = true;
    $featuredCard.style.display = "none";
    $infoCards.style.display = "none";
    $recentSearches.style.display = "none";
    if (results.length === 0) {
      $resultsList.innerHTML = '<li class="empty-msg">No Navajo words start with the letter "' + letter + '"</li>';
      $resultsArea.hidden = false;
      $loadMore.hidden = true;
      $resultsCount.textContent = "";
    } else {
      renderResults("");
      $resultsCount.textContent = results.length + ' words starting with "' + letter + '"';
    }
  }

  // ===== BROWSE SECTION =====
  function buildBrowseGrid() {
    var counts = {};
    LETTERS.forEach(function(l) { counts[l] = 0; });
    for (var i = 0; i < D.length; i++) {
      var wordLetter = getLetterForWord(D[i].n);
      for (var j = 0; j < LETTERS.length; j++) {
        if (LETTERS[j].toLowerCase() === wordLetter) { counts[LETTERS[j]]++; break; }
      }
    }

    LETTERS.forEach(function(letter) {
      var tile = document.createElement("button");
      tile.className = "browse-tile";
      tile.innerHTML = '<div>' + letter + '<span class="tile-count">' + counts[letter] + '</span></div>';
      tile.addEventListener("click", function() {
        document.querySelectorAll(".browse-tile").forEach(function(t) { t.classList.remove("active"); });
        this.classList.add("active");
        browseByLetter(letter);
      });
      $browseGrid.appendChild(tile);
    });
  }

  function browseByLetter(letter) {
    var lLower = letter.toLowerCase();
    browseResults = [];
    for (var i = 0; i < D.length; i++) {
      if (getLetterForWord(D[i].n) === lLower) browseResults.push(i);
    }
    browseShown = 0;
    $browseList.innerHTML = "";
    if (browseResults.length === 0) {
      $browseHeading.textContent = letter;
      $browseList.innerHTML = '<li class="empty-msg">No Navajo words start with the letter "' + letter + '"</li>';
      $browseResults.hidden = false;
      $browseMore.hidden = true;
      return;
    }
    $browseHeading.textContent = letter + " — " + browseResults.length + " entries";
    var toShow = browseResults.slice(0, PAGE_SIZE);
    browseShown = toShow.length;
    for (var i = 0; i < toShow.length; i++) {
      $browseList.appendChild(createResultItem(D[toShow[i]], toShow[i], ""));
    }
    $browseResults.hidden = false;
    $browseMore.hidden = browseResults.length <= browseShown;
  }

  $browseMore.addEventListener("click", function() {
    var next = browseResults.slice(browseShown, browseShown + PAGE_SIZE);
    browseShown += next.length;
    for (var i = 0; i < next.length; i++) {
      $browseList.appendChild(createResultItem(D[next[i]], next[i], ""));
    }
    $browseMore.hidden = browseResults.length <= browseShown;
  });

  // ===== FAVORITES =====
  function loadFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch(e) { return new Set(); }
  }

  function saveFavorites() {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
  }

  function toggleFavorite(word) {
    if (favorites.has(word)) favorites.delete(word);
    else favorites.add(word);
    saveFavorites();
    updateFeaturedFavBtn();
  }

  function renderFavorites() {
    $favList.innerHTML = "";
    if (favorites.size === 0) {
      $favEmpty.style.display = "";
      return;
    }
    $favEmpty.style.display = "none";
    for (var word of favorites) {
      var entry = D.find(function(e) { return e.n === word; });
      if (!entry) continue;
      var idx = D.indexOf(entry);
      $favList.appendChild(createResultItem(entry, idx, ""));
    }
  }

  // ===== FEATURED WORD =====
  function pickFeatured() {
    if (D.length === 0) return;
    var today = new Date();
    var seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    var idx = seed % D.length;
    var entry = D[idx];
    $featuredNav.textContent = entry.n;
    $featuredEng.textContent = entry.e;
    $featuredCard.dataset.word = entry.n;
    updateFeaturedFavBtn();

    $featuredFav.onclick = function() {
      toggleFavorite(entry.n);
    };
  }

  function updateFeaturedFavBtn() {
    var word = $featuredCard.dataset.word;
    if (!word) return;
    var isFav = favorites.has(word);
    $featuredFav.innerHTML = isFav ? "&#9829;" : "&#9825;";
    $featuredFav.classList.toggle("saved", isFav);
  }

  // ===== RECENT SEARCHES =====
  function loadRecent() {
    try {
      var raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  function saveRecent(list) {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 8)));
  }

  function addRecent(entry) {
    var list = loadRecent();
    list = list.filter(function(r) { return r.n !== entry.n; });
    list.unshift({ n: entry.n, e: entry.e });
    saveRecent(list);
    renderRecent();
  }

  function renderRecent() {
    var list = loadRecent();
    $recentList.innerHTML = "";
    if (list.length === 0) { $recentSearches.style.display = "none"; return; }
    list.forEach(function(r) {
      var li = document.createElement("li");
      li.className = "recent-item";
      li.innerHTML = '<div class="recent-item-word">' + escapeHtml(r.n) + '</div><div class="recent-item-def">' + escapeHtml(r.e) + '</div>';
      li.addEventListener("click", function() {
        $input.value = r.n;
        $input.dispatchEvent(new Event("input"));
      });
      $recentList.appendChild(li);
    });
  }

  // ===== INIT =====
  renderRecent();

  loadDictionary().then(function() {
    pickFeatured();
    buildBrowseGrid();
    if (window.innerWidth > 768) $input.focus();
  }).catch(function(err) {
    console.error("Failed to load dictionary:", err);
    $resultsCount.textContent = "Unable to load dictionary. Please check your connection.";
    $resultsArea.hidden = false;
  });

})();
