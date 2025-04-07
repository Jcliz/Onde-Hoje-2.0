//TO-DO
//endpoint para CRUD de usuário
//verificar funções relacionadas ao node nos scripts das paginas
//endpoint para CRUD de avaliação
//autenticação de usuário com senha criptografada
//identificar, na interface, o usuário autenticado

var express = require('express');
var app = express();
app.use(express.json());

app.use(express.static(__dirname + '/components'));
app.use(express.static(__dirname + '/src/pages'));
app.use(express.static(__dirname + '/src/static'));
app.use(express.static(__dirname + '/public'));

// Adicione esta linha para servir arquivos HTML corretamente
app.use(express.static(__dirname));

//importante o modulo de mysql
var mysql = require('mysql2');

//criando a variável con que vai ter a referência de conexão
//com o banco de dadosa
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "ondehoje2"
});

//tentando conectar
//a variável con tem a conexão agora
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

const estabelecimentos = [];
let idUsuarios = 0;

const router = express.Router();

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
    const sql = 'INSERT INTO usuario (email, senha) VALUES (?, ?)';
    con.query(sql, [email, senha], (err, result) => {
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
    let sql = `SELECT u.id, u.email FROM usuario u WHERE u.id = ${id}`;
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

// Rota para listar todos os estabelecimentos
router.get('/api/estabelecimentos', (req, res) => {
    res.status(200).json(estabelecimentos);
});

// Rota para adicionar um estabelecimento
router.post('/api/estabelecimento', (req, res) => {
    var estabelecimento = req.body;
    estabelecimento.id = 1;
    estabelecimentos.push(estabelecimento);
    res.status(201).json(estabelecimento);
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
    var sql = `INSERT INTO estabelecimento (nome, rua, bairro, numero) VALUES 
               ('${estabelecimento.nome}', '${estabelecimento.rua}', 
               '${estabelecimento.bairro}', '${estabelecimento.numero}')`;
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
    var sql = `UPDATE estabelecimento SET nome = '${estabelecimento.nome}', 
               rua = '${estabelecimento.rua}', bairro = '${estabelecimento.bairro}',
               numero = '${estabelecimento.numero}' 
               WHERE id = ${id}`;

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

app.use(router);

app.get('/', (req, res) => {
    res.redirect('/src/pages/telaEntrada/telaentrada.html');
});

// Iniciando o servidor
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
