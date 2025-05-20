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
        return res.redirect(303, '/src/pages/perfil/perfil.html');
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
            nomeUsuario: req.session.nomeUsuario,
            email: req.session.email,
            senha: req.session.senha,
            telefone: req.session.telefone,
            cep: req.session.cep,
            numero: req.session.numero,
            complemento: req.session.complemento,
            nick: req.session.nick,
            isAdm: req.session.isAdm
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

    const buscarRatings = 'SELECT ID_rating FROM avaliacao WHERE fk_ID_usuario = ?';

    con.query(buscarRatings, [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar avaliações.' });
        }

        const ratingIds = results.map(row => row.ID_rating);

        if (ratingIds.length === 0) {
            continuarExclusao();

        } else {
            //deletar eventos associados às avaliações
            const deletarEventos = 'DELETE FROM evento WHERE fk_ID_rating IN (?)';
            con.query(deletarEventos, [ratingIds], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Erro ao excluir eventos relacionados às avaliações.' });
                }

                continuarExclusao();
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

//função para verficação de campos
function verficarCampos(user, body, novaFoto) {
    const campos = [];
    const valores = [];
    if (body.nick && body.nick !== user.nick) {
        campos.push("nick = ?");
        valores.push(body.nick);
    }
    if (body.email && body.email !== user.email) {
        campos.push("email = ?");
        valores.push(body.email);
    }
    if (body.senha && body.senha !== user.senha) {
        campos.push("senha = MD5(?)");
        valores.push(body.senha);
    }
    if (body.cep && body.cep !== user.cep) {
        campos.push("cep = ?");
        valores.push(body.cep);
    }
    if (body.complemento && body.complemento !== user.complemento) {
        campos.push("complemento = ?");
        valores.push(body.complemento);
    }
    if (body.numero && body.numero !== user.numero) {
        campos.push("numero = ?");
        valores.push(body.numero);
    }
    if (body.telefone && body.telefone !== user.telefone) {
        campos.push("telefone = ?");
        valores.push(body.telefone);
    }
    if (novaFoto) {
        campos.push("foto = UNHEX(?)");
        valores.push(novaFoto);
    }
    return { campos, valores };
}

app.put('/api/usuarios/update', (req, res) => {
    const { nick, email, senha, cep, complemento, numero, telefone } = req.body;
    const idUsuario = req.session.ID_usuario;
    const novaFoto = req.file ? req.file.buffer.toString('hex') : null;

    con.query('SELECT * FROM usuario WHERE ID_usuario = ?', [idUsuario], (err, results) => {
        if (err || results.length === 0) {
            console.error('Erro ao buscar dados atuais do usuário:', err);
            return res.status(500).json({ message: 'Erro no servidor' });
        }

        const user = results[0];

        const { campos, valores } = verficarCampos(user, req.body, novaFoto);
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

            // Atualiza a sessão com os novos dados
            if (nick) req.session.nick = nick;
            if (email) req.session.email = email;
            if (senha) req.session.senha = senha;
            if (cep) req.session.cep = cep;
            if (complemento) req.session.complemento = complemento;
            if (numero) req.session.numero = numero;
            if (telefone) req.session.telefone = telefone;

            return res.status(200).json({ message: 'Dados atualizados com sucesso!' });
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
            req.session.senha = result[0].senha;

            if (result[0].role && result[0].role.toLowerCase() === 'adm') {
                req.session.isAdm = true;
            } else {
                req.session.isAdm = false;
            }

            res.status(200).json({ message: 'Login bem-sucedido', usuario: result[0] });
        } else {
            res.status(401).json({ message: 'Senha ou e-mail inválido.' });
        }
    });
});

app.post('/api/usuarios/avaliar', (req, res) => {
    const { nota, comentario, estabelecimento } = req.body;

    // Buscar o ID do estabelecimento a partir do nome
    const sqlFind = "SELECT ID_estabelecimento FROM estabelecimento WHERE nome = ?";
    con.query(sqlFind, [estabelecimento], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no banco de dados ao buscar estabelecimento' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Estabelecimento não encontrado' });
        }
        const fk_ID_estabelecimento = results[0].ID_estabelecimento;

        // Inserir nova avaliação com nota, comentário e FK do estabelecimento
        const sqlInsert = "INSERT INTO avaliacao (avaliacao, comentario, fk_ID_usuario, fk_ID_estabelecimento) VALUES (?, ?, ?, ?)";
        con.query(sqlInsert, [nota, comentario, req.session.ID_usuario, fk_ID_estabelecimento], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao inserir avaliação' });
            }
            return res.status(200).json({ message: 'Avaliação adicionada com sucesso' });
        });
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

