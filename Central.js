(function () {
    'use strict';

    if (window._scriptRodandoCMSP_SF) return;
    window._scriptRodandoCMSP_SF = true;

    const isCMSP = location.hostname.includes("cmspweb.ip.tv");
    const isSalaFuturo = location.hostname.includes("saladofuturo");

    const formatTime = () => new Date().toLocaleTimeString('pt-BR', { hour12: false });

    const createLogBox = () => {
        const logBox = document.createElement('div');
        logBox.id = 'logVisual';
        logBox.style = `
            position: fixed; bottom: 10px; right: 10px; z-index: 99999;
            background: #000; color: #0f0; padding: 10px;
            font-family: monospace; border-radius: 12px;
            max-width: 350px; max-height: 60vh; overflow-y: auto;
            font-size: 13px; box-shadow: 0 0 15px #0f0;
        `;
        document.body.appendChild(logBox);
        return logBox;
    };

    const logBox = createLogBox();

    const log = (msg, isError = false) => {
        const line = document.createElement("div");
        const prefix = `[${formatTime()}] `;
        line.textContent = prefix + (isError ? `[ERRO] ${msg}` : `>> ${msg}`);
        line.style.color = isError ? "#f55" : "#0f0";
        logBox.appendChild(line);
        logBox.scrollTop = logBox.scrollHeight;
    };

    function showInterface(token = "Token ainda não carregado") {
        const popupBackground = document.createElement("div");
        popupBackground.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.7); display: flex;
            justify-content: center; align-items: center; z-index: 10000;
        `;

        const popupContent = document.createElement("div");
        popupContent.style.cssText = `
            background-color: #2c2c2c; padding: 20px; border-radius: 8px;
            width: 350px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            font-family: Arial, sans-serif; color: white; position: relative;
        `;

        const closeButton = document.createElement("span");
        closeButton.innerText = "✕";
        closeButton.style.cssText = `
            position: absolute; top: 12px; right: 12px; font-size: 14px;
            cursor: pointer; color: #999;
        `;
        closeButton.onclick = () => document.body.removeChild(popupBackground);
        popupContent.appendChild(closeButton);

        const rgbStrip = document.createElement("div");
        rgbStrip.style.cssText = `
            position: absolute; bottom: 0; left: 0; width: 100%; height: 5px;
            border-radius: 0 0 8px 8px;
            background: linear-gradient(90deg, rgba(59, 175, 222, 1), rgba(202, 70, 205, 1), rgba(201, 227, 58, 1), rgba(59, 175, 222, 1));
            background-size: 300% 100%;
            animation: rgbProgress 5s linear infinite;
        `;

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            @keyframes rgbProgress {
                0% { background-position: 0% 0; }
                100% { background-position: -300% 0; }
            }
        `;
        document.head.appendChild(styleSheet);

        const title = document.createElement("h3");
        title.innerText = isCMSP ? "CMSP Web - Token & Discord" : "Sala do Futuro - Token & Discord";
        title.style.cssText = `
            text-align: center; margin-bottom: 15px; font-size: 18px;
            font-weight: bold; color: #ffffff;
        `;
        popupContent.appendChild(title);

        const tabsContainer = document.createElement("div");
        tabsContainer.style.cssText = `display: flex; justify-content: space-around; margin-bottom: 10px;`;

        const copyTab = document.createElement("div");
        copyTab.innerText = "Logs e Token";
        copyTab.style.cssText = `cursor: pointer; padding: 5px; color: #fff; flex: 1; text-align: center; border-bottom: 2px solid #3bafde;`;

        const discordTab = document.createElement("div");
        discordTab.innerText = "Discord";
        discordTab.style.cssText = `cursor: pointer; padding: 5px; color: #bbb; flex: 1; text-align: center; border-bottom: 2px solid transparent;`;

        tabsContainer.appendChild(copyTab);
        tabsContainer.appendChild(discordTab);
        popupContent.appendChild(tabsContainer);
        popupContent.appendChild(rgbStrip);

        const sectionsContainer = document.createElement("div");

        const copySection = document.createElement("div");
        copySection.style.display = "block";

        const tokenText = document.createElement("input");
        tokenText.type = "text";
        tokenText.value = token;
        tokenText.readOnly = true;
        tokenText.style.cssText = `width: 100%; padding: 10px; font-size: 14px; text-align: center; margin-bottom: 15px; border: 1px solid #444; border-radius: 5px; background-color: #333; color: #fff;`;
        copySection.appendChild(tokenText);

        const copyButton = document.createElement("button");
        copyButton.innerText = "Copiar Token";
        copyButton.style.cssText = `width: 100%; padding: 10px; font-size: 14px; margin-bottom: 15px; cursor: pointer; background-color: #3bafde; color: #fff; border: none; border-radius: 5px;`;
        copyButton.onclick = () => {
            navigator.clipboard.writeText(tokenText.value);
            showNotification("Token copiado com sucesso!");
        };
        copySection.appendChild(copyButton);
        sectionsContainer.appendChild(copySection);

        const discordSection = document.createElement("div");
        discordSection.style.display = "none";

        const discordWidget = document.createElement("iframe");
        discordWidget.src = "https://discord.com/widget?id=1307176076300255292&theme=dark";
        discordWidget.width = "100%";
        discordWidget.height = "500";
        discordWidget.style.border = "none";
        discordWidget.allowTransparency = true;
        discordWidget.sandbox = "allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts";
        discordSection.appendChild(discordWidget);
        sectionsContainer.appendChild(discordSection);

        popupContent.appendChild(sectionsContainer);
        popupBackground.appendChild(popupContent);
        document.body.appendChild(popupBackground);

        copyTab.onclick = () => {
            copySection.style.display = "block";
            discordSection.style.display = "none";
            copyTab.style.borderBottom = "2px solid #3bafde";
            discordTab.style.borderBottom = "2px solid transparent";
            discordTab.style.color = "#bbb";
            copyTab.style.color = "#fff";
        };

        discordTab.onclick = () => {
            copySection.style.display = "none";
            discordSection.style.display = "block";
            discordTab.style.borderBottom = "2px solid #ca46cd";
            copyTab.style.borderBottom = "2px solid transparent";
            copyTab.style.color = "#bbb";
            discordTab.style.color = "#fff";
        };
    }

    function showNotification(message, isError = false) {
        const notification = document.createElement("div");
        notification.style.cssText = `
            position: fixed; top: 40px; right: 20px;
            background-color: ${isError ? "#e74c3c" : "#27ae60"}; color: white;
            padding: 10px 20px; border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); z-index: 1000;
            transition: all 0.3s ease;
        `;
        notification.innerText = message;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    async function fazerTudo() {
        try {
            const res = await fetch("/api/student-activities/me/available");
            const data = await res.json();
            const lista = data?.activities || [];

            if (lista.length === 0) {
                log("Nenhuma lição disponível.");
                showNotification("Nenhuma lição encontrada.");
                return;
            }

            for (const item of lista) {
                const tipo = item.title.includes("atrasada") ? "ATRASADA" : "NORMAL";
                log(`Iniciando lição ${tipo}: ${item.title}`);

                await fetch(`/api/student-activities/${item.id}/start`, { method: "POST" });

                await fetch(`/api/student-activities/${item.id}/finish`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ score: 10, correct: true })
                });

                log(`Finalizada lição ${tipo}: ${item.title}`);
                showNotification(`Lição ${tipo} concluída: ${item.title}`);
            }

            log("Todas as lições foram finalizadas.");
            showNotification("Execução automática concluída!");
        } catch (e) {
            log("Erro ao executar lições: " + e.message, true);
            showNotification("Erro ao executar!", true);
        }
    }

    setTimeout(() => {
        showInterface("Token CMSP/Sala não disponível");
        log("Interface visual ativada com sucesso!");
        log("Acesse a aba 'Discord' para suporte ao vivo.");
        fazerTudo();
    }, 1000);
})();
