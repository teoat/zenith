/**
 * useSanitizedHTML - Hook for sanitizing HTML content from LLM outputs
 * 
 * Prevents XSS attacks by sanitizing all HTML/Markdown from AI responses.
 */

import { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface UseSanitizedHTMLOptions {
  allowedTags?: string[];
  allowedAttributes?: { [key: string]: string[] };
  stripIgnoreTag?: boolean;
}

const defaultConfig: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
    'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'a', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
  ],
  ALLOWED_ATTR: ['href', 'class', 'id', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

export function useSanitizedHTML(
  dirtyHTML: string,
  options: UseSanitizedHTMLOptions = {}
): string {
  return useMemo(() => {
    const config: DOMPurify.Config = {
      ...defaultConfig,
      ...(options.allowedTags && { ALLOWED_TAGS: options.allowedTags }),
      ...(options.allowedAttributes && { ALLOWED_ATTR: options.allowedAttributes }),
    };

    return DOMPurify.sanitize(dirtyHTML, config);
  }, [dirtyHTML, options]);
}

/**
 * sanitizeHTML - Direct function for one-off sanitization
 */
export function sanitizeHTML(
  dirtyHTML: string,
  config: DOMPurify.Config = {}
): string {
  return DOMPurify.sanitize(dirtyHTML, { ...defaultConfig, ...config });
}

/**
 * SanitizedHTML - Component for safely rendering HTML content
 */
interface SanitizedHTMLProps {
  html: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
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
