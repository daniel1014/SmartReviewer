import gnewsService from './services/gnewsService.js';

async function test() {
  try {
    const result = await gnewsService.searchNews('OpenAI', 1, 3);
    console.log('Articles:', result.articles);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();