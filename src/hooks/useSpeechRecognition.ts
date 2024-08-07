import { useState, useEffect } from "react";

export const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    let recognition: any;

    if ("webkitSpeechRecognition" in window) {
      recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        setTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = () => {
    setTranscript("");
    setIsListening(true);
    (window as any).webkitSpeechRecognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    (window as any).webkitSpeechRecognition.stop();
  };

  return { transcript, isListening, startListening, stopListening };
};
