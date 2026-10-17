# CarbonLedger-2
# CarbonLedger 2

A blockchain-based carbon credit management prototype built with React, TypeScript, Solidity, and Hardhat.

## Features

- Register carbon-credit projects on the blockchain.
- Verify or reject registered projects through a smart contract.
- Connect a wallet using MetaMask.
- Track project status and carbon-credit statistics.
- Explore a dashboard for carbon-credit management.

## Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Blockchain:** Solidity, Hardhat
- **Ethereum interaction:** ethers.js
- **Wallet:** MetaMask

## Project Structure

```text
CarbonLedger-2-Fresh/
├── frontend/
│   └── src/
├── blockchain/
│   ├── contracts/
│   │   └── CarbonLedger.sol
│   └── scripts/
└── README.md
```

## Run Locally

### 1. Start the blockchain

Open a terminal:

```powershell
cd blockchain
npx hardhat node
```

Keep this terminal running.

### 2. Deploy the smart contract

Open another terminal from the project root:

```powershell
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed contract address into `frontend/.env` as `your address`.

### 3. Run the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Important Notes

- The project currently uses a local Hardhat blockchain for development.
- Local deployments are not publicly accessible blockchain deployments.
- Project verification is connected to the smart contract.
- Credit issuance, transfers, and retirement still need their frontend actions connected to the blockchain.
- Never commit `.env` files, private keys, or wallet recovery phrases.

## Author

Suyash Raut
