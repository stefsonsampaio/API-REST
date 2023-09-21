const pool = require('../conexao.js')

const listaTransacoes = async (req, res) => {
    const { id } = req.usuario

    const { filtro } = req.query

    try {
        if (filtro && Array.isArray(filtro)) {
            const queryFiltraCategoria = await pool.query(
                `select transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id, transacoes.categoria_id, categorias.descricao as categoria_nome from transacoes inner join categorias on categorias.id = transacoes.categoria_id inner join usuarios on usuarios.id = transacoes.usuario_id where usuarios.id = $1 and categorias.descricao = any($2::text[])`,
                [id, filtro]
            )

            if (queryFiltraCategoria.rowCount < 1) {
                return res.status(404).json("O filtro não corresponde a nenhuma transação.")
            }

            return res.status(200).json(queryFiltraCategoria.rows)
        }

        const { rows, rowCount } = await pool.query(
            'select transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id, transacoes.categoria_id, categorias.descricao as categoria_nome from transacoes inner join categorias on categorias.id = transacoes.categoria_id inner join usuarios on usuarios.id = transacoes.usuario_id where usuarios.id = $1',
            [id]
        )

        if (rowCount < 1) {
            return res.status(404).json({mensagem: 'Nenhuma transação encontrada.'})
        }

        return res.status(200).json(rows)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const buscaTransacao = async (req, res) => {
    const { id } = req.usuario

    const params = req.params

    try {
        const { rows, rowCount } = await pool.query(
            'select transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id, transacoes.categoria_id, categorias.descricao as categoria_nome from transacoes inner join categorias on categorias.id = transacoes.categoria_id inner join usuarios on usuarios.id = transacoes.usuario_id where usuarios.id = $1 and transacoes.id = $2',
            [id, params.id]
        )

        if (rowCount < 1) {
            return res.status(404).json({mensagem: 'Transação não encontrada.'})
        }

        return res.status(200).json(rows)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const cadastraTransacao = async (req, res) => {
    const { id } = req.usuario

    const { descricao, valor, categoria_id, tipo } = req.body

    if (!descricao) {
        return res.status(400).json({mensagem: "Descrição não informada."})
    }
    if (!valor) {
        return res.stauts(400).json({mensagem: "Valor não informado."})
    }
    if (!categoria_id) {
        return res.stauts(400).json({mensagem: "Categoria não informado."})
    }
    if (!tipo) {
        return res.stauts(400).json({mensagem: "Tipo não informado."})
    }

    try {
        const categoria = await pool.query(
            'select descricao from categorias where id = $1',
            [categoria_id]
        )
    
        if (categoria.rowCount < 1) {
            return res.status(404).json({mensagem: "A categoria informada não existe."})
        }

        const transacao = await pool.query(
            'insert into transacoes (descricao, valor, categoria_id, tipo, usuario_id) values ($1, $2, $3, $4, $5) returning *',
            [descricao, valor, categoria_id, tipo, id]
        )
    
        if (transacao.rowCount < 1) {
            return res.status(400).json({mensagem: "Não foi possível adicionar a transação."})
        }

        const { rows } = await pool.query(
            'select transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id, transacoes.categoria_id, categorias.descricao as categoria_nome from transacoes inner join categorias on categorias.id = transacoes.categoria_id where transacoes.id = $1',
            [transacao.rows[0].id]
        )
    
        return res.status(200).json(rows[0])
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const alteraTransacao = async (req, res) => {
    const { id } = req.usuario

    const params = req.params

    const { descricao, valor, data, categoria_id, tipo } = req.body

    if (!descricao) {
        return res.status(400).json({mensagem: "Descrição não informada."})
    }
    if (!valor) {
        return res.stauts(400).json({mensagem: "Valor não informado."})
    }
    if (!categoria_id) {
        return res.stauts(400).json({mensagem: "Categoria não informado."})
    }
    if (!tipo) {
        return res.stauts(400).json({mensagem: "Tipo não informado."})
    }

    if (tipo != 'entrada' && tipo != 'saida') {
        return res.status(400).json({mensagem: "O 'tipo' informado não é válido."})
    }

    try {
        const existeCategoria = await pool.query(
            'select * from categorias where id = $1',
            [categoria_id]
        )

        if (existeCategoria.rowCount < 1) {
            return res.status(404).json({mensagem: "A categoria informada não existe."})
        }

        const existeTransacao = await pool.query(
            'select * from transacoes where id = $1',
            [id]
        )

        if (existeTransacao.rowCount < 1) {
            return res.status(404).json({mensagem: 'Não existe transação com o ID informado.'})
        }

        if (existeTransacao.rows[0].usuario_id != id) {
            return res.status(404).json({mensagem: 'Seu usuário não tem transação com o ID informado.'})
        }

        const ataualizaTransacao = await pool.query(
            'update transacoes set descricao = $1, valor = $2, data = $3, categoria_id = $4, tipo = $5 where id = $6',
            [descricao, valor, data, categoria_id, tipo, id]
        )

        if (ataualizaTransacao.rowCount < 1) {
            return res.status(403).json({mensagem: "Não foi possível alterar a transação."})
        }

        const { rows, rowCount } = await pool.query(
            'select transacoes.id, transacoes.tipo, transacoes.descricao, transacoes.valor, transacoes.data, transacoes.usuario_id, transacoes.categoria_id, categorias.descricao as categoria_nome from transacoes inner join categorias on categorias.id = transacoes.categoria_id where transacoes.id = $1',
            [params.id]
        )

        return res.status(201).json(rows[0])
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const deletaTransacao = async (req, res) => {
    const { id } = req.usuario

    const transacaoAlvo = req.params

    try {
        const existeTransacao = await pool.query(
            'select * from transacoes where id = $1',
            [transacaoAlvo.id]
        )


        if (existeTransacao.rows[0].usuario_id != id) {
            return res.status(403).json({mensagem: "Você não tem permissão de acesso a essa transação."})
        }

        await pool.query(
            'delete from transacoes where id = $1 returning *',
            [transacaoAlvo.id]
        )

        return res.status(200).json({mensagem: "Transação deletada com sucesso."})
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

const obtemExtrato = async (req, res) => {
    const { id } = req.usuario
    let extrato = {
        "entrada": 0,
        "saida": 0
    }

    try {
        const response = await pool.query(
            'select * from transacoes where usuario_id = $1',
            [id]
        )

        response.rows.forEach((row) => {
            if (row.tipo == "entrada") {
                extrato.entrada += Number(row.valor)
            } else if (row.tipo == "saida") {
                extrato.saida += Number(row.valor)
            }
        })

        return res.status(200).json(extrato)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

module.exports = {
    listaTransacoes,
    cadastraTransacao,
    buscaTransacao,
    alteraTransacao,
    deletaTransacao,
    obtemExtrato
}