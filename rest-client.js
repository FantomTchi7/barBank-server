const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = 9000;
const swaggerUi = require('swagger-ui-express');
const yamljs = require('yamljs');
const swaggerDocument = yamljs.load('./docs/swagger.yaml');

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://test:1234@cluster0.2zfhqac.mongodb.net/accounts-db', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB...'))
    .catch(err => console.error('Could not connect to MongoDB...', err));

const accountSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024
    }
});

const Account = mongoose.model('Account', accountSchema);

app.get('/accounts', async (req, res) => {
    try {
        const accounts = await Account.find();
        res.send(accounts);
    } catch (error) {
        res.status(500).send({ error: "An error occurred while fetching accounts." });
    }
});

app.get('/accounts/:id', async (req, res) => {
    try {
        const account = await Account.findById(req.params.id);
        if (!account) return res.status(404).send({ error: "Account not found" });
        res.send(account);
    } catch (error) {
        res.status(500).send({ error: "An error occurred while fetching the account." });
    }
});

app.post('/accounts', async (req, res) => {
    if (!req.body.username || !req.body.email || !req.body.password) {
        return res.status(400).send({ error: 'One or all params are missing' });
    }

    let account = new Account({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    try {
        account = await account.save();
        res.status(201)
            .location(`${getBaseUrl(req)}/accounts/${account._id}`)
            .send(account);
    } catch (error) {
        res.status(400).send({ error: "An error occurred while creating the account." });
    }
});

app.delete('/accounts/:id', async (req, res) => {
    try {
        const account = await Account.findByIdAndDelete(req.params.id);
        if (!account) return res.status(404).send({ error: "Account not found" });

        res.status(204).send();
    } catch (error) {
        res.status(500).send({ error: "An error occurred while deleting the account." });
    }
});


app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(port, () => {
    console.log(`API up at: http://localhost:${port}`);
});

function getBaseUrl(req) {
    return req.protocol + '://' + req.get('host');
}