//endpoint para buscar estabelecimentos do banco
app.get('/api/estabelecimentos', (req, res) => {
    const sql = 'SELECT * FROM estabelecimento';
    con.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar estabelecimentos.' });
        }
        res.json(results);
    });
});

app.post('/api/estabelecimentos/criar', upload.single('foto'), (req, res) => {
    const { nome, cnpj, cep, rua, bairro, numero, foto } = req.body;
    let fotoHex = null;

    if (req.file) {
        try {
            fotoHex = req.file.buffer.toString('hex');
        } catch (error) {
            console.error("Erro ao converter a foto:", error);
            return res.status(400).json({ message: 'Foto inválida.' });
        }
    } else if (foto) {
        try {
            const buffer = Buffer.from(foto, 'base64');
            fotoHex = buffer.toString('hex');
        } catch (error) {
            console.error("Erro ao converter foto base64:", error);
            return res.status(400).json({ message: 'Foto inválida.' });
        }
    }

    const sql = 'INSERT INTO estabelecimento (nome, cnpj, cep, rua, bairro, numero, foto) VALUES (?, ?, ?, ?, ?, ?, UNHEX(?))';
    con.query(sql, [nome, cnpj, cep, rua, bairro, numero, fotoHex], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao criar estabelecimento.' });
        }
        res.status(200).json({ message: 'Estabelecimento criado com sucesso!' });
    });
});

app.get("/api/estabelecimentos/foto/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT foto FROM estabelecimento WHERE ID_estabelecimento = ?";
    con.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar foto do estabelecimento:", err);
            return res.status(500).send("Erro ao buscar a foto");
        }
        if (results.length === 0 || !results[0].foto) {
            return res.status(404).send("Foto não encontrada");
        }
        const fotoBlob = results[0].foto;
        res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Content-Length": fotoBlob.length,
        });
        res.end(fotoBlob);
    });
});

app.post('/api/eventos/criar', upload.single('foto'), (req, res) => {
    const { nome, data, hora, cep, rua, bairro, numero, fk_ID_estabelecimento } = req.body;
    // ID do usuário atual da sessão
    const idUsuario = req.session.ID_usuario;
    let fotoHex = null;

    if (req.file) {
        try {
            fotoHex = req.file.buffer.toString('hex');
        } catch (error) {
            console.error("Erro ao converter a foto:", error);
            return res.status(400).json({ message: 'Foto inválida.' });
        }
    }

    if (fk_ID_estabelecimento) {
        const sqlFind = "SELECT ID_estabelecimento FROM estabelecimento WHERE nome = ?";
        con.query(sqlFind, [fk_ID_estabelecimento], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro no banco de dados ao buscar estabelecimento.' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
            }
            const estabelecimentoId = results[0].ID_estabelecimento;
            // Incluir o ID do usuário no cadastro do evento (fk_ID_usuario)
            const sql = 'INSERT INTO evento (nome, data, hora, cep, rua, bairro, numero, foto, fk_ID_estabelecimento, fk_ID_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, UNHEX(?), ?, ?)';
            con.query(sql, [nome, data, hora, cep, rua, bairro, numero, fotoHex, estabelecimentoId, idUsuario], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: 'Erro ao criar evento.' });
                }
                return res.status(200).json({ message: 'Evento criado com sucesso!' });
            });
        });
    } else {
        // Caso não haja estabelecimento, insere nulo para fk_ID_estabelecimento
        const sql = 'INSERT INTO evento (nome, data, hora, cep, rua, bairro, numero, foto, fk_ID_estabelecimento, fk_ID_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, UNHEX(?), ?, ?)';
        con.query(sql, [nome, data, hora, cep, rua, bairro, numero, fotoHex, null, idUsuario], (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: 'Erro ao criar evento.' });
            }
            return res.status(200).json({ message: 'Evento criado com sucesso!' });
        });
    }
});

