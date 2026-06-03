class AdotePetsManager {
  constructor() {
    this.storage = this.criarArmazenamentoSeguro();
    this.keys = {
      pets: "adotePets:pets",
      historias: "adotePets:historias",
      clinicas: "adotePets:clinicas",
      instituicoes: "adotePets:instituicoes",
      usuarioAtual: "adotePets:usuarioAtual",
      versaoDados: "adotePets:versaoDados"
    };
    this.versaoDados = "2026-04-21-v4";

    this.criarDadosIniciais();
  }

  criarArmazenamentoSeguro() {
    try {
      const chaveTeste = "__adotePetsTeste__";
      window.localStorage.setItem(chaveTeste, "ok");
      window.localStorage.removeItem(chaveTeste);
      return window.localStorage;
    } catch (erro) {
      return this.criarArmazenamentoMemoria();
    }
  }

  criarArmazenamentoMemoria() {
    if (!window.__adotePetsStorageMemoria) {
      window.__adotePetsStorageMemoria = {};
    }

    return {
      getItem(chave) {
        return Object.prototype.hasOwnProperty.call(window.__adotePetsStorageMemoria, chave)
          ? window.__adotePetsStorageMemoria[chave]
          : null;
      },
      setItem(chave, valor) {
        window.__adotePetsStorageMemoria[chave] = String(valor);
      },
      removeItem(chave) {
        delete window.__adotePetsStorageMemoria[chave];
      }
    };
  }

  garantirArmazenamentoAtivo() {
    if (!this.storage || typeof this.storage.getItem !== "function") {
      this.storage = this.criarArmazenamentoMemoria();
    }
  }

  criarDadosIniciais() {
    const precisaAtualizar = this.storage.getItem(this.keys.versaoDados) !== this.versaoDados;
    const petsAtuais = this.carregarLista(this.keys.pets);
    const historiasAtuais = this.carregarLista(this.keys.historias);
    const clinicasAtuais = this.carregarLista(this.keys.clinicas);

    if (precisaAtualizar || !petsAtuais.length) {
      this.sincronizarListaInicial(this.keys.pets, this.petsIniciais());
    }

    if (precisaAtualizar || !historiasAtuais.length) {
      this.sincronizarListaInicial(this.keys.historias, this.historiasIniciais());
    }

    if (precisaAtualizar || !clinicasAtuais.length) {
      this.sincronizarListaInicial(this.keys.clinicas, this.clinicasIniciais());
    }

    this.storage.setItem(this.keys.versaoDados, this.versaoDados);
  }

  sincronizarListaInicial(chave, dadosIniciais) {
    const dadosAtuais = this.carregarLista(chave);
    const idsIniciais = dadosIniciais.map((item) => item.id);
    const itensCriadosNoApp = dadosAtuais.filter((item) => !idsIniciais.includes(item.id));

    const dadosAtualizados = dadosIniciais.map((itemInicial) => {
      const itemAtual = dadosAtuais.find((item) => item.id === itemInicial.id);

      if (itemAtual && Object.prototype.hasOwnProperty.call(itemAtual, "favorito")) {
        return { ...itemInicial, favorito: itemAtual.favorito };
      }

      return itemInicial;
    });

    this.salvarLista(chave, [...dadosAtualizados, ...itensCriadosNoApp]);
  }

  carregarLista(chave) {
    this.garantirArmazenamentoAtivo();
    const dados = this.storage.getItem(chave);

    if (!dados) {
      return [];
    }

    try {
      const lista = JSON.parse(dados);
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      this.storage.removeItem(chave);
      return [];
    }
  }

  salvarLista(chave, lista) {
    this.garantirArmazenamentoAtivo();

    try {
      this.storage.setItem(chave, JSON.stringify(lista));
    } catch (erro) {
      this.storage = this.criarArmazenamentoMemoria();
      this.storage.setItem(chave, JSON.stringify(lista));
    }
  }

  listarPets() {
    let pets = this.carregarLista(this.keys.pets);

    if (!pets.length) {
      const petsIniciais = this.petsIniciais();
      this.sincronizarListaInicial(this.keys.pets, petsIniciais);
      pets = this.carregarLista(this.keys.pets);

      if (!pets.length) {
        pets = petsIniciais;
      }
    }

    return pets.map((pet) => new window.Pet(pet));
  }

  buscarPetPorId(id) {
    return this.listarPets().find((pet) => pet.id === id);
  }

  adicionarPet(dados) {
    const pets = this.listarPets();
    const pet = new window.Pet(dados);
    pets.push(pet);
    this.salvarLista(this.keys.pets, pets);
    return pet;
  }

  atualizarPet(id, novosDados) {
    const pets = this.listarPets();
    const indice = pets.findIndex((pet) => pet.id === id);

    if (indice === -1) {
      return null;
    }

    pets[indice] = new window.Pet({ ...pets[indice], ...novosDados, id });
    this.salvarLista(this.keys.pets, pets);
    return pets[indice];
  }

  removerPet(id) {
    const pets = this.listarPets().filter((pet) => pet.id !== id);
    this.salvarLista(this.keys.pets, pets);
  }

  alternarFavorito(id) {
    const pet = this.buscarPetPorId(id);

    if (!pet) {
      return null;
    }

    return this.atualizarPet(id, { favorito: !pet.favorito });
  }

  listarFavoritos() {
    return this.listarPets().filter((pet) => pet.favorito);
  }

  filtrarPets(filtros = {}) {
    return this.listarPets().filter((pet) => {
      return (
        this.comparaExato(pet.especie, filtros.especie) &&
        this.comparaExato(pet.sexo, filtros.sexo) &&
        this.comparaExato(pet.porte, filtros.porte) &&
        this.contemTexto(pet.idade, filtros.idade) &&
        this.contemTexto(pet.raca, filtros.raca) &&
        this.contemTexto(pet.localizacao, filtros.localizacao)
      );
    });
  }

  comparaExato(valor, filtro) {
    if (!filtro) {
      return true;
    }

    return String(valor).toLowerCase() === String(filtro).toLowerCase();
  }

  contemTexto(valor, filtro) {
    if (!filtro) {
      return true;
    }

    return String(valor).toLowerCase().includes(String(filtro).toLowerCase());
  }

  listarHistorias() {
    let historias = this.carregarLista(this.keys.historias);

    if (!historias.length) {
      const historiasIniciais = this.historiasIniciais();
      this.sincronizarListaInicial(this.keys.historias, historiasIniciais);
      historias = this.carregarLista(this.keys.historias);

      if (!historias.length) {
        historias = historiasIniciais;
      }
    }

    return historias.map((historia) => new window.Historia(historia));
  }

  buscarHistoriaPorId(id) {
    return this.listarHistorias().find((historia) => historia.id === id);
  }

  listarClinicas() {
    let clinicas = this.carregarLista(this.keys.clinicas);

    if (!clinicas.length) {
      const clinicasIniciais = this.clinicasIniciais();
      this.sincronizarListaInicial(this.keys.clinicas, clinicasIniciais);
      clinicas = this.carregarLista(this.keys.clinicas);

      if (!clinicas.length) {
        clinicas = clinicasIniciais;
      }
    }

    return clinicas.map((clinica) => new window.Clinica(clinica));
  }

  adicionarClinica(dados) {
    const clinicas = this.listarClinicas();
    const clinica = new window.Clinica(dados);
    clinicas.push(clinica);
    this.salvarLista(this.keys.clinicas, clinicas);
    return clinica;
  }

  removerClinica(id) {
    const clinicas = this.listarClinicas().filter((clinica) => clinica.id !== id);
    this.salvarLista(this.keys.clinicas, clinicas);
  }

  listarInstituicoes() {
    return this.carregarLista(this.keys.instituicoes).map((instituicao) => new window.Instituicao(instituicao));
  }

  adicionarInstituicao(dados) {
    const instituicoes = this.listarInstituicoes();
    const instituicao = new window.Instituicao(dados);
    instituicoes.push(instituicao);
    this.salvarLista(this.keys.instituicoes, instituicoes);
    return instituicao;
  }

  salvarUsuarioAtual(login) {
    this.garantirArmazenamentoAtivo();

    try {
      this.storage.setItem(this.keys.usuarioAtual, JSON.stringify({ login }));
    } catch (erro) {
      this.storage = this.criarArmazenamentoMemoria();
      this.storage.setItem(this.keys.usuarioAtual, JSON.stringify({ login }));
    }
  }

  buscarUsuarioAtual() {
    this.garantirArmazenamentoAtivo();
    const usuario = this.storage.getItem(this.keys.usuarioAtual);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario);
    } catch (erro) {
      this.storage.removeItem(this.keys.usuarioAtual);
      return null;
    }
  }

  petsIniciais() {
    return [
      new window.Pet({
        id: "pet-1",
        nome: "Alexia",
        especie: "Cachorro",
        sexo: "Femea",
        raca: "Vira-lata",
        porte: "Medio",
        idade: "1 ano",
        peso: "3 kg",
        localizacao: "Taguatinga, Brasilia - DF",
        descricao: "Pequena, alegre e muito carinhosa. Gosta de colo, passeios curtos e ja se acostumou com guia.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: true
      }),
      new window.Pet({
        id: "pet-2",
        nome: "Frederico",
        especie: "Cachorro",
        sexo: "Femea",
        raca: "Vira-lata",
        porte: "Pequeno",
        idade: "8 meses",
        peso: "5 kg",
        localizacao: "Taguatinga, Brasilia - DF",
        descricao: "Apesar do nome, Frederico e uma filhote femea muito curiosa, brincalhona e sociavel com outros animais.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: false
      }),
      new window.Pet({
        id: "pet-3",
        nome: "Amora",
        especie: "Cachorro",
        sexo: "Femea",
        raca: "SRD",
        porte: "Pequeno",
        idade: "2 anos",
        peso: "6 kg",
        localizacao: "Taguatinga, Brasilia - DF",
        descricao: "Doce, tranquila e companheira. Prefere ambientes calmos e responde bem a carinho e rotina.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: true
      }),
      new window.Pet({
        id: "pet-4",
        nome: "Alex",
        especie: "Cachorro",
        sexo: "Macho",
        raca: "SRD",
        porte: "Grande",
        idade: "3 anos",
        peso: "22 kg",
        localizacao: "Taguatinga, Brasilia - DF",
        descricao: "Calmo, protetor e bom para familia que tenha espaco. Ja esta acostumado a passear com guia.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: true
      }),
      new window.Pet({
        id: "pet-5",
        nome: "Mel",
        especie: "Cachorro",
        sexo: "Femea",
        raca: "Caramelo",
        porte: "Medio",
        idade: "2 anos",
        peso: "12 kg",
        localizacao: "Samambaia, Brasilia - DF",
        descricao: "Chegou timida ao abrigo, mas hoje procura carinho e acompanha os voluntarios por todos os cantos.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: true
      }),
      new window.Pet({
        id: "pet-6",
        nome: "Max",
        especie: "Cachorro",
        sexo: "Macho",
        raca: "SRD",
        porte: "Grande",
        idade: "4 anos",
        peso: "24 kg",
        localizacao: "Ceilandia, Brasilia - DF",
        descricao: "Muito leal e inteligente. Ideal para adotante que goste de caminhadas e tenha tempo para brincar.",
        status: "Em acompanhamento",
        imagem: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: false
      }),
      new window.Pet({
        id: "pet-7",
        nome: "Luna",
        especie: "Gato",
        sexo: "Femea",
        raca: "SRD",
        porte: "Pequeno",
        idade: "1 ano",
        peso: "4 kg",
        localizacao: "Asa Norte, Brasilia - DF",
        descricao: "Gatinha curiosa, limpa e tranquila. Gosta de janelas protegidas e brinquedos simples.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: true
      }),
      new window.Pet({
        id: "pet-8",
        nome: "Pipoca",
        especie: "Gato",
        sexo: "Macho",
        raca: "Rajado",
        porte: "Pequeno",
        idade: "6 meses",
        peso: "2 kg",
        localizacao: "Guara, Brasilia - DF",
        descricao: "Filhote brincalhao, sociavel e cheio de energia. Se adapta bem com outros gatos.",
        status: "Disponivel",
        imagem: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=80",
        vacinado: true,
        castrado: false
      })
    ];
  }

  historiasIniciais() {
    return [
      new window.Historia({
        id: "historia-1",
        titulo: "De Ruas Frias a Abracos Quentes",
        categoria: "Adocao responsavel",
        data: "16/06/2022",
        resumo: "A transformacao de Mel mostra como paciencia, rotina e amor mudam uma vida.",
        imagem: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=900&q=80",
        texto:
          "Ola, tudo bem? Aqui e a familia que adotou a Mel. Ela chegou um pouco timida, mas logo conquistou nossos coracoes. Desde o primeiro dia percebemos que ela precisava de cuidado, paciencia e uma rotina segura. Hoje ela corre quando ouve o barulho da coleira, dorme no cantinho preferido perto da janela e acompanha todos os momentos da casa. A Mel trouxe alegria, responsabilidade e um carinho enorme para nossa familia. A adocao dela mostrou que amor tambem se constroi com presenca, respeito e compromisso."
      }),
      new window.Historia({
        id: "historia-2",
        titulo: "Das Sombras para a Luz",
        categoria: "Adocao responsavel",
        data: "12/09/2024",
        resumo: "Max encontrou um novo lar depois de meses esperando uma chance no abrigo.",
        imagem: "https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=900&q=80",
        texto:
          "Max passou meses no abrigo ate conhecer uma familia disposta a adaptar a rotina para recebe-lo. No comeco ele tinha medo de sons altos e evitava chegar perto das pessoas. Com caminhadas curtas, reforco positivo e muito carinho, foi ganhando confianca. Hoje Max ja atende pelo nome, pede carinho e espera animado pela hora do passeio. Sua historia lembra que muitos animais precisam apenas de tempo, cuidado e uma oportunidade real."
      }),
      new window.Historia({
        id: "historia-3",
        titulo: "O Milagre de Luna",
        categoria: "Acolhimento",
        data: "12/03/2021",
        resumo: "Uma gatinha resgatada mostrou que acolhimento tambem cura quem adota.",
        imagem: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=900&q=80",
        texto:
          "Luna chegou ainda se recuperando de abandono. Precisou de acompanhamento veterinario, alimentacao correta e um ambiente protegido. Aos poucos voltou a brincar, subir nos moveis e confiar nas pessoas. A familia conta que a casa ficou mais leve depois da chegada dela. O processo ensinou responsabilidade, respeito ao tempo do animal e a importancia de adotar com consciencia."
      }),
      new window.Historia({
        id: "historia-4",
        titulo: "Um Recomeco para Thor",
        categoria: "Resgate",
        data: "03/05/2023",
        resumo: "Thor saiu do abandono e virou companheiro de uma crianca que sonhava com um melhor amigo.",
        imagem: "https://images.unsplash.com/photo-1558944351-c44c588d6177?auto=format&fit=crop&w=900&q=80",
        texto:
          "Thor foi encontrado cansado e desconfiado. A equipe parceira cuidou da vacinacao, castracao e adaptacao antes de disponibiliza-lo para adocao. Quando conheceu sua nova familia, criou uma conexao imediata com uma crianca que queria um companheiro para brincar. Hoje Thor tem rotina, acompanhamento e um quintal onde corre todos os dias. A historia dele reforca o papel das instituicoes parceiras e dos adotantes responsaveis."
      })
    ];
  }

  clinicasIniciais() {
    return [
      new window.Clinica({
        id: "clinica-1",
        nome: "Coracao Peludinho",
        local: "Gama",
        contato: "(61) 98765-4321",
        imagem: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80"
      }),
      new window.Clinica({
        id: "clinica-2",
        nome: "Centro Veterinario Dr. Juzo",
        local: "Samambaia",
        contato: "(61) 91454-5888",
        imagem: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=900&q=80"
      }),
      new window.Clinica({
        id: "clinica-3",
        nome: "Pet Adote Clinica",
        local: "Paranoa",
        contato: "(61) 91336-1677",
        imagem: "https://images.unsplash.com/photo-1601758123927-1966f409e098?auto=format&fit=crop&w=900&q=80"
      }),
      new window.Clinica({
        id: "clinica-4",
        nome: "Amigos e Pets Dr. Rodrigo",
        local: "Taguatinga",
        contato: "(61) 98120-3300",
        imagem: "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?auto=format&fit=crop&w=900&q=80"
      }),
      new window.Clinica({
        id: "clinica-5",
        nome: "Patinhas do Cerrado",
        local: "Ceilandia",
        contato: "(61) 99244-1188",
        imagem: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80"
      }),
      new window.Clinica({
        id: "clinica-6",
        nome: "Viva Pet Castracao",
        local: "Aguas Claras",
        contato: "(61) 99642-2210",
        imagem: "https://images.unsplash.com/photo-1525253013412-55c1a69a5738?auto=format&fit=crop&w=900&q=80"
      })
    ];
  }
}

window.AdotePetsManager = AdotePetsManager;
