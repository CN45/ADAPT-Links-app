import {
  ArrowUpRight,
  Clipboard,
  Github,
  Search,
  SlidersHorizontal,
  Sparkles
} from "lucide-react";
import { useMemo, useState } from "react";
import rawLinks from "./data/links.json";
import type { ResourceLink, SortKey } from "./types";

const links = rawLinks as ResourceLink[];
const categories = ["All", ...Array.from(new Set(links.map((link) => link.category))).sort()];

const sortLabels: Record<SortKey, string> = {
  recommended: "Recommended",
  newest: "Newest",
  title: "Title",
  category: "Category"
};

const suggestionIssueUrl =
  "https://github.com/CN45/ADAPT-Links-app/issues/new?template=suggest-link.yml&title=Suggest%20an%20ADAPT%20Link";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
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
