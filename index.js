//TO-DO
//endpoint para CRUD de avaliação
const estabelecimentos = [];
var express = require('express');
var app = express();
const session = require('express-session');
var mysql = require('mysql2');
const nunjucks = require('nunjucks');
const sessionMaxAge = 10 * 60 * 1000; // Expira após 10 minutos


app.use(session({
    secret: 'ondehoje',
    resave: true,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: sessionMaxAge,
        httpOnly: true,
        secure: false //http
    }
}));


app.use((req, res, next) => {
    //verificação de horario atual para término de sessão
    if (req.session.user_logged_in) {
        req.session.cookie.expires = new Date(Date.now() + sessionMaxAge);
    }
    next();
});

//middleware para armazenar sessão nos templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

app.use((req, res, next) => {
    res.locals.user_logged_in = req.session.user_logged_in || false;
    next();
});

// Configuração do Nunjucks
const nunjucksEnv = nunjucks.configure('views', {
    autoescape: true,
    express: app,
    watch: true
});

// Filtro de formatação de data
nunjucksEnv.addFilter('date', function (value, format) {
    const moment = require('moment');
    return moment(value).format(format);
});

app.use(express.json());

app.use(express.static(__dirname + '/components'));
app.use(express.static(__dirname + '/src/pages'));
app.use(express.static(__dirname + '/src/static'));
app.use(express.static(__dirname + '/public'));

app.use(express.static(__dirname));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "123456",
    database: "ondehoje2"
});

//tentando conectar
con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

// Configuração do Multer para formulários com ou sem imagens
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Apenas imagens são permitidas!'), false);
        }
        cb(null, true);
    }
});

//rota principal
app.get('/', (req, res) => {
    if (req.session.user_logged_in) {
        return res.redirect(303, '/src/pages/topRoles/topRoles.html');
    }
    res.redirect('/src/pages/telaEntrada/telaentrada.html');
});

//endpoint para o fetch dos dados da sessão
app.get('/api/session', (req, res) => {
    if (req.session.user_logged_in) {
        res.json({
            estaAutenticado: true,
            ID_usuario: req.session.ID_usuario,
            nomeUsuario: req.session.nomeUsuario || "Usuário",
            email: req.session.email,
            telefone: req.session.telefone,
            cep: req.session.cep,
            numero: req.session.numero,
            nick: req.session.nick
        });
    } else {
        res.json({ estaAutenticado: false });
    }
});

//logout do usuário
app.get('/logout', (req, res) => {
    console.log("Rota /logout foi acessada");
    req.session.destroy(() => {
        res.redirect('/');
    });
});

//endpoint para fazer login e verificar as credenciais
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    let sql = `SELECT * FROM usuario WHERE email = ? AND senha = MD5(?)`;

    con.query(sql, [email, senha], (err, result) => {
        if (err) {
            console.error('Erro ao consultar o banco de dados:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (result.length > 0) {
            req.session.user_logged_in = true;
            req.session.ID_usuario = result[0].ID_usuario;
            req.session.nomeUsuario = result[0].nome;
            req.session.email = result[0].email;
            req.session.telefone = result[0].telefone;
            req.session.cep = result[0].cep;
            req.session.numero = result[0].numero;
            req.session.nick = result[0].nick;

            res.status(200).json({ message: 'Login bem-sucedido', usuario: result[0] });
        } else {
            res.status(401).json({ message: 'Senha ou e-mail inválido.' });
        }
    });
});

