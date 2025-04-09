DROP DATABASE IF EXISTS ondehoje2;
CREATE DATABASE ondehoje2;
USE ondehoje2;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE usuario (
  ID_usuario INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  DT_nascimento DATE NOT NULL,
  email VARCHAR(50) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  cep VARCHAR(9) NOT NULL,
  numero VARCHAR(10) NOT NULL,
  complemento VARCHAR(25) NOT NULL,
  genero ENUM('Masculino', 'Feminino', 'Outro') DEFAULT 'Outro',
  telefone VARCHAR(11) UNIQUE,
  foto MEDIUMBLOB,
  role VARCHAR(4) NOT NULL DEFAULT 'user'
);

INSERT INTO usuario (nome, DT_nascimento, email, senha, cpf, cep, complemento, telefone, foto) VALUES
('João Silva', '1990-05-15', 'joao.silva@example.com', 'senha123', '12345678901', '12345678', '520, Ap 52A', '41999998888', ''),
('Maria Oliveira', '1985-08-22', 'maria.oliveira@example.com', 'senha456', '98765432100', '87654321', '62, Casa', '41988887777', ''),
('Carlos Pereira', '1992-11-30', 'carlos.pereira@example.com', 'senha789', '45678912300', '56789012', '511, Sobrado', '41977776666', '');

CREATE TABLE estabelecimento (
  ID_estabelecimento INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  rua VARCHAR(60) NOT NULL,
  bairro VARCHAR(60) NOT NULL,
  numero VARCHAR(10) NOT NULL
);

INSERT INTO estabelecimento (nome, rua, bairro, numero) VALUES
('Bar do Mário', 'Rua das Flores', 'Centro', '123'),
('Cervejaria do Centro', 'Avenida Brasil', 'Jardim América', '456'),
('Boteco do Zé', 'Rua das Palmeiras', 'Vila Nova', '789'),
('Happy Hour Lounge', 'Rua 7 de Setembro', 'Centro', '101'),
('Muvuca Fest', 'Avenida Central', 'Parque Industrial', '707');


CREATE TABLE avaliacao (
  ID_rating INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  avaliacao INT NOT NULL,
  comentario TEXT,
  fk_ID_usuario INT NOT NULL,
  fk_ID_estabelecimento INT NOT NULL,
  FOREIGN KEY (fk_ID_usuario) REFERENCES usuario(ID_usuario),
  FOREIGN KEY (fk_ID_estabelecimento) REFERENCES estabelecimento(ID_estabelecimento)
);

INSERT INTO avaliacao (avaliacao, comentario, fk_ID_usuario, fk_ID_estabelecimento) VALUES 
(5, 'Ótimas caipirinhas e petiscos saborosos em um ambiente acolhedor. Perfeito para um happy hour!', 1, 1),
(4, 'Excelente seleção de cervejas artesanais e pratos deliciosos. Ideal para os amantes de boa bebida!', 1, 2),
(3, 'Vista incrível do mar e coquetéis refrescantes. Um ótimo lugar para relaxar ao pôr do sol!', 3, 3),
(5, 'Ambiente descontraído e preços justos. As porções generosas são perfeitas para compartilhar com os amigos!', 2, 4),
(4, 'Drinks criativos e música ao vivo em um espaço moderno. O lugar ideal para uma noite animada!', 2, 5);

CREATE TABLE evento (
  ID_evento INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  fk_ID_rating INT NOT NULL,
  fk_ID_estabelecimento INT NOT NULL,
  FOREIGN KEY (fk_ID_rating) REFERENCES avaliacao(ID_rating),
  FOREIGN KEY (fk_ID_estabelecimento) REFERENCES estabelecimento(ID_estabelecimento)
);

INSERT INTO evento (nome, fk_ID_rating, fk_ID_estabelecimento) VALUES
('Bar do Mário', 1, 1),
('Cervejaria do Centro', 2, 2),
('Boteco do Zé', 3, 3),
('Happy Hour Lounge', 4, 4),
('Muvuca Fest', 5, 5);

COMMIT;