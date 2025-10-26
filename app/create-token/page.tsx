"use client";

import { useState } from "react";
import { ethers } from "ethers";
import ERC20Abi from "./ERC20Abi.json";

export default function CreateTokenPage() {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [initialSupply, setInitialSupply] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

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
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      setStatus("⏳ Deploying token...");

      // Create ContractFactory
      const factory = new ethers.ContractFactory(
        ERC20Abi.abi,
        ERC20Abi.bytecode,
        signer
      );

      // Deploy contract
      const token = await factory.deploy(
        name,
        symbol,
        ethers.parseUnits(initialSupply, 18)
      );

      // Get deployment transaction hash safely
      const deployTxHash = token.deploymentTransaction()?.hash || null;
      setTxHash(deployTxHash);

      setStatus("⏳ Waiting for deployment to be mined...");
      //await token.deployed();

      // Get deployed contract address
      setTokenAddress(token.target);

      setStatus("✅ Token deployed successfully!");
    } catch (err: any) {
      console.error(err);
      setStatus("❌ Deployment failed: " + (err.message || err.toString()));
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Create Your ERC20 Token</h1>

      <label className="block mb-2">
        Token Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      <label className="block mb-2">
        Token Symbol
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded mt-1"
        />
      </label>

      <label className="block mb-4">
        Initial Supply
        <input
          type="number"
          value={initialSupply}
          onChange={(e) => setInitialSupply(e.target.value)}
          className="w-full p-2 border rounded mt-1"
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
            href={`https://explorer.celo.org/sepolia/address/${tokenAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {tokenAddress}
          </a>
        </p>
      )}
    </div>
  );
}
