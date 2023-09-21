const pool = require('../conexao.js')

const listaCategoria = async (req, res) => {
    try {
        const { rows, rowCount } = await pool.query(
            'select * from categorias'
        )

        if (rowCount < 1) {
            return res.status(400).json({mensagem: 'Erro na consulta'})
        }

        return res.status(200).json(rows)
    } catch (error) {
        return res.status(500).json(error.message)
    }
}

module.exports = {
    listaCategoria
}