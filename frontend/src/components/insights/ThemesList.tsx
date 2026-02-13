"use client";

import * as Accordion from "@radix-ui/react-accordion";
import type { Theme } from "@/types";

interface ThemesListProps {
  themes: Theme[];
  title: string;
  subtitle: string;
  emptyMessage: string;
}

export function ThemesList({ themes, title, subtitle, emptyMessage }: ThemesListProps) {
  if (themes.length === 0) {
    return (
      <div>
        <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
          {title}
        </h3>
        <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
          {subtitle}
        </p>
        <p className="text-sm text-text-secondary bg-bg-secondary rounded-md p-4">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-[22px] font-semibold text-text-primary tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-text-secondary leading-relaxed mb-4">
        {subtitle}
      </p>

      <Accordion.Root type="multiple" defaultValue={themes.slice(0, 2).map((_, i) => String(i))}>
        {themes.map((theme, idx) => (
          <Accordion.Item
            key={idx}
            value={String(idx)}
            className="border border-border rounded-md mb-2 overflow-hidden"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <Accordion.Header>
              <Accordion.Trigger className="w-full px-4 py-3.5 text-left text-sm font-medium text-text-primary flex items-center justify-between hover:bg-bg-secondary/50 transition-colors group">
                <span>
                  {idx + 1}. &ldquo;{theme.theme}&rdquo; — mentioned {theme.mentions} times
                </span>
                <svg
                  className="w-4 h-4 text-text-secondary transition-transform duration-200 group-data-[state=open]:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-4 pb-4 text-sm">
              {theme.related_words.length > 0 && (
                <p className="text-text-secondary mb-2">
                  <span className="font-semibold text-text-primary">Related topics:</span>{" "}
                  {theme.related_words.join(", ")}
                </p>
              )}
              <p className="font-semibold text-text-primary mb-1">Example review:</p>
              <blockquote className="border-l-2 border-border pl-3 text-text-secondary">
                <p className="font-medium text-text-primary">
                  {theme.example_title}{" "}
                  <span style={{ color: "#FFB800" }}>
                    {"★".repeat(theme.example_rating)}
                  </span>{" "}
                  — {theme.example_date}
                </p>
                <p className="mt-1">{theme.example_review}</p>
              </blockquote>
              <p className="text-xs text-text-secondary mt-2">
                — {theme.example_author} ({theme.matching_count} matching reviews)
              </p>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </div>
  );
}
