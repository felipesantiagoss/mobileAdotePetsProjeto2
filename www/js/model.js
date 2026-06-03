class Pet {
  constructor(dados = {}) {
    this.id = dados.id || Date.now().toString();
    this.nome = dados.nome || "";
    this.especie = dados.especie || "";
    this.sexo = dados.sexo || "";
    this.raca = dados.raca || "SRD";
    this.porte = dados.porte || "";
    this.idade = dados.idade || "";
    this.peso = dados.peso || "";
    this.localizacao = dados.localizacao || "";
    this.descricao = dados.descricao || "";
    this.status = dados.status || "Disponivel";
    this.imagem = dados.imagem || "img/pet-placeholder.svg";
    this.vacinado = Boolean(dados.vacinado);
    this.castrado = Boolean(dados.castrado);
    this.favorito = Boolean(dados.favorito);
  }
}

class Clinica {
  constructor(dados = {}) {
    this.id = dados.id || Date.now().toString();
    this.nome = dados.nome || "";
    this.local = dados.local || "";
    this.contato = dados.contato || "";
    this.imagem = dados.imagem || "img/clinic-placeholder.svg";
  }
}

class Historia {
  constructor(dados = {}) {
    this.id = dados.id || Date.now().toString();
    this.titulo = dados.titulo || "";
    this.categoria = dados.categoria || "Adocao responsavel";
    this.data = dados.data || "";
    this.resumo = dados.resumo || "";
    this.texto = dados.texto || "";
    this.imagem = dados.imagem || "img/pet-placeholder.svg";
  }
}

class Instituicao {
  constructor(dados = {}) {
    this.id = dados.id || Date.now().toString();
    this.nome = dados.nome || "";
    this.email = dados.email || "";
    this.telefone = dados.telefone || "";
    this.cnpj = dados.cnpj || "";
    this.cidade = dados.cidade || "";
    this.endereco = dados.endereco || "";
  }
}

// Modelo descritivo dos registros que a API antirrabica do PNI (Ministerio da Saude)
// devolve depois de filtrados/normalizados em www/js/api-service.js. Apenas documenta
// o formato exibido na tela - nao e usado pelo fetch em si.
class RegistroAntirrabicaPNI {
  constructor(dados = {}) {
    this.id = dados.id || "";
    this.titulo = dados.titulo || "Vacina antirrabica";
    this.data = dados.data || "";
    this.uf = dados.uf || "";
    this.municipio = dados.municipio || "";
    this.dose = dados.dose || "";
    this.idade = dados.idade || "";
  }
}

// Modelo descritivo das imagens normalizadas vindas da Dog CEO API.
class ImagemRacaDogCeo {
  constructor(dados = {}) {
    this.id = dados.id || "";
    this.imagem = dados.imagem || "";
    this.raca = dados.raca || "";
  }
}

window.Pet = Pet;
window.Clinica = Clinica;
window.Historia = Historia;
window.Instituicao = Instituicao;
window.RegistroAntirrabicaPNI = RegistroAntirrabicaPNI;
window.ImagemRacaDogCeo = ImagemRacaDogCeo;
