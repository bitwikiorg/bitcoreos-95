import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/session';
import { actionBrokerConfigured, dispatchAction, makeActionEnvelope, type ActionRisk } from '@/lib/actions';

const ACTIONS: Record<string, { risk: ActionRisk; system: 'hub' | 'wiki' | 'agent' | 'cross-system' }> = {
  'research.deploy': { risk: 'sensitive', system: 'cross-system' },
  'research.transition': { risk: 'sensitive', system: 'cross-system' },
  'wiki.propose': { risk: 'privileged', system: 'wiki' },
  'hub.create_topic': { risk: 'sensitive', system: 'hub' },
  'hub.reply': { risk: 'sensitive', system: 'hub' },
  'agent.dispatch': { risk: 'sensitive', system: 'agent' },
};

export async function POST(request: NextRequest) {
  const user = verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'not_authenticated' }, { status: 401 });
  if (!actionBrokerConfigured()) return NextResponse.json({ error: 'n8n_action_broker_not_configured' }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === 'string' ? body.action : '';
  const policy = ACTIONS[action];
  if (!policy) return NextResponse.json({ error: 'action_not_allowed' }, { status: 400 });

  const envelope = makeActionEnvelope({
    action,
    actor: { username: user.username, externalId: user.externalId, groups: user.groups },
    target: {
      system: policy.system,
      resource: typeof body?.target?.resource === 'string' ? body.target.resource : undefined,
      id: typeof body?.target?.id === 'string' ? body.target.id : undefined,
    },
    payload: body?.payload && typeof body.payload === 'object' ? body.payload : {},
    context: body?.context && typeof body.context === 'object' ? body.context : undefined,
    risk: policy.risk,
    idempotencyKey: typeof body?.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
  });

  try {
    const result = await dispatchAction(envelope);
    return NextResponse.json({ accepted: true, envelope: { correlationId: envelope.correlationId, idempotencyKey: envelope.idempotencyKey, action: envelope.action }, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'action_dispatch_failed', correlationId: envelope.correlationId }, { status: 502 });
  }
}
