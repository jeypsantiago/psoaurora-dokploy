import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getStorageItem, readStorageJsonSafe, writeStorageJson } from '../../services/storage';

interface CreatableSelectProps {
    value: string;
    onChange: (value: string) => void;
    /** Pass the current options array from your component's state. Used as the primary source of truth. */
    options?: string[];
    /** Also persist new entries to this localStorage key; will merge with options prop. */
    storageKey?: string;
    placeholder?: string;
    label?: string;
}

/**
 * A fully-custom dropdown that always shows all options (no browser filtering).
 * - If `options` prop is passed, those are always shown.
 * - If `storageKey` is passed, options are also merged with localStorage data.
 * - New typed values are saved back to localStorage on blur.
 */
export const CreatableSelect: React.FC<CreatableSelectProps> = ({
    value,
    onChange,
    options: propOptions,
    storageKey,
    placeholder = 'Select or type...',
    label,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [displayOptions, setDisplayOptions] = useState<string[]>(propOptions || []);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Merge propOptions + localStorage data, deduplicated
    const buildOptions = (): string[] => {
        const base = propOptions || [];
        if (!storageKey) return base;

        const stored = getStorageItem(storageKey);
        if (!stored) {
            // Seed localStorage from propOptions if it's empty
            if (base.length > 0) {
                writeStorageJson(storageKey, base);
            }
            return base;
        }

        const parsed = readStorageJsonSafe<unknown>(storageKey, base);
        if (!Array.isArray(parsed)) {
            return base;
        }

        // Merge, keeping all unique entries. Stored items that aren't in base are "user-added"
        const merged = [...base];
        for (const item of parsed) {
            const normalizedItem = String(item);
            if (!merged.includes(normalizedItem)) merged.push(normalizedItem);
        }
        return merged;
    };

    // Refresh display options whenever the dropdown opens or propOptions changes
    useEffect(() => {
        setDisplayOptions(buildOptions());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, JSON.stringify(propOptions)]);

    // Auto-save new value to localStorage when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                if (storageKey && value.trim() !== '') {
                    const current = buildOptions();
                    if (!current.includes(value.trim())) {
                        const updated = [...current, value.trim()];
                        writeStorageJson(storageKey, updated);
                        setDisplayOptions(updated);
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, storageKey, JSON.stringify(propOptions)]);

    const handleSelect = (opt: string) => {
        onChange(opt);
        setIsOpen(false);
    };

    return (
        <div className="space-y-1.5 w-full relative" ref={wrapperRef}>
            {label && (
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                    {label}
                </label>
            )}
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 pr-10 text-sm font-bold text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                    placeholder={placeholder}
                    autoComplete="off"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsOpen(prev => !prev);
                    }}
                    tabIndex={-1}
                >
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {isOpen && displayOptions.length > 0 && (
                <div className="absolute z-[9999] w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-56 overflow-y-auto py-1">
                    {displayOptions.map((opt, idx) => (
                        <div
                            key={`${opt}-${idx}`}
                            onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
                            className={`px-4 py-2.5 text-sm font-medium cursor-pointer transition-colors
                                ${opt === value
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold'
                                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                                }`}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
