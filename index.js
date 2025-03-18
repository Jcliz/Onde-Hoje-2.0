var express = require('express');
var app = express();
app.use(express.json());

app.use(express.static('./pages'));

//abrir na tela de cadastro
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/cadastro/cadastro.html');
});

//modulo de mysql
var mysql = require('mysql');

//criando a variável con que vai ter a referência de conexão
//com o banco de dados
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "ondehoje2"
});

//tentando connectar
//a variável con tem a conexão agora
con.connect(function (err) {
    //if (err) throw err;
    console.log("Connected!");
});

const router = express.Router();

app.use(router);

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});