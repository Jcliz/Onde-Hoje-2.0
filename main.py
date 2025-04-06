import pymysql
import base64

from mangum import Mangum
from fastapi import FastAPI, Request, Form, Depends, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware
from datetime import date, datetime

app = FastAPI()

# Configuração de sessão (chave secreta para cookies de sessão)
app.add_middleware(SessionMiddleware, secret_key="ondehoje")

# Configuração de arquivos estáticos
app.mount("/static", StaticFiles(directory="src/static"), name="static")
app.mount("/public", StaticFiles(directory="/public"), name="public")
app.mount("/components", StaticFiles(directory="/components"), name="components")

templates = Jinja2Templates(directory="src/pages")

# Configuração do banco de dados
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",
    "database": "ondehoje2"
}

# Função para obter conexão com MySQL
def get_db():
    return pymysql.connect(**DB_CONFIG)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if request.session.get("user_logged_in"):
        return RedirectResponse(url="src/pages/estabelecimentos", status_code=303)

    login_error = request.session.pop("login_error", None)

    return templates.TemplateResponse("telaEntrada.html", {
        "request": request,
        "login_error": login_error,
    })

@app.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    senha: str = Form(...),
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:

            cursor.execute(
                "SELECT * FROM usuario WHERE email = %s AND senha = MD5(%s)", (email, senha))
            user = cursor.fetchone()

            if user:
                request.session["user_logged_in"] = True
                request.session["nome_usuario"] = user[1]
                return RedirectResponse(url="/estabelecimentos", status_code=303)
            else:
                request.session["login_error"] = "Usuário ou senha inválidos."
                return RedirectResponse(url="/", status_code=303)
    finally:
        db.close()


@app.get("/logout")
async def logout(request: Request):
    # Encerra a sessão do usuário e retorna à página inicial.
    request.session.clear()  # remove todos os dados de sessão
    return RedirectResponse(url="/telaEntrada", status_code=303)


@app.post("/cadastro", name="cadastro")
async def cadastrar_usuario(
    request: Request,
    nome: str = Form(...),
    dt_nascimento: date = Form(...),
    email: str = Form(...),
    senha: str = Form(...),
    cpf: str = Form(...),
    cep: str = Form(...),
    complemento: str = Form(...),
    db=Depends(get_db)
):
    try:
        with db.cursor() as cursor:
            cursor.execute(
                "SELECT ID_usuario FROM usuario WHERE login = %s", (login))
            if cursor.fetchone():
                request.session["nao_autenticado"] = True
                request.session["mensagem"] = "Erro: Este login já está em uso!"
                return RedirectResponse(url="/", status_code=303)

            sql = "INSERT INTO Usuario (nome, DT_nascimento, email, senha, cpf, cep, complemento, telefone) " \
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s MD5(%s))"
            cursor.execute(sql, (nome, dt_nascimento, email, senha, cpf, cep, complemento))
            db.commit()

            request.session["nao_autenticado"] = True
            request.session["mensagem"] = "Registro cadastrado com sucesso! Você já pode realizar login."
            return RedirectResponse(url="/login", status_code=303)

    except Exception as e:
        request.session["nao_autenticado"] = True
        request.session["mensagem"] = f"Erro ao cadastrar: {str(e)}"
        return RedirectResponse(url="/", status_code=303)

    finally:
        db.close()

