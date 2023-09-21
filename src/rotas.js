const express = require('express')
const {
    cadastraUsuario,
    login,
    obterPerfil,
    alteraUsuario
} = require('./controladores/usuarios')
const {
    listaCategoria
} = require('./controladores/categorias')
const { 
    cadastraTransacao, 
    listaTransacoes, 
    buscaTransacao,
    alteraTransacao,
    deletaTransacao,
    obtemExtrato
} = require('./controladores/transacoes')
const { verificaUsuarioLogado } = require('./intermediarios/autenticacao')

const rotas = express()

rotas.post("/usuario", cadastraUsuario)
rotas.post("/login", login)

rotas.use(verificaUsuarioLogado)

rotas.get("/usuario", obterPerfil)
rotas.put("/usuario", alteraUsuario)

rotas.get("/categoria", listaCategoria)

rotas.get("/transacao", listaTransacoes)
rotas.get("/transacao/extrato", obtemExtrato)
rotas.get("/transacao/:id", buscaTransacao)
rotas.post("/transacao", cadastraTransacao)
rotas.put("/transacao/:id", alteraTransacao)
rotas.delete("/transacao/:id", deletaTransacao)

module.exports = rotas