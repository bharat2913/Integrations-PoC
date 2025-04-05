import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClientProvider } from '@tanstack/react-query';
import { Inter } from 'next/font/google';

import '../globals.css';
import { queryClient } from '../utils';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={`${inter.variable} font-sans h-screen w-screen`}>
      <Head>
        <title key="title">Nango Sample App</title>
      </Head>
      <QueryClientProvider client={queryClient}>
        <div className="flex h-screen w-screen">
          <Component {...pageProps} />
        </div>
      </QueryClientProvider>
    </div>
  );
}
