import { useMemo } from 'react';

export default function BackgroundSymbols() {
  const symbols = useMemo(() => ['+', '-', '×', '÷', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '=', '?', '%', 'π'], []);

  return (
    <div className="bg-symbols">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="symbol"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${15 + Math.random() * 10}s`,
            fontSize: `${1 + Math.random() * 2}rem`,
            opacity: 0.3 + Math.random() * 0.5,
          }}
        >
          {symbols[Math.floor(Math.random() * symbols.length)]}
        </div>
      ))}
    </div>
  );
}
