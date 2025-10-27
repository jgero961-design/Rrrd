import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const KEY = process.env.SUNO_API_KEY;
const CB = process.env.PUBLIC_BASE_URL ? `${process.env.PUBLIC_BASE_URL.replace(/\/$/, '')}/api/webhook` : 'https://example.com/webhook';

async function main(){
  const body = {
    prompt: 'Test prompt upbeat instrumental',
    customMode: true,
    instrumental: true,
    model: 'V3_5',
    callBackUrl: CB,
  };
  try {
    const resp = await axios.post('https://api.sunoapi.org/api/v1/generate', body, {
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 20000,
      validateStatus: () => true,
    });
    console.log('status', resp.status);
    console.log(JSON.stringify(resp.data));
  } catch (e) {
    console.error('error', e.response?.status, e.response?.data || e.message);
  }
}

main();