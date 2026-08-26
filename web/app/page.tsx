"use client";
import { useState, useEffect } from "react";
import { useEnPassant } from "./hooks/useEnPassant";
import {
  Cpu,
  Terminal,
  ShieldAlert,
  Activity,
  Database,
  FileJson,
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isReady, evaluateTransaction } = useEnPassant();
  const [isStreaming, setIsStreaming] = useState(false);

  const [liveStream, setLiveStream] = useState<any[]>([]);
  const [quarantine, setQuarantine] = useState<any[]>([]);
  const [inspectedTx, setInspectedTx] = useState<any | null>(null);
  const [latency, setLatency] = useState<string>("0.00");

  const [commandInput, setCommandInput] = useState("");

  const handleInjectCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && commandInput.trim().startsWith("inject")) {
      const args: Record<string, any> = {};

      const parts = commandInput.split("--");
      parts.slice(1).forEach((part) => {
        const spaceIdx = part.trim().indexOf(" ");
        if (spaceIdx === -1) return;
        const key = part.trim().substring(0, spaceIdx).trim();
        const val = part
          .trim()
          .substring(spaceIdx + 1)
          .replace(/['"]/g, "")
          .trim();
        args[key] = isNaN(Number(val)) ? val : Number(val);
      });

      const customTx = {
        transaction_id: `pay_INJECT_${Math.floor(Math.random() * 9000) + 1000}`,
        user_id: "u_ADMIN_OVERRIDE",
        merchant: args["merchant"] || "Manual Terminal Entry",
        user_name: "Root User",
        device_name: "EnPassant CLI",
        amount: args["amount"] || 100,
        timestamp: Math.floor(Date.now() / 1000),
        hour_of_day: args["hour"] || 12,
        location: args["location"] || "IN",
        device_id: args["device"] || "auth_SECURE_NODE",
        is_fraud: 0,
      };

      const startTime = performance.now();
      const evaluation = evaluateTransaction(customTx);
      const rawLatency = performance.now() - startTime;

      setLatency(rawLatency < 1 ? "< 1.00" : rawLatency.toFixed(2));
      const timestamp = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        fractionalSecondDigits: 1,
      });
      const payload = { time: timestamp, tx: customTx, evaluation };

      if (evaluation.is_blocked) {
        setQuarantine((prev) => [payload, ...prev].slice(0, 4));
      }
      setLiveStream((prev) => [payload, ...prev].slice(0, 10));
      setInspectedTx(payload);
      setCommandInput(""); // Clear the terminal
    }
  };

  useEffect(() => setMounted(true), []);

  const generateRandomTransaction = () => {
    const isSuspicious = Math.random() < 0.15;

    const normalMerchants = [
      "Amazon India",
      "Swiggy",
      "Uber",
      "Starbucks",
      "Netflix",
      "Flipkart",
      "Zomato",
    ];
    const fraudMerchants = [
      "Unknown Crypto Exchange",
      "Offshore Wire Transfer",
      "High-Risk Merchant",
    ];
    const normalDevices = [
      "iPhone 13",
      "MacBook Pro",
      "Chrome (Windows 11)",
      "Safari (iOS)",
      "Zen (Fedora Linux)",
    ];
    return {
      transaction_id: `pay_${Math.floor(Math.random() * 900000) + 100000}`,
      user_id: `u_${Math.floor(Math.random() * 900) + 100}`,
      merchant: isSuspicious
        ? fraudMerchants[Math.floor(Math.random() * fraudMerchants.length)]
        : normalMerchants[Math.floor(Math.random() * normalMerchants.length)],
      user_name: isSuspicious
        ? "Unregistered Guest"
        : `User_${Math.floor(Math.random() * 900) + 100}`,
      device_name: isSuspicious
        ? "Rooted Android Emulator"
        : normalDevices[Math.floor(Math.random() * normalDevices.length)],
      amount: isSuspicious
        ? Math.floor(Math.random() * 800000) + 100000
        : Math.floor(Math.random() * 15000) + 100,
      timestamp: Math.floor(Date.now() / 1000),
      hour_of_day: isSuspicious
        ? Math.floor(Math.random() * 3) + 2
        : Math.floor(Math.random() * 24),
      location: "IN",
      device_id: isSuspicious
        ? "auth_FRAUD_NODE"
        : `auth_${Math.floor(Math.random() * 9000) + 1000}`,
      is_fraud: 0,
    };
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStreaming && isReady) {
      interval = setInterval(() => {
        const tx = generateRandomTransaction();

        const startTime = performance.now();
        const evaluation = evaluateTransaction(tx);
        const endTime = performance.now();

        const rawLatency = endTime - startTime;
        setLatency(rawLatency < 1 ? "< 1.00" : rawLatency.toFixed(2));
        const timestamp = new Date().toLocaleTimeString("en-US", {
          hour12: false,
          fractionalSecondDigits: 1,
        });

        const payload = { time: timestamp, tx, evaluation };

        if (evaluation.is_blocked) {
          setQuarantine((prev) => [payload, ...prev].slice(0, 4));
          setInspectedTx(payload);
        }

        setLiveStream((prev) => [payload, ...prev].slice(0, 10));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isStreaming, isReady]);

  if (!mounted) return <main className="h-screen bg-[#F2EFE5]" />;

  return (
    <main className="h-screen w-full overflow-hidden flex flex-col bg-[#F2EFE5] text-[#3A352F] font-sans p-4 lg:p-6 selection:bg-[#D8D3C4]">
      <header className="flex-none flex flex-col lg:flex-row justify-between items-stretch mb-6 bg-[#F9F8F6] border border-[#D8D3C4] shadow-sm rounded-md font-mono text-xs overflow-hidden">
        <div className="flex items-center bg-[#EAE6DB] px-5 py-4 border-b lg:border-b-0 lg:border-r border-[#D8D3C4] w-full lg:w-auto">
          <Terminal size={16} className="mr-2 text-[#C65342]" />
          <span className="font-bold tracking-widest uppercase text-[#3A352F] text-sm">
            EN_PASSANT
          </span>
          <span className="mx-3 text-[#9C9482]">/</span>
          <span className="font-semibold text-[#7A7265] tracking-widest">
            WASM_CORE
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-10 px-8 text-[#7A7265] tracking-wide flex-1">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-[#9C9482] tracking-widest">
              Engine Status
            </span>
            <span
              className={`flex items-center gap-1.5 font-bold ${
                !isReady
                  ? "text-[#C65342] animate-pulse"
                  : isStreaming
                    ? "text-[#5A7156]"
                    : "text-[#7A7265]"
              }`}
            >
              <Cpu size={14} />
              {!isReady
                ? "BOOTING SEQUENCE"
                : isStreaming
                  ? "ONLINE & YIELDING"
                  : "ENGINE ON STANDBY"}
            </span>
          </div>{" "}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-[#9C9482] tracking-widest">
              Avg Latency
            </span>
            <span className="flex items-center gap-1.5 font-bold text-[#3A352F]">
              <Activity size={14} />
              {isStreaming ? `${latency}ms` : "--ms"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] uppercase font-bold text-[#9C9482] tracking-widest">
              Mem Allocation
            </span>
            <span className="flex items-center gap-1.5 font-bold text-[#3A352F]">
              <Database size={14} /> 4.2MB
            </span>
          </div>
        </div>

        <div className="px-5 py-3 w-full lg:w-auto flex items-center justify-end bg-[#F9F8F6]">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            disabled={!isReady}
            className={`w-full lg:w-auto px-8 py-2.5 font-bold tracking-widest uppercase transition-all rounded-sm shadow-sm border ${
              isStreaming
                ? "bg-[#E3DFD5] text-[#3A352F] border-[#C4BFAF] hover:bg-[#D8D3C4]"
                : "bg-[#C65342] text-[#F9F8F6] border-[#C65342] hover:bg-[#A84334]"
            }`}
          >
            {isStreaming ? "HALT STREAM" : "INIT STREAM"}
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        <section className="lg:col-span-8 flex flex-col gap-6 overflow-hidden min-h-0">
          {quarantine.length > 0 && (
            <div className="flex-none max-h-[40%] bg-[#F6E1DF] border border-[#C65342]/40 rounded-md shadow-sm flex flex-col overflow-hidden">
              <div className="flex-none bg-[#C65342]/10 border-b border-[#C65342]/20 px-4 py-2 flex items-center gap-2 font-mono text-[11px] font-bold text-[#C65342] tracking-widest uppercase">
                <ShieldAlert size={14} />
                Quarantine Buffer (Intercepted Threats)
              </div>
              <div className="p-2 flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#C65342]/30 [&::-webkit-scrollbar-thumb]:rounded-full">
                <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                  <tbody>
                    {quarantine.map((item, i) => (
                      <tr
                        key={`q-${i}`}
                        onClick={() => setInspectedTx(item)}
                        className="cursor-pointer hover:bg-[#C65342]/10 text-[#C65342] font-medium transition-colors"
                      >
                        <td className="px-3 py-2 font-mono text-xs w-24">
                          {item.time}
                        </td>
                        <td className="px-3 py-2 font-semibold w-48">
                          {item.tx.merchant}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold">
                          ₹{item.tx.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2">{item.tx.device_name}</td>
                        <td className="px-3 py-2 text-right font-bold tracking-wide">
                          [BLOCKED]
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="bg-[#F9F8F6] border border-[#D8D3C4] rounded-md flex-1 flex flex-col shadow-sm overflow-hidden min-h-0">
            <div className="flex-none bg-[#EAE6DB] border-b border-[#D8D3C4] px-4 py-2 flex items-center justify-between font-mono text-[11px] font-bold text-[#7A7265] tracking-widest uppercase">
              <span>Live Transaction Stream</span>
              <span>1.25 TX/S</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D8D3C4] [&::-webkit-scrollbar-thumb]:rounded-full">
              <table className="w-full text-left font-sans text-sm whitespace-nowrap">
                <thead className="text-[#9C9482] font-mono text-[10px] border-b border-[#D8D3C4] sticky top-0 bg-[#F9F8F6]">
                  <tr>
                    <th className="px-3 py-3 font-semibold tracking-wider">
                      TIME
                    </th>
                    <th className="px-3 py-3 font-semibold tracking-wider">
                      MERCHANT
                    </th>
                    <th className="px-3 py-3 font-semibold tracking-wider">
                      AMOUNT
                    </th>
                    <th className="px-3 py-3 font-semibold tracking-wider">
                      DEVICE
                    </th>
                    <th className="px-3 py-3 font-semibold tracking-wider">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {liveStream.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-[#9C9482] italic"
                      >
                        Awaiting data stream...
                      </td>
                    </tr>
                  )}
                  {liveStream.map((item, i) => {
                    const isBlocked = item.evaluation.is_blocked;
                    return (
                      <tr
                        key={i}
                        onClick={() => setInspectedTx(item)}
                        className={`cursor-pointer transition-colors border-b border-[#F2EFE5]/70
                          ${
                            isBlocked
                              ? "bg-[#F6E1DF]/50 text-[#C65342] hover:bg-[#F6E1DF]"
                              : "text-[#5E574E] hover:bg-[#EAE6DB]"
                          }
                        `}
                      >
                        <td className="px-3 py-3 font-mono text-xs">
                          {item.time}
                        </td>
                        <td className="px-3 py-3 font-semibold">
                          {item.tx.merchant}
                        </td>
                        <td className="px-3 py-3 font-mono font-bold">
                          ₹{item.tx.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-3">{item.tx.device_name}</td>
                        <td
                          className={`px-3 py-3 font-bold text-right tracking-wide text-xs ${
                            isBlocked ? "text-[#C65342]" : "text-[#5A7156]"
                          }`}
                        >
                          {isBlocked ? "INTERCEPTED" : "PASS"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="lg:col-span-4 bg-[#F9F8F6] border border-[#D8D3C4] rounded-md flex flex-col shadow-sm overflow-hidden min-h-0">
          <div className="flex-none bg-[#EAE6DB] border-b border-[#D8D3C4] px-4 py-2 flex items-center gap-2 font-mono text-[11px] font-bold text-[#7A7265] tracking-widest uppercase">
            <FileJson size={14} />
            Deep Packet Inspector
          </div>

          <div className="flex-1 p-5 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D8D3C4] [&::-webkit-scrollbar-thumb]:rounded-full">
            {!inspectedTx ? (
              <div className="h-full flex items-center justify-center text-[#9C9482] text-sm italic">
                Select a transaction to inspect
              </div>
            ) : (
              <div className="animate-in fade-in duration-200">
                <div className="flex justify-between items-start mb-5 border-b border-[#D8D3C4] pb-5">
                  <div>
                    <div className="text-[11px] uppercase font-bold text-[#9C9482] font-mono tracking-wider mb-1.5">
                      Target Network ID
                    </div>
                    <div className="font-mono text-xl font-bold text-[#3A352F]">
                      {inspectedTx.tx.transaction_id}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 font-mono text-xs font-bold border rounded-sm tracking-widest shadow-sm ${
                      inspectedTx.evaluation.is_blocked
                        ? "bg-[#F6E1DF] text-[#C65342] border-[#C65342]/30"
                        : "bg-[#EAF0E9] text-[#5A7156] border-[#5A7156]/30"
                    }`}
                  >
                    {inspectedTx.evaluation.is_blocked ? "BLOCKED" : "CLEARED"}
                  </div>
                </div>

                <div
                  className={`mb-6 p-4 rounded border ${
                    inspectedTx.evaluation.is_blocked
                      ? "bg-[#F6E1DF]/40 border-[#C65342]/20"
                      : "bg-[#EAF0E9]/40 border-[#5A7156]/20"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-bold tracking-widest block mb-2 ${
                      inspectedTx.evaluation.is_blocked
                        ? "text-[#C65342]"
                        : "text-[#5A7156]"
                    }`}
                  >
                    AI Inference Summary
                  </span>
                  <p className="font-sans text-sm text-[#5E574E] leading-relaxed">
                    {inspectedTx.evaluation.is_blocked ? (
                      <>
                        The neural network intercepted a{" "}
                        <strong>high-risk vector</strong>. An attempt to route{" "}
                        <strong>
                          ₹{inspectedTx.tx.amount.toLocaleString()}
                        </strong>{" "}
                        to <strong>{inspectedTx.tx.merchant}</strong> triggered
                        massive weight activations. The combination of a{" "}
                        <strong>{inspectedTx.tx.device_name}</strong> and
                        anomalous timing resulted in a definitive block
                        probability.
                      </>
                    ) : (
                      <>
                        Transaction cleared. Transfer of{" "}
                        <strong>
                          ₹{inspectedTx.tx.amount.toLocaleString()}
                        </strong>{" "}
                        to <strong>{inspectedTx.tx.merchant}</strong> via{" "}
                        <strong>{inspectedTx.tx.device_name}</strong> aligns
                        with standard consumer velocity weights. Probability of
                        fraud is mathematically negligible.
                      </>
                    )}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="text-[11px] uppercase font-bold text-[#9C9482] font-mono tracking-wider mb-2 flex justify-between">
                    <span>EnPassant AI Execution Trace</span>
                    <span className="text-[9px]">enpassant.wasm</span>
                  </div>
                  <div className="bg-[#EAE6DB] border border-[#D8D3C4] p-3 rounded-sm font-mono text-[11px] text-[#7A7265] space-y-2 shadow-inner">
                    <div className="flex justify-between">
                      <span>[+] Tensor Ops:</span>
                      <span className="text-[#5A7156]">
                        Forward Pass (2 Layers)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>[+] Latency:</span>
                      <span className="text-[#5A7156]">
                        &lt; 1.00ms (Local)
                      </span>
                    </div>
                    <div className="border-t border-[#D8D3C4]/60 my-2 pt-2"></div>
                    <div className="flex justify-between font-bold text-[#3A352F]">
                      <span>[=] AI Fraud Probability:</span>
                      <span
                        className={
                          inspectedTx.evaluation.is_blocked
                            ? "text-[#C65342]"
                            : "text-[#5A7156]"
                        }
                      >
                        {inspectedTx.evaluation.risk_score.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-[11px] uppercase font-bold text-[#9C9482] font-mono tracking-wider mb-2">
                    WASM Payload (Raw JSON)
                  </div>
                  <div className="bg-[#EAE6DB] border border-[#D8D3C4] p-4 rounded-sm font-mono text-[11px] text-[#7A7265] overflow-x-auto whitespace-pre shadow-inner">
                    {JSON.stringify(inspectedTx.tx, null, 2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-none bg-[#3A352F] p-3 border-t border-[#D8D3C4] flex items-center font-mono text-xs">
            <span className="text-[#C65342] font-bold mr-3 shrink-0">
              ADMIN {">"}
            </span>
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              onKeyDown={handleInjectCommand}
              placeholder='inject --amount 950000 --hour 3 --device "auth_FRAUD_NODE"'
              className="bg-transparent border-none outline-none text-[#F2EFE5] w-full"
              spellCheck="false"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
