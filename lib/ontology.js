export const layers = [
  { id:'entry', label:'ENTRY', description:'Human-facing intents.', nodes:[
    {id:'ask',label:'Ask',kind:'intent',description:'Ask a question grounded in public Hub + Wiki context.'},
    {id:'search',label:'Search',kind:'intent',description:'Federated discovery across BIThub and BITwiki.'},
    {id:'explore',label:'Explore',kind:'intent',description:'Browse by purpose, subject, or resource type.'},
    {id:'work',label:'Work',kind:'intent',description:'Open tools, workflows, Constructs, Nodes, COREs, and Workspaces.'}
  ]},
  { id:'bithub', label:'BITHUB', description:'The workshop.', nodes:[
    {id:'topics',label:'Topics',kind:'hub',description:'Discussions and durable work threads.'},
    {id:'guides',label:'Guides',kind:'hub',description:'Orientation and procedural documentation.'},
    {id:'constructs',label:'Constructs',kind:'hub',description:'Agent-facing AI experiences and capabilities.'},
    {id:'nodes',label:'Nodes',kind:'hub',description:'Focused reusable tools or task primitives.'},
    {id:'cores',label:'COREs',kind:'hub',description:'Multi-stage analytical workflows.'},
    {id:'workspaces',label:'Workspaces',kind:'hub',description:'Interactive utilities and working environments.'},
    {id:'artifacts',label:'Artifacts',kind:'hub',description:'Reusable outputs, files, references, and generated work.'},
    {id:'people',label:'People',kind:'hub',description:'Members, agents, contributors, and operators.'}
  ]},
  { id:'bitwiki', label:'BITWIKI', description:'The library.', nodes:[
    {id:'concepts',label:'Concepts',kind:'wiki',description:'Canonical concepts and definitions.'},
    {id:'projects',label:'Projects',kind:'wiki',description:'Project records and structured project knowledge.'},
    {id:'entities',label:'Entities',kind:'wiki',description:'People, organizations, protocols, assets, places, and other named entities.'},
    {id:'schemas',label:'Schemas',kind:'wiki',description:'Semantic properties, templates, Cargo/SMW structures, and ontology definitions.'},
    {id:'relations',label:'Relations',kind:'wiki',description:'Typed semantic links between concepts and entities.'}
  ]},
  { id:'access', label:'ACCESS', description:'Capabilities by identity and permission.', nodes:[
    {id:'guest',label:'Guest',kind:'access',description:'Public Hub, public Wiki, anonymous search, and bounded anonymous AI.'},
    {id:'member',label:'Member',kind:'access',description:'Authenticated BIThub identity and user-authorized actions.'},
    {id:'agent',label:'Agent',kind:'access',description:'Programmatic API/MCP access using the same permission model.'}
  ]}
];

export const connections = [
  ['ask','topics'],['ask','concepts'],['search','topics'],['search','concepts'],['explore','guides'],['explore','schemas'],
  ['work','constructs'],['work','nodes'],['work','cores'],['work','workspaces'],['topics','concepts'],['guides','concepts'],
  ['constructs','artifacts'],['nodes','artifacts'],['cores','artifacts'],['artifacts','entities'],['concepts','relations'],
  ['projects','entities'],['schemas','relations'],['guest','ask'],['member','work'],['agent','constructs']
];

export const allNodes = layers.flatMap(layer => layer.nodes.map(node => ({...node,layer:layer.id,layerLabel:layer.label})));
