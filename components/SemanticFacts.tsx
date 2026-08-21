'use client';

export type SemanticFact = {
  property: string;
  direction: string;
  values: Array<{ type?: number; item: string }>;
};

function cleanItem(value: string) {
  return value.replace(/#\d+##$/, '').replace(/_/g, ' ');
}

function propertyLabel(value: string) {
  return value.startsWith('_') ? value : value.replace(/_/g, ' ');
}

export function SemanticFacts({ facts, empty = 'No semantic assertions returned for this subject.' }: { facts: SemanticFact[]; empty?: string }) {
  if (!facts.length) return <div className="semantic-empty">{empty}</div>;
  return (
    <div className="semantic-facts">
      {facts.slice(0, 16).map((fact) => (
        <div className="semantic-fact" key={`${fact.direction}-${fact.property}`}>
          <span className={`relation-direction ${fact.direction}`}>{fact.direction === 'inverse' ? '←' : '→'}</span>
          <b>{propertyLabel(fact.property)}</b>
          <span>{fact.values.map((value) => cleanItem(value.item)).join(' · ')}</span>
        </div>
      ))}
    </div>
  );
}
