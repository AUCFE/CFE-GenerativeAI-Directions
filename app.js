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
  /* ---------------------------------------------------------------------
     CONTENT: PER-PLATFORM STEP-BY-STEP DIRECTIONS (verified Sept 2026)
  --------------------------------------------------------------------- */
  var PLATFORM_STEPS = {
    claude: {
      base: [
        'Go to <strong>claude.ai</strong> and sign in.',
        'In the left sidebar, click <strong>"Projects,"</strong> then <strong>"+ New Project."</strong>',
        'Name it and, if you\'d like, add a short description of what you\'re building.',
        'Click <strong>"Set project instructions"</strong> and paste your Instructions text from Part 2 below, then save.',
        'You\'ll also see a <strong>"Project knowledge"</strong> area &mdash; this is where you could optionally upload reference files for your Knowledge &amp; Resources. You can leave it empty for now and add files anytime.',
        'Start a new chat inside the project and try the test cases from Part 2 below.'
      ],
      agentExtra: [
        'To let this project act in other tools, click the <strong>"+"</strong> icon in the chat (or go to <strong>Settings → Customize → Connectors</strong>) and turn one on &mdash; Gmail, Google Calendar, and Google Drive are available on free accounts, plus a broader Connectors Directory (Slack, Canva, Notion, and more).',
        'Claude will ask your approval before it sends, creates, or changes anything through a connector &mdash; individual accounts can\'t turn this off (Team/Enterprise admins can, org-wide).'
      ],
      watchFor: 'Since August 2025, Claude\'s consumer plans (Free, Pro, Max) train on your conversations by default. If you don\'t want that &mdash; especially before pasting anything sensitive &mdash; turn it off under <strong>Settings → Privacy → "Help Improve our AI models."</strong>'
    },
    chatgpt: {
      base: [
        'Go to <strong>chatgpt.com</strong> and sign in.',
        'In the sidebar, click <strong>"New project"</strong> and give it a name.',
        'Open the project\'s <strong>•••</strong> menu → <strong>"Project settings"</strong> and add your Instructions text from Part 2 below.',
        'Upload two or three reference files if you have them for your Knowledge &amp; Resources &mdash; optional.',
        'Start a chat inside the project and try the test cases from Part 2 below.'
      ],
      agentExtra: [
        'To connect an outside app, go to <strong>Settings → Plugins</strong>, connect one (Google Drive, Gmail, Slack, Notion, Canva, and more), then reference it directly in a chat inside your project.',
        'Building a brand-new Plugin from scratch needs a Business, Enterprise, or Edu workspace &mdash; personal accounts can still connect and use an existing app, just not build a new one.'
      ],
      watchFor: 'Custom GPTs are being retired &mdash; new ones can no longer be created on personal accounts, and existing ones stop working entirely on December 11, 2026. ChatGPT Projects (used above) is the durable path going forward. Note: the new "Plugins" feature reuses a name OpenAI used for something different back in 2023 &mdash; ignore any old tutorials that turn up.'
    },
    perplexity: {
      base: [
        'Go to <strong>perplexity.ai</strong> and sign in.',
        'Click <strong>"Projects"</strong> in the sidebar, then <strong>"+ New project."</strong>',
        'Give it a title and, if you\'d like, a short description.',
        'Under <strong>Settings → Context</strong>, add your Instructions text from Part 2 below.',
        'Upload files under <strong>Project Files</strong> if you have them for your Knowledge &amp; Resources &mdash; optional.',
        'Ask the test cases from Part 2 below and check that its cited sources are accurate and relevant.'
      ],
      agentExtra: [
        'Under <strong>Settings → Connectors</strong>, connect an outside tool (Google Drive, Notion, Linear, GitHub, Slack, and 400+ more).',
        'For an assistant that actually takes actions rather than just searching and citing, set the project to <strong>"Computer"</strong> mode &mdash; this needs a Pro, Max, or Enterprise plan.'
      ],
      watchFor: 'Perplexity renamed "Spaces" to "Projects" in July 2026 &mdash; if you see older instructions mentioning Spaces, they mean the same thing.'
    },
    gemini: {
      base: [
        'Go to <strong>gemini.google.com</strong> and open your profile menu.',
        'Select <strong>"Gems,"</strong> then <strong>"New Gem"</strong> (or "Explore Gems" → New Gem).',
        'Name it and paste your Instructions text from Part 2 below. The <strong>"Use Gemini to re-write instructions"</strong> option can expand a rough draft into fuller instructions.',
        'Under <strong>"Knowledge,"</strong> click <strong>"Add files"</strong> for anything from your Knowledge &amp; Resources &mdash; optional.',
        'Preview it with the test cases from Part 2 below &mdash; previewing does not save it.',
        'Click <strong>"Save."</strong> You can create and edit Gems on the web only (both web and mobile can use one once it\'s saved).'
      ],
      agentExtra: [
        'Gemini can\'t take actions in other tools today. If your idea genuinely needs to send, create, or update something, that\'s a sign to build this one in Claude or Copilot instead &mdash; Gemini stays chatbot-level regardless of what you picked in Step 1.'
      ],
      watchFor: 'Google is retiring Gems in favor of a new "skills" format, starting <strong>November 17, 2026</strong> for personal accounts. This flow is accurate today, but expect it to change soon &mdash; check Gemini\'s own help center if something here doesn\'t match what you see.'
    },
    copilot: {
      base: [
        'Open Microsoft 365 Copilot (or go to <strong>copilot.microsoft.com</strong>) and sign in with your AU account.',
        'Click <strong>"New agent."</strong>',
        'Describe its purpose in plain language, or click <strong>"Skip to configure"</strong> to fill in fields directly.',
        'Paste your Instructions text from Part 2 below into the <strong>Instructions</strong> field.',
        'Under <strong>Knowledge</strong>, add SharePoint links, uploaded files, or specific web pages if you have them &mdash; optional.',
        'Under <strong>Suggested Prompts</strong> (sometimes shown as "Starter Prompts"), add one or two quick-click prompts.',
        'Test it on the <strong>"Try it"</strong> tab using the test cases from Part 2 below, then save and publish.'
      ],
      agentExtra: [
        'For real multi-step actions &mdash; not just answering from your own content &mdash; look at <strong>Copilot Studio</strong> instead (Create → New agent). It now offers two different builders chosen at creation: a classic Topics/Actions builder, or a newer natural-language Build tab &mdash; use whichever your account shows you.',
        'Some connectors, especially email or calendar actions, may be restricted by your institution\'s policy &mdash; check with your IT or ed-tech team before designing a workflow around one.'
      ],
      watchFor: null
    }
  };

  /* ---------------------------------------------------------------------
     CONTENT: CONNECTOR / PLUGIN DECISION CHECKLIST (per platform)
  --------------------------------------------------------------------- */
  var CONNECTOR_INFO = {
    claude: {
      live: 'Turn on a <strong>Connector</strong> &mdash; Gmail, Google Calendar, Google Drive, or browse the full Connectors Directory (Slack, Canva, Notion, and more) via the &quot;+&quot; icon in your chat or <strong>Settings → Customize → Connectors</strong>.',
      act: "yes",
      actText: 'Yes &mdash; Claude will ask your approval before it sends, creates, or changes anything.',
      fileOnly: 'Skip the connector &mdash; add it to <strong>Project knowledge</strong> instead.',
      mcp: 'If what you need isn\'t in the built-in list, Claude also supports connecting a custom <strong>MCP</strong> (Model Context Protocol) server &mdash; ask your IT or ed-tech team whether one exists for the tool you have in mind.'
    },
    chatgpt: {
      live: 'Connect a <strong>Plugin</strong> under <strong>Settings → Plugins</strong> &mdash; Google Drive, Gmail, Slack, Notion, Canva, and more.',
      act: "partial",
      actText: 'Partially &mdash; personal accounts can connect and use an existing Plugin, but building a brand-new one needs a Business, Enterprise, or Edu workspace.',
      fileOnly: 'Skip it &mdash; upload the file as Knowledge in your project instead.',
      mcp: null
    },
    perplexity: {
      live: 'Connect one under <strong>Settings → Connectors</strong> &mdash; Google Drive, Notion, Linear, GitHub, Slack, and 400+ more.',
      act: "yes",
      actText: 'Yes, with <strong>"Computer"</strong> mode &mdash; but that needs a Pro, Max, or Enterprise plan. On a free account, Perplexity stays in search-and-cite mode.',
      fileOnly: 'Skip it &mdash; add the file under Project Files instead.',
      mcp: 'Perplexity also supports connecting a custom <strong>MCP</strong> (Model Context Protocol) server if what you need isn\'t in the built-in 400+ list &mdash; ask your IT or ed-tech team.'
    },
    gemini: {
      live: '<strong>@mention</strong> a connected Workspace app right in your chat &mdash; Gmail, Docs, Drive, Calendar, Tasks, or Keep.',
      act: "no",
      actText: 'No &mdash; Gemini reads and references, but doesn\'t take actions on its own.',
      fileOnly: 'Skip it &mdash; add the file under Knowledge instead.',
      mcp: null
    },
    copilot: {
      live: 'Add a <strong>Connector</strong> under Knowledge (Agent Builder) or Tools (Copilot Studio) &mdash; SharePoint, OneDrive, Outlook, and more.',
      act: "yes",
      actText: 'Yes, via <strong>Copilot Studio</strong> &mdash; though some connectors, especially email/calendar actions, may be blocked by your institution\'s policy.',
      fileOnly: 'Skip it &mdash; add the file under Knowledge instead.',
      mcp: null
    }
  };

  var LAST_VERIFIED = "September 2026";

  function renderDirections(platform, pathChoice){
    var p = PLATFORM_STEPS[platform];
    var steps = p.base.slice();
    if(pathChoice === "agent") steps = steps.concat(p.agentExtra);
    var html = '<div class="tool-block"><h3>Using ' + PLATFORM_META[platform].name + '</h3><ol>';
    steps.forEach(function(s){ html += '<li>' + s + '</li>'; });
    html += '</ol>';
    if(p.watchFor){
      html += '<p style="margin-top:14px; font-size:13.5px; color:var(--text-muted);"><strong>Watch for:</strong> ' + p.watchFor + '</p>';
    }
    html += '</div>';
    return html;
  }

  function renderConnectorChecklist(platform, pathChoice){
    var c = CONNECTOR_INFO[platform];
    var nudge = (pathChoice === "chatbot" && c.act !== "no")
      ? ' If that\'s true for what you\'re building, you actually want the <strong>Agent</strong> path &mdash; go back to Step 1 and choose that instead.'
      : '';
    var html = '<div class="tool-block"><h3>Should You Turn On a Connector?</h3><ol>';
    html += '<li>Does it need something that changes day to day (today\'s calendar, this week\'s inbox) rather than something you could just upload once? → ' + c.live + '</li>';
    html += '<li>Does it need to <em>do</em> something outside the chat (send, create, update) rather than only answer? → ' + c.actText + nudge + '</li>';
    html += '<li>Is what you need just sitting in a file you already have? → ' + c.fileOnly + '</li>';
    html += '</ol>';
    if(c.mcp){
      html += '<p style="margin-top:14px; font-size:13.5px; color:var(--text-muted);"><strong>Advanced:</strong> ' + c.mcp + '</p>';
    }
    html += '</div>';
    return html;
  }

  /* ---------------------------------------------------------------------
     RENDER: OUTPUT
  --------------------------------------------------------------------- */
  function renderOutput(){
    var p = PLATFORM_META[state.platform];
    var html = '<div class="card">';
    html += '<div class="output-topbar"><div>' +
      '<p class="section-eyebrow">Your Results</p>' +
      '<h2 class="section-title">Your Personalized Plan</h2>' +
      '<p class="section-desc" style="margin-bottom:0;">Follow the numbered directions below, then use the copy-paste content in Part 2 with ' + p.name + '.</p>' +
      '</div><button class="btn btn-ghost btn-sm" onclick="App.goTo(3)">← Back</button></div>';

    html += '<div class="chip-row">' +
      '<span class="chip">' + (state.pathChoice === "agent" ? "Agent" : "Chatbot") + '</span>' +
      '<span class="chip">' + p.name + '</span>' +
      (state.sensitiveData ? '<span class="chip">Sensitive data</span>' : '') +
      '</div>';

    html += '<h3 class="section-heading">Part 1 &middot; Your Step-by-Step Directions</h3>';
    html += '<p class="section-sub">Plain-language steps for ' + p.name + '.</p>';
    html += renderDirections(state.platform, state.pathChoice);
    html += renderConnectorChecklist(state.platform, state.pathChoice);

    html += '<div class="info-box">🔀&nbsp; <strong>This travels with you:</strong> the Instructions text in Part 2 works with little rewriting if you want to try a different platform later &mdash; that\'s the point of writing it in plain language up front.</div>';

    html += '<div class="warning">🔒&nbsp; <strong>Before you paste anything in:</strong> don\'t put institutional data, student records, or anything covered by FERPA or your organization\'s data policy into a personal AI account. Use only the accounts and platforms your organization has approved for that kind of data.' + (state.sensitiveData ? ' You told us this assistant involves sensitive data &mdash; take an extra look at your Guardrails in Part 2 before you paste anything in.' : '') + '</div>';

    html += '<div class="info-box">🕓&nbsp; <strong>AI tools change their menus often.</strong> We verified everything above as of ' + LAST_VERIFIED + '. If a button or menu doesn\'t match what you see, look for the closest equivalent, or check ' + p.name + '\'s own help center.</div>';

    html += '<h3 class="section-heading">Part 2 &middot; Your Copy-Paste Instructions &amp; Prompts</h3>';
    html += '<p class="section-sub">Already filled in with your answers. Click Copy, then paste into ' + p.name + '.</p>';
    html += '<div class="placeholder-note">🚧 Instructions text, test cases, and copy buttons are coming in the next build phase.<br>Your answers so far are saved in this session &mdash; nothing will be lost.</div>';

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
