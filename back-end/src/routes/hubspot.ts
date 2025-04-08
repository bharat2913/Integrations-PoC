import type { RouteHandler } from 'fastify';
import { nango } from '../nango.js';
import { getUserFromDatabase } from '../db.js';
import { HubSpotClientWrapper } from '../rate-limit/HubSpotClientWrapper.js';
import { RateLimitError } from '../rate-limit/RateLimitError.js';

// Define the shape of Nango OAuth2 credentials
interface OAuth2Credentials {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

// Define HubSpot API response types
interface HubSpotContactProperties {
  email: string;
  firstname: string | null;
  lastname: string | null;
  company: string | null;
  phone: string | null;
}

interface HubSpotContact {
  id: string;
  properties: HubSpotContactProperties;
}

interface HubSpotApiContact {
  id: string;
  properties: Record<string, string | null>;
}

export type HubSpotTask = {
  id: string;
  properties: {
    hs_task_subject: string;
    hs_task_body: string;
    hs_task_status: string;
    hs_task_priority: string;
    hs_timestamp: string;
  };
};

export type CreateTaskInput = {
  contactId: string;
  subject: string;
  body: string;
  status?: string;
  priority?: string;
};

export const createTask: RouteHandler<{
  Body: CreateTaskInput;
  Reply: HubSpotTask | { error: string };
}> = async (request, reply) => {
  const user = await getUserFromDatabase();
  if (!user || !user.connectionId) {
    await reply.status(400).send({ error: 'invalid_user' });
    return;
  }

  try {
    // Get HubSpot connection
    const connection = await nango.getConnection('hubspot', user.connectionId);
    const credentials = connection.credentials as unknown as OAuth2Credentials;

    // Initialize HubSpot client with rate limiting
    const hubspotClient = new HubSpotClientWrapper(credentials.access_token);

    // Create task
    const task = await hubspotClient.crmTasksCreate({
      properties: {
        hs_task_subject: request.body.subject,
        hs_task_body: request.body.body,
        hs_task_status: request.body.status ?? 'NOT_STARTED',
        hs_task_priority: request.body.priority ?? 'HIGH',
        hs_task_type: 'TODO',
        hs_timestamp: new Date().toISOString(),
      },
      associations: [
        {
          to: {
            id: request.body.contactId,
          },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 204,
            },
          ],
        },
      ],
    });

    await reply.status(200).send(task as unknown as HubSpotTask);
  } catch (error) {
    console.error('Error creating HubSpot task:', error);
    await reply.status(500).send({ error: 'failed_to_create_task' });
  }
};

export const getHubspotContacts: RouteHandler<{
  Reply:
    | HubSpotContact[]
    | { error: string; retryAfter?: number; message?: string };
}> = async (_, reply) => {
  const user = await getUserFromDatabase();
  if (!user || !user.connectionId) {
    await reply.status(400).send({ error: 'invalid_user' });
    return;
  }

  try {
    // Get HubSpot connection
    const connection = await nango.getConnection('hubspot', user.connectionId);
    const credentials = connection.credentials as unknown as OAuth2Credentials;

    // Initialize HubSpot client with rate limiting
    const hubspotClient = new HubSpotClientWrapper(credentials.access_token);

    // Get contacts
    const response = await hubspotClient.crmContactsGetPage(100);

    const formattedContacts: HubSpotContact[] = response.results.map(
      (contact: HubSpotApiContact) => ({
        id: contact.id,
        properties: {
          email: contact.properties['email'] ?? '',
          firstname: contact.properties['firstname'] ?? null,
          lastname: contact.properties['lastname'] ?? null,
          company: contact.properties['company'] ?? null,
          phone: contact.properties['phone'] ?? null,
        },
      })
    );

    await reply.status(200).send(formattedContacts);
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error);

    if (error instanceof RateLimitError) {
      await reply
        .status(429)
        .header('Retry-After', error.retryAfter.toString())
        .send({
          error: 'rate_limit_exceeded',
          retryAfter: error.retryAfter,
          message: error.message,
        });
      return;
    }

    await reply.status(500).send({ error: 'failed_to_fetch_contacts' });
  }
};
