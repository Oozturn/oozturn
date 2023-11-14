import '../styles/globals.scss'
import type { AppProps } from 'next/app'
import Layout from '../components/layout/layout'
import Head from 'next/head'
import { SWRConfig } from 'swr'
import { fetcher } from '../lib/gql/client'
import { GetLocalTheme } from '../components/tools/user-theme'
import { useIconUrl } from '../lib/hooks'
import { dealWithError } from '../lib/error/error-management'

export default function App({ Component, pageProps }: AppProps) {
  const iconUrl = useIconUrl()
  return (
    <SWRConfig value={{ 
      fetcher: fetcher,
      onError(err, key, config) {
        dealWithError(err)
      },
    }}>
      <Layout>
        <GetLocalTheme />
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href={iconUrl} />
        </Head>
        <Component {...pageProps} />
      </Layout>
    </SWRConfig>
  )
}
