import {
  ArrowLeft,
  ArrowUpRight,
  Clipboard,
  ClipboardCheck,
  Github,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import rawLinks from "./data/links.json";
import type { ResourceLink, SortKey } from "./types";

const links = rawLinks as ResourceLink[];
const linkCategories = Array.from(new Set(links.map((link) => link.category))).sort();
const categories = ["All", ...linkCategories];

const sortLabels: Record<SortKey, string> = {
  recommended: "Recommended",
  newest: "Newest",
  title: "Title",
  category: "Category"
};

const suggestionIssueUrl =
  "https://github.com/CN45/ADAPT-Links-app/issues/new?template=suggest-link.yml&title=Suggest%20an%20ADAPT%20Link";

const today = new Date().toISOString().slice(0, 10);

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function cleanUrl(value: string) {
  return value.replace(/[),.;\]]+$/g, "");
}

function titleFromUrl(url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host
      .split(".")[0]
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  } catch {
    return "Suggested Link";
  }
}

function parseIssueSection(text: string, heading: string) {
  const pattern = new RegExp(`### ${heading}\\s+([\\s\\S]*?)(?=\\n### |$)`, "i");
  return text.match(pattern)?.[1].trim() ?? "";
}

function parseTags(value: string) {
  return value
    .split(/[,;\n]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function parseImportedLinks(
  text: string,
  defaultCategory: string,
  defaultTags: string[],
  addedBy: string,
  dateAdded: string,
  recommended: boolean
) {
  const issueTitle = parseIssueSection(text, "Link title");
  const issueUrl = parseIssueSection(text, "URL");
  const issueDescription = parseIssueSection(text, "Why is this useful\\?");
  const issueCategory = parseIssueSection(text, "Category");
  const issueTags = parseIssueSection(text, "Tags");

  if (issueUrl) {
    return [
      {
        title: issueTitle || titleFromUrl(issueUrl),
        url: cleanUrl(issueUrl),
        description: issueDescription || "Suggested resource for the ADAPT AI Team.",
        category: issueCategory || defaultCategory,
        tags: parseTags(issueTags).length > 0 ? parseTags(issueTags) : defaultTags,
        addedBy,
        dateAdded,
        recommended,
        status: "active" as const
      }
    ];
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const urlPattern = /https?:\/\/[^\s)]+/g;
  const imported: ResourceLink[] = [];

  lines.forEach((line, index) => {
    const urls = line.match(urlPattern) ?? [];

    urls.forEach((rawUrl) => {
      const url = cleanUrl(rawUrl);
      const lineWithoutUrl = line.replace(rawUrl, "").replace(/^[-:–—\s]+|[-:–—\s]+$/g, "");
      const previousLine = [...lines]
        .slice(0, index)
        .reverse()
        .find((candidate) => !candidate.match(urlPattern) && candidate.length > 3);

      imported.push({
        title: lineWithoutUrl || previousLine || titleFromUrl(url),
        url,
        description: lineWithoutUrl
          ? `Suggested resource: ${lineWithoutUrl}.`
          : "Suggested resource for the ADAPT AI Team.",
        category: defaultCategory,
        tags: defaultTags,
        addedBy,
        dateAdded,
        recommended,
        status: "active"
      });
    });
  });

  return imported;
}

function sortLinks(items: ResourceLink[], sortKey: SortKey) {
  return [...items].sort((a, b) => {
    if (sortKey === "recommended") {
      return Number(b.recommended) - Number(a.recommended) || a.title.localeCompare(b.title);
    }

    if (sortKey === "newest") {
      return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
    }

    return a[sortKey].localeCompare(b[sortKey]);
  });
}

export function App() {
  const [route, setRoute] = useState(window.location.hash === "#/admin" ? "admin" : "home");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("recommended");
  const [copiedUrl, setCopiedUrl] = useState("");

  const activeLinks = links.filter((link) => link.status === "active");

  const filteredLinks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const results = activeLinks.filter((link) => {
      const matchesCategory = category === "All" || link.category === category;
      const searchableText = [
        link.title,
        link.url,
        link.description,
        link.category,
        ...link.tags
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && searchableText.includes(normalizedQuery);
    });

    return sortLinks(results, sortKey);
  }, [activeLinks, category, query, sortKey]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    window.setTimeout(() => setCopiedUrl(""), 1400);
  };

  const goHome = () => {
    window.location.hash = "";
    setRoute("home");
  };

  if (route === "admin") {
    return <ImportPage onBack={goHome} />;
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="ADAPT Links overview">
        <div>
          <p className="eyebrow">ADAPT AI Team</p>
          <h1>ADAPT Links</h1>
          <p className="intro">
            A curated resource list for AI tools, prompts, coding assistants, policies,
            workflows, and examples worth keeping close.
          </p>
        </div>
        <a className="suggest-button" href={suggestionIssueUrl} target="_blank" rel="noreferrer">
          <Github aria-hidden="true" size={18} />
          Suggest Link
        </a>
      </section>

      <section className="controls" aria-label="Filter and search links">
        <label className="search-box">
          <Search aria-hidden="true" size={18} />
          <span className="sr-only">Search links</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tools, topics, tags, or URLs"
          />
        </label>

        <label className="select-control">
          <SlidersHorizontal aria-hidden="true" size={17} />
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="select-control">
          <span>Sort</span>
          <select
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
          >
            {Object.entries(sortLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="summary-strip" aria-label="Link summary">
        <span>{filteredLinks.length} shown</span>
        <span>{activeLinks.length} active links</span>
        <span>{categories.length - 1} categories</span>
      </section>

      {filteredLinks.length > 0 ? (
        <section className="link-grid" aria-label="AI resource links">
          {filteredLinks.map((link) => (
            <article className="link-card" key={link.url}>
              <div className="card-header">
                <span className="category-pill">{link.category}</span>
                {link.recommended ? (
                  <span className="recommended">
                    <Sparkles aria-hidden="true" size={14} />
                    Recommended
                  </span>
                ) : null}
              </div>

              <h2>{link.title}</h2>
              <p>{link.description}</p>

              <div className="tags" aria-label={`${link.title} tags`}>
                {link.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              <div className="card-footer">
                <span>Added {formatDate(link.dateAdded)}</span>
                <div className="card-actions">
                  <button type="button" onClick={() => handleCopy(link.url)}>
                    <Clipboard aria-hidden="true" size={16} />
                    {copiedUrl === link.url ? "Copied" : "Copy"}
                  </button>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <ArrowUpRight aria-hidden="true" size={16} />
                    Open
                  </a>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="empty-state">
          <h2>No links found</h2>
          <p>Try a different search term or category.</p>
        </section>
      )}
    </main>
  );
}

function ImportPage({ onBack }: { onBack: () => void }) {
  const [sourceText, setSourceText] = useState("");
  const [defaultCategory, setDefaultCategory] = useState(linkCategories[0] ?? "Research and reading");
  const [tagsText, setTagsText] = useState("suggested");
  const [addedBy, setAddedBy] = useState("Cyndi");
  const [dateAdded, setDateAdded] = useState(today);
  const [recommended, setRecommended] = useState(false);
  const [copied, setCopied] = useState(false);

  const parsedLinks = useMemo(
    () =>
      parseImportedLinks(
        sourceText,
        defaultCategory,
        parseTags(tagsText),
        addedBy,
        dateAdded,
        recommended
      ),
    [addedBy, dateAdded, defaultCategory, recommended, sourceText, tagsText]
  );
  const jsonOutput = JSON.stringify(parsedLinks, null, 2).slice(1, -1).trim();

  const copyJson = async () => {
    await navigator.clipboard.writeText(jsonOutput);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <main className="app-shell">
      <section className="admin-header">
        <button className="back-button" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={18} />
          Links
        </button>
        <div>
          <p className="eyebrow">ADAPT AI Team</p>
          <h1>Import Links</h1>
          <p className="intro">
            Paste a GitHub suggestion or a block of links, then copy the generated JSON into
            `src/data/links.json`.
          </p>
        </div>
      </section>

      <section className="import-layout">
        <div className="import-panel">
          <label className="field-label" htmlFor="sourceText">
            Paste links or issue text
          </label>
          <textarea
            id="sourceText"
            className="import-textarea"
            value={sourceText}
            onChange={(event) => setSourceText(event.target.value)}
            placeholder="### Link title&#10;Careful Adoption of Agentic AI Services&#10;&#10;### URL&#10;https://example.com"
          />

          <div className="import-controls">
            <label className="field-label">
              Category
              <select value={defaultCategory} onChange={(event) => setDefaultCategory(event.target.value)}>
                {linkCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Tags
              <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} />
            </label>
            <label className="field-label">
              Added by
              <input value={addedBy} onChange={(event) => setAddedBy(event.target.value)} />
            </label>
            <label className="field-label">
              Date added
              <input
                type="date"
                value={dateAdded}
                onChange={(event) => setDateAdded(event.target.value)}
              />
            </label>
          </div>

          <label className="checkbox-control">
            <input
              type="checkbox"
              checked={recommended}
              onChange={(event) => setRecommended(event.target.checked)}
            />
            Recommended
          </label>
        </div>

        <div className="import-panel output-panel">
          <div className="output-header">
            <div>
              <p className="eyebrow">{parsedLinks.length} parsed</p>
              <h2>JSON Output</h2>
            </div>
            <button className="secondary-button" type="button" onClick={copyJson} disabled={!jsonOutput}>
              {copied ? (
                <ClipboardCheck aria-hidden="true" size={18} />
              ) : (
                <Clipboard aria-hidden="true" size={18} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="json-output">{jsonOutput || "[]"}</pre>
        </div>
      </section>
    </main>
  );
}
