import { useState } from 'react';
import { AlertCircle, Shield, ArrowRight, CheckCircle2, Loader2, Calculator, Lock, Zap, Eye, Target } from 'lucide-react';
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
      {/* Floating orbs for visual appeal */}
      <div className="floating-orb"></div> 
      <div className="floating-orb"></div>
      <div className="floating-orb"></div>

      <div className="relative z-10 w-full">
        {/* Hero Section */}
        <div className="container mx-auto px-6 pt-12 pb-8">
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full linea-gradient mb-6 pulse-glow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-6xl font-bold mb-4 text-shadow">
              <span className="text-white">LINEA Token</span>
              <br />
              <span className="linea-text">Claim Rescue</span>
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Safely claim your LINEA token allocation from compromised wallets using atomic bundle transactions that bypass sweeper bots
            </p>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              { icon: Eye, title: 'Invisible', desc: 'Bypass mempool monitoring' },
              { icon: Zap, title: 'Atomic', desc: 'All-or-nothing execution' },
              { icon: Lock, title: 'Secure', desc: 'Client-side key handling' },
              { icon: Target, title: 'Precise', desc: 'Optimized gas pricing' }
            ].map((feature) => (
              <div key={feature.title} className="glass-card card-hover rounded-2xl p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Claim Mode Notice */}
          <div className="glass-card rounded-2xl p-8 mb-8 border-l-4 border-blue-400 card-hover">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-3">Active Claim Mode: {claimMode.replace('_', ' ').toUpperCase()}</h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  {claimMode === 'user_input' && 'You specify the exact amount of LINEA tokens to claim.'}
                  {claimMode === 'auto_detect' && 'Token allocation automatically detected from LINEA API.'}
                  {claimMode === 'claim_all' && 'All available LINEA tokens will be claimed automatically.'}
                  {claimMode === 'merkle_proof' && 'Merkle proof-based claiming for verified allocations.'}
                </p>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="glass-card rounded-2xl p-8 mb-12 border-l-4 border-amber-400 card-hover">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-xl mb-3">Critical Security Notice</h3>
                <p className="text-white/80 text-lg leading-relaxed">
                  This tool uses atomic bundle transactions submitted directly to Linea's sequencer. All three transactions 
                  (fund gas → claim tokens → transfer to safety) execute together in a single block, making them invisible 
                  to sweeper bots until completion.
                </p>
              </div>
            </div>
          </div>

          {/* Main Interface Card */}
          <div className="glass-card rounded-3xl overflow-hidden mb-12 card-hover">
            {/* Tab Navigation */}
            <div className="bg-white/5 border-b border-white/10 px-8 py-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'rescue', label: 'Claim Tokens', icon: Shield },
                  { id: 'how', label: 'How It Works', icon: Eye }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'rescue' | 'how')}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'rescue' && (
              <div className="p-12 space-y-12">
                {/* Wallet Inputs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Compromised Wallet */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <h3 className="text-2xl font-bold text-white">Compromised Wallet</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="compromised-address" className="block text-white/80 font-medium mb-3 text-lg">Wallet Address</label>
                        <input
                          id="compromised-address"
                          type="text"
                          placeholder="0x..."
                          value={compromisedAddress}
                          onChange={(e) => setCompromisedAddress(e.target.value)}
                          className="glass-input w-full text-lg"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="compromised-key" className="block text-white/80 font-medium mb-3 text-lg">Private Key</label>
                        <input
                          id="compromised-key"
                          type="password"
                          placeholder="Never share this elsewhere"
                          value={compromisedKey}
                          onChange={(e) => setCompromisedKey(e.target.value)}
                          className="glass-input w-full text-lg"
                        />
                        <p className="text-white/50 text-sm mt-2">
                          Required to sign rescue transactions. Processed client-side only.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Safe Wallet */}
                  <div className="space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <h3 className="text-2xl font-bold text-white">Safe Destination</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="safe-address" className="block text-white/80 font-medium mb-3 text-lg">Safe Wallet Address</label>
                        <input
                          id="safe-address"
                          type="text"
                          placeholder="0x..."
                          value={safeAddress}
                          onChange={(e) => setSafeAddress(e.target.value)}
                          className="glass-input w-full text-lg"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="safe-key" className="block text-white/80 font-medium mb-3 text-lg">Safe Wallet Private Key</label>
                        <input
                          id="safe-key"
                          type="password"
                          placeholder="For funding gas fees"
                          value={safeKey}
                          onChange={(e) => setSafeKey(e.target.value)}
                          className="glass-input w-full text-lg"
                        />
                        <p className="text-white/50 text-sm mt-2">
                          Needed to fund gas for the atomic bundle transaction.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Token Amount Section - Conditional based on claim mode */}
                {isAmountRequired && (
                  <div className="max-w-md mx-auto">
                    <div className="gradient-border">
                      <div className="gradient-border-inner p-8 text-center">
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <h3 className="text-xl font-bold text-white">Token Allocation</h3>
                        </div>
                        
                        <div>
                          <label htmlFor="token-amount" className="block text-white/80 font-medium mb-4 text-lg">LINEA Token Amount</label>
                          <input
                            id="token-amount"
                            type="text"
                            placeholder="1000.0"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            className="glass-input w-full text-xl text-center font-semibold"
                          />
                          <p className="text-white/60 mt-3">
                            Enter your LINEA token allocation amount to claim
                          </p>
                        </div>
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
                        <label htmlFor="claim-contract" className="block text-white/80 font-medium mb-3 text-lg">
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
                        <p className="text-white/50 text-xs mt-2">
                          Contract that handles claim() function
                        </p>
                      </div>
                      
                      <div>
                        <label htmlFor="token-contract" className="block text-white/80 font-medium mb-3 text-lg">
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
                        <p className="text-white/50 text-xs mt-2">
                          ERC-20 token contract for transfer()
                        </p>
                      </div>
                    </div>

                    <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-400/30 mt-6">
                      <p className="text-purple-200 text-sm mb-2">
                        🚀 <strong>For Testing:</strong>
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
                        <span className="text-green-400 font-semibold">Default: 25 Gwei</span>
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
                      <label htmlFor="custom-gas-toggle" className="text-white font-semibold text-lg cursor-pointer">
                        Override with custom gas price
                      </label>
                    </div>

                    {/* Custom Gas Input */}
                    {useCustomGas && (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="gas-price" className="block text-white/80 font-medium mb-3 text-lg">
                            Custom Gas Price (Gwei)
                          </label>
                          <input
                            id="gas-price"
                            type="number"
                            placeholder="100"
                            min="1"
                            max="1000"
                            value={gasPrice}
                            onChange={(e) => setGasPrice(e.target.value)}
                            className="glass-input w-full text-xl text-center font-semibold"
                          />
                        </div>
                        
                        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-400/30">
                          <p className="text-orange-200 text-sm mb-2">
                            🔥 <strong>LINEA Token Launch Strategy:</strong>
                          </p>
                          <ul className="text-orange-200/80 text-sm space-y-1">
                            <li>• <strong>Conservative:</strong> 50-100 Gwei</li>
                            <li>• <strong>Competitive:</strong> 100-300 Gwei</li>
                            <li>• <strong>Aggressive:</strong> 300-500 Gwei</li>
                          </ul>
                          <p className="text-orange-400 text-xs mt-3">
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
                      { num: 1, title: 'Fund Gas', desc: 'ETH → Compromised Wallet', color: 'from-green-400 to-emerald-600' },
                      { num: 2, title: 'Claim Tokens', desc: 'Execute LINEA Claim', color: 'from-blue-400 to-purple-600' },
                      { num: 3, title: 'Transfer Safe', desc: 'Tokens → Safe Wallet', color: 'from-purple-400 to-pink-600' }
                    ].map((step) => (
                      <div key={step.title} className="flex items-center gap-6 step-line">
                        <div className="glass-card rounded-2xl p-6 text-center min-w-[200px] card-hover">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center mx-auto mb-4 text-white font-bold text-lg`}>
                            {step.num}
                          </div>
                          <h4 className="text-white font-semibold mb-2">{step.title}</h4>
                          <p className="text-white/60 text-sm">{step.desc}</p>
                        </div>
                        {step.num < 3 && (
                          <ArrowRight className="w-8 h-8 text-white/40 hidden lg:block" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 max-w-2xl mx-auto">
                  <button
                    onClick={handleEstimate}
                    disabled={!isFormValid || status === 'estimating'}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all duration-300 border border-white/20 hover:border-white/40 disabled:opacity-50"
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
                    className="flex items-center justify-center gap-3 px-8 py-4 linea-gradient text-white rounded-2xl font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 flex-1"
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