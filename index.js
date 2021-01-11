const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors('*'));
require('dotenv').config();
const env = require('./server/config');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require('./server/routes');
app.use(routes);
app.listen(env.port, (err) => {
    if (err) throw new Error(err);
    console.log(`Servidor corriendo en puerto ${env.port}`);
});
