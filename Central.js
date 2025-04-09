(function() {
    'use strict';

    let lesson_regex = /https:\/\/(saladofuturo\.educacao\.sp\.gov\.br|cmsp\.ip\.tv)\/mobile\/tms\/task\/\d+\/apply/;
    
    // Criando interface visual
    function criarInterface() {
        const estiloCSS = `
            .autoresponder-container {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 10px;
                padding: 15px;
                color: #fff;
                font-family: 'Courier New', monospace;
                z-index: 99999;
                box-shadow: 0 0 20px rgba(0, 255, 100, 0.7);
                border: 2px solid #00ff64;
                transition: all 0.3s ease;
            }
            .autoresponder-header {
                text-align: center;
                font-size: 18px;
                margin-bottom: 10px;
                color: #00ff64;
                text-shadow: 0 0 5px #00ff64;
                font-weight: bold;
            }
            .autoresponder-log {
                height: 200px;
                overflow-y: auto;
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                border: 1px solid #444;
            }
            .log-item {
                margin-bottom: 5px;
                line-height: 1.4;
                font-size: 12px;
                transition: all 0.3s ease;
            }
            .log-info { color: #3498db; }
            .log-success { color: #2ecc71; }
            .log-error { color: #e74c3c; }
            .log-warning { color: #f39c12; }
            .progress-container {
                width: 100%;
                background: #333;
                height: 20px;
                border-radius: 10px;
                overflow: hidden;
                margin-bottom: 10px;
            }
            .progress-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #00ff64, #00a1ff);
                transition: width 0.3s ease;
                position: relative;
                border-radius: 10px;
            }
            .progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0) 0%,
                    rgba(255, 255, 255, 0.3) 50%,
                    rgba(255, 255, 255, 0) 100%
                );
                animation: shimmer 1.5s infinite;
                transform: skewX(-20deg);
            }
            .status-indicator {
                text-align: center;
                font-size: 16px;
                margin-top: 10px;
                font-weight: bold;
            }
            .lesson-info {
                background: rgba(0, 0, 0, 0.5);
                padding: 10px;
                border-radius: 5px;
                margin-bottom: 10px;
                border: 1px solid #444;
            }
            .token-display {
                background: rgba(0, 0, 0, 0.5);
                padding: 8px;
                border-radius: 5px;
                margin-bottom: 10px;
                font-family: monospace;
                font-size: 10px;
                word-break: break-all;
                max-height: 60px;
                overflow-y: auto;
                border: 1px solid #00ff64;
                box-shadow: 0 0 10px rgba(0, 255, 100, 0.3);
            }
            .token-label {
                color: #00ff64;
                font-size: 12px;
                margin-bottom: 3px;
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%) skewX(-20deg); }
                100% { transform: translateX(200%) skewX(-20deg); }
            }
            @keyframes pulse {
                0% { box-shadow: 0 0 10px rgba(0, 255, 100, 0.7); }
                50% { box-shadow: 0 0 20px rgba(0, 255, 100, 1); }
                100% { box-shadow: 0 0 10px rgba(0, 255, 100, 0.7); }
            }
            .pulse-animation {
                animation: pulse 1.5s infinite;
            }
            .confetti {
                position: absolute;
                width: 10px;
                height: 10px;
                background-color: #f00;
                border-radius: 50%;
                opacity: 0;
                z-index: 999999;
            }
        `;

        // Adicionar CSS
        const styleElement = document.createElement('style');
        styleElement.textContent = estiloCSS;
        document.head.appendChild(styleElement);

        // Criar container principal
        const container = document.createElement('div');
        container.className = 'autoresponder-container pulse-animation';
        container.id = 'autoresponder-container';
        container.innerHTML = `
            <div class="autoresponder-header">AutoResponder Sala do Futuro</div>
            <div class="token-label">Token de Autenticação:</div>
            <div class="token-display" id="token-display">Aguardando...</div>
            <div class="lesson-info" id="lesson-info">
                <div><strong>ID da Lição:</strong> <span id="lesson-id">-</span></div>
                <div><strong>Sala:</strong> <span id="room-name">-</span></div>
                <div><strong>Título:</strong> <span id="lesson-title">-</span></div>
            </div>
            <div class="progress-container">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <div class="autoresponder-log" id="autoresponder-log"></div>
            <div class="status-indicator" id="status-indicator">Aguardando lição...</div>
        `;

        document.body.appendChild(container);
        
        return {
            log: function(mensagem, tipo = 'info') {
                const logContainer = document.getElementById('autoresponder-log');
                const logItem = document.createElement('div');
                logItem.className = `log-item log-${tipo}`;
                logItem.textContent = `[${new Date().toLocaleTimeString()}] ${mensagem}`;
                logContainer.appendChild(logItem);
                logContainer.scrollTop = logContainer.scrollHeight;
                
                // Efeito de pulse no item de log
                logItem.style.opacity = '0';
                setTimeout(() => {
                    logItem.style.opacity = '1';
                }, 10);
            },
            atualizarProgresso: function(porcentagem) {
                const progressBar = document.getElementById('progress-bar');
                progressBar.style.width = `${porcentagem}%`;
            },
            atualizarStatus: function(status) {
                const statusIndicator = document.getElementById('status-indicator');
                statusIndicator.textContent = status;
            },
            atualizarInfoLicao: function(id, sala, titulo) {
                document.getElementById('lesson-id').textContent = id || '-';
                document.getElementById('room-name').textContent = sala || '-';
                document.getElementById('lesson-title').textContent = titulo || '-';
            },
            mostrarToken: function(token) {
                const tokenDisplay = document.getElementById('token-display');
                tokenDisplay.textContent = token || 'Não encontrado';
                
                // Efeito de coleta de token
                tokenDisplay.style.boxShadow = '0 0 20px rgba(0, 255, 255, 1)';
                tokenDisplay.style.color = '#00ffff';
                setTimeout(() => {
                    tokenDisplay.style.boxShadow = '';
                    tokenDisplay.style.color = '#fff';
                }, 2000);
            },
            celebrar: function() {
                // Criando efeito de confete
                for (let i = 0; i < 100; i++) {
                    criarConfete();
                }
                
                // Highlight na borda do container
                const container = document.getElementById('autoresponder-container');
                container.style.borderColor = '#00ffff';
                container.style.boxShadow = '0 0 30px rgba(0, 255, 255, 1)';
                setTimeout(() => {
                    container.style.borderColor = '#00ff64';
                    container.style.boxShadow = '0 0 20px rgba(0, 255, 100, 0.7)';
                }, 3000);
            }
        };
    }

    // Função para criar confete
    function criarConfete() {
        const confete = document.createElement('div');
        confete.className = 'confetti';
        
        // Cor aleatória
        const cores = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
        const cor = cores[Math.floor(Math.random() * cores.length)];
        confete.style.backgroundColor = cor;
        
        // Posição aleatória
        const posX = Math.random() * window.innerWidth;
        const posY = -20;
        confete.style.left = `${posX}px`;
        confete.style.top = `${posY}px`;
        
        document.body.appendChild(confete);
        
        // Animação
        const velocidadeY = 3 + Math.random() * 5;
        const velocidadeX = (Math.random() - 0.5) * 3;
        const rotacao = (Math.random() - 0.5) * 20;
        let posicaoY = posY;
        let posicaoX = posX;
        let opacidade = 1;
        
        // Início da animação com leve atraso para cada confete
        setTimeout(() => {
            confete.style.opacity = '1';
            
            const animacao = setInterval(() => {
                posicaoY += velocidadeY;
                posicaoX += velocidadeX;
                confete.style.top = `${posicaoY}px`;
                confete.style.left = `${posicaoX}px`;
                confete.style.transform = `rotate(${rotacao * posicaoY / 20}deg)`;
                
                // Desaparecimento gradual
                if (posicaoY > window.innerHeight - 200) {
                    opacidade -= 0.02;
                    confete.style.opacity = opacidade.toString();
                    
                    if (opacidade <= 0) {
                        clearInterval(animacao);
                        confete.remove();
                    }
                }
            }, 20);
        }, Math.random() * 500);
    }

    // Criar interface logo no início
    const ui = criarInterface();
    ui.log("Script AutoResponder iniciado", "success");
    
    // Função principal para transformar JSON
    function transformJson(jsonOriginal) {
        ui.log("Transformando dados da lição...", "info");
        let novoJson = {
            status: "submitted",
            accessed_on: jsonOriginal.accessed_on,
            executed_on: jsonOriginal.executed_on,
            answers: {}
        };

        for (let questionId in jsonOriginal.answers) {
            let question = jsonOriginal.answers[questionId];
            let taskQuestion = jsonOriginal.task.questions.find(q => q.id === parseInt(questionId));

            if (taskQuestion.type === "order-sentences") {
                let answer = taskQuestion.options.sentences.map(sentence => sentence.value);
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                ui.log(`Processando questão ${questionId}: tipo order-sentences`, "info");
            } else if (taskQuestion.type === "fill-words") {
                let pre_answer = taskQuestion.options;
                let answer = pre_answer.phrase.map(item => item.value).filter((_, index) => index % 2 !== 0);
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                ui.log(`Processando questão ${questionId}: tipo fill-words`, "info");
            } else if (taskQuestion.type === "text_ai") {
                let answer = taskQuestion.comment.replace(/<\/?p>/g, '');
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: { "0": answer } };
                ui.log(`Processando questão ${questionId}: tipo text_ai`, "info");
            } else if (taskQuestion.type === "fill-letters") {
                let answer = taskQuestion.options.answer;
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                ui.log(`Processando questão ${questionId}: tipo fill-letters`, "info");
            } else if (taskQuestion.type === "cloud") {
                let answer = taskQuestion.options.ids;
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                ui.log(`Processando questão ${questionId}: tipo cloud`, "info");
            } else {
                let answer = Object.fromEntries(Object.keys(taskQuestion.options).map(optionId => [optionId, taskQuestion.options[optionId].answer]));
                novoJson.answers[questionId] = { question_id: question.question_id, question_type: taskQuestion.type, answer: answer };
                ui.log(`Processando questão ${questionId}: tipo ${taskQuestion.type}`, "info");
            }
        }
        
        ui.log("Transformação de dados concluída", "success");
        return novoJson;
    }

    // Função para enviar requisições com feedback visual
    const sendRequest = (method, url, data, callback) => {
        ui.log(`Enviando requisição ${method} para ${url.split('/').slice(-3).join('/')}`, "info");
        
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("X-Api-Key", currentToken);
        xhr.setRequestHeader("Content-Type", "application/json");
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                ui.log(`Requisição ${method} concluída com sucesso (${xhr.status})`, "success");
            } else {
                ui.log(`Erro na requisição ${method}: Status ${xhr.status}`, "error");
            }
            callback(xhr);
        };
        
        xhr.onerror = () => {
            ui.log('Falha na requisição: Erro de conexão', "error");
            console.error('Request failed');
        };
        
        xhr.send(data ? JSON.stringify(data) : null);
    };

    // Variáveis globais
    let currentToken = '';
    let oldHref = document.location.href;

    // Observador de mudanças na URL
    const observer = new MutationObserver(() => {
        if (oldHref !== document.location.href) {
            oldHref = document.location.href;
            
            if (lesson_regex.test(oldHref)) {
                ui.log("Lição detectada! Iniciando processamento...", "success");
                ui.atualizarStatus("Lição detectada");
                ui.atualizarProgresso(10);
                
                let platform = oldHref.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
                
                try {
                    const stateKey = `${platform}:iptvdashboard:state`;
                    const state = JSON.parse(sessionStorage.getItem(stateKey));
                    
                    if (!state || !state.auth || !state.auth.auth_token) {
                        ui.log("Erro: Token de autenticação não encontrado!", "error");
                        ui.atualizarStatus("Erro: Token não encontrado");
                        return;
                    }
                    
                    currentToken = state.auth.auth_token;
                    ui.mostrarToken(currentToken);
                    ui.log("Token de autenticação obtido com sucesso", "success");
                    ui.atualizarProgresso(20);
                    
                    const room_name = state.room.room.name;
                    const id = oldHref.split("/")[6];
                    
                    ui.atualizarInfoLicao(id, room_name, "Carregando...");
                    ui.log(`ID da Lição: ${id}`, "info");
                    ui.log(`Nome da Sala: ${room_name}`, "info");
                    ui.atualizarProgresso(30);
                    
                    let draft_body = { 
                        status: "draft", 
                        accessed_on: "room", 
                        executed_on: room_name, 
                        answers: {} 
                    };
                    
                    ui.log("Enviando rascunho da lição...", "info");
                    ui.atualizarStatus("Preparando submissão");
                    ui.atualizarProgresso(40);
                    
                    // Enviar rascunho
                    sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${id}/answer`, draft_body, (response) => {
                        if (response.status !== 200 && response.status !== 201) {
                            ui.log("Erro ao enviar rascunho da lição", "error");
                            ui.atualizarStatus("Erro no rascunho");
                            return;
                        }
                        
                        ui.log("Rascunho enviado com sucesso", "success");
                        ui.atualizarProgresso(50);
                        
                        let response_json = JSON.parse(response.responseText);
                        let task_id = response_json.id;
                        let get_answers_url = `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;
                        
                        ui.log("Obtendo dados da lição...", "info");
                        ui.atualizarStatus("Obtendo dados");
                        ui.atualizarProgresso(60);
                        
                        // Obter respostas
                        sendRequest("GET", get_answers_url, null, (response) => {
                            if (response.status !== 200) {
                                ui.log("Erro ao obter dados da lição", "error");
                                ui.atualizarStatus("Erro na obtenção de dados");
                                return;
                            }
                            
                            ui.log("Dados da lição obtidos com sucesso", "success");
                            ui.atualizarProgresso(70);
                            
                            try {
                                let get_answers_response = JSON.parse(response.responseText);
                                
                                // Atualizar o título da lição
                                if (get_answers_response.task && get_answers_response.task.title) {
                                    ui.atualizarInfoLicao(id, room_name, get_answers_response.task.title);
                                    ui.log(`Título da Lição: ${get_answers_response.task.title}`, "info");
                                }
                                
                                // Mostrar número de questões
                                if (get_answers_response.task && get_answers_response.task.questions) {
                                    const numQuestoes = get_answers_response.task.questions.length;
                                    ui.log(`Número de questões na lição: ${numQuestoes}`, "info");
                                }
                                
                                let send_answers_body = transformJson(get_answers_response);
                                
                                ui.log("Preparando 
