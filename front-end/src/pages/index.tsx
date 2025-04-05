import { useQuery } from '@tanstack/react-query';
import { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { IntegrationsGrid } from '../components/IntegrationGrid';
import Spinner from '../components/Spinner';
import { listConnections, listIntegrations, getHubSpotContacts } from '../api';
import { HubSpotTaskForm } from '../components/HubSpotTaskForm';
import type { Integration, HubSpotContact } from '../types';
import { cn } from '../utils';

export default function IndexPage() {
  const { data: resIntegrations } = useQuery({
    queryKey: ['integrations'],
    queryFn: listIntegrations,
  });
  const { data: resConnections } = useQuery({
    queryKey: ['connections'],
    queryFn: listConnections,
  });

  const integrations = useMemo<Integration[] | undefined>(() => {
    if (!resIntegrations || !resConnections) {
      return;
    }

    return resIntegrations.integrations.map((integration) => ({
      id: integration.unique_key,
      name: integration.display_name,
      description: `Connect your ${integration.provider} account`,
      icon: integration.provider.toLowerCase(),
      connected: resConnections.connections.some(
        (connection) =>
          connection.provider_config_key === integration.unique_key
      ),
      unique_key: integration.unique_key,
      provider: integration.provider,
      logo: integration.logo,
    }));
  }, [resIntegrations, resConnections]);

  const connectedTo = useMemo(() => {
    return integrations?.find((value) => value.connected);
  }, [integrations]);

  const [contacts, setContacts] = useState<HubSpotContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const data = await getHubSpotContacts();
        setContacts(data);
      } catch (error) {
        console.error('Failed to load contacts:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (!integrations) {
    return (
      <main className="p-4 md:p-10 mx-auto max-w-7xl">
        <Spinner size={2} />
      </main>
    );
  }

  return (
    <div className="w-full h-screen grid grid-rows-[auto_1fr]">
      <header className="px-10 py-5 border-b">
        <h1 className="text-2xl font-bold">Integrations</h1>
      </header>
      <div className="overflow-y-scroll px-10 py-10">
        <div
          className={cn(
            'flex justify-center',
            !connectedTo && 'items-center h-full'
          )}
        >
          <div className="flex flex-col gap-16">
            <div className="w-[540px] rounded shadow-2xl px-16 py-10 pb-16 h-auto">
              {!connectedTo && <IntegrationsGrid integrations={integrations} />}
              {connectedTo && <IntegrationsGrid integrations={[connectedTo]} />}
              {integrations.length <= 0 && (
                <div>
                  <button
                    className={cn(
                      'relative transition-colors inline-flex w-full items-center justify-center gap-x-3 py-3 text-sm font-semibold rounded-md bg-black text-white hover:bg-gray-900',
                      'bg-opacity-80'
                    )}
                  >
                    <img
                      src={
                        'https://app.nango.dev/images/template-logos/hubspot.svg'
                      }
                      alt=""
                      className="w-5"
                    />
                    Import from Hubspot
                  </button>
                  <div className="text-red-500 text-xs text-center mt-1">
                    <Link href="https://app.nango.dev/dev/integrations">
                      Activate this provider in your Nango account
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {connectedTo && (
          <div className="w-[540px] mx-auto mt-8 rounded-lg bg-white px-4 py-5 shadow sm:px-6">
            <h2 className="text-lg font-medium leading-6 text-gray-900">
              HubSpot Tasks
            </h2>
            <div className="mt-6">
              {isLoading ? (
                <div className="text-center">Loading contacts...</div>
              ) : (
                <HubSpotTaskForm contacts={contacts} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
