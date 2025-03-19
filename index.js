var express = require('express');
var app = express();
app.use(express.json());

app.use(express.static(__dirname + '/pages'));
app.use(express.static(__dirname + '/public'));

//importante o modulo de mysql
var mysql = require('mysql');

//criando a variável con que vai ter a referência de conexão
//com o banco de dadosa
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "webdev"
});

//tentando conectar
//a variável con tem a conexão agora
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

const produtos = [];
let idUsuarios = 0;

const router = express.Router();

// Rota para listar todos os produtos
router.get('/api/produtos', (req, res) => {
    res.status(200).json(produtos);
});

// Rota para adicionar um produto
router.post('/api/produtos', (req, res) => {
    var produto = req.body;
    produto.id = 1;
    produtos.push(produto);
    res.status(201).json(produto);
});

// Endpoint para listar todos os usuários
app.get('/api/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuario';
    con.query(sql, (err, result) => {
        if (err) throw err;
        res.json(result);
    });
});

// Endpoint para salvar um usuário (criar ou atualizar)
app.post('/api/usuarios', (req, res) => {
    const { email, senha } = req.body;
    const sql = 'INSERT INTO usuario (email, senha, status) VALUES (?, ?, ?)';
    con.query(sql, [email, senha, 1], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, email, senha });
    });
});

// Endpoint para atualizar um usuário
app.put('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { email, senha } = req.body;
    const sql = 'UPDATE usuario SET email = ?, senha = ? WHERE id = ?';
    con.query(sql, [email, senha, id], (err, result) => {
        if (err) throw err;
        res.json({ id, email, senha });
    });
});

// Endpoint para capturar um usuário por id
router.get('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    let sql = `SELECT u.id, u.email, u.status FROM usuario u WHERE u.id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result[0]);
    });
});

// Endpoint para excluir um usuário
app.delete('/api/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM usuario WHERE id = ?';
    con.query(sql, [id], (err, result) => {
        if (err) throw err;
        res.json({ message: 'Usuário excluído' });
    });
});

// Novo: Endpoint para fazer login e verificar as credenciais
router.post('/api/login', (req, res) => {
    const { email, senha } = req.body;
    
    // Verifica no banco de dados se o email e a senha correspondem a um usuário
    let sql = `SELECT * FROM usuario WHERE email = '${email}' AND senha = '${senha}'`;
    
    con.query(sql, function (err, result) {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (result.length > 0) {
            // Se encontrou um usuário com as credenciais fornecidas, retorna sucesso
            res.status(200).json({ message: 'Login bem-sucedido', usuario: result[0] });
        } else {
            // Senão, retorna erro de credenciais inválidas
            res.status(401).json({ message: 'Credenciais inválidas' });
        }
    });
});

// Endpoint para listar todos os estabelecimentos
router.get('/api/estabelecimentos', (req, res) => {
    let sql = "SELECT * FROM estabelecimento";
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result);
    });
});

// Endpoint para adicionar um novo estabelecimento
router.post('/api/estabelecimentos', (req, res) => {
    var estabelecimento = req.body;
    var sql = `INSERT INTO estabelecimento (nome, endereco, avaliacao) VALUES 
               ('${estabelecimento.nome}', '${estabelecimento.endereco}', ${estabelecimento.avaliacao})`;
    con.query(sql, function (err, result) {
        if (err) {
            console.error("Erro ao inserir no banco de dados:", err);
            res.status(500).json({ error: "Erro ao inserir no banco de dados" });
            return;
        }
        res.status(201).json({ id: result.insertId, ...estabelecimento });
    });
});

// Endpoint para atualizar um estabelecimento existente
router.put('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    var estabelecimento = req.body;
    var sql = `UPDATE estabelecimento SET nome = '${estabelecimento.nome}', endereco = '${estabelecimento.endereco}', 
               avaliacao = ${estabelecimento.avaliacao} WHERE id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(estabelecimento);
    });
});

// Endpoint para excluir um estabelecimento
router.delete('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    var sql = `DELETE FROM estabelecimento WHERE id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).send(`Estabelecimento com id ${id} excluído`);
    });
});

// Endpoint para capturar um estabelecimento por ID
router.get('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    let sql = `SELECT * FROM estabelecimento WHERE id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result[0]);
    });
});

// Definindo a rota principal
app.use(router);

app.get('/', (req, res) => {
    res.redirect('/TelaEntrada/telaentrada.html'); // Ajuste o caminho aqui
});

// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
