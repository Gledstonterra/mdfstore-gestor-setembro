document.addEventListener('DOMContentLoaded', () => {
    // MAPEAMENTO DE ELEMENTOS
    const marcaSelect = document.getElementById('marca-select');
    const formMarcaSelect = document.getElementById('form-marca');
    const listaProdutos = document.getElementById('lista-produtos');
    const feedbackMessage = document.getElementById('feedback-message');
    const form = document.getElementById('gestor-form');
    
    const marcas = ["Arauco", "Berneck", "Duratex", "Eucatex", "Fibraplac", "Greenplac", "Guararapes", "Sudati"];
    
    // PREENCHE OS SELETORES DE MARCA
    marcas.forEach(marca => {
        const m = marca.toLowerCase();
        marcaSelect.add(new Option(marca, m));
        formMarcaSelect.add(new Option(marca, m));
    });

    // FUNÇÃO PARA CARREGAR E EXIBIR OS PRODUTOS
    async function carregarProdutos(marca) {
        listaProdutos.innerHTML = '<p>Carregando...</p>';
        try {
            const response = await fetch(`/api/admin/chapas/${marca}`);
            const produtos = await response.json();

            listaProdutos.innerHTML = '';
            if (produtos.length === 0) {
                listaProdutos.innerHTML = '<p>Nenhum produto cadastrado para esta marca.</p>';
                return;
            }
            const table = document.createElement('table');
            table.className = 'w-full text-sm text-left';
            table.innerHTML = `
                <thead class="bg-slate-100">
                    <tr>
                        <th class="p-2">Nome</th>
                        <th class="p-2">Esp.</th>
                        <th class="p-2">Ref.</th>
                        <th class="p-2">Linha</th>
                        <th class="p-2">Textura</th>
                        <th class="p-2">Acabamento</th>
                        <th class="p-2">Categoria</th>
                        <th class="p-2">Valor Marcenaria</th>
                        <th class="p-2">Valor Balcão</th>
                        <th class="p-2">Ações</th>
                    </tr>
                </thead>
                <tbody></tbody>`;
            const tbody = table.querySelector('tbody');
            produtos.forEach(p => {
                const row = document.createElement('tr');
                row.className = 'border-b';
                row.innerHTML = `
                    <td class="p-2">${p.nome}</td>
                    <td class="p-2">${p.esp || ''}mm</td>
                    <td class="p-2 font-mono">${p.ref_interna || ''}</td>
                    <td class="p-2">${p.linha || ''}</td>
                    <td class="p-2">${p.textura || ''}</td>
                    <td class="p-2">${p.acabamento || ''}</td>
                    <td class="p-2">${p.categoria || ''}</td>
                    <td class="p-2">${p.valor_marcenaria || ''}</td>
                    <td class="p-2">${p.valor_balcao || ''}</td>
                    <td class="p-2 flex gap-4">
                        <button class="text-blue-500 hover:text-blue-700" data-id="${p._id}" data-action="edit">Editar</button>
                        <form action="/api/admin/chapas/delete/${p._id}" method="POST" onsubmit="return confirm('Tem certeza?');">
                            <input type="hidden" name="marca" value="${marca}">
                            <button type="submit" class="text-red-500 hover:text-red-700">Excluir</button>
                        </form>
                    </td>
                `;
                tbody.appendChild(row);
            });
            listaProdutos.appendChild(table);
        } catch (error) {
            listaProdutos.innerHTML = '<p class="text-red-500">Erro ao carregar produtos.</p>';
        }
    }
    
    // Lida com mensagens de feedback da URL
    const urlParams = new URLSearchParams(window.location.search);
    const feedback = urlParams.get('feedback');
    const marcaUrl = urlParams.get('marca') || marcas[0].toLowerCase();
    
    marcaSelect.value = marcaUrl;
    formMarcaSelect.value = marcaUrl;
    
    if (feedback) {
        feedbackMessage.classList.remove('hidden');
        if (feedback === 'success') {
            feedbackMessage.className = 'mb-4 p-4 rounded-md text-center font-semibold bg-green-100 text-green-800';
            feedbackMessage.textContent = 'Produto salvo com sucesso!';
        } else if (feedback === 'deleted') {
            feedbackMessage.className = 'mb-4 p-4 rounded-md text-center font-semibold bg-blue-100 text-blue-800';
            feedbackMessage.textContent = 'Produto excluído com sucesso!';
        } else {
            feedbackMessage.className = 'mb-4 p-4 rounded-md text-center font-semibold bg-red-100 text-red-800';
            feedbackMessage.textContent = `Erro: ${decodeURIComponent(urlParams.get('message') || 'Ocorreu uma falha.')}`;
        }
    }
    
    marcaSelect.addEventListener('change', () => {
        window.location.href = `/admin.html?marca=${marcaSelect.value}`;
    });

    // IA: Preencher formulário com sugestão
    document.getElementById('btn-ia').addEventListener('click', () => {
        const exemplos = [
            {
                nome: 'Carvalho Viena',
                marca: 'arauco',
                esp: 15,
                ref_interna: '1.1.13-CVA',
                linha: 'Essencial',
                textura: 'Madeirada',
                acabamento: 'Fosco',
                descricao: 'Padrão sofisticado inspirado em carvalhos europeus.',
                combinacoes: 'Branco, Preto, Cinza',
                status: 'Ativo',
                categoria: 'Madeirado',
                dimensao_padrao: '2,75x1,85m',
                fita_borda: 'Sim',
                valor_marcenaria: 'R$ 350,00',
                valor_balcao: 'R$ 420,00'
            },
            {
                nome: 'Branco TX',
                marca: 'berneck',
                esp: 18,
                ref_interna: '2.1.01-BRQ',
                linha: 'Clássicos',
                textura: 'Lisa',
                acabamento: 'Brilho',
                descricao: 'Branco universal para todos os ambientes.',
                combinacoes: 'Preto, Cinza',
                status: 'Ativo',
                categoria: 'Liso',
                dimensao_padrao: '2,75x1,85m',
                fita_borda: 'Sim',
                valor_marcenaria: 'R$ 280,00',
                valor_balcao: 'R$ 350,00'
            }
        ];
        const ex = exemplos[Math.floor(Math.random() * exemplos.length)];
        for (const k in ex) {
            if (form.elements[k]) form.elements[k].value = ex[k];
        }
    });

    // Exportação de chapas
    document.getElementById('btn-exportar').addEventListener('click', async () => {
        const marca = marcaSelect.value;
        try {
            const response = await fetch(`/api/admin/chapas/${marca}`);
            const chapas = await response.json();
            const blob = new Blob([JSON.stringify(chapas, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chapas_${marca}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert('Erro ao exportar.');
        }
    });

    // Importação de chapas
    document.getElementById('btn-importar').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const chapas = JSON.parse(text);
                for (const chapa of chapas) {
                    await fetch('/api/admin/chapas/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(chapa)
                    });
                }
                window.location.reload();
            } catch (err) {
                alert('Erro ao importar arquivo.');
            }
        };
        input.click();
    });

    // Envio do formulário com todos os campos extras
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        // Trata combinações como array
        let data = Object.fromEntries(formData.entries());
        if (data.combinacoes) {
            data.combinacoes = data.combinacoes.split(',').map(s => s.trim()).filter(Boolean);
        }
        try {
            const response = await fetch('/api/admin/chapas/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.redirected) {
                window.location.href = response.url;
            } else {
                throw new Error('Erro ao adicionar chapa.');
            }
        } catch (error) {
            feedbackMessage.textContent = error.message;
            feedbackMessage.className = 'mb-4 text-center text-red-600';
        }
    });

    carregarProdutos(marcaSelect.value);
});
