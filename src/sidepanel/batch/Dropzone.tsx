import { useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeContext';
import { MAX_BATCH_SIZE } from '@shared/types/batch';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

export function Dropzone({ onFiles, disabled }: DropzoneProps) {
  const { tokens: t } = useTheme();
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = (files: FileList | null) => {
    if (!files || disabled) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length > 0) onFiles(arr.slice(0, MAX_BATCH_SIZE));
  };

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        accept(e.dataTransfer.files);
      }}
      style={{
        border: `2px dashed ${hover ? t.accent : t.cardBorder}`,
        borderRadius: 10,
        padding: '24px 16px',
        textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        background: hover ? t.accentGlow : t.card,
        transition: 'all 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ fontSize: 28 }}>{'\u{1F4F8}'}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginTop: 8 }}>
        Drop images here
      </div>
      <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
        or click to choose (up to {MAX_BATCH_SIZE})
      </div>
      <div style={{ fontSize: 10, color: t.textDim, marginTop: 6, lineHeight: 1.5 }}>
        Shelf photos, barcodes, packaging, or seller-tool screenshots.
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}
