// == SCRIPT SALA DO FUTURO & CMSP - VERSÃO PRO ULTRA TUNADA == (function () { 'use strict';

if (window._scriptSalaFuturoPRO) return; window._scriptSalaFuturoPRO = true;

const salvar = (k, v) => localStorage.setItem(k, JSON.stringify(v)); const ler = k => JSON.parse(localStorage.getItem(k));

const formatTime = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });

const criarPainel = () => { const box = document.createElement('div'); box.id = 'painelSalaFuturoPro'; box.innerHTML = <style> #painelSalaFuturoPro { position: fixed; bottom: 20px; right: 20px; width: 380px; max-height: 70vh; z-index: 99999; background: #111; border-radius: 12px; overflow: hidden; box-shadow: 0 0 20px #0f0; font-family: monospace; animation: pulseBox 2s infinite; } #painelSalaFuturoPro header { background: #0f0; color: #000; padding: 8px; font-weight: bold; cursor: move; } #painelSalaFuturoPro nav { display: flex; background: #222; } #painelSalaFuturoPro nav button { flex: 1; padding: 6px; background: #333; color: #0f0; border: none; cursor: pointer; } #painelSalaFuturoPro nav button.ativo { background: #0f0; color: #000; } #painelSalaFuturoPro .conteudo > div { display: none; padding: 10px; max-height: 200px; overflow-y: auto; color: #0f0; } #painelSalaFuturoPro .conteudo > div.ativo { display: block; } @keyframes pulseBox { 0%, 100% { box-shadow: 0 0 15px #0f0; } 50% { box-shadow: 0 0 30px #0f0; } } </style> <header>Sala do Futuro PRO</header> <nav> <button data-tab="log" class="ativo">Logs</button> <button data-tab="config">Config</button> </nav> <div class="conteudo"> <div id="tab-log" class="ativo"></div> <div id="tab-config"> <button onclick="copyToken()">Copiar Token</button> <button onclick="exportarJSON()">Exportar JSON</button> <button onclick="forcarExecucao()">Forçar Execução</button> </div> </div>; document.body.appendChild(box);

const tabs = box.querySelectorAll('nav button');
tabs.forEach(btn => {
  btn.onclick = () => {
    tabs.forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    box.querySelectorAll('.conteudo > div').forEach(div => div.classList.remove('ativo'));
    box.querySelector(`#tab-${btn.dataset.tab}`).classList.add('ativo');
  };
});

let isDragging = false, startX, startY;
const header = box.querySelector('header');
header.onmousedown = e => {
  isDragging = true;
  startX = e.clientX - box.offsetLeft;
  startY = e.clientY - box.offsetTop;
};
document.onmouseup = () => isDragging = false;
document.onmousemove = e => {
  if (isDragging) {
    box.style.left = (e.clientX - startX) + 'px';
    box.style.top = (e.clientY - startY) + 'px';
    box.style.bottom = 'auto';
    box.style.right = 'auto';
  }
};

};

const log = (msg, erro = false) => { const area = document.getElementById('tab-log'); if (!area) return; const div = document.createElement('div'); div.style.color = erro ? '#f55' : '#0f0'; div.textContent = [${formatTime()}] ${erro ? '[ERRO]' : '>>'} ${msg}; area.appendChild(div); area.scrollTop = area.scrollHeight; };

window.copyToken = () => { navigator.clipboard.writeText(window._ultimoToken || 'Token não encontrado') .then(() => log('Token copiado para a área de transferência.')) .catch(() => log('Erro ao copiar token.', true)); };

window.exportarJSON = () => { const blob = new Blob([JSON.stringify(window._ultimoJSON || {}, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'resposta.json'; a.click(); };

window.forcarExecucao = () => iniciar(true);

const extrairToken = () => { const url = window.location.href; const plataforma = url.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv"; const estado = sessionStorage.getItem(${plataforma}:iptvdashboard:state); if (!estado) return null; try { const dados = JSON.parse(estado); return dados?.auth?.auth_token || null; } catch (e) { return null; } };

const iniciar = (forcado = false) => { const token = extrairToken(); if (!token) return log("Token não encontrado!", true); window._ultimoToken = token; log("Token capturado com sucesso!"); // Aqui vai o restante do script de envio da tarefa... };

criarPainel(); iniciar(false); })();

                           
