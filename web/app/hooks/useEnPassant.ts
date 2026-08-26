import { useState, useEffect } from "react";

export const useEnPassant = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initWasm = async () => {
      try {
        const response = await fetch("/EnPassant/enpassant.js");
        const scriptText = await response.text();

        const script = document.createElement("script");
        script.text = scriptText;
        document.body.appendChild(script);

        console.log("WASM Script Injected. Booting Tensor Engine...");

        const Module = await (window as any).createEnpassantModule({
          locateFile: (path: string) => "/EnPassant" + path,
        });

        (window as any).enpassantEngineInstance = Module;

        console.log("Native AI Engine Online!");
        setIsReady(true);
      } catch (error) {
        console.error("FATAL WASM ERROR:", error);
      }
    };

    if (!(window as any).enpassantEngineInstance) {
      initWasm();
    } else {
      setIsReady(true);
    }
  }, []);

  const evaluateTransaction = (tx: any) => {
    if (!isReady || !(window as any).enpassantEngineInstance) {
      return { risk_score: 0, is_blocked: false };
    }

    return (window as any).enpassantEngineInstance.evaluateTransaction(tx);
  };

  return { isReady, evaluateTransaction };
};
