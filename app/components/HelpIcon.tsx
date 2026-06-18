"use client";

import { useState } from "react";

interface HelpIconProps {
  text: string;
  title?: string;
}

export function HelpIcon({ text, title }: HelpIconProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition text-xs font-semibold"
      >
        ?
      </button>

      {show && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-lg z-50">
          {title && (
            <p className="text-xs font-semibold text-blue-300 mb-1">{title}</p>
          )}
          <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}