//endpoint para buscar avaliações do banco
app.get('/api/usuarios/avaliacoesPessoais', (req, res) => {
    const idUsuario = req.session.ID_usuario;

    if (!idUsuario) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const sql = `
        SELECT e.ID_estabelecimento, e.nome, e.foto, a.avaliacao, a.comentario
        FROM estabelecimento e
        JOIN avaliacao a ON e.ID_estabelecimento = a.fk_ID_estabelecimento
        WHERE a.fk_ID_usuario = ?
        ORDER BY a.ID_rating
    `;

    con.query(sql, [idUsuario], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
        res.json(results);
    });
});

app.get('/api/usuarios/avaliacoes', (req, res) => {
    const sql = `
        SELECT e.ID_estabelecimento, e.nome, e.foto, a.avaliacao, a.comentario 
        FROM estabelecimento e 
        JOIN avaliacao a ON e.ID_estabelecimento = a.fk_ID_estabelecimento
        ORDER BY a.ID_rating ASC 
    `;
    con.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro interno no servidor' });
        }
        res.json(results);
    });
});

app.post('/api/usuarios/editarAvaliacao', (req, res) => {
    const { nota, comentario, estabelecimento } = req.body;
    const idUsuario = req.session.ID_usuario;

    // Buscar o ID do estabelecimento a partir do nome
    const sqlFind = "SELECT ID_estabelecimento FROM estabelecimento WHERE nome = ?";
    con.query(sqlFind, [estabelecimento], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no banco de dados ao buscar estabelecimento' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Estabelecimento não encontrado' });
        }

        const fk_ID_estabelecimento = results[0].ID_estabelecimento;

        // Atualizar a avaliação do usuário
        const sqlUpdate = `
            UPDATE avaliacao 
            SET avaliacao = ?, comentario = ? 
            WHERE fk_ID_usuario = ? AND fk_ID_estabelecimento = ?
        `;
        con.query(sqlUpdate, [nota, comentario, idUsuario, fk_ID_estabelecimento], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao atualizar avaliação' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Avaliação não encontrada para este estabelecimento' });
            }
            return res.status(200).json({ message: 'Avaliação atualizada com sucesso' });
        });
    });
});

app.delete('/api/usuarios/excluirAvaliacao', (req, res) => {
    const { estabelecimento } = req.body;
    const idUsuario = req.session.ID_usuario;

    if (!idUsuario) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar o ID do estabelecimento a partir do nome
    const sqlFind = "SELECT ID_estabelecimento FROM estabelecimento WHERE nome = ?";
    con.query(sqlFind, [estabelecimento], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro no banco de dados ao buscar estabelecimento' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Estabelecimento não encontrado' });
        }

        const fk_ID_estabelecimento = results[0].ID_estabelecimento;

        // Excluir a avaliação do usuário para o estabelecimento
        const sqlDelete = `
            DELETE FROM avaliacao 
            WHERE fk_ID_usuario = ? AND fk_ID_estabelecimento = ?
        `;
        con.query(sqlDelete, [idUsuario, fk_ID_estabelecimento], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro ao excluir avaliação' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Avaliação não encontrada para este estabelecimento' });
            }
            return res.status(200).json({ message: 'Avaliação excluída com sucesso' });
        });
    });
});

// Endpoint para buscar a foto de um evento
app.get('/api/eventos/foto/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT foto FROM evento WHERE ID_evento = ?";
    con.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao buscar foto do evento:", err);
            return res.status(500).send("Erro ao buscar a foto");
        }
        if (results.length === 0 || !results[0].foto) {
            // Redireciona para uma imagem padrão
            return res.redirect('/public/bar.png');
        }
        const fotoBlob = results[0].foto;
        res.writeHead(200, {
            "Content-Type": "image/jpeg",
            "Content-Length": fotoBlob.length,
        });
        res.end(fotoBlob);
    });
});

