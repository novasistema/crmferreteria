import React, { forwardRef, useEffect, useRef, useState } from 'react';

// Campo numérico con formato argentino: el punto separa miles y la coma, decimales.
// "10.200" = diez mil doscientos · "10,5" = diez y medio · "1.234,56" = mil doscientos treinta y cuatro con 56.
// Un único punto seguido de 1, 2 o 4+ dígitos ("2.5", "0.75") se toma como decimal, porque así escribe el teclado numérico.
export const parseArNumber = (raw: string): number | null => {
  let t = String(raw ?? '').replace(/[\s$]/g, '');
  if (!t || t === '-' || t === ',' || t === '.') return null;
  const neg = t.startsWith('-');
  if (neg) t = t.slice(1);
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.').replace(/,/g, '');
  } else {
    const dots = (t.match(/\./g) || []).length;
    if (dots > 1) t = t.replace(/\./g, '');
    else if (dots === 1 && /^\d{1,3}\.\d{3}$/.test(t)) t = t.replace('.', '');
  }
  if (!/^\d*\.?\d*$/.test(t) || t === '' || t === '.') return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
};

// Se muestra con separador de miles solo desde 10.000 (así un año como 2026 queda "2026")
export const formatArNumber = (value: unknown): string => {
  if (value === '' || value === null || value === undefined) return '';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const abs = Math.abs(n);
  return n.toLocaleString('es-AR', { maximumFractionDigits: 4, useGrouping: abs >= 10000 });
};

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>;

export const NumInput = forwardRef<HTMLInputElement, Props>(({ value, onChange, onFocus, onBlur, min, max, step, ...rest }, ref) => {
  const [text, setText] = useState(() => formatArNumber(value));
  const focused = useRef(false);

  // Si el valor cambia desde afuera (un cálculo, un botón), se muestra el nuevo
  useEffect(() => {
    const current = parseArNumber(text);
    const incoming = value === '' || value === undefined || value === null ? null : Number(value);
    if (focused.current && current === incoming) return;
    if (focused.current && current === null && incoming === 0) return;
    setText(focused.current ? (incoming === null ? '' : String(value).replace('.', ',')) : formatArNumber(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (e: React.ChangeEvent<HTMLInputElement>, canonical: string) => {
    if (!onChange) return;
    const target = e.target;
    const fake = {
      value: canonical,
      valueAsNumber: canonical === '' ? NaN : Number(canonical),
      name: target.name,
      id: target.id,
      type: 'number',
      dataset: target.dataset
    };
    onChange({ ...e, target: fake, currentTarget: fake } as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <input
      {...rest}
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={text}
      onFocus={e => {
        focused.current = true;
        onFocus?.(e);
      }}
      onBlur={e => {
        focused.current = false;
        const n = parseArNumber(text);
        setText(n === null ? (text.trim() === '' ? '' : formatArNumber(value)) : formatArNumber(n));
        onBlur?.(e);
      }}
      onChange={e => {
        const raw = e.target.value;
        if (!/^[-\d.,\s$]*$/.test(raw)) return; // solo números, punto, coma y signo
        setText(raw);
        const n = parseArNumber(raw);
        emit(e, n === null ? '' : String(n));
      }}
    />
  );
});
NumInput.displayName = 'NumInput';
