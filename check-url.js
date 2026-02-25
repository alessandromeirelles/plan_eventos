import https from 'https';

https.get('https://ycgptxnntkjodwqbnwwe.supabase.co/rest/v1/', (res) => {
  console.log('Status:', res.statusCode);
}).on('error', (e) => {
  console.error('Error:', e.message);
});
