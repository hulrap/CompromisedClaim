import { useState } from 'react';
import { AlertCircle, Shield, CheckCircle2, Loader2, Calculator, Lock, Zap, Eye, Target } from 'lucide-react';

// Linea Official Decoration Component - Uses Official SVG File
const LineaDecoration = () => {
  return (
    <div className="fixed top-0 right-0 w-1/2 h-full pointer-events-none z-0 overflow-hidden">
      <img 
        src="/bottom-right-deco.svg" 
        alt="Linea geometric pattern" 
        className="absolute top-1/2 right-0 transform -translate-y-1/2 opacity-40 w-auto h-auto max-w-full max-h-full object-contain"
      />
    </div>
  );
};
import { ethers } from 'ethers';
import { LXPRescueService } from './rescue-service';
import { Validator } from './validator';
import { RescueConfig } from './types';
import { SERVICE_CONFIG } from './config';

function App() {
  const [compromisedAddress, setCompromisedAddress] = useState('');
  const [compromisedKey, setCompromisedKey] = useState('');
  const [safeAddress, setSafeAddress] = useState('');
  const [safeKey, setSafeKey] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [gasPrice, setGasPrice] = useState(''); // User-defined gas price in gwei (empty = use default)
  const [useCustomGas, setUseCustomGas] = useState(false);
  const [lineaClaimContract, setLineaClaimContract] = useState('');
  const [lineaTokenContract, setLineaTokenContract] = useState('');
  const [status, setStatus] = useState<'idle' | 'estimating' | 'processing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ bundleHash?: string; error?: string; gasEstimate?: string }>({});
  const [activeTab, setActiveTab] = useState<'rescue' | 'how'>('rescue');

  const handleEstimate = async () => {
    try {
      setStatus('estimating');
      setResult({});
      
      const config: RescueConfig = {
        compromisedAddress,
        compromisedPrivateKey: compromisedKey,
        safeAddress,
        safePrivateKey: safeKey
      };
      
      Validator.validateConfig(config);
      if (useCustomGas && gasPrice) {
        Validator.validateGasPrice(gasPrice);
      }
      if (tokenAmount && isAmountRequired) {
        Validator.validateTokenAmount(tokenAmount);
      }
      if (lineaClaimContract) {
        Validator.validateContractAddress(lineaClaimContract, 'LINEA Claim Contract');
      }
      if (lineaTokenContract) {
        Validator.validateContractAddress(lineaTokenContract, 'LINEA Token Contract');
      }
      
      const service = new LXPRescueService();
      const finalGasPrice = useCustomGas && gasPrice ? gasPrice : '25'; // Default to 25 Gwei
      const estimate = await service.estimateGas(compromisedAddress, tokenAmount, finalGasPrice, lineaClaimContract, lineaTokenContract);
      
      setResult({ gasEstimate: ethers.formatEther(estimate.totalEthNeeded) });
      setStatus('idle');
    } catch (error: any) {
      setResult({ error: error.message });
      setStatus('error');
    }
  };

  const handleRescue = async () => {
    try {
      setStatus('processing');
      setResult({});
      
      const config: RescueConfig = {
        compromisedAddress,
        compromisedPrivateKey: compromisedKey,
        safeAddress,
        safePrivateKey: safeKey
      };
      
      Validator.validateConfig(config);
      if (useCustomGas && gasPrice) {
        Validator.validateGasPrice(gasPrice);
      }
      if (tokenAmount && isAmountRequired) {
        Validator.validateTokenAmount(tokenAmount);
      }
      if (lineaClaimContract) {
        Validator.validateContractAddress(lineaClaimContract, 'LINEA Claim Contract');
      }
      if (lineaTokenContract) {
        Validator.validateContractAddress(lineaTokenContract, 'LINEA Token Contract');
      }
      
      const service = new LXPRescueService();
      const finalGasPrice = useCustomGas && gasPrice ? gasPrice : '25'; // Default to 25 Gwei
      const bundleResult = await service.rescueTokens(config, tokenAmount, finalGasPrice, lineaClaimContract, lineaTokenContract);
      
      setResult({ bundleHash: bundleResult.bundleHash });
      setStatus('success');
    } catch (error: any) {
      setResult({ error: error.message });
      setStatus('error');
    }
  };

  // Determine what fields are required based on claim mode
  const getClaimMode = () => {
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_MERKLE_PROOF_MODE) return 'merkle_proof';
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_CLAIM_ALL_MODE) return 'claim_all';
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_AUTO_DETECTION) return 'auto_detect';
    if (SERVICE_CONFIG.CLAIM_CONFIG.USE_USER_INPUT_AMOUNT) return 'user_input';
    
    // Fallback: if no mode is explicitly set, default to user input
    return 'user_input';
  };

  const claimMode = getClaimMode();
  const isAmountRequired = claimMode === 'user_input';
  const isFormValid = compromisedAddress && compromisedKey && safeAddress && safeKey && 
    (isAmountRequired ? tokenAmount : true) && 
    (!useCustomGas || (useCustomGas && gasPrice)) &&
    lineaClaimContract && lineaTokenContract;

  return (
    <div className="min-h-screen relative w-full">
      {/* Linea Official Decoration Pattern */}
      <LineaDecoration />

      <div className="relative z-10 w-full">
        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-16 pb-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16 linea-slide-up">
              <div className="flex items-center gap-3 mb-8">
                <svg width="94" height="27" viewBox="0 0 94 27" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: '#61dfff' }}>
                  <path d="M24.5297 26.6292H20.6408V7.70474H24.5297V26.6292Z" fill="currentColor"></path>
                  <path d="M38.5818 7.33261C40.7286 7.33261 42.4824 8.08536 43.8412 9.5909C45.1982 11.0964 45.8786 13.0105 45.8786 15.3313V26.6266H41.9897V15.9238C41.9897 14.4672 41.5205 13.2627 40.5819 12.3126C39.6434 11.3623 38.484 10.8872 37.1017 10.8872C35.5454 10.8872 34.2745 11.3623 33.2871 12.3126C32.2998 13.2627 31.8051 14.4672 31.8051 15.9238V26.6266H27.9162V7.7041H31.8051V12.5921C32.3232 10.9634 33.1815 9.67885 34.3801 8.74035C35.5767 7.80186 36.9785 7.33261 38.5837 7.33261H38.5818Z" fill="currentColor"></path>
                  <path d="M58.0027 7.33261C61.0391 7.33261 63.5086 8.4197 65.409 10.5919C67.3095 12.7661 68.0876 15.3939 67.7415 18.4812H52.0765C52.3482 20.0121 53.0521 21.2536 54.1881 22.2038C55.324 23.1541 56.6927 23.6292 58.298 23.6292C59.5316 23.6292 60.6363 23.3261 61.612 22.7219C62.5877 22.1179 63.3463 21.2967 63.8898 20.2584L67.1491 21.7033C66.3104 23.3085 65.1118 24.5912 63.5575 25.5551C62.0031 26.519 60.2121 27 58.1865 27C55.3476 27 52.9642 26.0615 51.0383 24.1864C49.1124 22.3114 48.1485 19.9769 48.1485 17.1869C48.1485 14.3967 49.0929 12.0583 50.9816 10.1676C52.8703 8.27892 55.2087 7.33457 58.0007 7.33457L58.0027 7.33261ZM58.0027 10.7034C56.5696 10.7034 55.33 11.1414 54.28 12.0193C53.2301 12.8952 52.532 14.037 52.188 15.4447H63.8175C63.4968 14.037 62.8105 12.8952 61.7625 12.0193C60.7126 11.1433 59.4593 10.7034 58.0027 10.7034Z" fill="currentColor"></path>
                  <path d="M78.4939 7.33261C80.7658 7.33261 82.6173 7.92504 84.0485 9.10988C85.4798 10.2948 86.1973 11.9997 86.1973 14.2208V26.6285H82.3084V21.5919C81.147 25.1972 78.8145 27 75.3089 27C73.6782 27 72.3213 26.5131 71.2342 25.5375C70.1471 24.5618 69.6055 23.2851 69.6055 21.7053C69.6055 19.8538 70.2586 18.4636 71.5685 17.5387C72.8765 16.6139 74.5443 16.0391 76.568 15.8162L80.234 15.4447C81.6163 15.3216 82.3084 14.7038 82.3084 13.5931C82.3084 12.6801 81.9566 11.9508 81.2527 11.4092C80.5488 10.8657 79.6298 10.5939 78.4939 10.5939C77.3579 10.5939 76.3509 10.8911 75.5493 11.4835C74.7477 12.0759 74.2354 12.9401 74.0126 14.0761L70.1607 13.1493C70.5069 11.3721 71.4316 9.9584 72.9391 8.9085C74.4446 7.86052 76.2961 7.33457 78.4939 7.33457V7.33261ZM76.568 23.8502C78.1732 23.8502 79.5301 23.3125 80.6407 22.239C81.7512 21.1657 82.3065 19.9124 82.3065 18.4792V17.443C82.0113 17.9376 81.2937 18.2446 80.1578 18.3677L76.566 18.8116C75.6275 18.9367 74.8807 19.2124 74.3253 19.6446C73.7701 20.0766 73.4925 20.6632 73.4925 21.4042C73.4925 22.1453 73.7701 22.7377 74.3253 23.1815C74.8807 23.6253 75.6275 23.8482 76.566 23.8482L76.568 23.8502Z" fill="currentColor"></path>
                  <path d="M17.9625 26.6292H0V7.70474H4.10984V22.9631H17.9625V26.6292Z" fill="currentColor"></path>
                  <path d="M89.8631 7.33201C91.8877 7.33201 93.529 5.69068 93.529 3.666C93.529 1.64133 91.8877 0 89.8631 0C87.8383 0 86.197 1.64133 86.197 3.666C86.197 5.69068 87.8383 7.33201 89.8631 7.33201Z" fill="currentColor"></path>
                </svg>
              </div>
              <h1 className="linea-text-large mb-6">
                Token Claim
                <br />
                <span className="text-white font-normal">Rescue</span>
              </h1>
              <p className="text-white/70 text-lg max-w-2xl leading-relaxed">
                Safely claim your LINEA token allocation from compromised wallets using atomic bundle transactions that bypass sweeper bots
              </p>
            </div>

          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 max-w-6xl">

          {/* Main Interface Card */}
          <div className="linea-main-card overflow-hidden mb-8 linea-hover">
            {/* Tab Navigation */}
            <div className="bg-white/5 border-b border-white/10 px-6 py-4">
              <nav className="flex space-x-6">
                {[
                  { id: 'rescue', label: 'Claim Tokens', icon: Shield },
                  { id: 'how', label: 'How It Works', icon: Eye }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'rescue' | 'how')}
                    className={`flex items-center gap-2 px-4 py-2 font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'linea-button text-sm'
                        : 'text-white/60 hover:text-white text-sm'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'rescue' && (
              <div className="p-8 space-y-8">
                {/* Wallet Inputs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Compromised Wallet */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">Compromised Wallet</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="compromised-address" className="block text-white/90 font-medium mb-2 text-sm">Wallet Address</label>
                        <input
                          id="compromised-address"
                          type="text"
                          placeholder="0x..."
                          value={compromisedAddress}
                          onChange={(e) => setCompromisedAddress(e.target.value)}
                          className="linea-input w-full"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="compromised-key" className="block text-white/90 font-medium mb-2 text-sm">Private Key</label>
                        <input
                          id="compromised-key"
                          type="password"
                          placeholder="Never share this elsewhere"
                          value={compromisedKey}
                          onChange={(e) => setCompromisedKey(e.target.value)}
                          className="linea-input w-full"
                        />
                        <p className="text-white/70 text-xs mt-2">
                          Required to sign rescue transactions. Processed client-side only.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Safe Wallet */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <h3 className="text-lg font-semibold text-white">Safe Destination</h3>
                    </div>
                    
                    {/* Critical Security Warning */}
                    <div className="status-error p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-200 text-xs font-semibold mb-2">
                            CRITICAL SECURITY REQUIREMENT
                          </p>
                          <ul className="text-red-200/90 text-xs space-y-1">
                            <li>• Use a BRAND NEW wallet created only for this transaction</li>
                            <li>• Fund it with ONLY the gas amount needed (check estimate first)</li>
                            <li>• NEVER reuse this wallet or save the private key anywhere</li>
                            <li>• Consider it compromised after this single use</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="safe-address" className="block text-white/90 font-medium mb-2 text-sm">Fresh Wallet Address</label>
                        <input
                          id="safe-address"
                          type="text"
                          placeholder="0x... (newly created wallet)"
                          value={safeAddress}
                          onChange={(e) => setSafeAddress(e.target.value)}
                          className="linea-input w-full"
                        />
                        <p className="text-white/70 text-xs mt-2">
                          Create this wallet fresh - never used before or after this transaction
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="safe-key" className="block text-white/90 font-medium mb-2 text-sm">
                          Fresh Wallet Private Key
                          {' '}
                          <span className="text-red-400 ml-2 text-xs font-normal">Single Use Only</span>
                        </label>
                        <input
                          id="safe-key"
                          type="password"
                          placeholder="Private key for gas funding only"
                          value={safeKey}
                          onChange={(e) => setSafeKey(e.target.value)}
                          className="linea-input-sensitive w-full"
                        />
                        <div className="text-white/70 text-xs mt-2 space-y-1">
                          <p>• Required to sign the gas funding transaction</p>
                          <p>• <strong className="text-white/90">Fund with exact gas estimate amount only</strong></p>
                          <p>• <strong className="text-red-600">Discard this wallet after use</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Amount Section - Conditional based on claim mode */}
                {isAmountRequired && (
                  <div className="max-w-md mx-auto">
                    <div className="glass-card p-8 text-center" style={{background: 'rgba(97, 223, 255, 0.1)', borderColor: 'rgba(25, 0, 102, 0.3)'}}>
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                          <h3 className="text-xl font-bold text-white">Token Allocation</h3>
                        </div>
                        
                        <div>
                          <label htmlFor="token-amount" className="block text-white/80 font-medium mb-4 text-lg">LINEA Token Amount</label>
                          <input
                            id="token-amount"
                            type="number"
                            placeholder="1000.0"
                            min="0.000001"
                            max="1000000000"
                            step="0.000001"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            className="glass-input w-full text-xl text-center font-semibold"
                          />
                          <p className="text-white/70 mt-3">
                            Enter your LINEA token allocation amount to claim
                          </p>
                        </div>
                    </div>
                  </div>
                )}

                {!isAmountRequired && (
                  <div className="max-w-md mx-auto">
                    <div className="glass-card rounded-2xl p-8 text-center border border-green-400/50">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <h3 className="text-xl font-bold text-white">Automatic Token Detection</h3>
                      </div>
                      <p className="text-white/80 text-lg">
                        {claimMode === 'auto_detect' && 'Token allocation will be fetched from LINEA API'}
                        {claimMode === 'claim_all' && 'All available tokens will be claimed automatically'}
                        {claimMode === 'merkle_proof' && 'Allocation determined by merkle proof verification'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Contract Addresses Section - For Testing */}
                <div className="max-w-2xl mx-auto">
                  <div className="glass-card rounded-2xl p-8 border border-purple-400/50">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Contract Addresses</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="claim-contract" className="block text-white/90 font-medium mb-3 text-lg">
                          LINEA Claim Contract
                        </label>
                        <input
                          id="claim-contract"
                          type="text"
                          placeholder="0x..."
                          value={lineaClaimContract}
                          onChange={(e) => setLineaClaimContract(e.target.value)}
                          className="glass-input w-full text-sm"
                        />
                        <p className="text-white/70 text-xs mt-2">
                          Contract that handles claim() function
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="token-contract" className="block text-white/90 font-medium mb-3 text-lg">
                          LINEA Token Contract
                        </label>
                        <input
                          id="token-contract"
                          type="text"
                          placeholder="0x..."
                          value={lineaTokenContract}
                          onChange={(e) => setLineaTokenContract(e.target.value)}
                          className="glass-input w-full text-sm"
                        />
                        <p className="text-white/70 text-xs mt-2">
                          ERC-20 token contract for transfer()
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-400/30 mt-6">
                      <p className="text-purple-200 text-sm mb-2">
                        <strong>For Testing:</strong>
                      </p>
                      <p className="text-purple-200/80 text-xs">
                        Deploy your own test contracts or use existing ones to test the bundle functionality.
                        This allows testing before LINEA official launch!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gas Price Section - Always visible */}
                <div className="max-w-lg mx-auto">
                  <div className="glass-card rounded-2xl p-8 border border-orange-400/50">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <h3 className="text-xl font-bold text-white">Gas Price Configuration</h3>
                    </div>
                    
                    {/* Default Gas Info */}
                    <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white font-semibold">Default: 25 Gwei</span>
                      </div>
                      <p className="text-white/70 text-sm">
                        Safe, standard gas price. Good for normal network conditions.
                      </p>
                    </div>

                    {/* Custom Gas Toggle */}
                    <div className="flex items-center gap-4 mb-6">
                      <input
                        type="checkbox"
                        id="custom-gas-toggle"
                        checked={useCustomGas}
                        onChange={(e) => setUseCustomGas(e.target.checked)}
                        className="w-5 h-5 rounded border-2 border-white/20 bg-white/10 checked:bg-orange-500 focus:outline-none"
                      />
                      <label htmlFor="custom-gas-toggle" className="text-white/90 font-semibold text-lg cursor-pointer">
                        Override with custom gas price
                      </label>
                    </div>

                    {/* Custom Gas Input */}
                    {useCustomGas && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="gas-price" className="block text-white/90 font-medium mb-3 text-lg">
                            Custom Gas Price (Gwei)
                          </label>
                          <input
                            id="gas-price"
                            type="number"
                            placeholder="100"
                            min="0.001"
                            max="1000"
                            step="0.001"
                            value={gasPrice}
                            onChange={(e) => setGasPrice(e.target.value)}
                            className="glass-input w-full text-xl text-center font-semibold"
                          />
                        </div>
                        
                        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-400/30">
                          <p className="text-orange-200 text-sm mb-2">
                            <strong>LINEA Token Launch Strategy:</strong>
                          </p>
                          <ul className="text-orange-200/80 text-sm space-y-1">
                            <li>• <strong>Conservative:</strong> 50-100 Gwei</li>
                            <li>• <strong>Competitive:</strong> 100-300 Gwei</li>
                            <li>• <strong>Aggressive:</strong> 300-500 Gwei</li>
                          </ul>
                          <p className="text-white/70 text-xs mt-3">
                            Higher gas = faster execution during token launch rush
                          </p>
                        </div>
                      </div>
                    )}

                    {!useCustomGas && (
                      <div className="text-center">
                        <p className="text-white/60 text-sm">
                          Using default 25 Gwei for all transactions
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Preview */}
                <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-10 border border-white/20">
                  <h3 className="text-2xl font-bold text-white mb-8 text-center">Atomic Bundle Execution</h3>
                  
                  <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
                    {[
                      { num: 1, title: 'Fund Gas', desc: 'ETH → Compromised Wallet' },
                      { num: 2, title: 'Claim Tokens', desc: 'Execute LINEA Claim' },
                      { num: 3, title: 'Transfer Safe', desc: 'Tokens → Safe Wallet' }
                    ].map((step) => (
                      <div key={step.title} className="flex items-center gap-6 step-line">
                        <div className="glass-card rounded-2xl p-6 text-center min-w-[200px] card-hover">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg" style={{backgroundColor: '#190066'}}>
                            {step.num}
                          </div>
                          <h4 className="text-white font-semibold mb-2" style={{color: '#FFFFFF'}}>{step.title}</h4>
                          <p className="text-white/60 text-sm">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto">
                  <button
                    onClick={handleEstimate}
                    disabled={!isFormValid || status === 'processing'}
                    className="flex items-center justify-center gap-3 px-8 py-4 font-semibold transition-all duration-300 disabled:opacity-50 rounded-lg"
                    style={{
                      backgroundColor: '#190066', 
                      color: '#FFFFFF',
                      border: 'none',
                      filter: 'none',
                      backdropFilter: 'none'
                    }}
                  >
                    {status === 'estimating' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Calculator className="w-5 h-5" />
                    )}
                    Estimate Gas Cost
                  </button>
                  
                  <button
                    onClick={handleRescue}
                    disabled={!isFormValid || status === 'processing'}
                    className="flex items-center justify-center gap-3 px-8 py-4 text-lg shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 flex-1 rounded-lg font-semibold"
                    style={{
                      backgroundColor: '#61DFFF', 
                      color: '#FFFFFF',
                      border: 'none',
                      filter: 'none',
                      backdropFilter: 'none'
                    }}
                  >
                    {(() => {
                      if (status === 'processing') {
                        return (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Executing Bundle...
                          </>
                        );
                      }
                      if (status === 'success') {
                        return (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Claim Complete!
                          </>
                        );
                      }
                      return (
                        <>
                          <Shield className="w-5 h-5" />
                          Execute Claim Bundle
                        </>
                      );
                    })()}
                  </button>
                </div>

                {/* Results */}
                {result.gasEstimate && (
                  <div className="glass-card rounded-2xl p-6 max-w-md mx-auto text-center border border-blue-400/50">
                    <h4 className="text-white font-semibold text-lg mb-2">Gas Estimate</h4>
                    <p className="text-blue-400 text-2xl font-bold">{result.gasEstimate} ETH</p>
                    <p className="text-white/60 text-sm mt-2">
                      Required for bundle execution at {useCustomGas && gasPrice ? gasPrice : '25'} Gwei
                    </p>
                    <div className="text-xs text-white/50 mt-2">
                      {useCustomGas && gasPrice ? 
                        `Using custom gas price: ${gasPrice} Gwei` : 
                        'Using default gas price: 25 Gwei'
                      }
                    </div>
                  </div>
                )}

                {status === 'success' && result.bundleHash && (
                  <div className="glass-card rounded-2xl p-8 border border-green-400/50 card-hover">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xl">Success!</h4>
                        <p className="text-green-400">Your LINEA tokens have been claimed successfully!</p>
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 mt-4">
                      <p className="text-white/60 text-sm mb-1">Bundle Hash:</p>
                      <p className="text-white font-mono text-sm break-all">{result.bundleHash}</p>
                    </div>
                  </div>
                )}

                {status === 'error' && result.error && (
                  <div className="glass-card rounded-2xl p-8 border border-red-400/50 card-hover">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-xl">Error</h4>
                        <p className="text-red-400">{result.error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'how' && (
              <div className="p-12 space-y-10">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">How Atomic Bundle Transactions Work</h2>
                  <p className="text-white/80 text-lg">Understanding the technology behind sweeper bot protection</p>
                </div>

                <div className="space-y-12">
                  <div className="glass-card rounded-2xl p-8 card-hover">
                    <h3 className="text-xl font-bold text-white mb-4">The Problem</h3>
                    <p className="text-white/80 leading-relaxed">
                      When a wallet's private key is compromised, malicious "sweeper bots" continuously monitor it. 
                      These bots immediately steal any ETH sent to the wallet for gas fees, creating an impossible 
                      situation where users cannot execute transactions to claim their rightful tokens.
                    </p>
                  </div>

                  <div className="glass-card rounded-2xl p-8 card-hover">
                    <h3 className="text-xl font-bold text-white mb-4">The Solution</h3>
                    <p className="text-white/80 leading-relaxed mb-6">
                      Linea's <code className="bg-black/30 px-2 py-1 rounded text-blue-400">eth_sendBundle</code> API 
                      allows us to submit multiple transactions that execute atomically (all-or-nothing) while bypassing 
                      the public mempool where bots monitor for transactions.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { title: 'Direct Sequencer Access', desc: 'Transactions bypass the public mempool entirely' },
                        { title: 'Atomic Execution', desc: 'All transactions execute together in one block' },
                        { title: 'All-or-Nothing', desc: 'Either everything succeeds or nothing happens' },
                        { title: 'Zero Visibility', desc: 'Bots cannot see transactions before execution' }
                      ].map((feature) => (
                        <div key={feature.title} className="bg-white/5 rounded-xl p-4">
                          <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                          <p className="text-white/60 text-sm">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-8 card-hover">
                    <h3 className="text-xl font-bold text-white mb-6">Security Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { icon: Lock, title: 'Client-Side Security', desc: 'Private keys never leave your browser' },
                        { icon: Zap, title: 'MEV Protection', desc: 'Immune to front-running and sandwich attacks' },
                        { icon: Target, title: 'Gas Optimization', desc: 'Precise calculations prevent failures' }
                      ].map((feature) => (
                        <div key={feature.title} className="text-center">
                          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                            <feature.icon className="w-8 h-8 text-white" />
                          </div>
                          <h4 className="text-white font-semibold mb-2">{feature.title}</h4>
                          <p className="text-white/60 text-sm">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-12 text-white/60">
          <p>Built with Linea's eth_sendBundle API • Secure • Atomic • Invisible to Bots</p>
        </div>
      </div>
    </div>
  );
}

export default App;