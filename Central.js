(function () {
    'use strict';

    if (window.__scriptJaRodou) return;
    window.__scriptJaRodou = true;

    const logBox = document.createElement('div');
    logBox.style = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 9999;
        background: #111;
        color: #0f0;
        padding: 10px;
        font-family: monospace;
        border-radius: 10px;
        max-width: 320px;
        max-height: 60vh;
        overflow-y: auto;
        font-size: 13px;
        box-shadow: 0 0 10px #0f0;
    `;
    document.body.appendChild(logBox);

    const log = (msg, isError = false) => {
        const line = document.createElement("div");
        const time = new Date().toLocaleTimeString();
        line.textContent = `${isError ? "[ERRO]" : ">>"} [${time}] ${msg}`;
        line.style.color = isError ? "#f33" : "#0f0";
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    };

    const isLicao = () => {
        const urlOk = /\/tms\/task\/\d+\/apply/.test(location.href);
        const temToken = sessionStorage.getItem('saladofuturo.educacao.sp.gov.br:iptvdashboard:state') || sessionStorage.getItem('cmsp.ip.tv:iptvdashboard:state');
        const temElemento = document.querySelector('.MuiTypography-root, [class*=task-title], [class*=MuiPaper-root]');
        return urlOk || (temToken && temElemento);
    };

    const addBotaoForcar = () => {
        const btn = document.createElement('button');
        btn.textContent = "▶ Forçar Execução";
        btn.style = `
            position: fixed;
            bottom: 80px;
            right: 10px;
            z-index: 10000;
            padding: 10px;
            background: #222;
            color: #0f0;
            border: 2px solid #0f0;
            border-radius: 8px;
            cursor: pointer;
        `;
        btn.onclick = () => {
            log("Execução forçada pelo usuário.");
            iniciar();
        };
        document.body.appendChild(btn);
    };

    if (!isLicao()) {
        log("Você não está numa lição. Acesse a página de uma lição e clique em 'Forçar Execução' se necessário.", true);
        addBotaoForcar();
        return;
    }

    iniciar();

    function iniciar() {
        try {
            const plataforma = location.href.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
            const sessionData = JSON.parse(sessionStorage.getItem(`${plataforma}:iptvdashboard:state`));
            if (!sessionData || !sessionData.auth?.auth_token) return log("Token de sessão não encontrado!", true);

            const token = sessionData.auth.auth_token;
            const roomName = sessionData.room?.room?.name || "Desconhecida";
            const lessonId = location.href.match(/task\/(\d+)/)?.[1];
            if (!lessonId) return log("ID da lição não encontrado!", true);

            log("Sessão validada!");
            log(`Sala: ${roomName}`);
            log(`Lição ID: ${lessonId}`);

            const draftBody = {
                status: "draft",
                accessed_on: "room",
                executed_on: roomName,
                answers: {}
            };

            const sendRequest = (method, url, data, callback) => {
                const xhr = new XMLHttpRequest();
                xhr.open(method, url);
                xhr.setRequestHeader("X-Api-Key", token);
                xhr.setRequestHeader("Content-Type", "application/json");
                xhr.onload = () => callback(xhr);
                xhr.onerror = () => log(`Erro em ${method} ${url}`, true);
                xhr.send(data ? JSON.stringify(data) : null);
            };

            const transformar = original => {
                const novo = {
                    status: "submitted",
                    accessed_on: original.accessed_on,
                    executed_on: original.executed_on,
                    answers: {}
                };

                for (const id in original.answers) {
                    const quest = original.answers[id];
                    const q = original.task.questions.find(q => q.id === parseInt(id));
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
                                resposta = Object.fromEntries(Object.entries(q.options).map(([k, v]) => [k, v.answer]));
                        }
                    } catch (err) {
                        log(`Erro ao processar questão ${id}: ${err.message}`, true);
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
            sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${lessonId}/answer`, draftBody, draftRes => {
                if (draftRes.status !== 200) return log("Falha ao enviar rascunho.", true);

                log("Rascunho enviado!");
                const answerId = JSON.parse(draftRes.responseText).id;
                const getUrl = `https://edusp-api.ip.tv/tms/task/${lessonId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;

                log("Buscando respostas certas...");
                sendRequest("GET", getUrl, null, getRes => {
                    if (getRes.status !== 200) return log("Erro ao buscar respostas.", true);

                    const json = JSON.parse(getRes.responseText);
                    const finalBody = transformar(json);

                    log("Respostas preparadas. Enviando...");
                    sendRequest("PUT", `https://edusp-api.ip.tv/tms/task/${lessonId}/answer/${answerId}`, finalBody, finalRes => {
                        if (finalRes.status === 200) {
                            log("Respostas enviadas com sucesso!");
                            const done = document.querySelector('button.MuiButton-contained');
                            if (done) {
                                setTimeout(() => done.click(), 800);
                                log("Clicando para finalizar.");
                            }
                        } else {
                            log("Erro ao enviar respostas finais.", true);
                        }
                    });
                });
            });

        } catch (e) {
            log("Erro inesperado: " + e.message, true);
        }
    }
})();
