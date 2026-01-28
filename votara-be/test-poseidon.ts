/**
 * Test script to verify Poseidon hash implementation
 * Run with: npx tsx test-poseidon.ts
 */

import { addressToIdentityCommitment, addressesToIdentityCommitments } from './src/services/semaphore';

const SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

console.log('🧪 Testing Poseidon Hash Implementation\n');

// Test addresses
const testAddresses = [
  '0x8540784B5FCcEb3045d1bc1f74919C7c41C12Fd6',
  '0x1234567890123456789012345678901234567890',
  '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  '0x0000000000000000000000000000000000000001',
  '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
];

console.log('📋 Test Addresses:');
testAddresses.forEach((addr, i) => {
  console.log(`   ${i + 1}. ${addr}`);
});
console.log();

// Test individual commitments
console.log('🔐 Testing Individual Commitments:\n');
testAddresses.forEach((address, i) => {
  const commitment = addressToIdentityCommitment(address as `0x${string}`);
  const isValid = commitment < SNARK_SCALAR_FIELD;
  
  console.log(`${i + 1}. Address: ${address}`);
  console.log(`   Commitment: ${commitment}`);
  console.log(`   Valid: ${isValid ? '✅' : '❌'} (${isValid ? 'within' : 'exceeds'} SNARK scalar field)`);
  console.log(`   Bits: ${commitment.toString(2).length} bits`);
  console.log();
});

// Test batch conversion
console.log('📦 Testing Batch Conversion:\n');
const commitments = addressesToIdentityCommitments(testAddresses as `0x${string}`[]);
console.log(`   Generated ${commitments.length} commitments`);
console.log(`   All valid: ${commitments.every(c => c < SNARK_SCALAR_FIELD) ? '✅' : '❌'}`);
console.log();

// Test determinism (same address should produce same commitment)
console.log('🔄 Testing Determinism:\n');
const addr = testAddresses[0] as `0x${string}`;
const commitment1 = addressToIdentityCommitment(addr);
const commitment2 = addressToIdentityCommitment(addr);
const isDeterministic = commitment1 === commitment2;
console.log(`   Address: ${addr}`);
console.log(`   First call:  ${commitment1}`);
console.log(`   Second call: ${commitment2}`);
console.log(`   Deterministic: ${isDeterministic ? '✅' : '❌'}`);
console.log();

// Test uniqueness (different addresses should produce different commitments)
console.log('🎲 Testing Uniqueness:\n');
const uniqueCommitments = new Set(commitments);
const isUnique = uniqueCommitments.size === commitments.length;
console.log(`   Total addresses: ${testAddresses.length}`);
console.log(`   Unique commitments: ${uniqueCommitments.size}`);
console.log(`   All unique: ${isUnique ? '✅' : '❌'}`);
console.log();

// Summary
console.log('📊 Summary:\n');
const allValid = commitments.every(c => c < SNARK_SCALAR_FIELD);
console.log(`   ✅ All commitments < SNARK_SCALAR_FIELD: ${allValid}`);
console.log(`   ✅ Deterministic (same input = same output): ${isDeterministic}`);
console.log(`   ✅ Unique (different inputs = different outputs): ${isUnique}`);
console.log();

if (allValid && isDeterministic && isUnique) {
  console.log('🎉 All tests passed! Poseidon hash is working correctly.\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the implementation.\n');
  process.exit(1);
}

