/**
 * useSanitizedHTML - Hook for sanitizing HTML content from LLM outputs
 * 
 * Prevents XSS attacks by sanitizing all HTML/Markdown from AI responses.
 */

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface UseSanitizedHTMLOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripIgnoreTag?: boolean;
}

// Define TrustedHTML interface if not available
interface TrustedHTML {
  toString: () => string;
}

const defaultConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
} as unknown as DOMPurify.Config;

export function useSanitizedHTML(
  dirtyHTML: string | TrustedHTML,
  options: UseSanitizedHTMLOptions = {}
): string {
  return useMemo(() => {
    const config: DOMPurify.Config = {
      ...defaultConfig,
      ...(options.allowedTags ? { ALLOWED_TAGS: options.allowedTags } : {}),
      ...(options.allowedAttributes ? { ALLOWED_ATTR: options.allowedAttributes } : {}),
    };

    const htmlString = typeof dirtyHTML === 'string' ? dirtyHTML : dirtyHTML.toString();
    return DOMPurify.sanitize(htmlString, config as any) as unknown as string;
  }, [dirtyHTML, options]);
}

/**
 * sanitizeHTML - Direct function for one-off sanitization
 */
export function sanitizeHTML(
  dirtyHTML: string,
  config: DOMPurify.Config = {}
): string {
  return DOMPurify.sanitize(dirtyHTML, { ...defaultConfig, ...config } as any) as unknown as string;
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
  className = '',
  as: Component = 'div'
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