@app.get("/estabelecimentos", name="estabelecimentos", response_class=HTMLResponse)
async def listar_estabelecimentos(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/login", status_code=303)

    with db.cursor(pymysql.cursors.DictCursor) as cursor:
        sql = """
            SELECT nome, endereco FROM evento
        """
        cursor.execute(sql)
        eventos = cursor.fetchall()  # lista de dicts com dados dos estabelecimentos

    hoje = date.today()

    #TO-DO
    #adicionar bloco de comando abaixo para estabelecimentos 
    #criar coluna para foto no bd
    #criar tabela de estabelecimentos
    for event in eventos:
         # Converter foto blob para base64 (se houver)
        if event["foto"]:
            event["Foto_base64"] = base64.b64encode(event["foto"]).decode('utf-8')
        else:
            event["Foto_base64"] = None

    nome_usuario = request.session.get("nome_usuario", None)
    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    # Renderiza o template 'medListar.html' com os dados dos médicos
    #TO-DO
    #arrumar este return após a tabela ser criada
    return templates.TemplateResponse("estabelecimentos.html", {
        "request": request,
        "medicos": medicos,
        "hoje": agora,
        "nome_usuario": nome_usuario
    })


@app.get("/medIncluir", response_class=HTMLResponse)
async def medIncluir(request: Request, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)

    # Obter especialidades do banco para o combo
    with db.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("SELECT ID_Espec, Nome_Espec FROM Especialidade")
        especialidades = cursor.fetchall()
    db.close()

    # Dados para o template (incluindo data/hora e nome do usuário)
    nome_usuario = request.session.get("nome_usuario", None)
    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    return templates.TemplateResponse("medIncluir.html", {
        "request": request,
        "especialidades": especialidades,
        "hoje": agora,
        "nome_usuario": nome_usuario
    })


@app.post("/medIncluir_exe")
async def medIncluir_exe(
    request: Request,
    Nome: str = Form(...),
    CRM: str = Form(...),
    Especialidade: str = Form(...),
    DataNasc: str = Form(None),
    Imagem: UploadFile = File(None),
    db=Depends(get_db)
):
    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)

    foto_bytes = None
    if Imagem and Imagem.filename:
        foto_bytes = await Imagem.read()

    try:
        with db.cursor() as cursor:
            sql = """INSERT INTO Medico (Nome, CRM, ID_Espec, Dt_Nasc, Foto)
                     VALUES (%s, %s, %s, %s, %s)"""
            cursor.execute(
                sql, (Nome, CRM, Especialidade, DataNasc, foto_bytes))
            db.commit()

        request.session["mensagem_header"] = "Inclusão de Novo Médico"
        request.session["mensagem"] = "Registro cadastrado com sucesso!"
    except Exception as e:
        request.session["mensagem_header"] = "Erro ao cadastrar"
        request.session["mensagem"] = str(e)
    finally:
        db.close()

    agora = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    nome_usuario = request.session.get("nome_usuario", None)

    return templates.TemplateResponse("medIncluir_exe.html", {
        "request": request,
        "mensagem_header": request.session.get("mensagem_header", ""),
        "mensagem": request.session.get("mensagem", ""),
        "hoje": agora,
        "nome_usuario": nome_usuario
    })


@app.get("/medExcluir", response_class=HTMLResponse)
async def med_excluir(request: Request, id: int, db=Depends(get_db)):

    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)

    with db.cursor(pymysql.cursors.DictCursor) as cursor:
        sql = ("SELECT M.ID_Medico, M.Nome, M.CRM, M.Dt_Nasc, E.Nome_Espec "
               "FROM Medico M JOIN Especialidade E ON M.ID_Espec = E.ID_Espec "
               "WHERE M.ID_Medico = %s")
        cursor.execute(sql, (id,))
        medico = cursor.fetchone()
    db.close()

    # Formatar data (YYYY-MM-DD para dd/mm/aaaa)
    data_nasc = medico["Dt_Nasc"]
    if isinstance(data_nasc, str):
        ano, mes, dia = data_nasc.split("-")
    else:
        ano, mes, dia = data_nasc.year, f"{data_nasc.month:02d}", f"{data_nasc.day:02d}"
    data_formatada = f"{dia}/{mes}/{ano}"

    hoje = datetime.now().strftime("%d/%m/%Y %H:%M")
    nome_usuario = request.session.get("nome_usuario", None)

    return templates.TemplateResponse("medExcluir.html", {
        "request": request,
        "med": medico,
        "data_formatada": data_formatada,
        "hoje": hoje,
        "nome_usuario": nome_usuario
    })


