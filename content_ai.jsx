import { useState, useRef } from "react";

const CONTENT_TYPES = [
  { id: "blog", label: "📝 Blog Post", icon: "📝" },
  { id: "caption", label: "📸 Social Media Caption", icon: "📸" },
  { id: "tweet", label: "🐦 Twitter/X Thread", icon: "🐦" },
  { id: "email", label: "📧 Email Newsletter", icon: "📧" },
  { id: "summary", label: "📋 Text Summary", icon: "📋" },
  { id: "youtube", label: "🎬 YouTube Description", icon: "🎬" },
];

const TONES = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "humorous", label: "Humorous" },
  { id: "inspirational", label: "Inspirational" },
  { id: "informative", label: "Informative" },
  { id: "persuasive", label: "Persuasive" },
];

const SAMPLE_TOPICS = [
  "Benefits of morning exercise",
  "How AI is changing education",
  "Top 5 productivity tips for students",
  "Why you should learn Python in 2025",
  "The future of electric vehicles",
];

const PROMPTS = {
  blog: (topic, tone) =>
    `Write a high-quality blog post about: "${topic}"\nTone: ${tone}\n\nInclude:\n- An engaging title\n- An intro paragraph\n- 3-4 sections with subheadings\n- A conclusion\n\nMake it detailed, readable, and SEO-friendly.`,
  caption: (topic, tone) =>
    `Write 3 different social media captions (Instagram/Facebook) about: "${topic}"\nTone: ${tone}\n\nFor each caption:\n- Make it engaging and shareable\n- Include relevant emojis\n- Add 5-8 relevant hashtags\n- Keep each under 150 words\n\nLabel them as Option 1, Option 2, Option 3.`,
  tweet: (topic, tone) =>
    `Write a Twitter/X thread (5-7 tweets) about: "${topic}"\nTone: ${tone}\n\nFormat:\n- Start with a hook tweet\n- Each tweet numbered (1/, 2/, etc.)\n- Keep each tweet under 280 characters\n- End with a strong CTA or takeaway`,
  email: (topic, tone) =>
    `Write an email newsletter about: "${topic}"\nTone: ${tone}\n\nInclude:\n- Subject line\n- Preview text\n- Greeting\n- Main body (3 paragraphs)\n- Call to action\n- Sign-off`,
  summary: (topic, tone) =>
    `Write a concise, well-structured summary about: "${topic}"\nTone: ${tone}\n\nInclude:\n- A one-line overview\n- Key points (bullet format)\n- Key takeaway\n\nKeep it under 300 words.`,
  youtube: (topic, tone) =>
    `Write a YouTube video description for a video about: "${topic}"\nTone: ${tone}\n\nInclude:\n- Engaging first 2 lines (visible before "Show more")\n- What viewers will learn\n- Timestamps section (create realistic ones)\n- 10-15 SEO hashtags\n- Subscribe CTA`,
};

