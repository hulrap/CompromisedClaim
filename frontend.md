import React, { useState } from 'react';
import { AlertCircle, Shield, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const RescueTool = () => {
  const [compromisedAddress, setCompromisedAddress] = useState('');
  const [compromisedKey, setCompromisedKey] = useState('');
  const [safeAddress, setSafeAddress] = useState('');
  const [status, setStatus] = useState('idle');
  const [txHash, setTxHash] = useState('');

  const handleRescue = async () => {
    setStatus('processing');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setTxHash('0x1234...abcd');
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <CardTitle className="text-2xl">LXP Rescue Tool</CardTitle>
          </div>
          <CardDescription>
            Safely recover LXP tokens from compromised wallets using Linea's bundle transactions
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This tool uses atomic bundle transactions to bypass sweeper bots. 
          All transactions execute together, preventing front-running attacks.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="rescue" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rescue">Rescue Tokens</TabsTrigger>
          <TabsTrigger value="how">How It Works</TabsTrigger>
        </TabsList>

        <TabsContent value="rescue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Compromised Wallet</CardTitle>
              <CardDescription>Enter the details of your compromised wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Wallet Address</label>
                <Input
                  placeholder="0x..."
                  value={compromisedAddress}
                  onChange={(e) => setCompromisedAddress(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Private Key</label>
                <Input
                  type="password"
                  placeholder="Never share this elsewhere"
                  value={compromisedKey}
                  onChange={(e) => setCompromisedKey(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required to sign the rescue transactions. Not stored or transmitted.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Safe Destination</CardTitle>
              <CardDescription>Where should we send the rescued LXP?</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium">Safe Wallet Address</label>
                <Input
                  placeholder="0x..."
                  value={safeAddress}
                  onChange={(e) => setSafeAddress(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Make sure you control this wallet
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Bundle Preview</CardTitle>
              <CardDescription>These transactions will execute atomically</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Fund Gas</p>
                    <p className="text-sm text-gray-600">Send ETH to compromised wallet for gas</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Claim LXP</p>
                    <p className="text-sm text-gray-600">Execute LXP claim from compromised wallet</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Transfer to Safety</p>
                    <p className="text-sm text-gray-600">Move LXP to your safe wallet</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            onClick={handleRescue}
            disabled={!compromisedAddress || !compromisedKey || !safeAddress || status === 'processing'}
            className="w-full"
            size="lg"
          >
            {status === 'processing' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing Bundle...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Rescue Complete!
              </>
            ) : (
              'Execute Rescue Bundle'
            )}
          </Button>

          {status === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Success! Your LXP has been rescued. Transaction: {txHash}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="how" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How Bundle Transactions Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">The Problem:</h4>
                <p className="text-sm text-gray-600">
                  When a wallet's private key is compromised, bots monitor it and immediately steal any ETH sent to it. 
                  This makes it impossible to pay for gas to move tokens out.
                </p>

                <h4 className="font-semibold mt-4">The Solution:</h4>
                <p className="text-sm text-gray-600">
                  Linea's `eth_sendBundle` API allows us to submit multiple transactions that execute atomically 
                  (all-or-nothing) while bypassing the public mempool where bots lurk.
                </p>

                <h4 className="font-semibold mt-4">Security Features:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Transactions bypass the public mempool</li>
                  <li>All transactions execute together or not at all</li>
                  <li>Bots cannot see or front-run the transactions</li>
                  <li>Gas is funded and used in the same atomic operation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RescueTool;