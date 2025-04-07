(function () {
    'use strict';

    if (window._scriptRodandoSalaFuturo) return;
    window._scriptRodandoSalaFuturo = true;

    const formatTime = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });

    const logBox = document.createElement('div');
    logBox.id = 'logSalaFuturo';
    logBox.style = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 99999;
        background: #000;
        color: #0f0;
        padding: 10px;
        font-family: monospace;
        border-radius: 12px;
        max-width: 350px;
        max-height: 60vh;
        overflow-y: auto;
        font-size: 13px;
        box-shadow: 0 0 15px #0f0;
    `;
    document.body.appendChild(logBox);

    const log = (msg, isError = false) => {
        const line = document.createElement("div");
        const prefix = `[${formatTime()}] `;
        line.textContent = prefix + (isError ? `[ERRO] ${msg}` : `>> ${msg}`);
        line.style.color = isError ? "#f55" : "#0f0";
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    };

    const forcarBtn = document.createElement('button');
    forcarBtn.textContent = 'Forçar Execução';
    forcarBtn.style = `
        margin-top: 8px;
        background: #222;
        color: #0f0;
        border: 1px solid #0f0;
        border-radius: 6px;
        cursor: pointer;
        padding: 5px;
        font-weight: bold;
    `;
    forcarBtn.onclick = () => {
        log("Execução forçada pelo usuário.");
        iniciarExecucao(true);
    };
    logBox.appendChild(forcarBtn);

    const aguardarPagina = () => {
        if (document.readyState !== "complete") {
            setTimeout(aguardarPagina, 300);
        } else {
            iniciarExecucao(false);
        }
    };

    const iniciarExecucao = (forcar = false) => {
        const url = window.location.href;
        const isLicao = url.includes("/task/") && url.includes("/apply");
        if (!isLicao && !forcar) {
            log("Você não está numa lição. Acesse a página de uma lição e clique em 'Forçar Execução' se necessário.", true);
            return;
        }

        const plataforma = url.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
        const estadoSessao = sessionStorage.getItem(`${plataforma}:iptvdashboard:state`);
        if (!estadoSessao) {
            log("Token de sessão não encontrado!", true);
            return;
        }

        let sessionData;
        try {
            sessionData = JSON.parse(estadoSessao);
        } catch (e) {
            log("Erro ao analisar dados da sessão!", true);
            return;
        }

        const token = sessionData?.auth?.auth_token;
        const room = sessionData?.room?.room?.name;
        const lessonId = url.split("/").find(x => /^\d+$/.test(x));

        if (!token || !room || !lessonId) {
            log("Informações essenciais ausentes (token, sala ou ID da lição).", true);
            return;
        }

        log(`Token detectado.`);
        log(`Sala: ${room}`);
        log(`ID da lição: ${lessonId}`);

        const draftBody = {
            status: "draft",
            accessed_on: "room",
            executed_on: room,
            answers: {}
        };

        const enviarReq = (method, url, data = null, callback) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.setRequestHeader("X-Api-Key", token);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => callback(xhr);
            xhr.onerror = () => log(`Erro de rede em ${method} ${url}`, true);
            xhr.send(data ? JSON.stringify(data) : null);
        };

        const montarFinalBody = json => {
            const novo = {
                status: "submitted",
                accessed_on: json.accessed_on,
                executed_on: json.executed_on,
                answers: {}
            };

            for (const id in json.answers) {
                const quest = json.answers[id];
                const q = json.task.questions.find(q => q.id === parseInt(id));
                if (!q) continue;

                let resposta;
                try {
                    switch (q.type) {
                        case "order-sentences": resposta = q.options.sentences.map(s => s.value); break;
                        case "fill-words": resposta = q.options.phrase.map((v, i) => i % 2 ? v.value : null).filter(Boolean); break;
                        case "text_ai": resposta = { "0": q.comment.replace(/<\/?p>/g, '') }; break;
                        case "fill-letters": resposta = q.options.answer; break;
                        case "cloud": resposta = q.options.ids; break;
                        default:
                            resposta = Object.fromEntries(Object.keys(q.options).map(opt => [opt, q.options[opt].answer]));
                    }
                } catch (e) {
                    log(`Erro ao processar questão ${id}: ${e.message}`, true);
                    continue;
                }

                novo.answers[id] = {
                    question_id: quest.question_id,
                    question_type: q.type,
                    answer: resposta
                };
            }

            return novo;
        };

        log("Enviando rascunho...");

        enviarReq("POST", `https://edusp-api.ip.tv/tms/task/${lessonId}/answer`, draftBody, draftRes => {
            if (draftRes.status !== 200) {
                log("Falha ao enviar rascunho.", true);
                return;
            }

            log("Rascunho enviado com sucesso!");

            const draftJson = JSON.parse(draftRes.responseText);
            const answerId = draftJson.id;
            const getUrl = `https://edusp-api.ip.tv/tms/task/${lessonId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;

            log("Buscando respostas certas...");

            enviarReq("GET", getUrl, null, getRes => {
                if (getRes.status !== 200) {
                    log("Erro ao buscar respostas completas.", true);
                    return;
                }

                const json = JSON.parse(getRes.responseText);
                const finalBody = montarFinalBody(json);

                log("Respostas preparadas. Enviando...");

                enviarReq("PUT", `https://edusp-api.ip.tv/tms/task/${lessonId}/answer/${answerId}`, finalBody, finalRes => {
                    if (finalRes.status === 200) {
                        log("Respostas enviadas com sucesso!");
                        const btn = document.querySelector('button.MuiButton-contained');
                        if (btn) {
                            log("Clicando para finalizar a tarefa.");
                            setTimeout(() => btn.click(), 1000);
                        }
                    } else {
                        log("Erro ao enviar as respostas finais.", true);
                        console.log(finalRes.responseText);
                    }
                });
            });
        });
    };

    aguardarPagina();
})();
