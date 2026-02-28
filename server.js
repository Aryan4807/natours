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

// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// );
// 1. Safety check: Ensure the base string exists
if (!process.env.DATABASE) {
  console.error('ERROR: DATABASE environment variable is missing!');
  process.exit(1);
}

// 2. Perform the replacements
let DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// Only replace <DATABASE> if you actually have that placeholder in your string
if (process.env.DATABASE_NAME) {
  DB = DB.replace('<DATABASE>', process.env.DATABASE_NAME);
}
console.log('Database connection string:', DB, port);
// const DB = process.env.DATABASE.replace(
//   '<PASSWORD>',
//   process.env.DATABASE_PASSWORD
// ).replace('<DATABASE>', process.env.DATABASE_NAME);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB connection successful!'));

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
