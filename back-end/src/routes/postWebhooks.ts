/* eslint-disable @typescript-eslint/require-await */
import type { RouteHandler } from 'fastify';

import type { NangoAuthWebhookBody, NangoWebhookBody } from '@nangohq/node';
import { nango } from '../nango.js';
import { db } from '../db.js';

/**
 * Receive webhooks from Nango every time a records has been added, updated or deleted
 */
export const postWebhooks: RouteHandler = async (req, reply) => {
  const body = req.body as NangoWebhookBody;
  const sig = req.headers['x-nango-signature'] as string;

  console.log('Webhook: received', body);

  // Verify the signature to be sure it's Nango that sent us this payload
  if (!nango.verifyWebhookSignature(sig, req.body)) {
    console.error('Failed to validate Webhook signature');
    await reply.status(400).send({ error: 'invalid_signature' });
    return;
  }

  // Handle each webhook
  switch (body.type) {
    case 'auth':
      // New connection
      await handleNewConnectionWebhook(body);
      break;

    default:
      console.warn('unsupported webhook', body);
      break;
  }

  // Always return 200 to avoid re-delivery
  await reply.status(200).send({ ack: true });
};

// ------------------------

/**
 * Handle webhook when a new connection is created
 */
async function handleNewConnectionWebhook(body: NangoAuthWebhookBody) {
  if (!body.success) {
    console.error('Failed to auth', body);
    return;
  }

  if (body.operation === 'creation') {
    console.log('Webhook: New connection');
    // With the end user id that we set in the Session, we can now link our user to the new connection
    await db.users.update({
      data: {
        connectionId: body.connectionId,
      },
      where: {
        id: body.endUser!.endUserId,
      },
    });
  } else {
    console.log('Webhook: connection', body.operation);
  }
}
