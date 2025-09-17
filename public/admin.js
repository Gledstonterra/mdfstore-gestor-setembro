document.addEventListener('DOMContentLoaded', () => {
  const marcaSelect = document.getElementById('marca-select');
  const formMarcaSelect = document.getElementById('form-marca');
  const listaProdutos = document.getElementById('lista-produtos');
  const feedbackMessage = document.getElementById('feedback-message');
  const form = document.getElementById('gestor-form');
    
  const marcas = ["Arauco", "Berneck", "Duratex", "Eucatex", "Fibraplac", "Greenplac", "Guararapes", "Sudati"];
    
  marcas.forEach(marca => {
    const m = marca.toLowerCase();
    marcaSelect.add(new Option(marca, m));
    formMarcaSelect.add(new Option(marca, m));
  });

  const gerarRefInterna = () => {
    const nome = form.querySelector('[name="nome"]').value.substring(0, 3).toUpperCase();
    const esp = form.querySelector('[name="esp"]').value;
    const marca = form.querySelector('[name="marca"]').value.substring(0, 3).toUpperCase();
    if (nome && esp && marca) {
      form.querySelector('[name="ref_interna"]').value = `${marca}-${esp}-${nome}`;
    }
  };
  form.querySelector('[name="nome"]').addEventListener('input', gerarRefInterna);
  form.querySelector('[name="esp"]').addEventListener('input', gerarRefInterna);
  form.querySelector('[name="marca"]').addEventListener('change', gerarRefInterna);

  async function carregarProdutos(marca) {
    listaProdutos.innerHTML = '<p>Carregando...</p>';
    try {
      const response = await fetch(`/api/admin/chapas/${marca}`);
      const produtos = await response.json();
      listaProdutos.innerHTML = '';
      if (produtos.length === 0) {
        listaProdutos.innerHTML = '<p>Nenhum produto cadastrado.</p>'; return;
      }
      const table = document.createElement('table');
      table.className = 'w-full text-sm text-left';
      table.innerHTML = `<thead><tr class="bg-slate-100"><th class="p-2">Nome</th><th class="p-2">Esp.</th><th class="p-2">Ref.</th><th class="p-2">Ações</th></tr></thead><tbody></tbody>`;
      const tbody = table.querySelector('tbody');
      produtos.forEach(p => {
        const row = document.createElement('tr');
        row.className = 'border-b';
        row.innerHTML = `<td class="p-2">${p.nome}</td><td class="p-2">${p.esp}mm</td><td class="p-2 font-mono">${p.ref_interna}</td>
          <td class="p-2">
            <form action="/api/admin/chapas/delete/${p._id}" method="POST" onsubmit="return confirm('Tem certeza?');">
              <input type="hidden" name="marca" value="${marca}">
              <button type="submit" class="text-red-500">Excluir</button>
            </form>
          </td>`;
        tbody.appendChild(row);
      });
      listaProdutos.appendChild(table);
    } catch (error) {
      listaProdutos.innerHTML = '<p class="text-red-500">Erro ao carregar produtos.</p>';
    }
  }
    
  const urlParams = new URLSearchParams(window.location.search);
  const feedback = urlParams.get('feedback');
  const marcaUrl = urlParams.get('marca') || marcas[0].toLowerCase();
    
  marcaSelect.value = marcaUrl;
  formMarcaSelect.value = marcaUrl;
    
  if (feedback) { /* Lógica de feedback aqui */ }
    
  marcaSelect.addEventListener('change', () => {
    window.location.href = `/admin.html?marca=${marcaSelect.value}`;
  });
    
  carregarProdutos(marcaSelect.value);
});
