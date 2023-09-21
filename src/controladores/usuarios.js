const pool = require('../conexao.js')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const senhaJWT = require('../senhaJWT')

const cadastraUsuario = async (req, res) => {
    const { nome, email, senha } = req.body

    try {
        const emailExistente = await pool.query(
            'select * from usuarios where email = $1',
            [email]
        )
        
        if (emailExistente.rowCount > 0) {
            return res.status(400).json({mensagem: "Já existe usuário cadastrado com o e-mail informado."})
        }
        
        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const { rows, rowCount } = await pool.query(
            'insert into usuarios (nome, email, senha) values ($1, $2, $3) returning *',
            [nome, email, senhaCriptografada]
        )

        if (rowCount < 1) {
            return res.status(400).json({mensagem: 'Falha ao cadastrar novo usuário'})
        }

        return res.status(201).json(rows[0])
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const login = async (req, res) => {
    const { email, senha } = req.body

    try {
        const usuario = await pool.query(
            'select * from usuarios where email = $1',
            [email]
        )

        if (usuario.rowCount < 1) {
            return res.status(404).json({mensagem: "Email ou senha incorreta!"})
        }

        const senhaValida = await bcrypt.compare(senha, usuario.rows[0].senha)

        if (!senhaValida) {
            return res.status(404).json({mensagem: "Email ou senha incorreta!"})
        }

        const token = jwt.sign({ id: usuario.rows[0].id }, senhaJWT, {
            expiresIn: '8h',
        })

        const { senha: _, ...usuarioLogado } = usuario.rows[0]

        return res.status(201).json({ usuario: usuarioLogado, token})
    } catch (error) {
        return res.json(error.message)
    }
}

const obterPerfil = async (req, res) => {
    return res.status(201).json(req.usuario)
}

const alteraUsuario = async (req, res) => {
    const { id } = req.usuario

    const { nome, email, senha } = req.body

    if (!nome) {
        return res.status(400).json({mensagem: "Nome não informado"})
    }
    if (!email) {
        return res.status(400).json({mensagem: "Email não informado"})
    }
    if (!senha) {
        return res.status(400).json({mensagem: "Senha não informado"})
    }

    try {
        const usuario = await pool.query(
            'select * from usuarios where email = $1',
            [email]
        )

        if (usuario.rowCount > 0) {
            return res.status(401).json({ mensagem: "O e-mail informado já está sendo utilizado por outro usuário."})
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10)

        const usuarioAtualizado = await pool.query(
            'update usuarios set nome = $1, email = $2, senha = $3 where id = $4 returning *',
            [nome, email, senhaCriptografada, id]
        )

        if (usuarioAtualizado.rowCount < 1) {
            return res.status(400).json({ mensagem: 'Falha ao atualizar usuário'})
        }

        return res.status(201).json(usuarioAtualizado.rows[0])
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

module.exports = {
    cadastraUsuario,
    login,
    obterPerfil,
    alteraUsuario
}