export default function ContentGenerator() {
  const [contentType, setContentType] = useState("blog");
  const [tone, setTone] = useState("professional");
  const [topic, setTopic] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const outputRef = useRef(null);

  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0;
  const charCount = output.length;

  async function generate(overrideTopic) {
    const activeTopic = overrideTopic || topic.trim();
    if (!activeTopic) {
      setError("Please enter a topic first.");
      return;
    }
    setError("");
    setOutput("");
    setLoading(true);

    const prompt = PROMPTS[contentType](activeTopic, tone);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content?.map((b) => b.text || "").join("") || "";
      setOutput(text);
      setHistory((prev) => [
        { topic: activeTopic, type: contentType, tone, output: text, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 9),
      ]);
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setError("Generation failed: " + e.message);
    }
    setLoading(false);
  }

  async function regenerate() {
    await generate(topic);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function loadFromHistory(item) {
    setTopic(item.topic);
    setContentType(item.type);
    setTone(item.tone);
    setOutput(item.output);
    setShowHistory(false);
  }

  const selectedType = CONTENT_TYPES.find((t) => t.id === contentType);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoMark}>✦</div>
          <div>
            <div style={styles.logoText}>
              Content<span style={styles.accent}>AI</span>
            </div>
            <div style={styles.logoSub}>AI-Powered Content Generator</div>
          </div>
        </div>
        <button style={styles.historyToggle} onClick={() => setShowHistory((v) => !v)}>
          {showHistory ? "✕ Close" : `🕐 History (${history.length})`}
        </button>
      </div>

      <div style={styles.body}>
        {/* History Panel */}
        {showHistory && (
          <div style={styles.historyPanel}>
            <div style={styles.historyTitle}>Generation History</div>
            {history.length === 0 ? (
              <div style={styles.historyEmpty}>No history yet. Generate some content!</div>
            ) : (
              history.map((item, i) => (
                <div key={i} style={styles.historyItem} onClick={() => loadFromHistory(item)}>
                  <div style={styles.historyItemTop}>
                    <span style={styles.historyIcon}>{CONTENT_TYPES.find((t) => t.id === item.type)?.icon}</span>
                    <span style={styles.historyItemTopic}>{item.topic}</span>
                    <span style={styles.historyTime}>{item.time}</span>
                  </div>
                  <div style={styles.historyMeta}>{item.tone} · {item.type}</div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={styles.main}>
          {/* LEFT: Controls */}
          <div style={styles.controls}>

            {/* Content Type */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Content Type</div>
              <div style={styles.typeGrid}>
                {CONTENT_TYPES.map((ct) => (
                  <button
                    key={ct.id}
                    style={{
                      ...styles.typeBtn,
                      ...(contentType === ct.id ? styles.typeBtnActive : {}),
                    }}
                    onClick={() => setContentType(ct.id)}
                  >
                    <span style={styles.typeIcon}>{ct.icon}</span>
                    <span style={styles.typeName}>{ct.label.replace(/^.\s/, "")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Tone</div>
              <div style={styles.toneRow}>
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    style={{
                      ...styles.toneBtn,
                      ...(tone === t.id ? styles.toneBtnActive : {}),
                    }}
                    onClick={() => setTone(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic */}
            <div style={styles.section}>
              <div style={styles.sectionLabel}>Topic / Prompt</div>
              <textarea
                style={styles.topicInput}
                placeholder={`What do you want to write about?\n\nExample: "${SAMPLE_TOPICS[0]}"`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
              />
              <div style={styles.sampleRow}>
                <span style={styles.sampleLabel}>Try:</span>
                {SAMPLE_TOPICS.slice(0, 3).map((s, i) => (
                  <button key={i} style={styles.sampleChip} onClick={() => { setTopic(s); generate(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            {/* Generate Button */}
            <button
              style={{ ...styles.generateBtn, opacity: loading ? 0.6 : 1 }}
              onClick={() => generate()}
              disabled={loading}
            >
              {loading ? (
                <span style={styles.btnInner}>
                  <span style={styles.spinner}></span> Generating...
                </span>
              ) : (
                <span style={styles.btnInner}>✦ Generate {selectedType?.label}</span>
              )}
            </button>
          </div>

          {/* RIGHT: Output */}
          <div style={styles.outputCol} ref={outputRef}>
            {!output && !loading && (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>✦</div>
                <div style={styles.emptyTitle}>Ready to generate</div>
                <div style={styles.emptySub}>
                  Pick a content type, set a tone, enter your topic and hit Generate.
                </div>
                <div style={styles.exampleList}>
                  {SAMPLE_TOPICS.map((s, i) => (
                    <div key={i} style={styles.exampleItem} onClick={() => { setTopic(s); generate(s); }}>
                      → {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div style={styles.loadingState}>
                <div style={styles.loadingDots}>
                  <span style={{ ...styles.dot, animationDelay: "0s" }}></span>
                  <span style={{ ...styles.dot, animationDelay: "0.2s" }}></span>
                  <span style={{ ...styles.dot, animationDelay: "0.4s" }}></span>
                </div>
                <div style={styles.loadingText}>Writing your {selectedType?.label}...</div>
              </div>
            )}

            {output && !loading && (
              <div style={styles.outputCard}>
                {/* Output Header */}
                <div style={styles.outputHeader}>
                  <div style={styles.outputMeta}>
                    <span style={styles.outputTypeBadge}>{selectedType?.icon} {selectedType?.label.replace(/^.\s/, "")}</span>
                    <span style={styles.outputToneBadge}>{tone}</span>
                  </div>
                  <div style={styles.outputActions}>
                    <button style={styles.actionBtn} onClick={regenerate}>↺ Regenerate</button>
                    <button
                      style={{ ...styles.actionBtn, ...styles.copyBtn, ...(copied ? styles.copiedBtn : {}) }}
                      onClick={copyToClipboard}
                    >
                      {copied ? "✓ Copied!" : "⎘ Copy"}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div style={styles.outputBody}>
                  {output}
                </div>

                {/* Footer stats */}
                <div style={styles.outputFooter}>
                  <span style={styles.stat}>📝 {wordCount} words</span>
                  <span style={styles.stat}>🔤 {charCount} characters</span>
                  <span style={styles.stat}>📖 ~{Math.ceil(wordCount / 200)} min read</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-8px); }
        }
        textarea:focus { border-color: #a78bfa !important; outline: none; }
        textarea { resize: vertical; }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    background: "#0c0c10",
    minHeight: "100vh",
    color: "#e2e2f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "16px 28px",
    borderBottom: "1px solid #1e1e28",
    background: "#10101a",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  logoMark: {
    width: 38, height: 38,
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, color: "#fff", fontWeight: 800,
  },
  logoText: { fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" },
  accent: { color: "#a78bfa" },
  logoSub: { fontSize: 11, color: "#555570", marginTop: 1 },
  historyToggle: {
    background: "transparent",
    border: "1px solid #2a2a3a",
    color: "#888890",
    padding: "7px 14px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  body: { display: "flex", flex: 1, position: "relative" },
  historyPanel: {
    width: 280,
    background: "#10101a",
    borderRight: "1px solid #1e1e28",
    padding: "20px 16px",
    overflowY: "auto",
    flexShrink: 0,
  },
  historyTitle: { fontSize: 12, color: "#666678", textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 },
  historyEmpty: { fontSize: 13, color: "#444455", textAlign: "center", paddingTop: 20 },
  historyItem: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #1e1e28",
    marginBottom: 8,
    cursor: "pointer",
    background: "#13131d",
    transition: "border-color 0.15s",
  },
  historyItemTop: { display: "flex", alignItems: "center", gap: 6, marginBottom: 4 },
  historyIcon: { fontSize: 14 },
  historyItemTopic: { fontSize: 12, flex: 1, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  historyTime: { fontSize: 10, color: "#555565" },
  historyMeta: { fontSize: 10, color: "#666678" },
  main: {
    display: "flex",
    flex: 1,
    gap: 0,
    overflow: "hidden",
  },
  controls: {
    width: 340,
    flexShrink: 0,
    padding: "24px 20px",
    borderRight: "1px solid #1e1e28",
    background: "#0e0e16",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  section: {},
  sectionLabel: {
    fontSize: 11,
    color: "#666678",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    fontWeight: 600,
  },
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 7,
  },
  typeBtn: {
    background: "#13131d",
    border: "1px solid #1e1e28",
    borderRadius: 9,
    padding: "9px 10px",
    color: "#888890",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.15s",
  },
  typeBtnActive: {
    background: "rgba(124, 58, 237, 0.12)",
    borderColor: "#7c3aed",
    color: "#a78bfa",
  },
  typeIcon: { fontSize: 15 },
  typeName: { fontSize: 11.5 },
  toneRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  toneBtn: {
    background: "#13131d",
    border: "1px solid #1e1e28",
    borderRadius: 20,
    padding: "5px 13px",
    color: "#666678",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    transition: "all 0.15s",
  },
  toneBtnActive: {
    background: "rgba(167, 139, 250, 0.12)",
    borderColor: "#a78bfa",
    color: "#a78bfa",
  },
  topicInput: {
    width: "100%",
    background: "#13131d",
    border: "1px solid #1e1e28",
    borderRadius: 10,
    color: "#e2e2f0",
    fontFamily: "inherit",
    fontSize: 13,
    padding: "12px 14px",
    lineHeight: 1.6,
    transition: "border-color 0.2s",
  },
  sampleRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 8, flexWrap: "wrap" },
  sampleLabel: { fontSize: 10, color: "#555565" },
  sampleChip: {
    background: "transparent",
    border: "1px solid #1e1e28",
    borderRadius: 6,
    padding: "3px 9px",
    fontSize: 10,
    color: "#666678",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  generateBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #7c3aed, #a78bfa)",
    border: "none",
    borderRadius: 11,
    color: "#fff",
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14,
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: 4,
  },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: {
    width: 14, height: 14,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    display: "inline-block",
    animation: "spin 0.7s linear infinite",
  },
  errorBox: {
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.2)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#f87171",
    fontSize: 12,
  },
  outputCol: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    background: "#0c0c10",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
  },
  emptyIcon: {
    fontSize: 40,
    color: "#2a2a3a",
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "#44445a", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#333345", marginBottom: 24, maxWidth: 320, margin: "0 auto 24px" },
  exampleList: { display: "flex", flexDirection: "column", gap: 8, alignItems: "center" },
  exampleItem: {
    fontSize: 12,
    color: "#555568",
    cursor: "pointer",
    padding: "6px 14px",
    borderRadius: 6,
    border: "1px solid #1a1a28",
    background: "#0e0e16",
    transition: "all 0.15s",
  },
  loadingState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 20px",
    gap: 16,
  },
  loadingDots: { display: "flex", gap: 8 },
  dot: {
    width: 10, height: 10,
    background: "#7c3aed",
    borderRadius: "50%",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },
  loadingText: { fontSize: 14, color: "#555568" },
  outputCard: {
    background: "#10101a",
    border: "1px solid #1e1e28",
    borderRadius: 14,
    overflow: "hidden",
  },
  outputHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid #1a1a28",
    flexWrap: "wrap",
    gap: 10,
  },
  outputMeta: { display: "flex", gap: 8 },
  outputTypeBadge: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 5,
    background: "rgba(124,58,237,0.12)",
    color: "#a78bfa",
    border: "1px solid rgba(124,58,237,0.2)",
  },
  outputToneBadge: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 5,
    background: "#13131d",
    color: "#666678",
    border: "1px solid #1e1e28",
  },
  outputActions: { display: "flex", gap: 8 },
  actionBtn: {
    background: "transparent",
    border: "1px solid #2a2a3a",
    borderRadius: 7,
    color: "#888890",
    padding: "6px 13px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s",
  },
  copyBtn: {},
  copiedBtn: {
    background: "rgba(0,229,160,0.08)",
    borderColor: "#00e5a0",
    color: "#00e5a0",
  },
  outputBody: {
    padding: "20px 22px",
    fontSize: 13.5,
    lineHeight: 1.8,
    color: "#d0d0e0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    minHeight: 200,
  },
  outputFooter: {
    padding: "12px 18px",
    borderTop: "1px solid #1a1a28",
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
  },
  stat: { fontSize: 11, color: "#444455" },
};
