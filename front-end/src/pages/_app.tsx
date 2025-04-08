import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClientProvider } from '@tanstack/react-query';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';

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
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#333',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          <Component {...pageProps} />
        </div>
      </QueryClientProvider>
    </div>
  );
}
