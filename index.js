const express = require('express');
const cors = require('cors');

const mountRouter = require('./router/mountRouter');

const PORT = 3010;
const app = express();

app.use(cors());
app.use(express.json());

mountRouter(app);

app.listen(PORT, () => console.log(`Server is running on ${PORT} port!`));
