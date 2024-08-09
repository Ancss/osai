import React from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { ExecutionStep } from "@/type";

const ExecutionStepComponent: React.FC<{ step: ExecutionStep }> = ({
  step,
}) => {
  const getStatusIcon = () => {
    switch (step.status) {
      case "success":
        return <CheckCircle className="text-green-500" />;
      case "failure":
        return <XCircle className="text-red-500" />;
      default:
        return <Clock className="text-gray-500" />;
    }
  };

  return (
    <div className="border rounded p-2 mb-2">
      <div className="flex items-center">
        {getStatusIcon()}
        <span className="ml-2 font-bold">{step.step}</span>
      </div>
      <pre className="bg-gray-100 p-2 mt-2 rounded text-sm overflow-x-auto">
        <code>{step.code}</code>
      </pre>
      {step.result && (
        <div className="mt-2">
          <strong>Result:</strong>
          <p>{step.result}</p>
        </div>
      )}
    </div>
  );
};

export default ExecutionStepComponent;
