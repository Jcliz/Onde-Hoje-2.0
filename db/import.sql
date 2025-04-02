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
  numero INT,
  PRIMARY KEY (ID_usuario)
);

CREATE TABLE avaliacao (
  ID_rating INT NOT NULL AUTO_INCREMENT,
  Avaliacao INT NOT NULL,
  Comentario TEXT,
  PRIMARY KEY (ID_rating)
);

INSERT INTO avaliacao VALUES (1,5,'Ótimas caipirinhas e petiscos saborosos em um ambiente acolhedor. Perfeito para um happy hour!'),
(2,4,'Excelente seleção de cervejas artesanais e pratos deliciosos. Ideal para os amantes de boa bebida!'),
(3,3,'Vista incrível do mar e coquetéis refrescantes. Um ótimo lugar para relaxar ao pôr do sol!'),
(4,5,'Ambiente descontraído e preços justos. As porções generosas são perfeitas para compartilhar com os amigos!'),
(5,4,'Drinks criativos e música ao vivo em um espaço moderno. O lugar ideal para uma noite animada!');

DROP TABLE IF EXISTS evento;

CREATE TABLE evento (
  ID_evento INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  Nome VARCHAR(50) NOT NULL,
  Endereco VARCHAR(100) NOT NULL,
  fk_ID_rating INT NOT NULL
);

ALTER TABLE  evento ADD CONSTRAINT fk_ID_rating FOREIGN KEY (fk_ID_rating) REFERENCES avaliacao (ID_rating);

INSERT INTO evento VALUES (1,'Bar do Mário','Rua das Flores, 123 - Centro',3),
(2,'Cervejaria do Centro','Avenida Principal, 456 - Centro', 2),
(3,'Boteco do Zé','Rua dos Amigos, 234 - Bairro Alegre', 4),
(4,'Happy Hour Lounge','Rua do Samba, 567 - Bairro das Artes', 1),
(5,'Muvuca Fest','Pedreira Paulo Leminski', 5);

COMMIT;