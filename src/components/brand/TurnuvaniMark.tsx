import type { SVGProps } from "react";

/** Compact hexagon cluster inspired by the Turnuvani wordmark. */
export function TurnuvaniMark({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} {...props}>
      {title ? <title>{title}</title> : null}
      <g stroke="#fff" strokeOpacity=".58" strokeWidth="1.1" strokeLinejoin="round">
        <path d="m25.5 4 6 3.5v7l-6 3.5-6-3.5v-7l6-3.5Z" fill="#2563EB" />
        <path d="m12.5 14 7 4v8l-7 4-7-4v-8l7-4Z" fill="#3B82F6" />
        <path d="m29.5 16 6.5 3.75v7.5L29.5 31 23 27.25v-7.5l6.5-3.75Z" fill="#1D4ED8" />
        <path d="m20.5 30 5.5 3.2v6.4l-5.5 3.2-5.5-3.2v-6.4l5.5-3.2Z" fill="#2864EB" />
        <path d="m34.5 32 4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3Z" fill="#60A5FA" />
      </g>
      <path d="m25.5 4 6 3.5-6 3.5-6-3.5 6-3.5ZM12.5 14l7 4-7 4-7-4 7-4ZM29.5 16l6.5 3.75-6.5 3.75-6.5-3.75 6.5-3.75Z" fill="#BFDBFE" fillOpacity=".58" />
    </svg>
  );
}
