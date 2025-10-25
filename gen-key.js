// gen-key.js (works with ethers v6)
import { Wallet } from "ethers";

const w = Wallet.createRandom(); // generates mnemonic + privateKey + address
console.log("Address:", w.address);
console.log("Private Key:", w.privateKey);
console.log("Mnemonic:", w.mnemonic?.phrase ?? "none");
