# Adote Pets

Aplicativo mobile academico feito com Apache Cordova + Framework7 para demonstrar um MVP de **adocao responsavel de animais**. Mobile-first, com dados locais salvos em `localStorage` e integracao com duas APIs publicas reais.

## Dupla

- **Felipe Santiago** — RA: 078364
- **Breno Ferreira** — RA: 069800

## Objetivo do app

Conectar tutores, instituicoes parceiras e animais disponiveis para adocao, oferecendo:

- Cadastro, listagem, filtros, edicao e exclusao de pets disponiveis.
- Pets favoritos e historias reais de adocao.
- Clinicas parceiras de castracao.
- Login e cadastro local de instituicoes.
- Uma tela "Dados Abertos" que consome **duas APIs publicas externas** em tempo real para enriquecer o app com dados oficiais de saude publica e referencia visual de racas.

## Tecnologias usadas

- Apache Cordova (target browser)
- Framework7 (local em `www/lib/framework7`)
- HTML5, CSS3, JavaScript ES6+
- `localStorage` para persistencia local
- `fetch` + `async/await` para chamadas externas

## APIs utilizadas

### 1. API de Dados Abertos do Ministerio da Saude — doses do PNI 2023

- **Tipo:** API publica oficial do **governo federal brasileiro**, catalogada no Portal Brasileiro de Dados Abertos.
- **URL base:** `https://apidadosabertos.saude.gov.br`
- **Endpoint usado:** `GET /vacinacao/doses-aplicadas-pni-2023?limit=1000&offset=0`
- **O que retorna:** registros de doses de vacinas aplicadas pelo Programa Nacional de Imunizacoes (PNI) em 2023, no formato `{ "doses_aplicadas_pni": [ ... ] }`. Cada registro inclui `data_vacina`, `descricao_vacina`, `codigo_vacina`, `codigo_dose_vacina`, `uf_estabelecimento`, `municipio_estabelecimento`, `idade_paciente`, entre outros.
- **Sem token, sem autenticacao.**
- **Como o app consome:** a base e enorme e paginada de 1000 em 1000; o app busca apenas a 1a pagina (rapido e estavel) e exibe os primeiros registros retornados, guardando o resultado em cache.
- **Proxy CORS:** o servidor do MS nao envia o header `Access-Control-Allow-Origin`, entao as chamadas do navegador passam por `https://cors.eu.org/<url>` (proxy publico gratuito) para liberar o CORS sem alterar o conteudo da resposta. Como esse proxy as vezes responde 522, o app tenta a chamada algumas vezes antes de desistir.
- **Sentido no app:** mostrar dados oficiais de imunizacao reforca a cultura de vacinacao — tutores que cuidam bem de si tambem cuidam melhor dos pets e de quem convive com eles.

### 2. Dog CEO API — imagens reais de racas

- **Tipo:** API publica de terceiros, sem autenticacao.
- **URL base:** `https://dog.ceo/api`
- **Endpoint usado:** `GET /breeds/image/random/6`
- **O que retorna:** JSON `{ "message": [urls], "status": "success" }` com 6 URLs de imagens reais de cachorros de diferentes racas.
- **Sentido no app:** ajudar futuros tutores a se familiarizarem visualmente com portes, pelagens e perfis de racas antes da visita ao abrigo parceiro.

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Adicione a plataforma browser:

```bash
npx cordova platform add browser
```

3. Rode o app:

```bash
npx cordova run browser
```

Tambem existem scripts equivalentes em `package.json`:

```bash
npm run platform:browser
npm start
```

Para testar no navegador sem janela automatica:

```bash
npx cordova serve
```

E acessar `http://localhost:8000/browser/www/index.html` (ou a URL exibida no terminal). A tela das APIs fica em `apis.html` (atalho no menu inferior).

## Como confirmar que as APIs estao chamando dados reais

Abra o **Console** do navegador (F12) na tela `apis.html`. Voce vai ver, em sequencia:

- `[Dog CEO] Status HTTP: 200 OK`, total de imagens e cada URL retornada.
- `[PNI] Total de registros na pagina 0` e os primeiros 5 com `data_vacina`, `descricao_vacina`, `codigo_dose_vacina`, `uf_estabelecimento`, `municipio_estabelecimento`, `idade_paciente`.
- `[API PNI] Registros recebidos: N` no fluxo principal (ou `Usando cache de HH:MM` quando vem do cache).

## Funcionalidades implementadas

