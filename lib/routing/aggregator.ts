import type { Pool } from './pools'

export interface RouteEdge {
  to: string
  pool: Pool
  getOutput: (amountIn: bigint) => bigint
}

interface AggregatorGraph {
  [tokenAddress: string]: RouteEdge[]
}

export interface AggregatorRoute {
  path: RouteEdge[]
  output: bigint
}

export class DEXAggregator {
  private readonly pools: Pool[]
  private readonly graph: AggregatorGraph
  constructor(pools: Pool[]) {
    this.pools = pools
    this.graph = this.buildGraph()
  }

  private buildGraph(): AggregatorGraph {
    const graph: AggregatorGraph = {}

    for (const pool of this.pools) {
  const { token0, token1, reserve0, reserve1, feeBps } = pool
  const feeFactor = this.calculateFeeFactor(feeBps)

      if (!graph[token0.address]) graph[token0.address] = []
      if (!graph[token1.address]) graph[token1.address] = []

      graph[token0.address].push({
        to: token1.address,
        pool,
        getOutput: (amount) => this.calculateOutput(amount, reserve0, reserve1, feeFactor)
      })

      graph[token1.address].push({
        to: token0.address,
        pool,
        getOutput: (amount) => this.calculateOutput(amount, reserve1, reserve0, feeFactor)
      })
    }

    return graph
  }

  private calculateFeeFactor(feeBps: number): bigint {
    const base = 10000
    if (feeBps <= 0) return BigInt(base)
    return BigInt(base - feeBps)
  }

  private calculateOutput(amountIn: bigint, reserveIn: bigint, reserveOut: bigint, feeFactor: bigint): bigint {
    if (reserveIn === BigInt(0) || reserveOut === BigInt(0)) return BigInt(0)
    const amountWithFee = amountIn * feeFactor / BigInt(10000)
    if (amountWithFee === BigInt(0)) return BigInt(0)
    const numerator = amountWithFee * reserveOut
    const denominator = reserveIn + amountWithFee
    if (denominator === BigInt(0)) return BigInt(0)
    return numerator / denominator
  }

  findBestRoute(tokenIn: string, tokenOut: string, amountIn: bigint, maxHops = 3): AggregatorRoute | null {
    if (!this.graph[tokenIn] || !this.graph[tokenOut]) return null

    const routes: AggregatorRoute[] = []

    const dfs = (current: string, target: string, remaining: bigint, path: RouteEdge[], visited: Set<string>) => {
      if (current === target) {
        routes.push({ path: [...path], output: remaining })
        return
      }

      if (path.length >= maxHops) return

      const edges = this.graph[current] || []
      for (const edge of edges) {
        if (visited.has(edge.to)) continue
        const output = edge.getOutput(remaining)
  if (output === BigInt(0)) continue
        visited.add(edge.to)
        dfs(edge.to, target, output, [...path, edge], new Set(visited))
        visited.delete(edge.to)
      }
    }

    dfs(tokenIn, tokenOut, amountIn, [], new Set([tokenIn]))

    if (!routes.length) return null

    routes.sort((a, b) => {
      if (a.output === b.output) {
        return a.path.length - b.path.length
      }
      return a.output > b.output ? -1 : 1
    })
    return routes[0]
  }
}
