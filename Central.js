(function() {
    'use strict';

    // Regex para detectar páginas de lição
    let lesson_regex = /https:\/\/(saladofuturo\.educacao\.sp\.gov\.br|cmsp\.ip\.tv)\/mobile\/tms\/task\/\d+\/apply/;
    
    // Variáveis globais
    let currentToken = '';
    let oldHref = document.location.href;

    // Criar interface mínima
    const statusDiv = document.createElement('div');
    statusDiv.style = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: #00ff64;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        z-index: 99999;
        border: 2px solid #00ff64;
        box-shadow: 0 0 10px rgba(0, 255, 100, 0.7);
    `;
    document.body.appendChild(statusDiv);
    
    // Função de log simples
    function log(msg) {
        statusDiv.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
        console.log(msg);
    }
    
    // Função para enviar requisições
    const sendRequest = (method, url, data, callback) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("X-Api-Key", currentToken);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onload = () => callback(xhr);
        xhr.onerror = () => callback(xhr);
        xhr.send(data ? JSON.stringify(data) : null);
    };
    
    // Função para transformar JSON
    function transformJson(jsonOriginal) {
        let novoJson = {
            status: "submitted",
            accessed_on: jsonOriginal.accessed_on,
            executed_on: jsonOriginal.executed_on,
            answers: {}
        };

        for (let questionId in jsonOriginal.answers) {
            let question = jsonOriginal.answers[questionId];
            let taskQuestion = jsonOriginal.task.questions.find(q => q.id === parseInt(questionId));
            
            if (!taskQuestion) continue;

            if (taskQuestion.type === "order-sentences") {
                let answer = taskQuestion.options.sentences.map(sentence => sentence.value);
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
            } else if (taskQuestion.type === "fill-words") {
                let answer = taskQuestion.options.phrase.map(item => item.value).filter((_, index) => index % 2 !== 0);
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
            } else if (taskQuestion.type === "text_ai") {
                let answer = taskQuestion.comment ? taskQuestion.comment.replace(/<\/?p>/g, '') : "";
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: { "0": answer } };
            } else if (taskQuestion.type === "fill-letters") {
                let answer = taskQuestion.options.answer;
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
            } else if (taskQuestion.type === "cloud") {
                let answer = taskQuestion.options.ids;
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
            } else {
                try {
                    let answer = Object.fromEntries(Object.keys(taskQuestion.options || {}).map(optionId => [optionId, taskQuestion.options[optionId].answer]));
                    novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                } catch (error) {
                    novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: {} };
                }
            }
        }
        return novoJson;
    }
    
    // Função para processar a lição
    function processLesson() {
        statusDiv.innerHTML = '<div style="color:#00ff64;font-weight:bold;">🔄 AutoResponder ativado!</div>';
        log("Lição detectada! Processando...");
        
        const platform = window.location.href.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
        const stateKey = `${platform}:iptvdashboard:state`;
        
        try {
            const state = JSON.parse(sessionStorage.getItem(stateKey));
            if (!state || !state.auth || !state.auth.auth_token) {
                log("❌ Token não encontrado!");
                return;
            }
            
            currentToken = state.auth.auth_token;
            log("✅ Token obtido: " + currentToken.substring(0, 10) + "...");
            
            const room_name = state.room.room.name;
            const id = window.location.href.split("/")[6];
            
            log("📝 Lição ID: " + id + " | Sala: " + room_name);
            
            // Enviar rascunho
            const draft_body = { 
                status: "draft", 
                accessed_on: "room", 
                executed_on: room_name, 
                answers: {} 
            };
            
            log("📤 Enviando rascunho...");
            
            sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${id}/answer`, draft_body, (response) => {
                if (response.status !== 200 && response.status !== 201) {
                    log("❌ Erro ao enviar rascunho!");
                    return;
                }
                
                log("✅ Rascunho enviado!");
                
                const task_id = JSON.parse(response.responseText).id;
                const get_answers_url = `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;
                
                log("🔍 Obtendo dados da lição...");
                
                sendRequest("GET", get_answers_url, null, (response) => {
                    if (response.status !== 200) {
                        log("❌ Erro ao obter dados!");
                        return;
                    }
                    
                    log("✅ Dados obtidos!");
                    
                    try {
                        const get_answers_response = JSON.parse(response.responseText);
                        
                        if (get_answers_response.task && get_answers_response.task.title) {
                            log("📚 Título: " + get_answers_response.task.title);
                        }
                        
                        if (get_answers_response.task && get_answers_response.task.questions) {
                            log("❓ Questões: " + get_answers_response.task.questions.length);
                        }
                        
                        const send_answers_body = transformJson(get_answers_response);
                        
                        log("📤 Enviando respostas...");
                        
                        sendRequest("PUT", `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}`, send_answers_body, (response) => {
                            if (response.status !== 200) {
                                log("❌ Erro ao enviar respostas!");
                                return;
                            }
                            
                            log("✅ LIÇÃO COMPLETADA COM SUCESSO! 🎉");
                            statusDiv.style.backgroundColor = "rgba(0, 100, 0, 0.8)";
                            statusDiv.style.borderColor = "#00ff00";
                        });
                    } catch (error) {
                        log("❌ Erro: " + error.message);
                    }
                });
            });
        } catch (error) {
            log("❌ Erro: " + error.message);
        }
    }

    // Observador de mudanças na URL
    const observer = new MutationObserver(() => {
        if (oldHref !== document.location.href) {
            oldHref = document.location.href;
            if (lesson_regex.test(oldHref)) {
                processLesson();
            }
        }
    });

    // Iniciar observação
    observer.observe(document, { childList: true, subtree: true });

    // Verificar se já estamos em uma página de lição
    if (lesson_regex.test(window.location.href)) {
        processLesson();
    } else {
        log("🔍 Aguardando lição...");
    }
})();