// Modificar a consulta de eventos ativos para incluir o nome do usuário
app.get('/api/eventos/ativos', (req, res) => {
    const sql = `
    SELECT e.*, est.nome AS estabelecimento_nome, u.nick AS usuario_nome
    FROM evento e
    LEFT JOIN estabelecimento est ON e.fk_ID_estabelecimento = est.ID_estabelecimento
    LEFT JOIN usuario u ON e.fk_ID_usuario = u.ID_usuario
    WHERE DATE(e.data) >= CURDATE()
    ORDER BY e.data, e.hora ASC
  `;
    con.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar eventos ativos:", err);
            return res.status(500).json({ message: "Erro ao buscar eventos." });
        }
        res.json(results);
    });
});

// Endpoint para buscar os eventos criados pelo usuário atual
app.get('/api/eventos/meus-eventos', (req, res) => {
    const idUsuario = req.session.ID_usuario;

    if (!idUsuario) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }

    const sql = `
      SELECT e.*, est.nome AS estabelecimento_nome, u.nick AS usuario_nome
      FROM evento e
      LEFT JOIN estabelecimento est ON e.fk_ID_estabelecimento = est.ID_estabelecimento
      LEFT JOIN usuario u ON e.fk_ID_usuario = u.ID_usuario
      WHERE e.fk_ID_usuario = ?
      ORDER BY e.data DESC, e.hora DESC
  `;

    con.query(sql, [idUsuario], (err, results) => {
        if (err) {
            console.error("Erro ao buscar eventos do usuário:", err);
            return res.status(500).json({ message: "Erro ao buscar eventos." });
        }
        res.json(results);
    });
});

// Endpoint para editar um evento
app.post('/api/eventos/editar', upload.single('foto'), (req, res) => {
    const { id, nome, data, hora } = req.body;
    const idUsuario = req.session.ID_usuario;

    if (!idUsuario) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Primeiro, verificar se o evento pertence ao usuário
    const sqlCheck = "SELECT * FROM evento WHERE ID_evento = ? AND fk_ID_usuario = ?";
    con.query(sqlCheck, [id, idUsuario], (err, results) => {
        if (err) {
            console.error("Erro ao verificar propriedade do evento:", err);
            return res.status(500).json({ message: 'Erro ao verificar o evento.' });
        }

        if (results.length === 0) {
            return res.status(403).json({ message: 'Você não tem permissão para editar este evento.' });
        }

        // Preparar campos para atualização
        let sql = 'UPDATE evento SET nome = ?, data = ?, hora = ?';
        let params = [nome, data, hora];

        // Se houver uma nova foto, incluí-la na atualização
        if (req.file) {
            try {
                const fotoHex = req.file.buffer.toString('hex');
                sql += ', foto = UNHEX(?)';
                params.push(fotoHex);
            } catch (error) {
                console.error("Erro ao converter a foto:", error);
                return res.status(400).json({ message: 'Foto inválida.' });
            }
        }

        // Finalizar a query SQL
        sql += ' WHERE ID_evento = ?';
        params.push(id);

        // Executar a atualização
        con.query(sql, params, (err, updateResult) => {
            if (err) {
                console.error("Erro ao atualizar evento:", err);
                return res.status(500).json({ message: 'Erro ao atualizar o evento.' });
            }

            res.status(200).json({ message: 'Evento atualizado com sucesso!' });
        });
    });
});

// Endpoint para excluir um evento
app.delete('/api/eventos/excluir', (req, res) => {
    const { id } = req.body;
    const idUsuario = req.session.ID_usuario;

    if (!idUsuario) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    // Primeiro, verificar se o evento pertence ao usuário
    const sqlCheck = "SELECT * FROM evento WHERE ID_evento = ? AND fk_ID_usuario = ?";
    con.query(sqlCheck, [id, idUsuario], (err, results) => {
        if (err) {
            console.error("Erro ao verificar propriedade do evento:", err);
            return res.status(500).json({ message: 'Erro ao verificar o evento.' });
        }

        if (results.length === 0) {
            return res.status(403).json({ message: 'Você não tem permissão para excluir este evento.' });
        }

        // Executar a exclusão
        const sqlDelete = "DELETE FROM evento WHERE ID_evento = ?";
        con.query(sqlDelete, [id], (err, deleteResult) => {
            if (err) {
                console.error("Erro ao excluir evento:", err);
                return res.status(500).json({ message: 'Erro ao excluir o evento.' });
            }

            res.status(200).json({ message: 'Evento excluído com sucesso!' });
        });
    });
});

