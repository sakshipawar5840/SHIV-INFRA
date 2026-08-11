import { detectIntent } from './backend/ai-engine/intentDetector.ts';

async function test() {
  const messages = [
    'Green Valley dakhav',
    'tyacha price kay?',
    'project details',
    'show me projects',
    'Pune madhle projects dakhav'
  ];

  for (const msg of messages) {
    const intent = await detectIntent(msg);
    console.log('Message:', msg);
    console.log('Intent:', intent.name, 'Confidence:', intent.confidence);
    console.log('Parameters:', JSON.stringify(intent.parameters));
    console.log('---');
  }
}

test().catch(console.error);
