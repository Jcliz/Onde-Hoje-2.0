DROP DATABASE IF EXISTS ondehoje2;

CREATE DATABASE ondehoje2;

USE ondehoje2;

SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

CREATE TABLE usuario (
  ID_usuario INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  nick VARCHAR(50) NOT NULL UNIQUE,
  DT_nascimento DATE NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  cep VARCHAR(9) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  complemento VARCHAR(25) NOT NULL,
  genero ENUM('Masculino', 'Feminino', 'Outro') DEFAULT 'Outro' NOT NULL,
  telefone VARCHAR(16) UNIQUE,
  foto MEDIUMBLOB,
  role VARCHAR(4) NOT NULL DEFAULT 'user'
);

INSERT INTO
  usuario (
    nome,
    nick,
    DT_nascimento,
    email,
    senha,
    cpf,
    cep,
    numero,
    complemento,
    genero,
    telefone,
    foto,
    role
  )
VALUES
  (
    'João Silva',
    'joaozinho',
    '1990-05-15',
    'joao.silva@example.com',
    MD5('senha123'),
    '12345678901',
    '80620070',
    '520',
    'Ap 52A',
    'Masculino',
    '41999998888',
    '',
    'adm'
  ),
  (
    'Maria Oliveira',
    'mariaaa23',
    '1985-08-22',
    'maria.oliveira@example.com',
    MD5('senha456'),
    '98765432100',
    '87654321',
    '62',
    'Casa',
    'Feminino',
    '41988887777',
    '',
    'user'
  ),
  (
    'Carlos Pereira',
    'carlos',
    '1992-11-30',
    'carlos.pereira@example.com',
    MD5('senha789'),
    '45678912300',
    '56789012',
    '511',
    'Sobrado',
    'Masculino',
    '41977776666',
    '',
    'user'
  );

CREATE TABLE estabelecimento (
  ID_estabelecimento INT PRIMARY KEY NOT NULL AUTO_INCREMENT UNIQUE,
  nome VARCHAR(50) NOT NULL UNIQUE,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  cep VARCHAR(9) NOT NULL, 
  rua VARCHAR(60) NOT NULL,
  bairro VARCHAR(60) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  foto MEDIUMBLOB
);

INSERT INTO
  estabelecimento (nome, cnpj, cep, rua, bairro, numero)
VALUES
  (
    'Bar do Mário',
    '89.948.562/0001-75',
    '13484-015',
    'Rua das Flores',
    'Centro',
    '123'
  ),
  (
    'Cervejaria do Centro',
    '47.776.980/0001-82',
    '17240-009',
    'Avenida Brasil',
    'Jardim América',
    '456'
  ),
  (
    'Boteco do Zé',
    '39.370.395/0001-50',
    '69550-089',
    'Rua das Palmeiras',
    'Vila Nova',
    '789'
  ),
  (
    'Happy Hour Lounge',
    '71.403.961/0001-95',
    '75830-112',
    'Rua 7 de Setembro',
    'Centro',
    '101'
  ),
  (
    'Muvuca Fest',
    '56.366.838/0001-58',
    '80010-000',
    'Avenida Central',
    'Parque Industrial',
    '707'
  );

CREATE TABLE avaliacao (
  ID_rating INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  avaliacao INT NOT NULL,
  comentario TEXT,
  fk_ID_usuario INT NOT NULL,
  fk_ID_estabelecimento INT NOT NULL,
  FOREIGN KEY (fk_ID_usuario) REFERENCES usuario(ID_usuario),
  FOREIGN KEY (fk_ID_estabelecimento) REFERENCES estabelecimento(ID_estabelecimento)
);

INSERT INTO
  avaliacao (
    avaliacao,
    comentario,
    fk_ID_usuario,
    fk_ID_estabelecimento
  )
VALUES
  (
    5,
    'Ótimas caipirinhas e petiscos saborosos em um ambiente acolhedor. Perfeito para um happy hour!',
    1,
    1
  ),
  (
    4,
    'Excelente seleção de cervejas artesanais e pratos deliciosos. Ideal para os amantes de boa bebida!',
    1,
    2
  ),
  (
    3,
    'Vista incrível do mar e coquetéis refrescantes. Um ótimo lugar para relaxar ao pôr do sol!',
    3,
    3
  ),
  (
    5,
    'Ambiente descontraído e preços justos. As porções generosas são perfeitas para compartilhar com os amigos!',
    2,
    4
  ),
  (
    4,
    'Drinks criativos e música ao vivo em um espaço moderno. O lugar ideal para uma noite animada!',
    2,
    5
  );

CREATE TABLE evento (
  ID_evento INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  data DATE NOT NULL,
  hora TIME NOT NULL,
  cep VARCHAR(9), 
  rua VARCHAR(60),
  bairro VARCHAR(60),
  numero VARCHAR(10),
  foto MEDIUMBLOB,
  fk_ID_estabelecimento INT,
  FOREIGN KEY (fk_ID_estabelecimento) REFERENCES estabelecimento(ID_estabelecimento)
);

INSERT INTO
  evento (nome, data, hora, fk_ID_estabelecimento)
VALUES
  ('Bar do Mário', '2025-05-30', '20:00', 1),
  ('Cervejaria do Centro', '2025-05-30', '20:00', 2),
  ('Boteco do Zé', '2025-05-30', '20:00', 3),
  ('Happy Hour Lounge', '2025-05-30', '20:00', 4),
  ('Muvuca Fest', '2025-05-30', '20:00', 5);

COMMIT;