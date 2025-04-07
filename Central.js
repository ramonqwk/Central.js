(function () { 'use strict';

if (window._scriptRodandoSalaFuturo) return;
window._scriptRodandoSalaFuturo = true;

// Token Extraction para Sala do Futuro
const cookies = document.cookie.split('; ');
const tokenCookie = cookies.find(cookie => cookie.startsWith('token='));

if (!tokenCookie) {
    showPopup("Token não encontrado", "Verifique se você está logado no Sala do Futuro.", () => {
        showTokenPopup("Token não disponível.");
    });
    return;
}

const token = decodeURIComponent(tokenCookie.split('=')[1]);
showTokenPopup(token);

function showPopup(title, message, callback) {
    const popup = createPopupBackground();
    const content = createPopupContent();

    const popupTitle = document.createElement("h3");
    popupTitle.innerText = title;
    popupTitle.style.cssText = "text-align: center; color: white; margin-bottom: 10px;";
    content.appendChild(popupTitle);

    const popupMessage = document.createElement("p");
    popupMessage.innerText = message;
    popupMessage.style.cssText = "text-align: center; color: white; margin-bottom: 20px;";
    content.appendChild(popupMessage);

    const button = document.createElement("button");
    button.innerText = "Abrir mesmo assim";
    button.style.cssText = "display: block; margin: 0 auto; padding: 10px; background-color: #3bafde; color: white; border: none; border-radius: 5px; cursor: pointer;";
    button.onclick = function () {
        callback();
        document.body.removeChild(popup);
    };
    content.appendChild(button);

    const closeButton = document.createElement("span");
    closeButton.innerText = "✕";
    closeButton.style.cssText = "position: absolute; top: 10px; right: 10px; font-size: 20px; color: #999; cursor: pointer;";
    closeButton.onclick = function () {
        document.body.removeChild(popup);
    };
    content.appendChild(closeButton);

    popup.appendChild(content);
    document.body.appendChild(popup);
}

function createPopupBackground() {
    const popupBackground = document.createElement("div");
    popupBackground.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.7); z-index: 9999; display: flex;
        justify-content: center; align-items: center;
    `;
    return popupBackground;
}

function createPopupContent() {
    const content = document.createElement("div");
    content.style.cssText = `
        background-color: #2c2c2c; padding: 30px; border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        width: 350px; text-align: center; position: relative;
    `;
    return content;
}

function showTokenPopup(token) {
    const popupBackground = createPopupBackground();

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
    closeButton.onclick = function () {
        document.body.removeChild(popupBackground);
    };
    popupContent.appendChild(closeButton);

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        @keyframes rgbProgress {
            0% { background-position: 0% 0; }
            100% { background-position: -300% 0; }
        }
    `;
    document.head.appendChild(styleSheet);

    const rgbStrip = document.createElement("div");
    rgbStrip.style.cssText = `
        position: absolute; bottom: 0; left: 0; width: 100%; height: 5px;
        border-radius: 0 0 8px 8px;
        background: linear-gradient(90deg, rgba(59, 175, 222, 1), rgba(202, 70, 205, 1), rgba(201, 227, 58, 1), rgba(59, 175, 222, 1));
        background-size: 300% 100%;
        animation: rgbProgress 5s linear infinite;
    `;

    const title = document.createElement("h3");
    title.innerText = "Token do Sala do Futuro";
    title.style.cssText = `
        text-align: center; margin-bottom: 15px; font-size: 18px;
        font-weight: bold; color: #ffffff;
    `;
    popupContent.appendChild(title);

    const tokenInput = document.createElement("input");
    tokenInput.type = "text";
    tokenInput.value = token;
    tokenInput.readOnly = true;
    tokenInput.style.cssText = `
        width: 100%; padding: 10px; font-size: 14px; text-align: center;
        margin-bottom: 15px; border: 1px solid #444; border-radius: 5px;
        background-color: #333; color: #fff;
    `;

    const copyButton = document.createElement("button");
    copyButton.innerText = "Copiar Token";
    copyButton.style.cssText = `
        width: 100%; padding: 10px; font-size: 14px; margin-bottom: 10px;
        cursor: pointer; background-color: #3bafde; color: #fff;
        border: none; border-radius: 5px;
    `;
    copyButton.onclick = function () {
        navigator.clipboard.writeText(tokenInput.value);
        showNotification("Token copiado com sucesso!");
    };

    popupContent.appendChild(tokenInput);
    popupContent.appendChild(copyButton);
    popupContent.appendChild(rgbStrip);
    popupBackground.appendChild(popupContent);
    document.body.appendChild(popupBackground);
}

function showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed; top: 40px; right: 20px;
        background-color: ${isError ? "#e74c3c" : "#27ae60"}; color: white;
        padding: 10px 20px; border-radius: 5px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        z-index: 1000;
    `;
    notification.innerText = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

})();