// Endpoint para salvar um usuário (criar)
app.post('/api/usuarios/criar', (req, res) => {
    const { nome, nick, dataNascimento, email, senha, cpf, cep, numero, complemento, genero, telefone } = req.body;

    const checkCpf = 'SELECT cpf FROM usuario WHERE cpf = ?';
    const checkTelefone = 'SELECT telefone FROM usuario WHERE telefone = ?';
    const checkEmail = 'SELECT email FROM usuario WHERE email = ?';
    const checkNick = 'SELECT nick FROM usuario WHERE nick = ?'

    con.query(checkCpf, [cpf], (err, result) => {
        if (err) {
            req.session.nao_autenticado = true;
            console.error('Erro ao verificar CPF:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (result.length > 0) {
            req.session.nao_autenticado = true;
            return res.status(400).json({ message: 'CPF já cadastrado.' });
        }

        // Verificar se o telefone já existe 
        con.query(checkTelefone, [telefone], (err, result) => {
            if (err) {
                req.session.nao_autenticado = true;
                console.error('Erro ao verificar telefone:', err);
                return res.status(500).json({ message: 'Erro no servidor' });
            }

            if (result.length > 0) {
                req.session.nao_autenticado = true;
                return res.status(400).json({ message: 'Telefone já cadastrado.' });
            }

            // Verificar se o email já existe
            con.query(checkEmail, [email], (err, result) => {
                if (err) {
                    req.session.nao_autenticado = true;
                    console.error('Erro ao verificar email:', err);
                    return res.status(500).json({ message: 'Erro no servidor' });
                }

                if (result.length > 0) {
                    req.session.nao_autenticado = true;
                    return res.status(400).json({ message: 'Email já cadastrado.' });
                }

                con.query(checkNick, [nick], (err, result) => {
                    if (err) {
                        req.session.nao_autenticado = true;
                        console.error('Erro ao criar o nick aleatório:', err);
                        return res.status(500).json({ message: 'Erro no servidor' });
                    }

                    if (result.length > 0) {
                        req.session.nao_autenticado = true;
                        return res.status(400).json({ message: 'Nick aleatório gerado já existe. Tente novamente.' });
                    }

                    // Inserir o novo usuário
                    const sql = 'INSERT INTO usuario (nome, nick, DT_nascimento, email, senha, cpf, cep, numero, complemento, genero, telefone) VALUES (?, ?, ?, ?, MD5(?), ?, ?, ?, ?, ?, ?)';
                con.query(sql, [nome, nick, dataNascimento, email, senha, cpf, cep, numero, complemento, genero, telefone], (err, result) => {
                    if (err) {
                        req.session.nao_autenticado = true;
                        console.error('Erro ao inserir usuário:', err);
                        return res.status(500).json({ message: 'Erro ao cadastrar o usuário.' });
                    }
                    req.session.nao_autenticado = true;
                    res.status(200).json({ message: 'Usuário cadastrado!' });
                });
            });
        });
    });
});
});

//endpoint para encontrar email no bd
app.post('/api/esqueceuSenha', (req, res) => {
    const { email } = req.body;

    let sql = `SELECT email FROM usuario WHERE email = ?`;

    con.query(sql, [email], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Erro no servidor' });
        }
        if (result.length > 0) {
            res.status(200).json({ message: 'E-mail enviado!' });
        } else {
            res.status(401).json({ message: 'E-mail não encontrado.' });
        }
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
app.get('/api/usuarios/:id', (req, res) => {
    const id = req.params.id;
    let sql = `SELECT u.id, u.nome, u.email FROM usuario u WHERE u.id = ${id}`;
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

// Rota para listar todos os estabelecimentos
app.get('/api/estabelecimentos', (req, res) => {
    res.status(200).json(estabelecimentos);
});

// Rota para adicionar um estabelecimento
app.post('/api/estabelecimento', (req, res) => {
    var estabelecimento = req.body;
    estabelecimento.id = 1;
    estabelecimentos.push(estabelecimento);
    res.status(201).json(estabelecimento);
});

// Endpoint para listar todos os estabelecimentos
app.get('/api/estabelecimentos', (req, res) => {
    let sql = "SELECT * FROM estabelecimento";
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result);
    });
});

// Endpoint para adicionar um novo estabelecimento
app.post('/api/estabelecimentos', (req, res) => {
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
app.put('/api/estabelecimentos/:id', (req, res) => {
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
app.delete('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    var sql = `DELETE FROM estabelecimento WHERE id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).send(`Estabelecimento com id ${id} excluído`);
    });
});

// Endpoint para capturar um estabelecimento por ID
app.get('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    let sql = `SELECT * FROM estabelecimento WHERE id = ${id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        res.status(200).json(result[0]);
    });
});


//iniciando o servidor
const port = 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});