import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('<h1>Home page</h1>');
});

app.get('/products', (req, res) => {
  res.send('<h1>Products page</h1>');
});

// This route will handle all the requests that are
// not handled by any other route handler. In
// this handler we will redirect the user to
// an error page with NOT FOUND message and status
// code as 404 (HTTP status code for NOT found)
app.all('*', (req, res) => {
  res.status(404).send('<h1>404! Page not found</h1>');
});

app.listen(3050, () => {
  console.log('Server is up on port 3050');
});
