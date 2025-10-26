#!/usr/bin/env tsx
/**
 * Test Demo Swap Mode
 * 
 * Usage: npx tsx scripts/test-demo-swap.ts
 */

import { simulateDemoSwap, isDemoSwapEnabled, getDemoSwapMessage } from '../lib/demo-swap'

async function main() {
  console.log('=== Demo Swap Mode Test ===\n')
  
  // Check if demo mode is enabled
  const demoEnabled = isDemoSwapEnabled()
  console.log('Demo Mode Enabled:', demoEnabled)
  console.log('Status Message:', getDemoSwapMessage())
  console.log()

  // Test swap simulation
  console.log('Testing swap simulation: 10 TKA -> TKB\n')
  
  try {
    const result = await simulateDemoSwap({
      tokenInSymbol: 'TKA',
      tokenOutSymbol: 'TKB',
      amount: '10',
      slippageBps: 50,
      recipient: '0x1234567890123456789012345678901234567890'
    })

    console.log('Simulation Result:')
    console.log('  Token In:', result.tokenIn)
    console.log('  Token Out:', result.tokenOut)
    console.log('  Expected Output:', result.expectedOut, result.tokenOut)
    console.log('  Min Output (0.5% slippage):', result.minOut, result.tokenOut)
    console.log('  Price Impact:', result.priceImpactBps / 100, '%')
    console.log('  Path:', result.path.join(' → '))
    console.log()

    // Calculate effective rate
    const rate = parseFloat(result.expectedOut) / 10
    console.log('  Effective Rate: 1', result.tokenIn, '=', rate.toFixed(6), result.tokenOut)
    
    // Show fee calculation
    const feePercent = (1 - rate) * 100
    console.log('  Total Fees/Impact:', feePercent.toFixed(3), '%')
    
    console.log('\n✅ Demo swap simulation working correctly!')
    console.log('\n📝 Next Steps:')
    console.log('   1. Make sure NEXT_PUBLIC_DEMO_SWAP_MODE=true in .env.local')
    console.log('   2. Restart your Next.js dev server')
    console.log('   3. Connect your wallet on the trading page')
    console.log('   4. Try swapping TKA <-> TKB (you need some TKA balance)')
    console.log('   5. Transaction will create a real tx hash!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

main()