// Novo endpoint para retornar os resultados dos filtros com data formatada
app.get('/api/filtros', (req, res) => {
    const searchTerm = req.query.q || '';
    const likeTerm = `%${searchTerm}%`;

    // Consulta para o primeiro evento: se CEP estiver nulo ou vazio, retorna o nome do estabelecimento; formata a data
    const eventQuery1 = `
        SELECT e.ID_evento, e.nome, DATE_FORMAT(e.data, '%d/%m/%Y') as data, e.hora,
          IF(e.cep IS NULL OR e.cep = '', est.nome, CONCAT(e.rua, ', ', e.bairro, ', ', e.numero, ', CEP: ', e.cep)) AS endereco
        FROM evento e
        LEFT JOIN estabelecimento est ON e.fk_ID_estabelecimento = est.ID_estabelecimento
        WHERE e.nome LIKE ?
        LIMIT 1 OFFSET 0
    `;

    // Consulta para uma avaliação de estabelecimento (sem foto)
    const avaliacaoQuery = `
        SELECT e.ID_estabelecimento, e.nome AS estabelecimento_nome, a.avaliacao, a.comentario 
        FROM estabelecimento e 
        JOIN avaliacao a ON e.ID_estabelecimento = a.fk_ID_estabelecimento 
        WHERE e.nome LIKE ? 
        LIMIT 1
    `;

    // Consulta para o segundo evento: mesma lógica de data e endereço
    const eventQuery2 = `
        SELECT e.ID_evento, e.nome, DATE_FORMAT(e.data, '%d/%m/%Y') as data, e.hora,
          IF(e.cep IS NULL OR e.cep = '', est.nome, CONCAT(e.rua, ', ', e.bairro, ', ', e.numero, ', CEP: ', e.cep)) AS endereco
        FROM evento e
        LEFT JOIN estabelecimento est ON e.fk_ID_estabelecimento = est.ID_estabelecimento
        WHERE e.nome LIKE ?
        LIMIT 1 OFFSET 1
    `;

    con.query(eventQuery1, [likeTerm], (err, eventResult1) => {
        if (err) {
            console.error("Erro ao buscar o primeiro evento:", err);
            return res.status(500).json({ error: 'Erro ao buscar eventos' });
        }
        con.query(avaliacaoQuery, [likeTerm], (err, avaliacaoResult) => {
            if (err) {
                console.error("Erro ao buscar a avaliação:", err);
                return res.status(500).json({ error: 'Erro ao buscar avaliação' });
            }
            con.query(eventQuery2, [likeTerm], (err, eventResult2) => {
                if (err) {
                    console.error("Erro ao buscar o segundo evento:", err);
                    return res.status(500).json({ error: 'Erro ao buscar eventos' });
                }
                return res.status(200).json({
                    evento1: eventResult1[0] || null,
                    avaliacao: avaliacaoResult[0] || null,
                    evento2: eventResult2[0] || null
                });
            });
        });
    });
});


