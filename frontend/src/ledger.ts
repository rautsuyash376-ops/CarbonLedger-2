
import { BrowserProvider, Contract } from "ethers";
import ledgerAbi from "./abi/CarbonLedgerABI.json";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const LOCAL_CHAIN_ID = "0x7a69"; // 31337

function getContract(providerOrSigner: any) {
  if (!CONTRACT_ADDRESS) {
    throw new Error("Missing VITE_CONTRACT_ADDRESS in frontend/.env");
  }

  return new Contract(
    CONTRACT_ADDRESS,
    ledgerAbi,
    providerOrSigner
  );
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed or enabled.");
  }

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: LOCAL_CHAIN_ID }],
    });
  } catch (error: any) {
    if (error.code !== 4902) throw error;

    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: LOCAL_CHAIN_ID,
          chainName: "Hardhat Local",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["http://127.0.0.1:8545"],
        },
      ],
    });
  }

  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();

  return {
    address: await signer.getAddress(),
    contract: getContract(signer),
  };
}

export async function readLedgerStats() {
  if (!window.ethereum) {
    throw new Error("Please install or enable MetaMask.");
  }

  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();

  if (network.chainId !== 31337n) {
    throw new Error("Please select the Hardhat Local network in MetaMask.");
  }

  const contract = getContract(provider);

  const [issued, retired, outstanding] = await Promise.all([
    contract.totalIssued(),
    contract.totalRetired(),
    contract.outstandingUnits(),
  ]);

  return {
    issued: issued.toString(),
    retired: retired.toString(),
    outstanding: outstanding.toString(),
  };
}
