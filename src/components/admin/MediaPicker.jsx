import React, { useId, useMemo } from 'react';
import { ImagePlus, Paperclip, Upload, Video } from 'lucide-react';

const MediaPicker = ({
  label = 'Adjuntar archivo',
  accept = 'image/*',
  file = null,
  onChange,
  previewUrl = '',
  helperText = '',
  type = 'image',
}) => {
  const inputId = useId();

  const objectUrl = useMemo(() => {
    if (!file) return '';
    return URL.createObjectURL(file);
  }, [file]);

  const resolvedPreview = objectUrl || previewUrl || '';
  const isVisual = type === 'image';

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-white/10 bg-[#050510] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          {helperText ? <p className="mt-1 text-xs text-[#a7a8c7]">{helperText}</p> : null}
        </div>

        <div>
          <input
            id={inputId}
            type="file"
            accept={accept}
            onChange={(event) => onChange?.(event.target.files?.[0] || null)}
            className="hidden"
          />
          <label
            htmlFor={inputId}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-white/20 hover:bg-white/10"
          >
            {type === 'image' ? <ImagePlus size={16} /> : <Video size={16} />}
            Adjuntar
          </label>
        </div>
      </div>

      {file ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          <Upload size={14} />
          <span>{file.name}</span>
        </div>
      ) : null}

      {resolvedPreview ? (
        isVisual ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <img src={resolvedPreview} alt="Vista previa" className="h-44 w-full object-cover" />
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-[#cbd2f1]">
            <div className="inline-flex items-center gap-2 text-white">
              <Paperclip size={15} />
              Archivo listo
            </div>
            <p className="mt-2 break-all text-xs text-[#a7a8c7]">{file?.name || previewUrl}</p>
          </div>
        )
      ) : null}
    </div>
  );
};

export default MediaPicker;
