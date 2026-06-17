import HeaderAuth from '@/components/HeaderAuth'
import Footer from '@/components/Footer'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HeaderAuth />
      <main className="flex w-full flex-1 flex-col">{children}</main>
      <Footer />
    </>
  )
}
