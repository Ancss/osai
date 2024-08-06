import React, { useState, useEffect } from "react";
import { getFilePreview } from "../services/FileSystemService";

interface PreviewProps {
  result: {
    type: string;
    path?: string;
    name: string;
  };
}

const Preview: React.FC<PreviewProps> = ({ result }) => {
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const loadPreview = async () => {
      if (result.type === "file" && result.path) {
        try {
          const filePreview = await getFilePreview(result.path);
          setPreview(filePreview);
        } catch (error) {
          setPreview("Unable to load preview");
        }
      } else {
        setPreview(`${result.type}: ${result.name}`);
      }
    };

    loadPreview();
  }, [result]);

  return (
    <div className="mt-4 p-2 bg-gray-100 rounded">
      <h3 className="font-bold">{result.name}</h3>
      <pre className="mt-2 whitespace-pre-wrap">{preview}</pre>
    </div>
  );
};

export default Preview;
