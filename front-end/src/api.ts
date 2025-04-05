import type {
  GetIntegrations,
  PostConnectSessionSuccess,
  GetConnectionsSuccess,
} from 'back-end';
import { baseUrl } from './utils';
import type { Integration, HubSpotContact, HubSpotTask } from './types';

const API_BASE_URL = '/api';

export async function postConnectSession(): Promise<PostConnectSessionSuccess> {
  const res = await fetch(`${baseUrl}/connect-session`, {
    method: 'POST',
  });
  if (res.status !== 200) {
    throw new Error();
  }

  const json = (await res.json()) as PostConnectSessionSuccess;
  return json;
}

export async function listIntegrations(): Promise<GetIntegrations> {
  const res = await fetch(`${baseUrl}/integrations`);
  if (res.status !== 200) {
    throw new Error();
  }

  const json = (await res.json()) as GetIntegrations;
  return json;
}

export async function listConnections(): Promise<GetConnectionsSuccess> {
  const res = await fetch(`${baseUrl}/connections`);
  if (res.status !== 200) {
    throw new Error();
  }

  const json = (await res.json()) as GetConnectionsSuccess;
  return json;
}

export async function getIntegrations(): Promise<Integration[]> {
  const response = await fetch(`${API_BASE_URL}/integrations`);
  return response.json();
}

export async function createConnectSession(): Promise<{
  connectSession: string;
}> {
  const response = await fetch(`${API_BASE_URL}/connect-session`, {
    method: 'POST',
  });
  return response.json();
}

export async function getHubSpotContacts(): Promise<HubSpotContact[]> {
  const response = await fetch(`http://localhost:3010/api/hubspot/contacts`);
  return response.json();
}

export async function createHubSpotTask(
  contactId: string,
  subject: string,
  body: string,
  status?: string,
  priority?: string
): Promise<HubSpotTask> {
  const response = await fetch(`http://localhost:3010/api/hubspot/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contactId,
      subject,
      body,
      status,
      priority,
    }),
  });
  return response.json();
}
