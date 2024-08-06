import { useState, useCallback } from "react";
import { search, SearchResult } from "../services/SearchService";

export default function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim() === "") {
      setResults([]);
      return;
    }
    console.log("performSearch", query);
    const searchResults = await search(query);
    console.log(searchResults, "searchResults");
    setResults(searchResults);
  }, []);

  return {
    results,
    search: performSearch,
    isLoading: false,
    error: false,
  };
}
