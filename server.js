// 1. IMPORTAÇÃO DE MÓDULOS
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

// 2. CONFIGURAÇÃO INICIAL
const app = express();
const PORT = 4000;
const DB_NAME = 'mdf_store';
const MONGO_URI = `mongodb://localhost:27017/${DB_NAME}`;

// 3. MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware de Content Security Policy (CSP) para permitir recursos externos
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' https://cdn.tailwindcss.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "connect-src 'self' http://localhost:4000;"
    );
    next();
});

// 4. CONFIGURAÇÃO DO UPLOAD DE IMAGENS (MULTER)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 5. CONEXÃO COM O BANCO DE DADOS MONGODB
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log(`Conectado com sucesso ao banco de dados: ${DB_NAME}`);
        app.listen(PORT, () => {
            console.log(`Servidor do Sistema Gestor rodando em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Erro ao conectar ao MongoDB:', err.message);
        process.exit(1);
    });

// 6. DEFINIÇÃO DOS MODELOS DE DADOS (SCHEMAS)

// Schema para Marcas (dinâmico)
const marcaSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    codigo: { type: String, required: true, unique: true }
});
const Marca = mongoose.model('Marca', marcaSchema);

// Schema para Linhas (dinâmico)
const linhaSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true },
    codigo: { type: String, required: true, unique: true }
});
const Linha = mongoose.model('Linha', linhaSchema);

// Schema para Espessuras (com origem do preço)
const espessuraSchema = new mongoose.Schema({
    ref_interna: { type: String, required: true, unique: true },
    espessura: { type: Number, required: true },
    valor_marcenaria: { type: Number, default: 0 },
    valor_balcao: { type: Number, default: 0 },
    preco_origem: { type: String, enum: ['manual', 'ia'], default: 'manual' }
}, { _id: false });

const chapaSchema = new mongoose.Schema({
    marca: { type: String, required: true },
    nome: { type: String, required: true },
    linha: { type: String },
    textura: { type: String },
    acabamento: { type: String },
    dimensao_padrao: { type: String },
    descricao: { type: String },
    combinacoes: { type: String },
    preco_fita_65mm_rolo: { type: Number, default: 0 },
    metragem_rolo_fita: { type: Number, default: 0 },
    url_imagem: { type: String },
    espessuras: [espessuraSchema]
}, { timestamps: true });

const Chapa = mongoose.model('Chapa', chapaSchema, 'chapas');

// 7. LÓGICA PARA GERAR REFERÊNCIA INTERNA (dinâmica)
const codigosEspessura = { '3': '0', '6': '1', '9': '2', '12': '3', '15': '4', '18': '5', '25': '6' };
async function gerarRefInterna(marcaNome, espessura, linhaNome, nomeChapa) {
    const marca = await Marca.findOne({ nome: marcaNome });
    const linha = await Linha.findOne({ nome: linhaNome });
    const M = marca ? marca.codigo : 'X';
    const E = codigosEspessura[espessura] || 'X';
    const LL = linha ? linha.codigo : '99';
    const ABC = nomeChapa.substring(0, 3).toUpperCase();
    return `${M}.${E}.${LL}-${ABC}`;
}

// 8. DEFINIÇÃO DAS ROTAS DA API
// [C]REATE - Cadastrar uma nova chapa
app.post('/api/chapas', upload.single('imagem'), async (req, res) => {
    try {
        const dados = req.body;
        if (!dados.espessuras || dados.espessuras.length === 0) {
            return res.status(400).json({ message: 'É obrigatório cadastrar ao menos uma espessura.' });
        }
        const espessurasProcessadas = [];
        for (const esp of dados.espessuras) {
            espessurasProcessadas.push({
                ...esp,
                ref_interna: await gerarRefInterna(dados.marca, esp.espessura, dados.linha, dados.nome)
            });
        }
        const novaChapa = new Chapa({
            ...dados,
            espessuras: espessurasProcessadas,
            url_imagem: req.file ? `/uploads/${req.file.filename}` : null
        });
        const chapaSalva = await novaChapa.save();
        res.status(201).json(chapaSalva);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao cadastrar chapa', error: error.message });
    }
});

app.get('/api/chapas', async (req, res) => {
    try {
        const filtro = {};
        if (req.query.marca) {
            filtro.marca = req.query.marca;
        }
        const chapas = await Chapa.find(filtro).sort({ nome: 1 });
        res.status(200).json(chapas);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chapas', error: error.message });
    }
});

// [U]PDATE - Atualizar uma chapa
app.put('/api/chapas/:id', upload.single('imagem'), async (req, res) => {
    try {
        const { id } = req.params;
        const dadosAtualizados = req.body;
        if (req.file) {
            dadosAtualizados.url_imagem = `/uploads/${req.file.filename}`;
        }
        if (dadosAtualizados.espessuras) {
            const espessurasAtualizadas = [];
            for (const esp of dadosAtualizados.espessuras) {
                espessurasAtualizadas.push({
                    ...esp,
                    ref_interna: await gerarRefInterna(dadosAtualizados.marca, esp.espessura, dadosAtualizados.linha, dadosAtualizados.nome)
                });
            }
            dadosAtualizados.espessuras = espessurasAtualizadas;
        }
        const chapa = await Chapa.findByIdAndUpdate(id, dadosAtualizados, { new: true });
        if (!chapa) {
            return res.status(404).json({ message: 'Chapa não encontrada.' });
        }
        res.status(200).json(chapa);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao atualizar chapa', error: error.message });
    }
});

// [D]ELETE - Excluir uma chapa ou espessura
app.delete('/api/chapas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { refEspessura } = req.query;
        if (refEspessura) {
            const resultado = await Chapa.updateOne(
                { _id: id },
                { $pull: { espessuras: { ref_interna: refEspessura } } }
            );
            if (resultado.modifiedCount === 0) {
                return res.status(404).json({ message: 'Espessura não encontrada.' });
            }
            res.status(200).json({ message: 'Espessura removida com sucesso.' });
        } else {
            const chapa = await Chapa.findByIdAndDelete(id);
            if (!chapa) {
                return res.status(404).json({ message: 'Chapa não encontrada.' });
            }
            res.status(200).json({ message: 'Chapa excluída com sucesso.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir', error: error.message });
    }
});
// --- NOVAS ROTAS PARA GERENCIAR MARCAS E LINHAS ---

// Listar todas as marcas
app.get('/api/marcas', async (req, res) => {
    const marcas = await Marca.find().sort({ nome: 1 });
    res.json(marcas);
});

// Cadastrar nova marca
app.post('/api/marcas', async (req, res) => {
    try {
        const novaMarca = new Marca(req.body);
        await novaMarca.save();
        res.status(201).json(novaMarca);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar marca.', error: error.message });
    }
});

// Listar todas as linhas
app.get('/api/linhas', async (req, res) => {
    const linhas = await Linha.find().sort({ nome: 1 });
    res.json(linhas);
});

// Cadastrar nova linha
app.post('/api/linhas', async (req, res) => {
    try {
        const novaLinha = new Linha(req.body);
        await novaLinha.save();
        res.status(201).json(novaLinha);
    } catch (error) {
        res.status(400).json({ message: 'Erro ao criar linha.', error: error.message });
    }
});

