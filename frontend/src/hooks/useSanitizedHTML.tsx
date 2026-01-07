/**
 * useSanitizedHTML - Hook for sanitizing HTML content from LLM outputs
 *
 * Prevents XSS attacks by sanitizing all HTML/Markdown from AI responses.
 */

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface UseSanitizedHTMLOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripIgnoreTag?: boolean;
}

interface TrustedHTML {
  toString: () => string;
}

interface SanitizeConfig {
  ALLOWED_TAGS?: string[];
  ALLOWED_ATTR?: string[];
  [key: string]: unknown;
}

const defaultConfig: SanitizeConfig = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "code",
    "pre",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "span",
    "div",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
  ],
};

export function useSanitizedHTML(
  dirtyHTML: string | TrustedHTML,
  options: UseSanitizedHTMLOptions = {},
): string {
  return useMemo(() => {
    const config: SanitizeConfig = {
      ...defaultConfig,
      ...(options.allowedTags ? { ALLOWED_TAGS: options.allowedTags } : {}),
      ...(options.allowedAttributes
        ? { ALLOWED_ATTR: options.allowedAttributes }
        : {}),
    };

    const htmlString =
      typeof dirtyHTML === "string" ? dirtyHTML : dirtyHTML.toString();
    return DOMPurify.sanitize(htmlString, config);
  }, [dirtyHTML, options]);
}

export function sanitizeHTML(
  dirtyHTML: string,
  config: SanitizeConfig = {},
): string {
  return DOMPurify.sanitize(dirtyHTML, { ...defaultConfig, ...config });
}

/**
 * SanitizedHTML - Component for safely rendering HTML content
 */
interface SanitizedHTMLProps {
  html: string;
  className?: string;
  as?: React.ElementType;
}

export const SanitizedHTML: React.FC<SanitizedHTMLProps> = ({
  html,
  className = "",
  as: Component = "div",
}) => {
  const cleanHTML = useSanitizedHTML(html);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: cleanHTML }}
    />
  );
};

export default useSanitizedHTML;
