// O evento DOMContentLoaded garante que este script só será executado
// depois que toda a estrutura HTML da página estiver pronta.
// Esta é a correção definitiva para os erros de inicialização.
document.addEventListener('DOMContentLoaded', () => {

    // --- SELETORES DE ELEMENTOS ---
    const form = document.getElementById('product-form');
    const productIdField = document.getElementById('productId');
    const imagePreview = document.getElementById('image-preview');
    const clearFormBtn = document.getElementById('clear-form-btn');
    const productList = document.getElementById('product-list');
    const filterMarcaSelect = document.getElementById('filter-marca');
    const marcaSelect = document.getElementById('marca');
    const linhaSelect = document.getElementById('linha');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const thicknessContainer = document.getElementById('thickness-container');
    const addThicknessBtn = document.getElementById('add-thickness-btn');
    const exportTemplateBtn = document.getElementById('export-template-btn');
    const importFileInput = document.getElementById('import-file-input');
    
    // --- LÓGICA DAS ABAS ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // A busca de produtos só é chamada quando a aba de gestão é clicada.
            if (tabId === 'tab-gestao') {
                fetchProducts();
            }
        });
    });
    
    // --- FUNÇÕES DE CARREGAMENTO INICIAL ---
    async function loadMarcas() {
        try {
            const response = await fetch('/api/marcas');
            if (!response.ok) throw new Error('Falha ao carregar marcas');
            const marcas = await response.json();
            
            if(filterMarcaSelect) {
                filterMarcaSelect.innerHTML = '<option value="">Todas as Marcas</option>';
                marcas.forEach(marca => filterMarcaSelect.add(new Option(marca.nome, marca.nome)));
            }
            if(marcaSelect) {
                marcaSelect.innerHTML = '<option value="">Selecione a Marca</option>';
                marcas.forEach(marca => marcaSelect.add(new Option(marca.nome, marca.nome)));
            }

        } catch (error) {
            console.error('Erro ao carregar marcas:', error);
        }
    }

    async function loadLinhas() {
        try {
            const response = await fetch('/api/linhas');
            if (!response.ok) throw new Error('Falha ao carregar linhas');
            const linhas = await response.json();

            if(linhaSelect) {
                linhaSelect.innerHTML = '<option value="">Selecione a Linha</option>';
                linhas.forEach(linha => linhaSelect.add(new Option(linha.nome, linha.nome)));
            }
        } catch (error) {
            console.error('Erro ao carregar linhas:', error);
        }
    }

    // --- FUNÇÕES DE DADOS (API) ---
    async function fetchProducts(marca = '') {
        if (!productList) return;

        try {
            const url = marca ? `/api/chapas?marca=${encodeURIComponent(marca)}` : '/api/chapas';
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar produtos.');
            const products = await response.json();
            renderProducts(products);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            productList.innerHTML = `<p class="text-red-500 col-span-full">Erro ao carregar produtos. Verifique se o servidor está rodando.</p>`;
        }
    }

    function renderProducts(products) {
        if (!productList) return;
        
        productList.innerHTML = '';
        if (products.length === 0) {
            productList.innerHTML = `<p class="text-slate-500 col-span-full">Nenhum produto encontrado.</p>`;
            return;
        }
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col';
            card.innerHTML = `
                <img src="${product.url_imagem || 'https://placehold.co/400x300/e2e8f0/64748b?text=Sem+Imagem'}" alt="${product.nome}" class="w-full h-40 object-cover">
                <div class="p-4 flex-grow flex flex-col">
                    <h3 class="font-bold text-lg">${product.nome}</h3>
                    <p class="text-sm text-slate-600">${product.marca}</p>
                    <div class="mt-auto pt-4 flex space-x-2">
                        <button class="btn btn-secondary text-xs flex-1 edit-btn" data-id="${product._id}">Editar</button>
                        <button class="btn btn-danger text-xs flex-1 delete-btn" data-id="${product._id}">Excluir</button>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });
    }
    
    // --- LÓGICA DO FORMULÁRIO ---
    function clearForm() {
        if(!form) return;
        form.reset();
        if(productIdField) productIdField.value = '';
        if(thicknessContainer) thicknessContainer.innerHTML = '';
        if(imagePreview) {
            imagePreview.classList.add('hidden');
            imagePreview.src = '';
        }
        const imagemInput = document.getElementById('imagem');
        if (imagemInput) imagemInput.value = '';
    }

    function populateForm(product) {
        if(!form) return;
        clearForm();
        if(productIdField) productIdField.value = product._id;
        if(marcaSelect) marcaSelect.value = product.marca;
        if(linhaSelect) linhaSelect.value = product.linha || '';
        document.getElementById('nome').value = product.nome;
        document.getElementById('textura').value = product.textura || '';
        document.getElementById('acabamento').value = product.acabamento || '';
        document.getElementById('dimensao_padrao').value = product.dimensao_padrao || '';
        document.getElementById('descricao').value = product.descricao || '';
        document.getElementById('combinacoes').value = product.combinacoes || '';
        document.getElementById('preco_fita_65mm_rolo').value = product.preco_fita_65mm_rolo || 0;
        document.getElementById('metragem_rolo_fita').value = product.metragem_rolo_fita || 0;

        if(product.url_imagem && imagePreview){
            imagePreview.src = product.url_imagem;
            imagePreview.classList.remove('hidden');
        }

        (product.espessuras || []).forEach(addThicknessField);
    }
    
    if(form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = productIdField.value;
            const formData = new FormData(form);
            
            const espessuras = [];
            if(thicknessContainer) {
                thicknessContainer.querySelectorAll('.thickness-group').forEach(group => {
                     espessuras.push({
                        espessura: group.querySelector('[name="espessura"]').value,
                        valor_marcenaria: group.querySelector('[name="valor_marcenaria"]').value,
                        valor_balcao: group.querySelector('[name="valor_balcao"]').value,
                        preco_origem: 'manual'
                    });
                });
            }

            formData.append('espessuras', JSON.stringify(espessuras));
            
            try {
                const response = await fetch(id ? `/api/chapas/${id}` : '/api/chapas', {
                    method: id ? 'PUT' : 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao salvar o produto.');
                }
                
                alert('Produto salvo com sucesso!');
                clearForm();
                const gestaoTab = document.querySelector('[data-tab="tab-gestao"]');
                if (gestaoTab) gestaoTab.click();

            } catch (error) {
                console.error('Erro no formulário:', error);
                alert(`Erro: ${error.message}`);
            }
        });
    }

    // --- LÓGICA DE ESPESSURAS ---
    function addThicknessField(esp = { espessura: '', valor_marcenaria: '', valor_balcao: '' }) {
        if (!thicknessContainer) return;
        const div = document.createElement('div');
        div.className = 'thickness-group grid grid-cols-1 sm:grid-cols-4 gap-2 items-center';
        div.innerHTML = `
            <input type="number" name="espessura" value="${esp.espessura || ''}" class="form-input" placeholder="Espessura (mm)" required>
            <input type="number" step="0.01" name="valor_marcenaria" value="${esp.valor_marcenaria || ''}" class="form-input" placeholder="V. Marcenaria">
            <input type="number" step="0.01" name="valor_balcao" value="${esp.valor_balcao || ''}" class="form-input" placeholder="V. Balcão">
            <button type="button" class="btn btn-danger w-full remove-thickness-btn"><i class="fa-solid fa-trash-alt"></i></button>
        `;
        thicknessContainer.appendChild(div);
    }
    
    if(addThicknessBtn) addThicknessBtn.addEventListener('click', () => addThicknessField());
    if(thicknessContainer) {
        thicknessContainer.addEventListener('click', e => {
            const removeBtn = e.target.closest('.remove-thickness-btn');
            if (removeBtn) {
                removeBtn.closest('.thickness-group').remove();
            }
        });
    }

    // --- LÓGICA DE EVENTOS DA LISTA ---
    if(productList) {
        productList.addEventListener('click', async (e) => {
            const button = e.target.closest('.btn');
            if (!button) return;
            
            const id = button.dataset.id;
            
            if (button.classList.contains('edit-btn')) {
                try {
                    const response = await fetch(`/api/chapas/${id}`);
                    if (!response.ok) throw new Error('Produto não encontrado');
                    const productToEdit = await response.json();

                    if(productToEdit){
                        populateForm(productToEdit);
                        const cadastroTab = document.querySelector('[data-tab="tab-cadastro"]');
                        if (cadastroTab) cadastroTab.click();
                    }
                } catch(error) {
                    alert('Não foi possível carregar os dados para edição: ' + error.message);
                }
            }
            
            if (button.classList.contains('delete-btn')) {
                 if (confirm('Deseja realmente excluir este produto e todas as suas espessuras?')) {
                    try {
                        const response = await fetch(`/api/chapas/${id}`, { method: 'DELETE' });
                         if (!response.ok) throw new Error('Falha ao excluir.');
                         alert('Produto excluído com sucesso!');
                         if(filterMarcaSelect) fetchProducts(filterMarcaSelect.value);
                    } catch(error) {
                        alert('Erro ao excluir o produto.');
                    }
                }
            }
        });
    }

    // --- OUTROS EVENTOS ---
    if(clearFormBtn) clearFormBtn.addEventListener('click', clearForm);
    if(filterMarcaSelect) filterMarcaSelect.addEventListener('change', () => fetchProducts(filterMarcaSelect.value));
    
    const imagemInput = document.getElementById('imagem');
    if (imagemInput) {
        imagemInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if(file && imagePreview) {
                imagePreview.src = URL.createObjectURL(file);
                imagePreview.classList.remove('hidden');
            }
        });
    }

    // --- LÓGICA DO ASSISTENTE DE IA ---
    const generatePromptBtn = document.getElementById('generate-prompt-btn');
    const promptArea = document.getElementById('prompt-area');
    const iaPromptOutput = document.getElementById('ia-prompt-output');
    const fillFormBtn = document.getElementById('fill-form-btn');
    
    if(generatePromptBtn) {
        generatePromptBtn.addEventListener('click', () => {
            const marca = document.getElementById('ia-marca').value;
            const nome = document.getElementById('ia-nome').value;
            if(!marca || !nome) {
                alert('Por favor, informe a Marca e o Nome do Padrão.');
                return;
            }
            const prompt = `Busque a ficha técnica completa do MDF "${nome}" da marca "${marca}". Inclua também uma busca por preços médios de mercado para este produto e para a fita de borda correspondente. Retorne os dados no seguinte formato de lista, preenchendo o máximo de informações possível:
marca: ${marca}
nome: ${nome}
linha: 
textura: 
acabamento: 
dimensao_padrao: 
descricao: 
combinacoes: 
preco_fita_65mm_rolo: 
metragem_rolo_fita: 
espessura_1: 
valor_marcenaria_1: 
valor_balcao_1: 
espessura_2: 
valor_marcenaria_2: 
valor_balcao_2: 
espessura_3: 
valor_marcenaria_3: 
valor_balcao_3: `;
            if (iaPromptOutput) iaPromptOutput.value = prompt;
            if (promptArea) promptArea.classList.remove('hidden');
        });
    }

    if(fillFormBtn) {
        fillFormBtn.addEventListener('click', () => {
            const results = document.getElementById('ia-results-input').value;
            try {
                let data;
                // Tenta parsear como JSON
                try {
                    data = JSON.parse(results);
                } catch {
                    // Se não for JSON, tenta parsear como lista antiga
                    data = {};
                    results.split('\n').forEach(line => {
                        const [key, ...valueParts] = line.split(':');
                        if (key && valueParts.length > 0) {
                            const value = valueParts.join(':').trim();
                            data[key.trim()] = value;
                        }
                    });
                }

                // Preenche campos do formulário
                if (marcaSelect) marcaSelect.value = data.marca || document.getElementById('ia-marca').value;
                document.getElementById('nome').value = data.nome || document.getElementById('ia-nome').value;
                if (linhaSelect) linhaSelect.value = data.linha || '';

                // Campos seletivos
                const texturaSelect = document.getElementById('textura');
                if (texturaSelect && data.textura) {
                    let found = false;
                    for (let i = 0; i < texturaSelect.options.length; i++) {
                        if (texturaSelect.options[i].text.toLowerCase() === (data.textura || '').toLowerCase() ||
                            texturaSelect.options[i].value.toLowerCase() === (data.textura || '').toLowerCase()) {
                            texturaSelect.selectedIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) texturaSelect.selectedIndex = 0;
                }
                const acabamentoSelect = document.getElementById('acabamento');
                if (acabamentoSelect && data.acabamento) {
                    let found = false;
                    for (let i = 0; i < acabamentoSelect.options.length; i++) {
                        if (acabamentoSelect.options[i].text.toLowerCase() === (data.acabamento || '').toLowerCase() ||
                            acabamentoSelect.options[i].value.toLowerCase() === (data.acabamento || '').toLowerCase()) {
                            acabamentoSelect.selectedIndex = i;
                            found = true;
                            break;
                        }
                    }
                    if (!found) acabamentoSelect.selectedIndex = 0;
                }

                document.getElementById('dimensao_padrao').value = data.dimensao_padrao || data.dimensao || '';
                document.getElementById('descricao').value = data.descricao || '';
                document.getElementById('combinacoes').value = Array.isArray(data.combinacoes) ? data.combinacoes.join(', ') : (data.combinacoes || '');
                document.getElementById('preco_fita_65mm_rolo').value = data.preco_fita_65mm_rolo || data.preco_fita || '';
                document.getElementById('metragem_rolo_fita').value = data.metragem_rolo_fita || data.metragem_fita || '';

                // Preencher campos de espessura
                if(thicknessContainer) thicknessContainer.innerHTML = '';
                if (data.esp !== undefined) {
                    addThicknessField({
                        espessura: data.esp,
                        valor_marcenaria: (data.valor_marcenaria || '').replace(/[^\d.,]/g, ''),
                        valor_balcao: (data.valor_balcao || '').replace(/[^\d.,]/g, '')
                    });
                } else {
                    for (let i = 1; i < 10; i++) {
                        if (data[`espessura_${i}`]) {
                            addThicknessField({
                                espessura: data[`espessura_${i}`],
                                valor_marcenaria: (data[`valor_marcenaria_${i}`] || '').replace(/[^\d.,]/g, ''),
                                valor_balcao: (data[`valor_balcao_${i}`] || '').replace(/[^\d.,]/g, '')
                            });
                        }
                    }
                }

                alert('Formulário preenchido! Verifique os dados e salve.');
            } catch (error) {
                console.error("Erro ao preencher o formulário com dados da IA:", error);
                alert('Não foi possível processar o texto colado. Verifique o formato.');
            }
        });
    }

    // --- LÓGICA DE IMPORTAR/EXPORTAR ---
    if (exportTemplateBtn) {
        exportTemplateBtn.addEventListener('click', () => {
            // Exporta um template JSON com todos os campos
            const templateFicha = [{
                "nome": "",
                "linha": "",
                "textura": "",
                "acabamento": "",
                "descricao": "",
                "combinacoes": [],
                "status": "Ativo",
                "categoria": "",
                "dimensao_padrao": "",
                "fita_borda": "",
                "esp": 0,
                "ref_interna": "",
                "valor_marcenaria": "",
                "valor_balcao": ""
            }];
            const blob = new Blob([JSON.stringify(templateFicha, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'template_ficha_mdf.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }
    
    if (importFileInput) {
        importFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    if (!Array.isArray(json)) throw new Error('O arquivo deve ser um array de fichas.');
                    if (confirm(`Foram encontrados ${json.length} fichas no arquivo. Deseja importá-las?`)) {
                        let successCount = 0;
                        let errorCount = 0;
                        for (const ficha of json) {
                            try {
                                const response = await fetch('/api/chapas', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(ficha)
                                });
                                if(response.ok) successCount++;
                                else errorCount++;
                            } catch (err) {
                                errorCount++;
                                console.error('Erro ao importar ficha:', ficha.nome, err);
                            }
                        }
                        alert(`Importação concluída!\n${successCount} fichas importadas com sucesso.\n${errorCount} fichas falharam.`);
                        if (successCount > 0) {
                            const gestaoTab = document.querySelector('[data-tab="tab-gestao"]');
                            if (gestaoTab) gestaoTab.click();
                        }
                    }
                } catch (readError) {
                    console.error('Erro ao ler o arquivo JSON:', readError);
                    alert('Houve um erro ao ler o arquivo. Verifique se o formato está correto.');
                }
            };
            reader.readAsText(file);
        });
    }

    // --- INICIALIZAÇÃO ---
    loadMarcas();
    loadLinhas();
});

