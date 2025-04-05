(function() {
    'use strict';

    // Função para exibir logs visuais na tela
    function createLogBox() {
        const logBox = document.createElement('div');
        logBox.style = 'position:fixed;bottom:10px;right:10px;z-index:9999;background:#000;color:#0f0;padding:10px;font-family:monospace;border-radius:5px;max-width:300px;font-size:14px;opacity:0.9;';
        document.body.appendChild(logBox);
        return logBox;
    }

    const logBox = createLogBox();
    const log = msg => {
        const logEntry = document.createElement('div');
        logEntry.textContent = `> ${msg}`;
        logBox.appendChild(logEntry);
    };

    // Função para obter o token de autenticação
    function getAuthToken() {
        const platforms = ["saladofuturo.educacao.sp.gov.br", "cmsp.ip.tv"];
        for (const platform of platforms) {
            const state = sessionStorage.getItem(`${platform}:iptvdashboard:state`);
            if (state) {
                const authData = JSON.parse(state);
                return authData.auth.auth_token;
            }
        }
        return null;
    }

    // Função para obter o nome da sala
    function getRoomName() {
        const platforms = ["saladofuturo.educacao.sp.gov.br", "cmsp.ip.tv"];
        for (const platform of platforms) {
            const state = sessionStorage.getItem(`${platform}:iptvdashboard:state`);
            if (state) {
                const roomData = JSON.parse(state);
                return roomData.room.room.name;
            }
        }
        return null;
    }

    // Função para enviar requisições HTTP
    function sendRequest(method, url, token, data = null) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method, url);
            xhr.setRequestHeader("X-Api-Key", token);
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = () => resolve(xhr);
            xhr.onerror = () => reject(new Error(`Erro na requisição: ${method} ${url}`));
            xhr.send(data ? JSON.stringify(data) : null);
        });
    }

    // Função para transformar o JSON original em respostas
    function transformJson(original) {
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
            switch (q.type) {
                case "order-sentences":
                    resposta = q.options.sentences.map(s => s.value);
                    break;
                case "fill-words":
                    resposta = q.options.phrase.map((v, i) => i % 2 ? v.value : null).filter(Boolean);
                    break;
                case "text_ai":
                    resposta = { "0": q.comment.replace(/<\/?p>/g, '') };
                    break;
                case "fill-letters":
                    resposta = q.options.answer;
                    break;
                case "cloud":
                    resposta = q.options.ids;
                    break;
                default:
                    resposta = Object.fromEntries(Object.keys(q.options).map(opt => [opt, q.options[opt].answer]));
            }

            novo.answers[id] = {
                question_id: quest.question_id,
                question_type: q.type,
                answer: resposta
            };
        }

        return novo;
    }

    // Função principal para processar a atividade
    async function processActivity(activityId) {
        const token = getAuthToken();
        const roomName = getRoomName();

        if (!token || !roomName) {
            log("Erro ao obter token ou nome da sala.");
            return;
        }

        log(`ID da atividade: ${activityId}`);
        log(`Sala: ${roomName}`);

        const draftBody = {
            status: "draft",
            accessed_on: "room",
            executed_on: roomName,
            answers: {}
        };

        try {
            log("Enviando rascunho...");
            const draftRes = await sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${activityId}/answer`, token, draftBody);
            log("Rascunho enviado!");

            const draftJson = JSON.parse(draftRes.responseText);
            const answerId = draftJson.id;
            const getUrl = `https://edusp-api.ip.tv/tms/task/${activityId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;

            log("Buscando respostas corretas...");
            const getRes = await sendRequest("GET", getUrl, token);
            const json = JSON.parse(getRes.responseText);
            const finalBody = transformJson(json);

            log("Enviando respostas...");
            const finalRes = await sendRequest("PUT", `https://edusp-api.ip.tv/tms/task/${activityId}/answer/${answerId}`, token, finalBody);

            if (finalRes.status === 200) {
                log("Respostas enviadas com sucesso!");
                const doneButton = document.querySelector('button.MuiButton-contained');
                if (doneButton) {
                    setTimeout(() => doneButton.click(), 800);
                    log("Atividade finalizada.");
                }
            } else {
                log("Erro ao enviar respostas.");
                console.error(finalRes.responseText);
            }
        } catch (error) {
            log(`Erro: ${error.message}`);
        }
    }

    // Verifica se está na página de uma atividade
    const activityMatch = window.location.href.match(/\/atividade\/(\d+)/);
    if (activityMatch) {
        const activityId = activityMatch[1];
        processActivity(activityId);
    } else {
        // Se não estiver na página de uma atividade, solicita o ID manualmente
        const activityId = prompt("Por favor, insira o ID da atividade:");
        if (activityId) {
            processActivity(activityId);
        } else {
            log("Nenhum ID de atividade fornecido.");
        }
    }
})();
