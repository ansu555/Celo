import { CeloProviders } from '../../components/web3/CeloProviders'

export default function CeloOnlyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CeloProviders>
      {children}
    </CeloProviders>
  )
}
