//TO-DO
//endpoint para CRUD de avaliação
const estabelecimentos = [];
var express = require('express');
var app = express();
const session = require('express-session');
var mysql = require('mysql2');
const nunjucks = require('nunjucks');
const fs = require('fs');
const path = require('path');
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

//endpoint para mostrar a foto de perfil vazia
app.get('/api/usuarios/foto', (req, res) => {
    const idUsuario = req.session.ID_usuario;

    con.query('SELECT HEX(foto) AS foto FROM usuario WHERE ID_usuario = ?', [idUsuario], (err, result) => {
        if (err || result.length === 0 || !result[0].foto) {
            return res.redirect('/public/foto-placeholder.jpg'); //placeholder
        }

        const hex = result[0].foto;
        const buffer = Buffer.from(hex, 'hex');

        res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    });
});

//endpoint para upload de fotos de perfil
app.post('/api/usuarios/uploadFoto', upload.single('foto'), async (req, res) => {
    try {
        const fotoBuffer = req.file?.buffer;

        if (!fotoBuffer) {
            return res.status(400).json({ erro: 'Imagem não enviada!' });
        }

        //converter para hexadecimal
        const fotoHex = fotoBuffer.toString('hex');

        const idUsuario = req.session.ID_usuario;
        const sql = 'UPDATE usuario SET foto = UNHEX(?) WHERE ID_usuario = ?';
        con.query(sql, [fotoHex, idUsuario]); 

        res.status(200).json({ mensagem: 'Upload realizado com sucesso!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Erro ao salvar a imagem.' });
    }
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
            complemento: req.session.complemento,
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

//exclusão de usuário
app.delete('/api/usuarios/excluir', (req, res) => {
    const { id } = req.body;

    // Passo 1: Buscar todos os ID_rating das avaliações do usuário
    const buscarRatings = 'SELECT ID_rating FROM avaliacao WHERE fk_ID_usuario = ?';

    con.query(buscarRatings, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar avaliações.' });
        }

        const ratingIds = results.map(row => row.ID_rating);

        if (ratingIds.length === 0) {
            continuarExclusao(); // se não houver avaliações, só continua
        } else {
            //deletar eventos associados às avaliações
            const deletarEventos = 'DELETE FROM evento WHERE fk_ID_rating IN (?)';
            con.query(deletarEventos, [ratingIds], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Erro ao excluir eventos relacionados às avaliações.' });
                }

                continuarExclusao(); //segue para deletar avaliações e usuário
            });
        }

        //continuar a exclusão após os eventos
        function continuarExclusao() {
            const deletarAvaliacoes = 'DELETE FROM avaliacao WHERE fk_ID_usuario = ?';
            con.query(deletarAvaliacoes, [id], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Erro ao excluir avaliações.' });
                }

                const deletarUsuario = 'DELETE FROM usuario WHERE ID_usuario = ?';
                con.query(deletarUsuario, [id], (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: 'Erro ao excluir usuário.' });
                    }

                    res.json({ message: 'Usuário e dados relacionados excluídos com sucesso.' });
                });
            });
        }
    });
});

