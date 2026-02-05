import React, { useState, useEffect } from "react";

type SearchBarProps = {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showFilters?: boolean;
  filters?: {
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (value: string) => void;
  }[];
};

export default function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  onClear,
  debounceMs = 300,
  showFilters = false,
  filters = [],
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <span
          style={{
            position: "absolute",
            left: "12px",
            fontSize: "18px",
            color: "#6c757d",
          }}
        >
          🔍
        </span>
        <input
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="input"
          style={{
            paddingLeft: "40px",
            paddingRight: localValue ? "40px" : "12px",
            fontSize: "14px",
          }}
        />
        {localValue && (
          <button
            onClick={() => {
              setLocalValue("");
              onClear?.();
            }}
            style={{
              position: "absolute",
              right: "8px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: "#6c757d",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ×
          </button>
        )}
      </div>
      {showFilters && filters.length > 0 && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {filters.map((filter, index) => (
            <select
              key={index}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="select"
              style={{
                minWidth: "150px",
                fontSize: "13px",
                padding: "6px 12px",
              }}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  );
}
