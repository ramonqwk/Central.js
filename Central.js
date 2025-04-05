(function() {
    'use strict';

    const logBox = document.createElement('div');
    logBox.style = 'position:fixed;bottom:10px;right:10px;z-index:9999;background:#222;color:#0f0;padding:10px;font-family:monospace;border-radius:10px;max-width:300px;font-size:14px;';
    document.body.appendChild(logBox);
    const log = msg => logBox.innerHTML += `<div>> ${msg}</div>`;

    const lesson_regex = /https:\/\/(saladofuturo\.educacao\.sp\.gov\.br|cmsp\.ip\.tv)\/mobile\/tms\/task\/\d+\/apply/;
    if (!lesson_regex.test(window.location.href)) {
        log("Esta página não é uma lição.");
        return;
    }

    log("Página de lição detectada!");

    const platform = window.location.href.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
    const sessionData = JSON.parse(sessionStorage.getItem(`${platform}:iptvdashboard:state`));
    if (!sessionData) return log("Erro ao obter token.");
    const token = sessionData.auth.auth_token;
    const roomName = sessionData.room.room.name;
    const lessonId = window.location.href.split("/")[6];

    log("Token capturado!");
    log(`ID da lição: ${lessonId}`);
    log(`Sala: ${roomName}`);

    const draftBody = {
        status: "draft",
        accessed_on: "room",
        executed_on: roomName,
        answers: {}
    };

    const sendRequest = (method, url, data = null, callback) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("X-Api-Key", token);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => callback(xhr);
        xhr.onerror = () => log(`Erro em: ${method} ${url}`);
        xhr.send(data ? JSON.stringify(data) : null);
    };

    const transformJson = original => {
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
    };

    log("Enviando rascunho...");

    sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${lessonId}/answer`, draftBody, draftRes => {
        log("Rascunho enviado!");
        const draftJson = JSON.parse(draftRes.responseText);
        const answerId = draftJson.id;
        const getUrl = `https://edusp-api.ip.tv/tms/task/${lessonId}/answer/${answerId}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;

        log("Buscando respostas certas...");

        sendRequest("GET", getUrl, null, getRes => {
            const json = JSON.parse(getRes.responseText);
            const finalBody = transformJson(json);
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
                    log("Erro ao enviar respostas.");
                    console.log(finalRes.responseText);
                }
            });
        });
    });

})();
