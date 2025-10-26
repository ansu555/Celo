"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ERC20Abi from "./ERC20Abi.json";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TokenLog {
  from: string;
  to: string;
  value: string;
  txHash: string;
}

interface CreatedToken {
  name: string;
  symbol: string;
  address: string;
  txHash: string;
  totalSupply?: string;
}

export default function CreateTokenPage() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [createdTokens, setCreatedTokens] = useState<CreatedToken[]>([]);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Hardcoded example token
  const EXAMPLE_TOKEN: CreatedToken = {
    name: "aksha",
    symbol: "AKS",
    address: "0xAfd0ae07D20caAa36bA5F8D0e3a5d27Bf6E25E4b",
    txHash: "0x...",
    totalSupply: "10,000,000,000,000,000,000,000",
  };

  // Connect wallet on mount
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_requestAccounts" })
  .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            fetchCreatedTokens(accounts[0]);
          }
        });
    }
  }, []);

  // Helper function to get token metadata from contract
  const getTokenMetadata = async (
    tokenAddress: string
  ): Promise<{ name: string; symbol: string; totalSupply: string } | null> => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://forno.celo-sepolia.celo-testnet.org"
      );
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20Abi.abi,
        provider
      );

      const [name, symbol, totalSupply] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.totalSupply(),
      ]);

      return {
        name,
        symbol,
        totalSupply: ethers.formatUnits(totalSupply, 18),
      };
    } catch (err) {
      console.error(`Failed to get metadata for ${tokenAddress}:`, err);
      return null;
    }
  };

  const handleCreateToken = async () => {
    try {
      if (!name || !symbol || !initialSupply) {
        setStatus("❌ Please fill all fields");
        return;
      }

      if (!window.ethereum) {
        setStatus("❌ Wallet not detected. Please install MetaMask or Valora.");
        return;
      }

      setStatus("⏳ Connecting wallet...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setStatus("⏳ Deploying token...");
      const factory = new ethers.ContractFactory(
        ERC20Abi.abi,
        ERC20Abi.bytecode,
        signer
      );

      const token = await factory.deploy(
        name,
        symbol,
        ethers.parseUnits(initialSupply, 18)
      );

      const deployTxHash = token.deploymentTransaction()?.hash || null;
      setTxHash(deployTxHash);

      setStatus("⏳ Waiting for deployment to be mined...");
      await token.waitForDeployment();

      const deployedAddress = await token.getAddress();
      setTokenAddress(deployedAddress);
      setStatus("✅ Token deployed successfully!");

      // Add to local created tokens list
      setCreatedTokens((prev) => [
        ...prev,
        {
          name,
          symbol,
          address: deployedAddress,
          txHash: deployTxHash || "",
          totalSupply: initialSupply,
        },
      ]);

      // Close the modal after successful deployment
      setOpen(false);

      // Fetch logs for the newly created token
      fetchTokenLogs(deployedAddress, walletAddress).then(setLogs);
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Deployment failed: " + (err.message || err.toString()));
    }
  };

  // Fetch tokens created under this wallet via Blockscout
  const fetchCreatedTokens = async (address: string) => {
    try {
      // Start with example token
      const tokens: CreatedToken[] = [EXAMPLE_TOKEN];

      // Try to fetch from Blockscout
      const res = await fetch(
        `https://celo-sepolia.blockscout.com/api?module=account&action=txlist&address=${address}&sort=desc`
      );
      const data = await res.json();

      if (data.result && Array.isArray(data.result)) {
        // Collect all contract addresses
        const contractAddresses = new Set<string>();
        data.result.forEach((tx: any) => {
          if (
            tx.contractAddress &&
            tx.contractAddress !== EXAMPLE_TOKEN.address
          ) {
            contractAddresses.add(tx.contractAddress.toLowerCase());
          }
        });

        // Fetch metadata for each contract
        for (const contractAddr of contractAddresses) {
          const metadata = await getTokenMetadata(contractAddr);
          const tx = data.result.find(
            (t: any) =>
              t.contractAddress &&
              t.contractAddress.toLowerCase() === contractAddr
          );

          if (metadata) {
            tokens.push({
              name: metadata.name,
              symbol: metadata.symbol,
              address: contractAddr,
              txHash: tx?.hash || "",
              totalSupply: metadata.totalSupply,
            });
          } else {
            tokens.push({
              name: "Unknown",
              symbol: "???",
              address: contractAddr,
              txHash: tx?.hash || "",
            });
          }
        }
      }

      setCreatedTokens(tokens);
    } catch (err) {
      console.error("Failed to fetch created tokens:", err);
      // Fallback to just example token
      setCreatedTokens([EXAMPLE_TOKEN]);
    }
  };

  // Fetch ERC20 transfer logs via Blockscout
  const fetchTokenLogs = async (
    tokenAddr: string,
    user: string
  ): Promise<TokenLog[]> => {
    try {
      const apiUrl = `https://celo-sepolia.blockscout.com/api?module=account&action=tokentx&address=${user}&contractaddress=${tokenAddr}&sort=desc`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (!data.result || !Array.isArray(data.result)) return [];

      return data.result.map((tx: any) => ({
        from: tx.from,
        to: tx.to,
        value: ethers.formatUnits(tx.value, 18),
        txHash: tx.hash,
      }));
    } catch (err) {
      console.error("Failed to fetch token logs:", err);
      return [];
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header + actions */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Mint</h1>
          <p className="text-sm text-white/70 dark:text-white/60">Create and launch your ERC20 token on Celo Sepolia.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-[32px] bg-white/10 text-white border border-white/15 backdrop-blur-lg hover:bg-white/15">Launch your token</Button>
            </DialogTrigger>
            <DialogContent className="border border-white/20 bg-white/10 dark:bg-[#171717]/80 backdrop-blur-xl text-white dark:border-white/10">
              <DialogHeader>
                <DialogTitle>Launch your token</DialogTitle>
                <DialogDescription className="text-white/70">Fill the details below and deploy in one click.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid gap-2">
                  <Label htmlFor="token-name" className="text-white/90">Token Name</Label>
                  <Input id="token-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Aksha" className="bg-white/10 dark:bg-[#171717]/80 border-white/20 dark:border-white/10 text-white placeholder:text-white/50" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="token-symbol" className="text-white/90">Token Symbol</Label>
                  <Input id="token-symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="e.g., AKS" className="bg-white/10 dark:bg-[#171717]/80 border-white/20 dark:border-white/10 text-white placeholder:text-white/50" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="initial-supply" className="text-white/90">Initial Supply</Label>
                  <Input id="initial-supply" type="number" value={initialSupply} onChange={(e) => setInitialSupply(e.target.value)} placeholder="e.g., 1000000" className="bg-white/10 dark:bg-[#171717]/80 border-white/20 dark:border-white/10 text-white placeholder:text-white/50" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateToken} className="rounded-[28px] bg-white/15 text-white border border-white/20 backdrop-blur hover:bg-white/25">Deploy Token</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="ghost" className="rounded-[28px] bg-white/5 text-white border border-white/10 backdrop-blur hover:bg-white/10" onClick={() => setOpen(true)}>
            Deploy token
          </Button>
        </div>
      </div>

      {(status || txHash || tokenAddress) && (
        <div className="mb-8 rounded-2xl border border-white/20 bg-white/10 dark:bg-[#171717]/80 p-4 text-sm text-white/90 backdrop-blur-xl dark:border-white/10">
          {status && <div className="mb-1">{status}</div>}
          {txHash && (
            <div className="truncate">
              Tx: <a className="underline" href={`https://celo-sepolia.blockscout.com/tx/${txHash}?tab=token_transfers`} target="_blank" rel="noreferrer">{txHash}</a>
            </div>
          )}
          {tokenAddress && (
            <div className="truncate">
              Address: <a className="underline" href={`https://celo-sepolia.blockscout.com/address/${tokenAddress}`} target="_blank" rel="noreferrer">{tokenAddress}</a>
            </div>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Tokens</h2>
        <span className="text-xs text-white/60">{createdTokens.length} total</span>
      </div>
      {createdTokens.length === 0 && (
        <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-[#171717]/80 p-6 text-sm text-white/80 backdrop-blur-xl dark:border-white/10">No tokens deployed yet.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {createdTokens.map((t, i) => (
          <div key={i} className="rounded-2xl border border-white/20 bg-white/10 dark:bg-[#171717]/80 p-4 backdrop-blur-xl dark:border-white/10">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-base font-semibold text-white">{t.name}</div>
              {t.symbol && <span className="text-xs text-white/60">{t.symbol}</span>}
            </div>
            <div className="text-xs text-white/60">Address</div>
            <a href={`https://celo-sepolia.blockscout.com/token/${t.address}`} target="_blank" rel="noreferrer" className="truncate text-sm underline text-white/90">
              {t.address}
            </a>
            {t.totalSupply && (
              <div className="mt-2 text-xs text-white/60">Supply: <span className="text-white/80">{t.totalSupply}</span></div>
            )}
            {t.txHash && t.txHash !== "0x..." && (
              <div className="mt-2 truncate text-xs text-white/60">Tx: <a className="underline" href={`https://celo-sepolia.blockscout.com/tx/${t.txHash}?tab=token_transfers`} target="_blank" rel="noreferrer">{t.txHash}</a></div>
            )}
            <div className="mt-3">
              <button onClick={() => fetchTokenLogs(t.address, walletAddress).then(setLogs)} className="h-8 rounded-[20px] border border-white/15 bg-white/10 px-3 text-sm text-white hover:bg-white/15">View transfers</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-3">Token Transfer Logs</h2>
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-white/20 bg-white/10 dark:bg-[#171717]/80 p-6 text-sm text-white/80 backdrop-blur-xl dark:border-white/10">No transfers found. Click "View transfers" on a token above.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="rounded-2xl border border-white/20 bg-white/10 dark:bg-[#171717]/80 p-4 text-sm text-white/90 backdrop-blur-xl dark:border-white/10">
                <div className="truncate"><span className="text-white/60">From:</span> {log.from}</div>
                <div className="truncate"><span className="text-white/60">To:</span> {log.to}</div>
                <div><span className="text-white/60">Amount:</span> {log.value}</div>
                <div className="truncate"><span className="text-white/60">Tx:</span> <a className="underline" href={`https://celo-sepolia.blockscout.com/tx/${log.txHash}?tab=token_transfers`} target="_blank" rel="noreferrer">{log.txHash}</a></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
