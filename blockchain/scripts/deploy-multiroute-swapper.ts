import 'dotenv/config'
import { JsonRpcProvider, Wallet, ContractFactory, formatEther } from 'ethers'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const artifactPath = join(__dirname, '../artifacts/contracts/MultiRouteSwapper.sol/MultiRouteSwapper.json')
const MultiRouteSwapperArtifact = JSON.parse(readFileSync(artifactPath, 'utf-8'))

async function main() {
  console.log('Deploying MultiRouteSwapper to Celo Sepolia...\n')
  
  const rpcUrl = process.env.CELO_SEPOLIA_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
  const pk = process.env.CELO_SEPOLIA_PRIVATE_KEY
  if (!pk) {
    throw new Error('CELO_SEPOLIA_PRIVATE_KEY not set in blockchain/.env')
  }
  
  const provider = new JsonRpcProvider(rpcUrl)
  const deployer = new Wallet(pk, provider)
  const address = await deployer.getAddress()
  const balance = await provider.getBalance(address)
  
  console.log('Deployer:', address)
  console.log('Balance:', formatEther(balance), 'CELO\n')
  
  if (balance === 0n) {
    throw new Error('Insufficient CELO balance. Fund your wallet at https://faucet.celo.org/celo-sepolia')
  }
  
  const factory = new ContractFactory(MultiRouteSwapperArtifact.abi, MultiRouteSwapperArtifact.bytecode, deployer)
  console.log('Deploying contract...')
  
  const swapper = await factory.deploy()
  await swapper.waitForDeployment()
  
  const contractAddress = await swapper.getAddress()
  console.log('\n✅ MultiRouteSwapper deployed to:', contractAddress)
  console.log('\nSave this address for future use!')
  console.log(`Verify on explorer: https://celo-sepolia.celoscan.io/address/${contractAddress}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
