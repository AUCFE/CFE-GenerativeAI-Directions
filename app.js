(function(){

  /* ---------------------------------------------------------------------
     STATE
  --------------------------------------------------------------------- */
  var state = {
    screen: "landing",     // landing | welcome | 1 | 2 | 3 | output
    buildPath: null,       // "know" | "explore" -- which landing choice they took
    pathChoice: null,      // "chatbot" | "agent"
    platform: null,        // "claude" | "chatgpt" | "perplexity" | "gemini" | "copilot"
    processMappingPaste: "",
    purpose: "",
    audience: "",
    tone: "",
    guardrails: "",
    sensitiveData: null,   // true | false | null
    knowledge: "",
    theme: "light"
  };

  var STEP_LABELS = ["Chatbot or Agent", "Platform", "Your Assistant"];

  var TONE_SUGGESTIONS = [
    "Friendly and casual",
    "Professional and concise",
    "Step-by-step and instructional",
    "Warm and encouraging"
  ];

  var PLATFORM_META = {
    claude:     { name: "Claude",                 blurb: "Projects + Connectors. Works on a free account &mdash; connectors include Gmail, Calendar, Drive, and more." },
    chatgpt:    { name: "ChatGPT",                 blurb: "Projects. Free/Plus accounts can connect existing apps; building a brand-new one needs a Business, Enterprise, or Edu workspace." },
    perplexity: { name: "Perplexity",              blurb: "Projects, built around live web search and citations. Taking real actions needs a paid or institutional plan." },
    gemini:     { name: "Gemini",                  blurb: "Gems &mdash; free with any Google account. Google is transitioning Gems to a new &quot;skills&quot; format starting November 2026." },
    copilot:    { name: "Microsoft 365 Copilot",   blurb: "Included with an AU Microsoft 365 account. Agents and connectors may be limited by your institution's policy." }
  };

  var app = document.getElementById("app");

  /* ---------------------------------------------------------------------
     HELPERS
  --------------------------------------------------------------------- */
  function escapeHtml(str){
    return String(str).replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }

  function copyToClipboard(text, btn){
    function ok(){
      var original = btn.textContent;
      btn.textContent = "Copied ✓";
      btn.classList.add("copied");
      setTimeout(function(){ btn.textContent = original; btn.classList.remove("copied"); }, 1600);
    }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(ok).catch(function(){ fallbackCopy(text, ok); });
    } else {
      fallbackCopy(text, ok);
    }
  }

  function fallbackCopy(text, ok){
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus(); ta.select();
    try{ document.execCommand("copy"); ok(); }catch(e){}
    document.body.removeChild(ta);
  }

  /* ---------------------------------------------------------------------
     NAVIGATION
  --------------------------------------------------------------------- */
  function goTo(screen){ state.screen = screen; window.scrollTo(0,0); render(); }

  function chooseBuildPath(path){
    state.buildPath = path;
    if(path === "explore"){
      window.open("https://aucfe.github.io/CFE-AI-Process-Mapping/", "_blank");
    }
    goTo("welcome");
  }
  function continueFromLandingAnyway(){
    state.buildPath = "explore";
    goTo("welcome");
  }

  function selectPathChoice(v){ state.pathChoice = v; render(); }
  function selectPlatform(v){ state.platform = v; render(); }

  function toggleTheme(){
    state.theme = state.theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", state.theme);
    document.getElementById("themeIcon").textContent = state.theme === "light" ? "🌙" : "☀️";
    document.getElementById("themeLabel").textContent = state.theme === "light" ? "Dark Mode" : "Light Mode";
  }

  function startOver(){
    state.screen = "landing";
    state.buildPath = null;
    state.pathChoice = null;
    state.platform = null;
    state.processMappingPaste = "";
    state.purpose = "";
    state.audience = "";
    state.tone = "";
    state.guardrails = "";
    state.sensitiveData = null;
    state.knowledge = "";
    window.scrollTo(0,0);
    render();
  }

  /* ---------------------------------------------------------------------
     RENDER: SHELL
  --------------------------------------------------------------------- */
  function render(){
    var html = "";
    if(state.screen === "landing"){
      html += renderLanding();
    } else {
      html += renderUtilityBar();
      if(state.screen === "welcome"){
        html += renderWelcome();
      } else if(state.screen === "output"){
        html += renderOutput();
      } else {
        html += renderProgress();
        if(state.screen === 1) html += renderStep1();
        else if(state.screen === 2) html += renderStep2();
        else if(state.screen === 3) html += renderStep3();
      }
    }
    html += renderFooter();
    app.innerHTML = html;

    if(state.screen === 3){
      wireStep3Inputs();
    }
  }

  function renderUtilityBar(){
    return '' +
      '<div class="utility-bar">' +
        '<span class="utility-label">Your Progress</span>' +
        '<button class="btn btn-ghost" onclick="App.saveProgress()">💾 Save Progress</button>' +
        '<label class="file-input-label">' +
          '<span class="btn btn-ghost" style="pointer-events:none;">📂 Load Saved File</span>' +
          '<input type="file" accept="application/json" style="display:none" onchange="App.loadProgress(event)">' +
        '</label>' +
      '</div>';
  }

  function renderFooter(){
    return '<footer>Nothing you enter here is saved or sent anywhere unless you click &quot;Save Progress&quot; yourself &mdash; everything else stays in this browser tab for today\'s session.</footer>';
  }

  /* ---------------------------------------------------------------------
     RENDER: LANDING
  --------------------------------------------------------------------- */
  function renderLanding(){
    return '' +
      '<div class="tool-intro">' +
        '<h1>Build Your AI Assistant</h1>' +
        '<div class="intro-callout">' +
          '<span class="intro-callout-icon">→</span>' +
          '<p>A few quick questions turn your idea into personalized, plain-language directions for building a chatbot or agent in Claude, ChatGPT, Perplexity, Gemini, or Microsoft 365 Copilot &mdash; plus copy-paste instructions ready to use.</p>' +
        '</div>' +
      '</div>' +
      '<div class="card">' +
        '<p class="section-eyebrow">Before You Start</p>' +
        '<h2 class="section-title">Do you already have an idea?</h2>' +
        '<div class="fork-grid">' +
          '<div class="fork-card">' +
            '<h3>I know what I want to build</h3>' +
            '<p>You already have a task or problem in mind. Jump straight into building your chatbot or agent.</p>' +
            '<button class="btn btn-primary" onclick="App.chooseBuildPath(\'know\')">Continue →</button>' +
          '</div>' +
          '<div class="fork-card">' +
            '<h3>I don\'t have an idea yet</h3>' +
            '<p>Start with the Process Mapping tool to find a good AI opportunity in your own work first &mdash; it opens in a new tab, and its result can feed right back into this tool.</p>' +
            '<button class="btn btn-primary" onclick="App.chooseBuildPath(\'explore\')">Open Process Mapping Tool ↗</button>' +
            '<div class="fork-secondary-link">or <button onclick="App.continueFromLandingAnyway()">continue here anyway →</button> &mdash; your directions will just be a bit more general until you narrow it down</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     RENDER: WELCOME
  --------------------------------------------------------------------- */
  function renderWelcome(){
    return '' +
      '<div class="card">' +
        '<p class="section-eyebrow">How This Works</p>' +
        '<h2 class="section-title">Three quick steps</h2>' +
        '<p class="section-desc">There are no wrong answers here &mdash; you can always come back and change something with the Back button.</p>' +
        '<ol style="padding-left:20px; margin:0 0 26px;">' +
          '<li style="margin-bottom:10px;"><strong>Chatbot or agent, and which platform.</strong> Two quick picks that shape everything after.</li>' +
          '<li style="margin-bottom:10px;"><strong>Tell us about your assistant</strong> &mdash; its purpose, audience, tone, and guardrails, in plain language.</li>' +
          '<li><strong>Get your directions.</strong> Personalized, numbered steps for your platform, a ready-to-paste Instructions block, suggested test cases, and more &mdash; all with Copy buttons.</li>' +
        '</ol>' +
        '<div class="step-nav" style="justify-content:space-between;">' +
          '<button class="btn btn-ghost" onclick="App.goTo(\'landing\')">← Back</button>' +
          '<button class="btn btn-primary" onclick="App.goTo(1)">Get Started →</button>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     RENDER: PROGRESS
  --------------------------------------------------------------------- */
  function renderProgress(){
    var segs = "", labels = "";
    for(var i=1;i<=3;i++){
      var cls = i < state.screen ? "done" : (i === state.screen ? "active" : "");
      segs += '<div class="progress-seg ' + cls + '"></div>';
      labels += '<span class="' + (i===state.screen?"current":"") + '">' + STEP_LABELS[i-1] + '</span>';
    }
    return '' +
      '<div class="progress-wrap">' +
        '<div class="progress-label">Step ' + state.screen + ' of 3</div>' +
        '<div class="progress-track">' + segs + '</div>' +
        '<div class="progress-steps">' + labels + '</div>' +
      '</div>';
  }

  /* ---------------------------------------------------------------------
     RENDER: STEP 1 -- CHATBOT OR AGENT
  --------------------------------------------------------------------- */
  function renderStep1(){
    var opts = [
      {v:"chatbot", t:"Chatbot", d:"Answers questions using instructions and knowledge you give it. Realistic to build in under an hour."},
      {v:"agent", t:"Agent", d:"Also takes actions in other tools — like sending an email or updating a calendar — on your behalf. Adds permissions, connectors, and security considerations."}
    ];
    var html = '<div class="card"><p class="section-eyebrow">Step 1</p><h2 class="section-title">Chatbot or agent?</h2><p class="section-desc">Pick one.</p>';
    html += '<div class="option-grid cols-2">';
    opts.forEach(function(o){
      var sel = state.pathChoice === o.v;
      html += '<button class="option' + (sel?" selected":"") + '" onclick="App.selectPathChoice(\'' + o.v + '\')">' +
        '<span class="opt-title"><span class="check">' + (sel?"✓":"") + '</span>' + o.t + '</span>' +
        '<span class="opt-desc">' + o.d + '</span></button>';
    });
    html += '</div>';
    html += '<div class="info-box">💡&nbsp; <strong>Not sure?</strong> Every agent starts as a chatbot with one thing added: the ability to act, not just answer. If your idea is &quot;answer questions using material I give it,&quot; that\'s a chatbot. If it needs to send, create, update, or post something in another tool, that\'s agent territory.</div>';
    html += renderNav(true, state.pathChoice !== null);
    return html;
  }

  /* ---------------------------------------------------------------------
     RENDER: STEP 2 -- PLATFORM
  --------------------------------------------------------------------- */
  function renderStep2(){
    var order = ["claude","chatgpt","perplexity","gemini","copilot"];
    var html = '<div class="card"><p class="section-eyebrow">Step 2</p><h2 class="section-title">Which platform will you build in?</h2><p class="section-desc">Pick one. Each works a little differently, so your directions will be tailored to whichever you choose.</p>';
    html += '<div class="option-grid cols-list">';
    order.forEach(function(key){
      var p = PLATFORM_META[key];
      var sel = state.platform === key;
      html += '<button class="option' + (sel?" selected":"") + '" onclick="App.selectPlatform(\'' + key + '\')">' +
        '<span class="opt-title"><span class="check">' + (sel?"✓":"") + '</span>' + p.name + '</span>' +
        '<span class="opt-meta">' + p.blurb + '</span></button>';
    });
    html += '</div>';
    html += renderNav(true, state.platform !== null);
    return html;
  }

  /* ---------------------------------------------------------------------
     RENDER: STEP 3 -- BUILD TEMPLATE FIELDS
  --------------------------------------------------------------------- */
  function renderStep3(){
    var html = '<div class="card"><p class="section-eyebrow">Step 3</p><h2 class="section-title">Tell us about your assistant</h2><p class="section-desc">Plain language is fine — this becomes your ready-to-paste Instructions in the next screen.</p>';

    html += '<div class="collapsible-box">' +
      '<div class="field">' +
        '<label>Paste your Process Mapping result (optional)</label>' +
        '<div class="field-hint">If you used the Process Mapping tool, paste what it gave you here. We won\'t try to sort it into the fields below automatically — every idea reads differently — but we\'ll carry it into your final Instructions as background, so nothing gets lost while you fill out Purpose and Audience yourself just below.</div>' +
        '<textarea id="f-processMappingPaste" placeholder="Paste the prompt the Process Mapping tool generated for you...">' + escapeHtml(state.processMappingPaste) + '</textarea>' +
      '</div>' +
    '</div>';

    var purposePlaceholder = state.buildPath === "explore"
      ? "Not sure yet? A rough idea is fine — your directions will just be a bit more general until you narrow it down. e.g., Help students understand feedback on their essay drafts."
      : "What is this for, and what problem does it solve? e.g., Help students understand feedback on their essay drafts before they revise.";

    html += '<div class="field"><label>Purpose</label>' +
      '<textarea id="f-purpose" placeholder="' + escapeHtml(purposePlaceholder) + '">' + escapeHtml(state.purpose) + '</textarea></div>';

    html += '<div class="field"><label>Audience</label>' +
      '<textarea id="f-audience" placeholder="Who will use it, and what do they already know? e.g., First-year writing students, new to academic feedback language.">' + escapeHtml(state.audience) + '</textarea></div>';

    html += '<div class="field"><label>Tone</label>' +
      '<input type="text" id="f-tone" placeholder="Describe it in your own words, or pick a suggestion below" value="' + escapeHtml(state.tone) + '">' +
      '<div class="chip-row-wrap" id="toneChips">' +
        TONE_SUGGESTIONS.map(function(t){
          return '<button type="button" class="chip-btn" onclick="App.applyToneSuggestion(' + JSON.stringify(t).replace(/"/g,'&quot;') + ')">' + t + '</button>';
        }).join("") +
      '</div></div>';

    html += '<div class="field"><label>Guardrails</label>' +
      '<div class="field-hint">What should it always refuse, avoid, or flag?</div>' +
      '<textarea id="f-guardrails" placeholder="e.g., If asked about something outside this purpose, say you can\'t help with that and suggest who can. Say when you don\'t know something rather than guessing.">' + escapeHtml(state.guardrails) + '</textarea></div>';

    html += '<div class="field"><label>Sensitive data</label>' +
      '<div class="field-hint">Will this involve student records, HR/personnel data, health information, or other sensitive institutional data?</div>' +
      '<div class="toggle-row" id="sensitiveToggle">' +
        '<button type="button" class="toggle-btn' + (state.sensitiveData===true?" selected":"") + '" data-val="true" onclick="App.setSensitiveData(true)">Yes</button>' +
        '<button type="button" class="toggle-btn' + (state.sensitiveData===false?" selected":"") + '" data-val="false" onclick="App.setSensitiveData(false)">No</button>' +
      '</div></div>';

    html += '<div class="field"><label>Knowledge &amp; Resources <span class="note" style="margin:0;font-weight:600;">(optional)</span></label>' +
      '<input type="text" id="f-knowledge" placeholder="What documents or reference material will it draw on? e.g., our writing rubric, sample annotated essays" value="' + escapeHtml(state.knowledge) + '"></div>';

    html += renderNav(true, isStep3Valid(), "Generate My Directions →");
    return html;
  }

  function isStep3Valid(){
    return state.purpose.trim() !== "" && state.audience.trim() !== "";
  }

  function applyToneSuggestion(text){
    state.tone = text;
    var el = document.getElementById("f-tone");
    if(el) el.value = text;
  }

  function setSensitiveData(val){
    state.sensitiveData = val;
    var wrap = document.getElementById("sensitiveToggle");
    if(wrap){
      Array.from(wrap.querySelectorAll(".toggle-btn")).forEach(function(btn){
        btn.classList.toggle("selected", btn.getAttribute("data-val") === String(val));
      });
    }
  }

  function wireStep3Inputs(){
    var map = {
      "f-processMappingPaste": "processMappingPaste",
      "f-purpose": "purpose",
      "f-audience": "audience",
      "f-tone": "tone",
      "f-guardrails": "guardrails",
      "f-knowledge": "knowledge"
    };
    Object.keys(map).forEach(function(id){
      var el = document.getElementById(id);
      if(!el) return;
      el.addEventListener("input", function(){
        state[map[id]] = el.value;
        var nextBtn = document.querySelector(".step-nav .btn-primary");
        if(nextBtn) nextBtn.disabled = !isStep3Valid();
      });
    });
  }

  /* ---------------------------------------------------------------------
     RENDER: OUTPUT (placeholder -- built out in Phase 2/3)
  --------------------------------------------------------------------- */
  function renderOutput(){
    var p = PLATFORM_META[state.platform];
    var html = '<div class="card">';
    html += '<div class="output-topbar"><div>' +
      '<p class="section-eyebrow">Your Results</p>' +
      '<h2 class="section-title">Your Personalized Plan</h2>' +
      '<p class="section-desc" style="margin-bottom:0;">Building this out in the next phase.</p>' +
      '</div><button class="btn btn-ghost btn-sm" onclick="App.goTo(3)">← Back</button></div>';

    html += '<div class="chip-row">' +
      '<span class="chip">' + (state.pathChoice === "agent" ? "Agent" : "Chatbot") + '</span>' +
      '<span class="chip">' + p.name + '</span>' +
      (state.sensitiveData ? '<span class="chip">Sensitive data</span>' : '') +
      '</div>';

    html += '<div class="placeholder-note" style="margin-top:28px;">🚧 Step-by-step directions and copy-paste prompts are coming in the next build phase.<br>Your answers so far are saved in this session &mdash; nothing will be lost.</div>';

    html += '<div class="final-actions">' +
      '<button class="btn btn-ghost" onclick="App.goTo(3)">← Back</button>' +
      '<button class="btn btn-focal" onclick="App.startOver()">Start Over</button>' +
    '</div>';

    html += '</div>';
    return html;
  }

  /* ---------------------------------------------------------------------
     NAV BAR (shared)
  --------------------------------------------------------------------- */
  function renderNav(showBack, canProceed, nextLabel){
    var backTarget = state.screen === 1 ? "'welcome'" : (state.screen - 1);
    var back = showBack ? '<button class="btn btn-ghost" onclick="App.goTo(' + backTarget + ')">← Back</button>' : '<span></span>';
    var label = nextLabel || "Continue →";
    var nextAction = state.screen === 3 ? "App.goTo('output')" : "App.goTo(" + (state.screen + 1) + ")";
    return '<div class="step-nav">' + back + '<button class="btn btn-primary" ' + (canProceed?"":"disabled") + ' onclick="' + nextAction + '">' + label + '</button></div>';
  }

  /* ---------------------------------------------------------------------
     PERSISTENCE -- Save Progress / Load Saved File
  --------------------------------------------------------------------- */
  function saveProgress(){
    var data = JSON.stringify(state, null, 2);
    var blob = new Blob([data], {type: "application/json"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "build-your-ai-assistant-progress.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadProgress(evt){
    var file = evt.target.files && evt.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(e){
      try{
        var loaded = JSON.parse(e.target.result);
        Object.keys(state).forEach(function(key){
          if(key === "theme") return;
          if(Object.prototype.hasOwnProperty.call(loaded, key)) state[key] = loaded[key];
        });
        window.scrollTo(0,0);
        render();
      }catch(err){
        alert("That file doesn't look like a saved progress file from this tool.");
      }
    };
    reader.readAsText(file);
  }

  /* ---------------------------------------------------------------------
     PUBLIC API + INIT
  --------------------------------------------------------------------- */
  window.App = {
    goTo: goTo,
    chooseBuildPath: chooseBuildPath,
    continueFromLandingAnyway: continueFromLandingAnyway,
    selectPathChoice: selectPathChoice,
    selectPlatform: selectPlatform,
    toggleTheme: toggleTheme,
    startOver: startOver,
    applyToneSuggestion: applyToneSuggestion,
    setSensitiveData: setSensitiveData,
    saveProgress: saveProgress,
    loadProgress: loadProgress
  };

  render();
})();
