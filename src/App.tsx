import React, { useState } from "react";
import SearchBar from "./components/SearchBar";
import SearchResults from "./components/SearchResults";
import Calculator from "./components/Calculator";
import Preview from "./components/Preview";
import Settings from "./components/Settings";
import useSearch from "./hooks/useSearch";
import useHotkey from "./hooks/useHotkey";
import { SearchResult } from "./services/SearchService";

const App: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { results, search, isLoading, error } = useSearch();
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const [showSettings, setShowSettings] = useState(false);

  useHotkey("CommandOrControl+Space", () => setIsVisible((prev) => !prev));

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 w-2/3 max-w-3xl">
        <SearchBar onSearch={search} />
        {isLoading && <div className="mt-4 text-center">Loading...</div>}
        {error && <div className="mt-4 text-red-500 text-center">{error}</div>}
        {!isLoading && !error && (
          <SearchResults results={results} onSelect={setSelectedResult} />
        )}
        {selectedResult && <Preview result={selectedResult} />}
        <Calculator />
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            {showSettings ? "Hide Settings" : "Show Settings"}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
        {showSettings && <Settings />}
      </div>
    </div>
  );
};

export default App;
