"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { StarRating } from "@/components/shared/StarRating";
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
        <div className="space-y-2">
          {themes.map((theme, idx) => (
            <Accordion.Item
              key={idx}
              value={String(idx)}
              className="rounded-md overflow-hidden bg-bg-tertiary"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <Accordion.Header>
                <Accordion.Trigger className="w-full px-4 py-3.5 text-left text-sm font-medium text-text-primary flex items-center justify-between hover:bg-bg-secondary/60 transition-colors group">
                  <span>
                    <span className="text-text-tertiary mr-1.5">{idx + 1}.</span>
                    &ldquo;{theme.theme}&rdquo;
                    <span className="text-text-tertiary font-normal ml-2">
                      {theme.mentions} mentions
                    </span>
                  </span>
                  <svg
                    className="w-4 h-4 text-text-tertiary transition-transform duration-200 group-data-[state=open]:rotate-180"
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
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {theme.related_words.map((w) => (
                      <span
                        key={w}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-pill bg-bg-secondary text-text-secondary"
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                )}
                <blockquote className="bg-bg-secondary rounded-sm px-3.5 py-3 text-text-secondary">
                  <p className="font-medium text-text-primary text-[13px] mb-1">
                    {theme.example_title}{" "}
                    <StarRating rating={theme.example_rating} size="sm" />
                    <span className="text-text-tertiary font-normal text-xs ml-2">
                      {theme.example_date}
                    </span>
                  </p>
                  <p className="text-[13px] leading-relaxed">{theme.example_review}</p>
                </blockquote>
                <p className="text-xs text-text-tertiary mt-2">
                  {theme.example_author} &middot; {theme.matching_count} matching reviews
                </p>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </div>
      </Accordion.Root>
    </div>
  );
}
