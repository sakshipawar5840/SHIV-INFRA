import { correctIntent } from './backend/ai-engine/intentDetector.ts';

async function test() {
  const mockIntent = {
    name: 'SEARCH_CUSTOMERS',
    action: 'SEARCH',
    entity: 'CUSTOMER',
    parameters: { name: 'tasks' },
    confidence: 0.8
  };
  
  console.log('Before:', mockIntent);
  const result = correctIntent('Show tasks', mockIntent);
  console.log('After:', result);
}

test();
