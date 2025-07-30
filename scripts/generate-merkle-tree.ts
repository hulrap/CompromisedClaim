import { ethers } from 'ethers';

// Your wallet addresses for the airdrop
const WALLET_ADDRESSES = [
  '0xEAc2272aBE991443702c2F5920Df4ACfd9A31386',
  '0x6F3a62C07C928C2aE8FB5377D20A8D898930F028',
];

// Amount each wallet can claim (in tokens, will be converted to wei)
const CLAIM_AMOUNT_PER_WALLET = '1000'; // 1000 tokens per wallet

interface LeafData {
  address: string;
  amount: bigint;
  leaf: string;
}

class MerkleTreeGenerator {
  private leaves: LeafData[] = [];
  
  constructor(addresses: string[], amount: string) {
    this.generateLeaves(addresses, amount);
  }

  private generateLeaves(addresses: string[], amount: string): void {
    const amountInWei = ethers.parseUnits(amount, 18);
    
    this.leaves = addresses.map(address => {
      // Create leaf hash: keccak256(abi.encodePacked(address, amount))
      const leaf = ethers.keccak256(
        ethers.solidityPacked(['address', 'uint256'], [address, amountInWei])
      );
      
      return {
        address,
        amount: amountInWei,
        leaf
      };
    });

    console.log('Generated leaves:');
    this.leaves.forEach((leaf, index) => {
      console.log(`${index + 1}. Address: ${leaf.address}`);
      console.log(`   Amount: ${ethers.formatUnits(leaf.amount, 18)} tokens`);
      console.log(`   Leaf: ${leaf.leaf}`);
      console.log('');
    });
  }

  private sortLeaves(): string[] {
    // Sort leaves by their hash value for consistent merkle tree generation
    return this.leaves
      .map(leaf => leaf.leaf)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  generateMerkleTree(): { root: string; proofs: { [address: string]: string[] } } {
    const sortedLeaves = this.sortLeaves();
    
    if (sortedLeaves.length === 0) {
      throw new Error('No leaves to generate merkle tree');
    }

    // Build the merkle tree
    let currentLevel = sortedLeaves;
    const tree: string[][] = [currentLevel];

    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        
        // Hash the pair
        const combined = left <= right 
          ? ethers.keccak256(ethers.concat([left, right]))
          : ethers.keccak256(ethers.concat([right, left]));
        
        nextLevel.push(combined);
      }
      
      currentLevel = nextLevel;
      tree.push(currentLevel);
    }

    const root = currentLevel[0];
    
    // Generate proofs for each address
    const proofs: { [address: string]: string[] } = {};
    
    this.leaves.forEach(leafData => {
      const proof = this.generateProof(leafData.leaf, tree);
      proofs[leafData.address] = proof;
    });

    return { root, proofs };
  }

  private generateProof(targetLeaf: string, tree: string[][]): string[] {
    const proof: string[] = [];
    let currentIndex = tree[0].findIndex(leaf => leaf === targetLeaf);
    
    if (currentIndex === -1) {
      throw new Error(`Leaf ${targetLeaf} not found in tree`);
    }

    for (let level = 0; level < tree.length - 1; level++) {
      const currentLevel = tree[level];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < currentLevel.length) {
        proof.push(currentLevel[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  verifyProof(address: string, amount: bigint, proof: string[], root: string): boolean {
    const leaf = ethers.keccak256(
      ethers.solidityPacked(['address', 'uint256'], [address, amount])
    );

    let computedHash = leaf;
    
    for (const proofElement of proof) {
      computedHash = computedHash <= proofElement
        ? ethers.keccak256(ethers.concat([computedHash, proofElement]))
        : ethers.keccak256(ethers.concat([proofElement, computedHash]));
    }

    return computedHash === root;
  }
}

// Generate the merkle tree
console.log('🌳 Generating Merkle Tree for LINEA Token Airdrop');
console.log('================================================');

const generator = new MerkleTreeGenerator(WALLET_ADDRESSES, CLAIM_AMOUNT_PER_WALLET);
const { root, proofs } = generator.generateMerkleTree();

console.log('🎯 MERKLE ROOT (use this in Thirdweb):');
console.log(root);
console.log('');

console.log('📋 MERKLE PROOFS:');
Object.entries(proofs).forEach(([address, proof]) => {
  console.log(`Address: ${address}`);
  console.log(`Proof: [${proof.map(p => `"${p}"`).join(', ')}]`);
  console.log('');
});

// Verify all proofs
console.log('✅ VERIFICATION:');
const amountInWei = ethers.parseUnits(CLAIM_AMOUNT_PER_WALLET, 18);
Object.entries(proofs).forEach(([address, proof]) => {
  const isValid = generator.verifyProof(address, amountInWei, proof, root);
  console.log(`${address}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('');
console.log('🚀 NEXT STEPS:');
console.log('1. Copy the MERKLE ROOT above');
console.log('2. Go to your Thirdweb contract interface');
console.log('3. Use the setMerkleRoot function with:');
console.log('   - Token: [Your ERC20 token contract address]');
console.log('   - Token Merkle Root: [The root hash above]');
console.log('   - Reset Claim Status: true (if you want to reset claims)');
console.log('4. Update your .env file with the contract details');
console.log('5. Test the rescue application!');

export { MerkleTreeGenerator, WALLET_ADDRESSES, CLAIM_AMOUNT_PER_WALLET };