// Endpoint para filtros avançados que mostra eventos e estabelecimentos quando "Todos" é selecionado
app.get('/api/filtros/avancado', (req, res) => {
    const searchTerm = req.query.q || '';
    const categoria = req.query.categoria || 'Todos';
    const avaliacao = req.query.avaliacao || 'Qualquer';
    const ordenacao = req.query.ordenacao || 'Relevância';

    const likeTerm = searchTerm ? `%${searchTerm}%` : '%'; // Se vazio, busca tudo

    // Extrair valor numérico da avaliação
    let avaliacaoMinima = 0;
    if (avaliacao.includes('1+')) avaliacaoMinima = 1;
    if (avaliacao.includes('2+')) avaliacaoMinima = 2;
    if (avaliacao.includes('3+')) avaliacaoMinima = 3;
    if (avaliacao.includes('4+')) avaliacaoMinima = 4;

    let queries = [];
    let results = { eventos: [], avaliacoes: [] };

    // Agora, eventos aparecem tanto em "Evento" quanto em "Todos"
    if (categoria === 'Todos' || categoria === 'Evento') {
        // Consulta de eventos
        let eventosQuery = `
            SELECT e.ID_evento, e.nome, DATE_FORMAT(e.data, '%d/%m/%Y') as data, e.hora,
                IF(e.cep IS NULL OR e.cep = '', est.nome, 
                    CONCAT(e.rua, ', ', e.bairro, ', ', e.numero, IF(e.cep IS NULL OR e.cep = '', '', CONCAT(', CEP: ', e.cep)))) AS endereco,
                'evento' AS tipo
            FROM evento e
            LEFT JOIN estabelecimento est ON e.fk_ID_estabelecimento = est.ID_estabelecimento
            WHERE e.nome LIKE ? 
               OR e.data LIKE ?
               OR e.hora LIKE ?
               OR e.cep LIKE ?
               OR e.rua LIKE ?
               OR e.bairro LIKE ?
               OR est.nome LIKE ?
        `;

        // Ordenação de eventos
        if (ordenacao === 'Mais recentes') {
            eventosQuery += ' ORDER BY e.data DESC, e.hora DESC';
        } else { // Relevância ou outra opção
            eventosQuery += ' ORDER BY e.data ASC, e.hora ASC';
        }

        queries.push(new Promise((resolve, reject) => {
            // Repete o mesmo parâmetro para cada condição OR
            con.query(eventosQuery, [likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm], (err, eventResult) => {
                if (err) {
                    console.error("Erro ao buscar eventos:", err);
                    reject(err);
                } else {
                    results.eventos = eventResult || [];
                    resolve();
                }
            });
        }));
    }

    // Estabelecimentos aparecem na categoria 'Todos' ou 'Estabelecimento'
    if (categoria === 'Todos' || categoria === 'Estabelecimento') {
        // Consulta de avaliações
        let avaliacoesQuery = `
            SELECT 
                e.ID_estabelecimento, 
                e.nome AS estabelecimento_nome, 
                a.ID_rating,
                a.avaliacao, 
                a.comentario, 
                'avaliacao' AS tipo
            FROM estabelecimento e 
            JOIN avaliacao a ON e.ID_estabelecimento = a.fk_ID_estabelecimento 
            WHERE e.nome LIKE ?
               OR a.comentario LIKE ?
        `;

        // Filtro de avaliação mínima
        if (avaliacaoMinima > 0) {
            avaliacoesQuery += ` AND a.avaliacao >= ${avaliacaoMinima}`;
        }

        // Ordenação de estabelecimentos
        if (ordenacao === 'Melhor avaliados') {
            avaliacoesQuery += ' ORDER BY a.avaliacao DESC';
        } else if (ordenacao === 'Mais recentes') {
            avaliacoesQuery += ' ORDER BY a.ID_rating DESC';
        } else { // Relevância ou outra opção
            avaliacoesQuery += ' ORDER BY e.nome ASC';
        }

        queries.push(new Promise((resolve, reject) => {
            con.query(avaliacoesQuery, [likeTerm, likeTerm], (err, avaliacaoResult) => {
                if (err) {
                    console.error("Erro ao buscar avaliações:", err);
                    reject(err);
                } else {
                    results.avaliacoes = avaliacaoResult || [];
                    resolve();
                }
            });
        }));
    }

    // Executar todas as consultas e retornar os resultados
    Promise.all(queries)
        .then(() => {
            return res.status(200).json(results);
        })
        .catch(err => {
            return res.status(500).json({ error: 'Erro ao buscar resultados', details: err.message });
        });
});

// Endpoint para buscar um estabelecimento específico por ID
app.get('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'SELECT * FROM estabelecimento WHERE ID_estabelecimento = ?';

    con.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar estabelecimento:', err);
            return res.status(500).json({ message: 'Erro ao buscar estabelecimento.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        res.json(results[0]);
    });
});

