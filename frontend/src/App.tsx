import { useState, useCallback } from "react";
import WalletInput from "./components/WalletInput";
import PortfolioSummary from "./components/PortfolioSummary";
import TokenTable from "./components/TokenTable";
import AllocationChart from "./components/AllocationChart";
import TransactionFeed from "./components/TransactionFeed";
import ChatPanel from "./components/ChatPanel";
import type { PortfolioData, ChatMessage } from "./types";
import { getAgentId, sendMessage, parsePortfolioFromResponse } from "./api";

export default function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);

  const initAgent = useCallback(async () => {
    if (agentId) return agentId;
    try {
      const id = await getAgentId();
      setAgentId(id);
      return id;
    } catch {
      setChatError("Could not connect to agent. Is ElizaOS running on port 3000?");
      return null;
    }
  }, [agentId]);

  const handleSendMessage = useCallback(
    async (text: string) => {
      const id = await initAgent();
      if (!id) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        setChatError(null);
        const responses = await sendMessage(id, text);
        for (const r of responses) {
          const agentMsg: ChatMessage = {
            id: crypto.randomUUID(),
            role: "agent",
            text: r.text,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, agentMsg]);

          // Try to parse portfolio data from response
          const parsed = parsePortfolioFromResponse(r.text);
          if (parsed && parsed.totalValue && parsed.totalValue > 0) {
            setPortfolio((prev) => ({
              walletAddress: walletAddress || prev?.walletAddress || "",
              totalValue: parsed.totalValue ?? prev?.totalValue ?? 0,
              change24h: parsed.change24h ?? prev?.change24h ?? 0,
              change24hPercent: parsed.change24hPercent ?? prev?.change24hPercent ?? 0,
              tokens: parsed.tokens?.length ? parsed.tokens : prev?.tokens ?? [],
              transactions: parsed.transactions?.length
                ? parsed.transactions
                : prev?.transactions ?? [],
            }));
          }
        }
      } catch {
        setChatError("Failed to get response from agent.");
      }
    },
    [initAgent, walletAddress]
  );

  const handleLoadWallet = useCallback(
    async (address: string) => {
      setWalletAddress(address);
      setLoading(true);
      await handleSendMessage(`Analyze wallet ${address}`);
      setLoading(false);
    },
    [handleSendMessage]
  );

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h1 className="text-xl font-bold text-primary tracking-tight">
            SolFolio
          </h1>
        </div>
        <span className="text-text-muted text-sm hidden sm:inline">
          Solana Portfolio Intelligence
        </span>
        <div className="ml-auto">
          <WalletInput onSubmit={handleLoadWallet} loading={loading} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel — Portfolio Dashboard */}
        <div className="lg:w-[55%] xl:w-[60%] overflow-y-auto p-4 space-y-4 border-r border-border">
          <PortfolioSummary portfolio={portfolio} loading={loading} />

          {portfolio && portfolio.tokens.length > 0 ? (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AllocationChart tokens={portfolio.tokens} />
                <TransactionFeed transactions={portfolio.transactions} />
              </div>
              <TokenTable tokens={portfolio.tokens} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-lg font-medium mb-1">No portfolio loaded</p>
              <p className="text-sm">
                Enter a Solana wallet address above or ask the agent to analyze
                one
              </p>
            </div>
          )}
        </div>

        {/* Right Panel — Chat */}
        <div className="lg:w-[45%] xl:w-[40%] flex flex-col overflow-hidden">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            error={chatError}
          />
        </div>
      </div>
    </div>
  );
}
