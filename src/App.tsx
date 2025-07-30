import { useState } from 'react';
import { AlertCircle, Shield, ArrowRight, CheckCircle2, Loader2, Calculator } from 'lucide-react';
import { ethers } from 'ethers';
import { LXPRescueService } from './rescue-service';
import { Validator } from './validator';
import { RescueConfig } from './types';

function App() {
  const [compromisedAddress, setCompromisedAddress] = useState('');
  const [compromisedKey, setCompromisedKey] = useState('');
  const [safeAddress, setSafeAddress] = useState('');
  const [safeKey, setSafeKey] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
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
      
      const service = new LXPRescueService();
      const estimate = await service.estimateGas(compromisedAddress, tokenAmount);
      
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
      
      const service = new LXPRescueService();
      const bundleResult = await service.rescueTokens(config, tokenAmount);
      
      setResult({ bundleHash: bundleResult.bundleHash });
      setStatus('success');
    } catch (error: any) {
      setResult({ error: error.message });
      setStatus('error');
    }
  };

  const isFormValid = compromisedAddress && compromisedKey && safeAddress && safeKey && tokenAmount;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-6 space-y-6">
        <div className="glass-card rounded-xl p-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full linea-gradient">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold linea-text">LINEA Token Claim Tool</h1>
              <p className="text-gray-700 mt-2 text-lg">
                Safely claim LINEA tokens from compromised wallets using atomic bundle transactions
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-6 border-l-4 border-amber-400">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-lg">Security Notice</p>
              <p className="text-gray-700 mt-2">
                This tool uses atomic bundle transactions to bypass sweeper bots. All transactions execute together atomically, preventing front-running attacks on compromised wallets.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl overflow-hidden">
          <div className="border-b border-gray-200/50">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('rescue')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'rescue'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Claim Tokens
              </button>
              <button
                onClick={() => setActiveTab('how')}
                className={`py-4 px-2 border-b-2 font-semibold text-sm transition-colors ${
                  activeTab === 'how'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                How It Works
              </button>
            </nav>
          </div>

          {activeTab === 'rescue' && (
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Compromised Wallet
                  </h3>
                  <div>
                    <label htmlFor="compromised-address" className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Address
                    </label>
                    <input
                      id="compromised-address"
                      type="text"
                      placeholder="0x..."
                      value={compromisedAddress}
                      onChange={(e) => setCompromisedAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="compromised-key" className="block text-sm font-medium text-gray-700 mb-1">
                      Private Key
                    </label>
                    <input
                      id="compromised-key"
                      type="password"
                      placeholder="Never share this elsewhere"
                      value={compromisedKey}
                      onChange={(e) => setCompromisedKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Required to sign rescue transactions. Not stored or transmitted.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Safe Destination
                  </h3>
                  <div>
                    <label htmlFor="safe-address" className="block text-sm font-medium text-gray-700 mb-1">
                      Safe Wallet Address
                    </label>
                    <input
                      id="safe-address"
                      type="text"
                      placeholder="0x..."
                      value={safeAddress}
                      onChange={(e) => setSafeAddress(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="safe-key" className="block text-sm font-medium text-gray-700 mb-1">
                      Safe Wallet Private Key
                    </label>
                    <input
                      id="safe-key"
                      type="password"
                      placeholder="For funding gas"
                      value={safeKey}
                      onChange={(e) => setSafeKey(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Needed to fund gas for the bundle transaction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="gradient-border max-w-md">
                <div className="gradient-border-inner p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Token Allocation
                  </h3>
                  <div>
                    <label htmlFor="token-amount" className="block text-sm font-medium text-gray-700 mb-2">
                      LINEA Token Amount
                    </label>
                    <input
                      id="token-amount"
                      type="text"
                      placeholder="1000.0"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Enter your LINEA token allocation amount to claim
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border border-slate-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-full bg-blue-100">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  </div>
                  Atomic Transaction Bundle
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 text-white font-bold text-sm">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Fund Gas</p>
                      <p className="text-sm text-gray-600">Send ETH to compromised wallet for transaction fees</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 text-white font-bold text-sm">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Claim LINEA</p>
                      <p className="text-sm text-gray-600">Execute LINEA token claim from compromised wallet</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  
                  <div className="flex items-center gap-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-bold text-sm">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Transfer to Safety</p>
                      <p className="text-sm text-gray-600">Move claimed LINEA tokens to your secure wallet</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <button
                  onClick={handleEstimate}
                  disabled={!isFormValid || status === 'estimating'}
                  className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg transition-all duration-200 hover:shadow-xl"
                >
                  {status === 'estimating' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Calculator className="h-5 w-5" />
                  )}
                  Estimate Gas
                </button>
                
                <button
                  onClick={handleRescue}
                  disabled={!isFormValid || status === 'processing'}
                  className="flex items-center gap-3 px-8 py-4 linea-gradient text-white rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-1 font-bold shadow-lg transition-all duration-200 hover:shadow-xl"
                >
{(() => {
                    if (status === 'processing') {
                      return (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Executing Bundle...
                        </>
                      );
                    }
                    if (status === 'success') {
                      return (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Claim Complete!
                        </>
                      );
                    }
                    return 'Execute Claim Bundle';
                  })()}
                </button>
              </div>

              {result.gasEstimate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-medium">Gas Estimate</p>
                  <p className="text-blue-700 text-sm mt-1">
                    Estimated ETH needed: {result.gasEstimate} ETH
                  </p>
                </div>
              )}

              {status === 'success' && result.bundleHash && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-green-800 font-medium">Success!</p>
                      <p className="text-green-700 text-sm mt-1">
                        Your LINEA tokens have been claimed successfully! Bundle Hash: {result.bundleHash}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {status === 'error' && result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-700 text-sm mt-1">{result.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'how' && (
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">How Bundle Transactions Work</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">The Problem:</h4>
                    <p className="text-gray-600 text-sm">
                      When a wallet's private key is compromised, bots monitor it and immediately steal any ETH sent to it. 
                      This makes it impossible to pay for gas to move tokens out.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">The Solution:</h4>
                    <p className="text-gray-600 text-sm">
                      Linea's `eth_sendBundle` API allows us to submit multiple transactions that execute atomically 
                      (all-or-nothing) while bypassing the public mempool where bots lurk.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Security Features:</h4>
                    <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                      <li>Transactions bypass the public mempool</li>
                      <li>All transactions execute together or not at all</li>
                      <li>Bots cannot see or front-run the transactions</li>
                      <li>Gas is funded and used in the same atomic operation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;