// Modificar o endpoint para atualizar estabelecimento para aceitar FormData com foto
app.put('/api/estabelecimentos/edit/:id', upload.single('foto'), (req, res) => {
    const id = req.params.id;
    const { nome, cnpj, cep, rua, bairro, numero } = req.body;

    if (!nome) {
        return res.status(400).json({ message: 'O campo nome é obrigatório.' });
    }

    // Preparar campos para atualização
    let campos = ['nome = ?', 'cnpj = ?', 'cep = ?', 'rua = ?', 'bairro = ?', 'numero = ?'];
    let valores = [nome, cnpj, cep, rua, bairro, numero];

    // Adicionar foto se tiver sido enviada
    if (req.file) {
        try {
            const fotoHex = req.file.buffer.toString('hex');
            campos.push('foto = UNHEX(?)');
            valores.push(fotoHex);
        } catch (error) {
            console.error("Erro ao converter a foto:", error);
            return res.status(400).json({ message: 'Foto inválida.' });
        }
    }

    // Finalizar a query SQL
    const sql = `UPDATE estabelecimento SET ${campos.join(', ')} WHERE ID_estabelecimento = ?`;
    valores.push(id);

    con.query(sql, valores, (err, result) => {
        if (err) {
            console.error('Erro ao atualizar:', err);
            return res.status(500).json({ message: 'Erro ao atualizar o estabelecimento.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
        }

        res.json({ message: 'Estabelecimento atualizado com sucesso.' });
    });
});

// Excluir estabelecimento (DELETE)
app.delete('/api/estabelecimentos/:id', (req, res) => {
    const id = req.params.id;

    // Primeiro, verificar se existem avaliações relacionadas
    const checkAvaliacoes = 'SELECT COUNT(*) AS total FROM avaliacao WHERE fk_ID_estabelecimento = ?';

    con.query(checkAvaliacoes, [id], (err, results) => {
        if (err) {
            console.error('Erro ao verificar avaliações:', err);
            return res.status(500).json({ message: 'Erro ao verificar relações do estabelecimento.' });
        }

        const hasAvaliacoes = results[0].total > 0;

        if (hasAvaliacoes) {
            // Se existem avaliações, excluí-las primeiro
            const deleteAvaliacoes = 'DELETE FROM avaliacao WHERE fk_ID_estabelecimento = ?';

            con.query(deleteAvaliacoes, [id], (err) => {
                if (err) {
                    console.error('Erro ao excluir avaliações:', err);
                    return res.status(500).json({ message: 'Erro ao excluir avaliações relacionadas.' });
                }

                // Após excluir as avaliações, excluir o estabelecimento
                excluirEstabelecimento();
            });
        } else {
            // Se não existem avaliações, excluir diretamente o estabelecimento
            excluirEstabelecimento();
        }
    });

    // Função para excluir o estabelecimento após lidar com as dependências
    function excluirEstabelecimento() {
        // Verificar e atualizar eventos relacionados
        const checkEventos = 'SELECT ID_evento FROM evento WHERE fk_ID_estabelecimento = ?';

        con.query(checkEventos, [id], (err, eventosResults) => {
            if (err) {
                console.error('Erro ao verificar eventos:', err);
                return res.status(500).json({ message: 'Erro ao verificar eventos relacionados.' });
            }

            if (eventosResults.length > 0) {
                // Se existem eventos, definir FK como NULL (desassociar)
                const updateEventos = 'UPDATE evento SET fk_ID_estabelecimento = NULL WHERE fk_ID_estabelecimento = ?';

                con.query(updateEventos, [id], (err) => {
                    if (err) {
                        console.error('Erro ao atualizar eventos:', err);
                        return res.status(500).json({ message: 'Erro ao atualizar eventos relacionados.' });
                    }

                    // Após desassociar eventos, excluir o estabelecimento
                    finalizarExclusao();
                });
            } else {
                // Se não existem eventos, excluir diretamente
                finalizarExclusao();
            }
        });
    }

    // Função final para excluir o estabelecimento
    function finalizarExclusao() {
        const deleteEstabelecimento = 'DELETE FROM estabelecimento WHERE ID_estabelecimento = ?';

        con.query(deleteEstabelecimento, [id], (err, result) => {
            if (err) {
                console.error('Erro ao excluir estabelecimento:', err);
                return res.status(500).json({ message: 'Erro ao excluir o estabelecimento.' });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Estabelecimento não encontrado.' });
            }

            res.json({ message: 'Estabelecimento excluído com sucesso.' });
        });
    }
});

// Endpoint para buscar todos os estabelecimentos ativos
app.get('/api/estabelecimentos/ativos', (req, res) => {
    const sql = 'SELECT * FROM estabelecimento WHERE 1 ORDER BY nome';

    con.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar estabelecimentos:', err);
            return res.status(500).json({ message: 'Erro ao buscar estabelecimentos.' });
        }

        res.json(results);
    });
});

//iniciando o servidor
const port = 3001;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});