- Home com apresentacao do Adote Pets e atalhos principais.
- Navegacao mobile entre paginas reais do projeto.
- Listagem mobile de pets disponiveis em cards.
- Filtros por especie, sexo, porte, idade, raca e localizacao.
- Detalhe do pet em popup mobile.
- CRUD completo de pets: cadastrar, listar, editar e excluir.
- Favoritar e desfavoritar pets com persistencia.
- Pagina propria para pets favoritos.
- Historias de impacto com detalhe local.
- Clinicas de castracao parceiras com dados locais e cadastro simples.
- Login simulado/local sem autenticacao real.
- Cadastro local de instituicao parceira.
- Dados iniciais carregados automaticamente quando o `localStorage` esta vazio.
- Tela "Dados Abertos" (`apis.html`) com integracao em tempo real das duas APIs descritas acima.
- Loading visual, tratamento amigavel de erro e logs claros no console.

## Aula 6 — Cache e recurso nativo (GPS)

- Cache em `localStorage` com TTL de 30 minutos para as duas APIs.
- Arquivo `www/js/cache.js` com as funcoes `salvarCache`, `lerCache` e `formatarHora`.
- Chaves de cache: `cache_dog_ceo` e `cache_antirrabica` (cada uma guarda os dados + `timestamp`).
- O botao "Consultar fontes" forca uma nova chamada (`forcarRefresh = true`); o carregamento automatico usa o cache enquanto ele for valido.
- Cada painel mostra "Atualizado as HH:MM" com a hora do dado exibido.
- Recurso nativo: **GPS** via `navigator.geolocation` (bloco "Minha localizacao" em `apis.html`, funcao `capturarGPS()` no `api-service.js`).
- A partir da latitude/longitude o app descobre **cidade e bairro** com o Nominatim (OpenStreetMap, gratuito e sem cadastro) e mostra tambem a precisao em metros.
- Tratamento dos erros do GPS: permissao negada, posicao indisponivel e tempo esgotado.
- A ultima posicao fica salva em `localStorage` (chave `ultima_posicao`) e reaparece ao reabrir o app.

## Como o projeto ficou organizado

- `index.html`: pagina principal com apresentacao do app e atalhos.
- `pets.html`: listagem, filtros, detalhe e CRUD de pets.
- `favoritos.html`: lista de pets favoritados com acoes proprias.
- `historias.html`: listagem de historias e detalhe por hash local.
- `clinicas.html`: listagem e cadastro de clinicas parceiras.
- `apis.html`: tela "Dados Abertos" com as duas APIs publicas.
- `acesso.html`: login local e cadastro de instituicao.

## Estrutura de estilos e scripts

- `css/base.css`: base visual compartilhada do aplicativo.
- `css/inicio.css`, `css/pets.css`, `css/favoritos.css`, `css/historias.css`, `css/clinicas.css`, `css/apis.css`, `css/acesso.css`: estilos separados por pagina.
- `js/comum.js`: utilitarios compartilhados entre as paginas (DOM, Framework7, fallbacks).
- `js/inicio.js`, `js/pets.js`, `js/favoritos.js`, `js/historias.js`, `js/clinicas.js`, `js/apis.js`, `js/acesso.js`: controle separado por pagina.
- `js/api-service.js`: chamadas `fetch` das APIs publicas (Dog CEO e antirrabica PNI), com paginacao, filtro, cache e tratamento de erro, alem do recurso nativo de GPS.
- `js/cache.js`: cache em `localStorage` com TTL (`salvarCache`, `lerCache`, `formatarHora`).
- `js/api-config.js`: parametros de paginacao da API antirrabica.
- `js/api-config.example.js`: modelo de configuracao.
- `js/manager.js`: camada de dados e regras de negocio no `localStorage`.
- `js/model.js`: modelos `Pet`, `Clinica`, `Historia`, `Instituicao`, `RegistroAntirrabicaPNI` e `ImagemRacaDogCeo`.

## Estrutura dos arquivos

```text
config.xml
package.json
README.md
www/
  acesso.html
  apis.html
  clinicas.html
  favoritos.html
  historias.html
  index.html
  pets.html
  cordova_plugins.js
  css/
    acesso.css
    apis.css
    base.css
    clinicas.css
    favoritos.css
    historias.css
    inicio.css
    pets.css
  js/
    acesso.js
    api-config.example.js
    api-config.js
    api-service.js
    apis.js
    cache.js
    clinicas.js
    comum.js
    favoritos.js
    historias.js
    inicio.js
    manager.js
    model.js
    pets.js
  img/
    clinic-placeholder.svg
    logo.svg
    pet-placeholder.svg
  lib/
    framework7/
      framework7-bundle.min.css
      framework7-bundle.min.js
```
