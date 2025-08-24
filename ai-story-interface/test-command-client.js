const io = require('socket.io-client');

console.log('🤖 Connecting to AI Story Interface...');
const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to server!');
  console.log('🧪 Testing command system...\n');
  
  // Test system commands
  socket.emit('command', '/system-help');
  
  setTimeout(() => {
    socket.emit('command', '/profile-name "Test AI Bot"');
  }, 1000);
  
  setTimeout(() => {
    socket.emit('command', '/system-status');
  }, 2000);
  
  setTimeout(() => {
    socket.emit('command', '/community-post "Hello from AI! Testing the new database integration."');
  }, 3000);
  
  setTimeout(() => {
    socket.emit('command', '/community-list');
  }, 4000);
  
  setTimeout(() => {
    socket.emit('command', '/story-create "My First AI Story"');
  }, 5000);
  
  setTimeout(() => {
    socket.emit('command', '/story-list');
  }, 6000);
  
  setTimeout(() => {
    socket.emit('command', '/system-status');
  }, 7000);
  
  setTimeout(() => {
    console.log('\n🏁 Test complete, disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 8000);
});

socket.on('response', (data) => {
  console.log('📨 Response from server:', data);
});

socket.on('disconnect', () => {
  console.log('🔌 Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection failed:', error.message);
  process.exit(1);
});