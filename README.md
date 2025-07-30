# LINEA Token Claim Tool for Compromised Wallets

A production-grade web application that enables users to safely claim LINEA token allocations from compromised wallets using Linea's `eth_sendBundle` API to bypass sweeper bots.

## Problem Statement

When a wallet's private key is compromised, malicious actors deploy "sweeper bots" that monitor the wallet continuously. These bots immediately steal any ETH sent to the wallet for gas fees, making it impossible for legitimate users to execute transactions and claim their token allocations. This creates a catch-22 situation where users cannot claim their rightful LINEA tokens.

## Our Solution

### Brief Description
Our tool solves this problem by leveraging Linea's `eth_sendBundle` API to execute atomic bundle transactions that bypass the public mempool entirely. This prevents sweeper bots from seeing or front-running the transactions, allowing legitimate users to safely claim their LINEA token allocations.

### How eth_sendBundle Bypasses Sweeper Bots

**Traditional Transaction Flow (Vulnerable to Sweepers):**
1. User sends ETH to compromised wallet for gas → **Sweeper bot immediately steals ETH**
2. User cannot execute claim transaction → **Tokens remain unclaimed**

**Our Bundle Transaction Flow (Sweeper-Proof):**
1. **Direct to Sequencer**: Transactions bypass the public mempool and go directly to Linea's sequencer
2. **Atomic Execution**: All transactions in the bundle execute together in a single block
3. **All-or-Nothing**: Either all transactions succeed or none execute
4. **Zero Visibility**: Sweeper bots cannot see transactions before execution

### Technical Process Outline

#### 1. Bundle Construction
```typescript
// Transaction 1: Fund gas from safe wallet to compromised wallet
const fundingTx = {
  from: safeWallet.address,
  to: compromisedWallet.address,
  value: calculatedGasAmount,
  // ... other params
};

// Transaction 2: Claim LINEA tokens from compromised wallet
const claimTx = {
  from: compromisedWallet.address,
  to: LINEA_TOKEN_CLAIM_CONTRACT,
  data: encodedClaimData,
  // ... other params
};

// Transaction 3: Transfer claimed tokens to safe wallet
const transferTx = {
  from: compromisedWallet.address,
  to: LINEA_TOKEN_CLAIM_CONTRACT,
  data: transferToSafeWalletData,
  // ... other params
};
```

#### 2. Bundle Submission
```typescript
const bundle = {
  jsonrpc: "2.0",
  method: "eth_sendBundle",
  params: [{
    txs: [signedFundingTx, signedClaimTx, signedTransferTx],
    blockNumber: `0x${(currentBlock + 1).toString(16)}`,
    minTimestamp: currentTimestamp,
    maxTimestamp: currentTimestamp + 120
  }],
  id: 1
};

// Submit directly to Linea sequencer via allowlisted Infura endpoint
const response = await axios.post(infuraUrl, bundle);
```

#### 3. Atomic Execution
- All three transactions execute in sequence within the same block
- Gas is funded, tokens are claimed, and tokens are transferred to safety
- If any transaction fails, the entire bundle reverts
- Sweeper bots never see the transactions in the mempool

## Codebase Architecture

### Core Files Structure
```
src/
├── config.ts              # Service configuration and constants
├── types.ts               # TypeScript type definitions
├── gas-optimizer.ts       # Smart gas price calculation
├── allocation-service.ts  # LINEA token allocation detection
├── rescue-service.ts      # Core bundle transaction logic
├── validator.ts           # Input validation and security
├── lxp-detector.ts       # Token detection utilities
└── App.tsx               # React user interface
```

### Key Components

#### 1. Gas Optimizer (`gas-optimizer.ts`)
- **Purpose**: Calculates optimal gas prices to ensure transaction success
- **Features**: 
  - EIP-1559 support with fallback to legacy pricing
  - 20% safety buffer for reliability
  - Maximum gas price limits to prevent overpaying
  - Dynamic network-based adjustments

#### 2. Allocation Service (`allocation-service.ts`)
- **Purpose**: Handles LINEA token allocation detection and claim data generation
- **Features**:
  - User input validation for token amounts
  - Claim data encoding for contract interaction
  - Future support for automatic allocation detection API
  - Integration with merkle proof-based claims

