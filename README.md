# LINEA Token Rescue Tool

A modern web application that enables users to safely claim LINEA token allocations from compromised wallets using Linea's `eth_sendBundle` API to bypass sweeper bots.

![LINEA Token Rescue](https://img.shields.io/badge/LINEA-Token%20Rescue-61E8E1)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Vite](https://img.shields.io/badge/Vite-5.0-646cff)

## 🚨 The Problem

When a wallet's private key is compromised, malicious "sweeper bots" monitor it 24/7. These bots instantly steal any ETH sent for gas fees, creating an impossible situation where users cannot claim their rightful LINEA token allocations.

**Traditional Flow (Fails):**
```
Send ETH for gas → Sweeper bot steals ETH → Cannot claim tokens
```

## ✅ Our Solution

**Atomic Bundle Flow (Works):**
```
Bundle: [Fund Gas + Claim Tokens + Transfer to Safety] → Execute atomically
```

Using Linea's `eth_sendBundle` API, we execute all three transactions atomically in a single block, completely bypassing the mempool where sweeper bots monitor.

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build Tool**: Vite 5
- **Blockchain**: ethers.js 6 + Linea Network
- **Styling**: Modern glass morphism design
- **Bundle API**: Linea's `eth_sendBundle`

## 📁 Project Structure

```
src/
├── App.tsx                 # Main React component with modern UI
├── main.tsx               # React app entry point
├── index.css              # Tailwind + custom styles
├── config.ts              # Network and contract configuration
├── types.ts               # TypeScript type definitions
├── gas-optimizer.ts       # Smart gas price calculations
├── allocation-service.ts  # Token allocation handling
├── rescue-service.ts      # Core bundle transaction logic
└── validator.ts           # Input validation and security
```

## 🎯 Core Features

### 🔒 Security First
- **Client-side only**: Private keys never leave your browser
- **Input validation**: Comprehensive security checks
- **Address verification**: Keys must match provided addresses

### ⚡ Atomic Execution
- **All-or-nothing**: Either everything succeeds or nothing happens
- **Invisible to bots**: Transactions bypass public mempool
- **Gas optimized**: Precise calculations to prevent failures

### 🎨 Modern Interface
- **Glass morphism design**: Professional, modern aesthetic
- **Responsive layout**: Works on desktop and mobile
- **Real-time feedback**: Loading states and progress indicators
- **Accessibility**: Proper labels and keyboard navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Allowlisted Infura API key for Linea `eth_sendBundle`

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd CompromisedClaim

# Install dependencies
npm install

# Start development server
npm run dev
```

### Configuration

Update `src/config.ts`:

```typescript
export const SERVICE_CONFIG = {
  INFURA_API_KEY: 'your-allowlisted-api-key',
  LINEA_TOKEN_CLAIM_CONTRACT: '0x...', // LINEA token contract
  LINEA_RPC_URL: 'https://linea-mainnet.infura.io/v3/',
  LINEA_CHAIN_ID: 59144
};
```

## 📱 How to Use

1. **Enter Compromised Wallet**
   - Address of wallet with LINEA allocation
   - Private key (processed client-side only)

2. **Enter Safe Wallet**
   - Address of secure wallet
   - Private key (needed to fund gas)

3. **Specify Token Amount**
   - Enter your LINEA token allocation amount

4. **Execute Bundle**
   - Estimate gas costs first (optional)
   - Execute atomic bundle transaction
   - Tokens transferred to safety in one block

## 🔧 Technical Details

### Bundle Transaction Structure

```typescript
// 1. Fund compromised wallet with exact gas needed
const fundingTx = {
  from: safeWallet,
  to: compromisedWallet,
  value: calculatedGasAmount
};

// 2. Claim LINEA tokens from compromised wallet
const claimTx = {
  from: compromisedWallet,
  to: LINEA_CONTRACT,
  data: claimData
};

// 3. Transfer tokens to safe wallet
const transferTx = {
  from: compromisedWallet,
  to: LINEA_CONTRACT,
  data: transferData
};

// Submit as atomic bundle
const bundle = {
  method: 'eth_sendBundle',
  params: [{ txs: [fundingTx, claimTx, transferTx] }]
};
```

### Gas Optimization

- **EIP-1559 support**: Modern gas pricing
- **Safety buffers**: 20% gas limit buffer
- **Network adaptation**: Dynamic gas price adjustment
- **Failure prevention**: Comprehensive gas estimation

## 🛡️ Security Features

### Against Sweeper Bots
- **Mempool bypass**: Direct sequencer submission
- **Atomic execution**: No partial transaction states
- **Zero visibility**: Bots cannot see pending transactions

### User Protection
- **Client-side processing**: Keys never transmitted
- **Input validation**: Prevent malicious inputs
- **Error handling**: Graceful failure recovery
- **Retry logic**: Automatic retry with exponential backoff

## 🎨 UI/UX Features

- **Modern design**: Glass morphism with LINEA branding
- **Responsive**: Mobile-first design approach
- **Accessibility**: WCAG compliant form controls
- **Loading states**: Clear progress indicators
- **Error feedback**: User-friendly error messages

## 📊 Why This Works

### Technical Advantages
- **MEV Protection**: Immune to front-running
- **Gas Efficiency**: Precise cost calculation
- **Failure Safety**: Bundle reverts prevent partial execution
- **Speed**: Direct sequencer access

### User Benefits
- **Guaranteed safety**: Tokens recovered or no gas lost
- **Simple interface**: No blockchain expertise required
- **Reliable execution**: Robust retry mechanisms

## 🔄 Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run typecheck  # TypeScript type checking
npm run lint       # ESLint code checking
```

## 🌐 Production Deployment

1. **Build the app**: `npm run build`
2. **Deploy `dist/` folder** to your web server
3. **Configure environment** variables for production
4. **Ensure HTTPS** for security (Web3 requirement)

## ⚠️ Important Notes

- **Infura API Key**: Must be allowlisted for `eth_sendBundle`
- **LINEA Network**: Currently supports Linea mainnet only
- **Gas Requirements**: Safe wallet needs ETH for gas fees
- **Browser Support**: Modern browsers with Web3 support

## 🤝 Contributing

This tool addresses a critical need in the Web3 ecosystem. Contributions welcome for:

- Additional network support
- UI/UX improvements
- Security enhancements
- Performance optimizations

## 📄 License

MIT License - see LICENSE file for details.

---

**⚡ Built with Linea's `eth_sendBundle` API • Secure • Atomic • Invisible to Bots**