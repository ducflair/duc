"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
}

export function RecentUpdatesSection() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("All");

  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/ducflair/duc/releases?per_page=30&page=${pageNum}`);
      if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
      const data: GitHubRelease[] = await res.json();
      if (Array.isArray(data)) {
        if (data.length < 30) {
          setHasMore(false);
        }
        setReleases((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newUnique = data.filter((r) => !existingIds.has(r.id));
          return [...prev, ...newUnique];
        });
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching GitHub releases:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Infinite scroll observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchPage(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPage]);

  const extractPackageName = (tagName: string): string => {
    if (tagName.includes("@")) {
      return tagName.split("@")[0];
    }
    return "general";
  };

  const getPackageBadgeColor = (pkg: string) => {
    switch (pkg.toLowerCase()) {
      case "ducrs":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "ducjs":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "ducpy":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "ducpdf":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      case "ducsvg":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-fd-accent text-fd-muted-foreground border-fd-border";
    }
  };

  const packageFilters = ["All", "ducrs", "ducjs", "ducpy", "ducpdf", "ducsvg"];

  const filteredReleases = releases.filter((rel) => {
    const pkg = extractPackageName(rel.tag_name);
    const matchesPackage = selectedPackage === "All" || pkg.toLowerCase() === selectedPackage.toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      rel.tag_name.toLowerCase().includes(q) ||
      rel.name?.toLowerCase().includes(q) ||
      rel.body?.toLowerCase().includes(q);
    return matchesPackage && matchesSearch;
  });

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const renderSimpleMarkdown = (text: string) => {
    if (!text) return <p className="text-fd-muted-foreground italic">No release notes available.</p>;

    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-fd-foreground mt-3 mb-1">
            {trimmed.replace(/^###\s+/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3 key={idx} className="text-base font-bold text-fd-foreground mt-4 mb-2">
            {trimmed.replace(/^##\s+/, "")}
          </h3>
        );
      }
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        const bulletText = trimmed.replace(/^[\*\-]\s+/, "");
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-fd-foreground/90 my-1">
            {bulletText}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-fd-foreground/90 my-1 leading-relaxed">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="my-6 space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-fd-border pb-3">
        <div className="flex flex-wrap gap-1.5">
          {packageFilters.map((pkg) => (
            <button
              key={pkg}
              onClick={() => setSelectedPackage(pkg)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                selectedPackage === pkg
                  ? "bg-fd-primary text-fd-primary-foreground font-semibold"
                  : "bg-fd-accent text-fd-muted-foreground hover:bg-fd-accent/80 hover:text-fd-foreground"
              }`}
            >
              {pkg}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter release notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-md border border-fd-border bg-fd-background px-3 py-1 text-xs text-fd-foreground focus:outline-none focus:ring-1 focus:ring-fd-ring w-full sm:w-56"
        />
      </div>

      {/* Release Cards */}
      <div className="space-y-4">
        {filteredReleases.map((rel) => {
          const pkg = extractPackageName(rel.tag_name);
          const badgeClass = getPackageBadgeColor(pkg);

          return (
            <div
              key={rel.id}
              className="rounded-lg border border-fd-border bg-fd-card p-5 shadow-xs transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-fd-border/50 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-bold rounded border font-mono ${badgeClass}`}>
                    {pkg}
                  </span>
                  <span className="font-mono font-bold text-base text-fd-foreground">
                    {rel.tag_name}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-fd-muted-foreground">
                  <span>{formatDate(rel.published_at)}</span>
                  <a
                    href={rel.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-fd-primary hover:underline font-medium"
                  >
                    GitHub ↗
                  </a>
                </div>
              </div>

              {/* Formatted Release Body */}
              <div className="text-xs space-y-1">
                {renderSimpleMarkdown(rel.body)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Load Trigger */}
      <div ref={observerTarget} className="py-4 text-center text-xs text-fd-muted-foreground">
        {loading ? (
          <span>Loading more releases...</span>
        ) : hasMore ? (
          <span>Scroll down for more updates</span>
        ) : (
          <span>End of release history</span>
        )}
      </div>
    </div>
  );
}

export default RecentUpdatesSection;
