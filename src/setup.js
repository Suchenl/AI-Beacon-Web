
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '..', '.env.local');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔑 AI Beacon Setup Utility\n');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local already exists!');
  console.log('If you want to update your key, please delete the file first or edit it manually.\n');
  process.exit(0);
}

console.log('To use AI features, we need your Google Gemini API Key.');
console.log('Get it here: https://aistudio.google.com/app/apikey\n');

rl.question('Paste your API Key here: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('❌ Key cannot be empty.');
    process.exit(1);
  }

  const content = `VITE_GEMINI_API_KEY=${apiKey.trim()}\n`;

  try {
    fs.writeFileSync(envPath, content);
    console.log('\n✅ Success! .env.local has been created.');
    console.log('🚀 You can now run "npm run dev" or use the start script to launch the app.\n');
  } catch (err) {
    console.error('\n❌ Failed to write file:', err);
  }

  rl.close();
});