@app.post("/medExcluir_exe")
async def med_excluir_exe(request: Request, id: int = Form(...), db=Depends(get_db)):

    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)

    try:
        with db.cursor(pymysql.cursors.DictCursor) as cursor:

            sql_delete = "DELETE FROM Medico WHERE ID_Medico = %s"
            cursor.execute(sql_delete, (id,))
            db.commit()

            request.session["mensagem_header"] = "Exclusão de Médico"
            request.session["mensagem"] = f"Médico excluído com sucesso."

    except Exception as e:
        request.session["mensagem_header"] = "Erro ao excluir"
        request.session["mensagem"] = str(e)
    finally:
        db.close()

    # Redireciona para a página de resultado da exclusão
    return templates.TemplateResponse("medExcluir_exe.html", {
        "request": request,
        "mensagem_header": request.session.get("mensagem_header", ""),
        "mensagem": request.session.get("mensagem", ""),
        "hoje": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "nome_usuario": request.session.get("nome_usuario", None)
    })


@app.get("/medAtualizar", response_class=HTMLResponse)
async def med_atualizar(request: Request, id: int, db=Depends(get_db)):
    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)
    with db.cursor(pymysql.cursors.DictCursor) as cursor:
        cursor.execute("SELECT * FROM Medico WHERE ID_Medico = %s", (id,))
        medico = cursor.fetchone()
        cursor.execute("SELECT ID_Espec, Nome_Espec FROM Especialidade")
        especialidades = cursor.fetchall()
    db.close()

    hoje = datetime.now().strftime("%d/%m/%Y %H:%M")

    return templates.TemplateResponse("medAtualizar.html", {
        "request": request,
        "med": medico,
        "especialidades": especialidades,
        "hoje": hoje
    })


@app.post("/medAtualizar_exe")
async def med_atualizar_exe(
    request: Request,
    id: int = Form(...),
    Nome: str = Form(...),
    CRM: str = Form(...),
    Especialidade: str = Form(...),
    DataNasc: str = Form(None),
    Imagem: UploadFile = File(None),
    db=Depends(get_db)
):
    if not request.session.get("user_logged_in"):
        return RedirectResponse(url="/", status_code=303)

    foto_bytes = None
    if Imagem and Imagem.filename:
        foto_bytes = await Imagem.read()

    try:
        with db.cursor() as cursor:
            if foto_bytes:
                sql = """UPDATE Medico 
                         SET Nome=%s, CRM=%s, Dt_Nasc=%s, ID_Espec=%s, Foto=%s
                         WHERE ID_Medico=%s"""
                cursor.execute(sql, (Nome, CRM, DataNasc,
                               Especialidade, foto_bytes, id))
            else:
                sql = """UPDATE Medico 
                         SET Nome=%s, CRM=%s, Dt_Nasc=%s, ID_Espec=%s
                         WHERE ID_Medico=%s"""
                cursor.execute(sql, (Nome, CRM, DataNasc, Especialidade, id))
            db.commit()

        request.session["mensagem_header"] = "Atualização de Médico"
        request.session["mensagem"] = "Registro atualizado com sucesso!"

    except Exception as e:
        request.session["mensagem_header"] = "Erro ao atualizar"
        request.session["mensagem"] = str(e)
    finally:
        db.close()

    return templates.TemplateResponse("medAtualizar_exe.html", {
        "request": request,
        "mensagem_header": request.session.get("mensagem_header", ""),
        "mensagem": request.session.get("mensagem", ""),
        "hoje": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "nome_usuario": request.session.get("nome_usuario", None)
    })


@app.post("/reset_session")
async def reset_session(request: Request):
    request.session.pop("mensagem_header", None)
    request.session.pop("mensagem", None)
    return {"status": "ok"}

Mangum(app)
