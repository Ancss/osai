import React, { useState, useCallback, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/tauri";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const DEBOUNCE_DELAY = 300; // ms

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");
  const timeoutRef = useRef<number | null>(null);
  const composingRef = useRef(false);
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      // onSearch(e.target.value);
    },
    [onSearch]
  );
  const debouncedSearch = useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setQuery(value);
        onSearch(value);
      }, DEBOUNCE_DELAY);
    },
    [onSearch]
  );
  useEffect(() => {
    if (!composingRef.current) {
      debouncedSearch(query);
    }
  }, [query, debouncedSearch]);
  const handleCompositionStart = () => {
    console.log("composition start");
    composingRef.current = true;
  };

  const handleCompositionEnd = (
    event: React.CompositionEvent<HTMLInputElement>
  ) => {
    console.log("composition end");
    composingRef.current = false;
    debouncedSearch(query);
    // setQuery(event.currentTarget.value);
  };
  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      placeholder="Search or type a command"
      className="w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export default SearchBar;