//update de usuário
app.put('/api/usuarios/update', (req, res) => {
    const { nick, email, cep, complemento, numero, telefone } = req.body;
    const idUsuario = req.session.ID_usuario;
    const novaFoto = req.file ? req.file.buffer.toString('hex') : null;

    const getUserSql = 'SELECT * FROM usuario WHERE ID_usuario = ?';
    con.query(getUserSql, [idUsuario], (err, results) => {
        if (err || results.length === 0) {
            console.error('Erro ao buscar dados atuais do usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        const user = results[0]

        //lista de promessas para verificar apenas o que mudou e dados cadastrados
        const verificacoes = [];

        if (telefone && telefone !== user.telefone) {
            verificacoes.push(new Promise((resolve, reject) => {
                con.query('SELECT * FROM usuario WHERE telefone = ? AND ID_usuario != ?', [telefone, idUsuario], (err, result) => {
                    if (err) reject('Erro ao verificar telefone');
                    else if (result.length > 0) reject('Telefone já cadastrado');
                    else resolve();
                });
            }));
        }

        if (email && email !== user.email) {
            verificacoes.push(new Promise((resolve, reject) => {
                con.query('SELECT * FROM usuario WHERE email = ? AND ID_usuario != ?', [email, idUsuario], (err, result) => {
                    if (err) reject('Erro ao verificar email');
                    else if (result.length > 0) reject('Email já cadastrado');
                    else resolve();
                });
            }));
        }

        if (nick && nick !== user.nick) {
            verificacoes.push(new Promise((resolve, reject) => {
                con.query('SELECT * FROM usuario WHERE nick = ? AND ID_usuario != ?', [nick, idUsuario], (err, result) => {
                    if (err) reject('Erro ao verificar nick');
                    else if (result.length > 0) reject('Nick já cadastrado');
                    else resolve();
                });
            }));
        }

        //executa todas as verificações
        Promise.all(verificacoes)
            .then(() => {
                //monta dinamicamente os campos que devem ser atualizados
                const campos = [];
                const valores = [];

                if (nick && nick !== user.nick) {
                    campos.push("nick = ?");
                    valores.push(nick);
                }
                if (email && email !== user.email) {
                    campos.push("email = ?");
                    valores.push(email);
                }
                if (cep && cep !== user.cep) {
                    campos.push("cep = ?");
                    valores.push(cep);
                }
                if (complemento && complemento !== user.complemento) {
                    campos.push("complemento = ?");
                    valores.push(complemento);
                }
                if (numero && numero !== user.numero) {
                    campos.push("numero = ?");
                    valores.push(numero);
                }
                if (telefone && telefone !== user.telefone) {
                    campos.push("telefone = ?");
                    valores.push(telefone);
                }

                if (novaFoto) {
                    campos.push("foto = UNHEX(?)");
                    valores.push(novaFoto);
                }

                if (campos.length === 0) {
                    return res.status(200).json({ message: 'Nenhum dado alterado.' });
                }

                const sql = `UPDATE usuario SET ${campos.join(', ')} WHERE ID_usuario = ?`;
                valores.push(idUsuario);

                con.query(sql, valores, (err) => {
                    if (err) {
                        console.error('Erro ao atualizar usuário:', err);
                        return res.status(500).json({ message: 'Erro ao atualizar o usuário.' });
                    }

                    //atualiza a sessão com os novos dados
                    if (nick) req.session.nick = nick;
                    if (email) req.session.email = email;
                    if (cep) req.session.cep = cep;
                    if (complemento) req.session.complemento = complemento;
                    if (numero) req.session.numero = numero;
                    if (telefone) req.session.telefone = telefone;

                    return res.status(200).json({ message: 'Dados atualizados com sucesso!' });
                });
            })
            .catch((msg) => {
                return res.status(400).json({ message: msg });
            });
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
            req.session.complemento = result[0].complemento;
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
    const checkNick = 'SELECT nick FROM usuario WHERE nick = ?';

    con.query(checkCpf, [cpf], (err, result) => {
        if (err) {
            req.session.estaAutenticado = false;
            console.error('Erro ao verificar CPF:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        if (result.length > 0) {
            req.session.estaAutenticado = false;
            return res.status(400).json({ message: 'CPF já cadastrado.' });
        }

        //erificar se o telefone já existe 
        con.query(checkTelefone, [telefone], (err, result) => {
            if (err) {
                req.session.estaAutenticado = false;
                console.error('Erro ao verificar telefone:', err);
                return res.status(500).json({ message: 'Erro no servidor' });
            }

            if (result.length > 0) {
                req.session.estaAutenticado = false;
                return res.status(400).json({ message: 'Telefone já cadastrado.' });
            }

            // Verificar se o email já existe
            con.query(checkEmail, [email], (err, result) => {
                if (err) {
                    req.session.estaAutenticado = false;
                    console.error('Erro ao verificar email:', err);
                    return res.status(500).json({ message: 'Erro no servidor' });
                }

                if (result.length > 0) {
                    req.session.estaAutenticado = false;
                    return res.status(400).json({ message: 'Email já cadastrado.' });
                }

                con.query(checkNick, [nick], (err, result) => {
                    if (err) {
                        req.session.estaAutenticado = false;
                        console.error('Erro ao criar o nick aleatório:', err);
                        return res.status(500).json({ message: 'Erro no servidor' });
                    }

                    if (result.length > 0) {
                        req.session.estaAutenticado = false;
                        return res.status(400).json({ message: 'Nick aleatório gerado já existe. Tente novamente.' });
                    }

                    // Inserir o novo usuário
                    const sql = 'INSERT INTO usuario (nome, nick, DT_nascimento, email, senha, cpf, cep, numero, complemento, genero, telefone) VALUES (?, ?, ?, ?, MD5(?), ?, ?, ?, ?, ?, ?)';
                    con.query(sql, [nome, nick, dataNascimento, email, senha, cpf, cep, numero, complemento, genero, telefone], (err, result) => {
                        if (err) {
                            req.session.estaAutenticado = false;
                            console.error('Erro ao inserir usuário:', err);
                            return res.status(500).json({ message: 'Erro ao cadastrar o usuário.' });
                        }
                        req.session.estaAutenticado = false;
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

//iniciando o servidor
const port = 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});