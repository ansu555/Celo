"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import ERC20Abi from "./ERC20Abi.json";

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
        .then((accounts) => {
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
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Create Your ERC20 Token</h1>

      <label className="block mb-2">
        Token Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          placeholder="e.g., aksha"
        />
      </label>

      <label className="block mb-2">
        Token Symbol
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          placeholder="e.g., AKS"
        />
      </label>

      <label className="block mb-4">
        Initial Supply
        <input
          type="number"
          value={initialSupply}
          onChange={(e) => setInitialSupply(e.target.value)}
          className="w-full p-2 border rounded mt-1"
          placeholder="e.g., 10000000000000000000000"
        />
      </label>

      <button
        onClick={handleCreateToken}
        className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
      >
        Deploy Token
      </button>

      {status && <p className="mt-4">{status}</p>}

      {txHash && (
        <p className="mt-2">
          Transaction Hash:{" "}
          <a
            href={`https://celo-sepolia.blockscout.com/tx/${txHash}?tab=token_transfers`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {txHash}
          </a>
        </p>
      )}

      {tokenAddress && (
        <p className="mt-2">
          Token Address:{" "}
          <a
            href={`https://celo-sepolia.blockscout.com/address/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {tokenAddress}
          </a>
        </p>
      )}

      <hr className="my-6" />

      <h2 className="text-xl font-semibold mb-4">Your Created Tokens</h2>
      {createdTokens.length === 0 && <p>No tokens deployed yet.</p>}
      {createdTokens.map((t, i) => (
        <div key={i} className="mb-3 p-4 border rounded bg-gray-50">
          <p className="font-semibold text-lg mb-2">
            {t.name} ({t.symbol})
          </p>
          <p className="text-sm mb-1">
            <strong>Address:</strong>{" "}
            <a
              href={`https://celo-sepolia.blockscout.com/token/${t.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {t.address}
            </a>
          </p>
          {t.totalSupply && (
            <p className="text-sm mb-1">
              <strong>Max Total Supply:</strong> {t.totalSupply}
            </p>
          )}
          {t.txHash && t.txHash !== "0x..." && (
            <p className="text-sm">
              <strong>Tx Hash:</strong>{" "}
              <a
                href={`https://celo-sepolia.blockscout.com/tx/${t.txHash}?tab=token_transfers`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {t.txHash}
              </a>
            </p>
          )}
          <button
            onClick={() =>
              fetchTokenLogs(t.address, walletAddress).then(setLogs)
            }
            className="mt-2 px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            View Transfer Logs
          </button>
        </div>
      ))}

      <hr className="my-6" />
      <h2 className="text-xl font-semibold mb-4">Token Transfer Logs</h2>
      {logs.length === 0 && (
        <p>No transfers found. Click "View Transfer Logs" on a token above.</p>
      )}
      {logs.map((log, i) => (
        <div key={i} className="mb-2 p-3 border rounded bg-gray-50">
          <p className="text-sm">
            <strong>From:</strong> <span className="break-all">{log.from}</span>
          </p>
          <p className="text-sm">
            <strong>To:</strong> <span className="break-all">{log.to}</span>
          </p>
          <p className="text-sm">
            <strong>Amount:</strong> {log.value} tokens
          </p>
          <p className="text-sm">
            <strong>Tx:</strong>{" "}
            <a
              href={`https://celo-sepolia.blockscout.com/tx/${log.txHash}?tab=token_transfers`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-all"
            >
              {log.txHash}
            </a>
          </p>
        </div>
      ))}
    </div>
  );
}
