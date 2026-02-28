const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

process.on('uncaughtException', err => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, 'config.env') });
}
const app = require('./app');

const port = process.env.PORT || 3000;

// Build DB connection string
if (!process.env.DATABASE) {
  console.error('ERROR: DATABASE environment variable is missing!');
  process.exit(1);
}

// Trim env variables to remove any whitespace
const database = (process.env.DATABASE || '').trim();
const password = (process.env.DATABASE_PASSWORD || '').trim();
const dbName = (process.env.DATABASE_NAME || '').trim();

console.log('Original DATABASE:', database);
console.log('DATABASE_PASSWORD:', password ? 'set' : 'missing');
console.log('DATABASE_NAME:', dbName ? 'set' : 'missing');

let DB = database;

if (password) {
  DB = DB.replace('<PASSWORD>', password);
  console.log('After password replacement:', DB);
}

if (dbName) {
  DB = DB.replace('<DATABASE>', dbName);
  console.log('After database name replacement:', DB);
}

console.log('Final connection string:', DB);
console.log('Connection string length:', DB.length);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('DB connection error:');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  });

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
