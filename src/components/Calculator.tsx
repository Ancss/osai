import React, { useState } from "react";
import { calculate } from "../services/CalculatorService";

const Calculator: React.FC = () => {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("");

  const handleCalculate = () => {
    try {
      const calculatedResult = calculate(expression);
      setResult(calculatedResult.toString());
    } catch (error) {
      setResult("Error");
    }
  };

  return (
    <div className="mt-4">
      <input
        type="text"
        value={expression}
        onChange={(e) => setExpression(e.target.value)}
        className="w-full p-2 rounded-lg border"
        placeholder="Enter calculation"
      />
      <button
        onClick={handleCalculate}
        className="mt-2 p-2 bg-blue-500 text-white rounded"
      >
        Calculate
      </button>
      {result && <div className="mt-2">Result: {result}</div>}
    </div>
  );
};

export default Calculator;
