// cache.js - Cache simples em localStorage com tempo de validade (TTL)
// Dupla: Felipe Santiago RA: 078364 e Breno Ferreira RA: 069800

function salvarCache(chave, dados) {
  const pacote = {
    dados: dados,
    timestamp: Date.now()
  };
  localStorage.setItem(chave, JSON.stringify(pacote));
}

function lerCache(chave, ttlMinutos) {
  const ttl = (ttlMinutos || 30) * 60 * 1000;
  const bruto = localStorage.getItem(chave);
  if (!bruto) return null;

  const pacote = JSON.parse(bruto);
  const idade = Date.now() - pacote.timestamp;

  if (idade > ttl) return null;
  return pacote;
}

function formatarHora(timestamp) {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return hh + ":" + mm;
}
