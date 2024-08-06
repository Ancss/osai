import React from "react";

interface SearchResult {
  id: string;
  name: string;
  type: "file" | "app" | "web" | "command";
}

interface SearchResultsProps {
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect }) => {
  return (
    <ul className="mt-2">
      {results.map((result) => (
        <li
          key={result.id}
          onClick={() => onSelect(result)}
          className="p-2 hover:bg-gray-100 cursor-pointer"
        >
          {result.name} ({result.type})
        </li>
      ))}
    </ul>
  );
};

export default SearchResults;
