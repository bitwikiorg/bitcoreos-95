import crypto from 'crypto';

export type ActionRisk = 'normal' | 'sensitive' | 'privileged';

export type ActionEnvelope<T = Record<string, unknown>> = {
  action: string;
  actor: { username: string; externalId?: string; groups?: string[] };
  target: { system: 'hub' | 'wiki' | 'agent' | 'cross-system'; resource?: string; id?: string };
  payload: T;
  context?: { hubRefs?: string[]; wikiRefs?: string[]; resourceRefs?: string[] };
  correlationId: string;
  idempotencyKey: string;
  risk: ActionRisk;
  requestedAt: string;
};

export function makeActionEnvelope<T>(input: Omit<ActionEnvelope<T>, 'correlationId' | 'idempotencyKey' | 'requestedAt'> & { correlationId?: string; idempotencyKey?: string }): ActionEnvelope<T> {
  return {
    ...input,
    correlationId: input.correlationId || crypto.randomUUID(),
    idempotencyKey: input.idempotencyKey || crypto.randomUUID(),
    requestedAt: new Date().toISOString(),
  };
}

export function actionBrokerConfigured() {
  return Boolean(process.env.N8N_ACTION_URL && process.env.N8N_ACTION_SECRET);
}

export async function dispatchAction(envelope: ActionEnvelope) {
  const url = process.env.N8N_ACTION_URL;
  const secret = process.env.N8N_ACTION_SECRET;
  if (!url || !secret) throw new Error('n8n_action_broker_not_configured');

  const body = JSON.stringify(envelope);
  const timestamp = Date.now().toString();
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-bitcoreos-timestamp': timestamp,
      'x-bitcoreos-signature': signature,
      'x-bitcoreos-correlation-id': envelope.correlationId,
      'x-bitcoreos-idempotency-key': envelope.idempotencyKey,
    },
    body,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || `n8n_http_${response.status}`);
  return data;
}