#### 3. Rescue Service (`rescue-service.ts`)
- **Purpose**: Core bundle transaction orchestration
- **Features**:
  - Multi-transaction bundle construction
  - Retry logic with exponential backoff
  - Transaction monitoring and status tracking
  - Atomic execution guarantees

#### 4. Validator (`validator.ts`)
- **Purpose**: Security validation for all user inputs
- **Features**:
  - Ethereum address validation
  - Private key format verification
  - Private key to address matching
  - Amount validation with safety limits

### User Workflow

1. **Input Compromised Wallet**: User provides address and private key of compromised wallet
2. **Input Safe Wallet**: User provides address and private key of secure wallet with ETH for gas
3. **Specify Token Amount**: User enters their LINEA token allocation amount
4. **Gas Estimation**: Tool calculates exact ETH needed for gas fees
5. **Bundle Execution**: Tool creates and submits atomic bundle transaction
6. **Success Confirmation**: Tokens are safely transferred to the secure wallet

### Security Features

#### Client-Side Security
- **No Server Storage**: Private keys never leave the user's browser
- **Input Validation**: Comprehensive validation prevents malicious inputs
- **Address Verification**: Private keys must match provided addresses

#### Transaction Security
- **Atomic Execution**: All-or-nothing transaction guarantee
- **Gas Optimization**: Competitive pricing prevents transaction failures
- **Retry Logic**: Multiple attempts with different block targets
- **Mempool Bypass**: Complete invisibility to sweeper bots

#### Network Security
- **Direct Sequencer Access**: Uses Linea's permissioned endpoint
- **Allowlisted API**: Requires pre-approved Infura API key
- **Bundle Validation**: Server-side validation before execution

## Technical Implementation Details

### Bundle Transaction Benefits
1. **MEV Protection**: Transactions cannot be front-run or sandwiched
2. **Gas Efficiency**: Precise gas calculation eliminates waste
3. **Failure Protection**: Invalid bundles fail gracefully without gas loss
4. **Speed**: Direct sequencer access for faster execution

### Smart Contract Integration
- **ERC-20 Compatibility**: Works with standard token contracts
- **Merkle Proof Support**: Handles complex claim mechanisms
- **Multi-call Support**: Can batch multiple claims in one bundle
- **Upgradeable**: Easy to modify for different claim contracts

### Production Deployment
- **Environment Variables**: Secure configuration management
- **Error Handling**: Comprehensive error reporting and recovery
- **Monitoring**: Transaction status tracking and logging
- **Scalability**: Handles multiple concurrent users

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Allowlisted Infura API key for `eth_sendBundle` on Linea
- LINEA token claim contract address

### Installation
```bash
# Clone repository
git clone <repository-url>
cd CompromisedClaim

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Infura API key and contract address

# Start development server
npm run dev
```

### Configuration
Update `src/config.ts` for different deployment scenarios:
```typescript
export const SERVICE_CONFIG = {
  INFURA_API_KEY: 'your-allowlisted-key',
  LINEA_TOKEN_CLAIM_CONTRACT: '0x...', // Contract address
  CLAIM_CONFIG: {
    CLAIM_FUNCTION_SIGNATURE: 'claim(uint256 amount, bytes32[] calldata merkleProof)',
    MAX_CLAIM_AMOUNT: '1000000', // Safety limit
  }
};
```

## Why This Solution Works

### Against Sweeper Bots
- **Invisibility**: Bots cannot monitor bundle transactions
- **Speed**: Direct sequencer access is faster than bot reaction time
- **Atomicity**: No partial execution means no opportunity for interference

### For Users
- **Safety**: Guaranteed token recovery or no gas loss
- **Simplicity**: Easy web interface requiring only basic inputs
- **Reliability**: Retry logic and gas optimization ensure success

### For the Network
- **Efficiency**: Reduced mempool congestion
- **Security**: Enhanced MEV protection for users
- **Adoption**: Enables continued participation despite compromised wallets

This tool represents a practical application of Linea's `eth_sendBundle` technology to solve a real-world problem affecting cryptocurrency users with compromised wallets.