DROP DATABASE IF EXISTS ondehoje2;
CREATE DATABASE ondehoje2;
USE ondehoje2;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

DROP TABLE IF EXISTS avaliacao;


CREATE TABLE usuario (
  ID_usuario INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  DT_nascimento DATE NOT NULL,
  email VARCHAR(50) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  cep VARCHAR(8) NOT NULL,
  complemento VARCHAR(25),
  telefone VARCHAR(11),
  PRIMARY KEY (ID_usuario)
);

INSERT INTO usuario (nome, DT_nascimento, email, senha, cpf, cep, complemento, telefone) VALUES
('João Silva', '1990-05-15', 'joao.silva@example.com', 'senha123', '12345678901', '12345678', '520, Ap 52A', ''),
('Maria Oliveira', '1985-08-22', 'maria.oliveira@example.com', 'senha456', '98765432100', '87654321', '62, Casa', ''),
('Carlos Pereira', '1992-11-30', 'carlos.pereira@example.com', 'senha789', '45678912300', '56789012', '511, Sobrado', '');

CREATE TABLE avaliacao (
  ID_rating INT NOT NULL AUTO_INCREMENT,
  avaliacao INT NOT NULL,
  comentario TEXT,
  fk_ID_usuario INT NOT NULL,
  PRIMARY KEY (ID_rating)
);

ALTER TABLE avaliacao ADD CONSTRAINT fk_ID_usuario FOREIGN KEY (fk_ID_usuario) REFERENCES avaliacao (ID_rating);

INSERT INTO avaliacao VALUES 
(1,5,'Ótimas caipirinhas e petiscos saborosos em um ambiente acolhedor. Perfeito para um happy hour!', 1),
(2,4,'Excelente seleção de cervejas artesanais e pratos deliciosos. Ideal para os amantes de boa bebida!', 1),
(3,3,'Vista incrível do mar e coquetéis refrescantes. Um ótimo lugar para relaxar ao pôr do sol!', 3),
(4,5,'Ambiente descontraído e preços justos. As porções generosas são perfeitas para compartilhar com os amigos!', 2),
(5,4,'Drinks criativos e música ao vivo em um espaço moderno. O lugar ideal para uma noite animada!', 2);

DROP TABLE IF EXISTS evento;

CREATE TABLE evento (
  ID_evento INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  nome VARCHAR(50) NOT NULL,
  endereco VARCHAR(100) NOT NULL,
  fk_ID_rating INT NOT NULL
);

ALTER TABLE evento ADD CONSTRAINT fk_ID_rating FOREIGN KEY (fk_ID_rating) REFERENCES avaliacao (ID_rating);

INSERT INTO evento VALUES (1,'Bar do Mário','Rua das Flores, 123 - Centro',3),
(2,'Cervejaria do Centro','Avenida Principal, 456 - Centro', 2),
(3,'Boteco do Zé','Rua dos Amigos, 234 - Bairro Alegre', 4),
(4,'Happy Hour Lounge','Rua do Samba, 567 - Bairro das Artes', 1),
(5,'Muvuca Fest','Pedreira Paulo Leminski', 5);

COMMIT;