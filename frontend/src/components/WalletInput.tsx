import { useState } from "react";
import { isValidSolanaAddress } from "../api";

interface Props {
  onSubmit: (address: string) => void;
  loading: boolean;
}

export default function WalletInput({ onSubmit, loading }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter an address");
      return;
    }
    if (!isValidSolanaAddress(trimmed)) {
      setError("Invalid Solana address");
      return;
    }
    setError("");
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder="Solana wallet address…"
          className="w-48 sm:w-72 bg-surface border border-border rounded-lg px-3 py-1.5 text-sm text-text
                     placeholder:text-text-muted focus:outline-none focus:border-primary/60
                     transition-colors"
          disabled={loading}
        />
        {error && (
          <p className="absolute -bottom-5 left-0 text-xs text-negative">{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-primary/15 text-primary border border-primary/30 rounded-lg px-4 py-1.5 text-sm
                   font-medium hover:bg-primary/25 transition-colors disabled:opacity-50
                   disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
            Loading
          </>
        ) : (
          "Load"
        )}
      </button>
    </form>
  );
}
