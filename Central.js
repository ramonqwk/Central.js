(function () {
    if (window.location.hostname.includes("sala.sesisc.org.br")) {
        let originalXHROpen = XMLHttpRequest.prototype.open;
        let tokenCaptured = false;

        XMLHttpRequest.prototype.open = function () {
            this.addEventListener("readystatechange", function () {
                if (this.readyState === 4 && !tokenCaptured) {
                    const token = this.getResponseHeader("x-auth-token");
                    if (token) {
                        tokenCaptured = true;
                        showTokenPopup(token);
                    }
                }
            });
            originalXHROpen.apply(this, arguments);
        };

        console.log("Aguardando requisição para capturar o token...");
    } else {
        showPopup("Site Incorreto", "Você precisa estar no site do Sala do Futuro (sala.sesisc.org.br).", () => {
            window.open("https://sala.sesisc.org.br", "_blank");
        });
    }

    // As funções showTokenPopup, showPopup, etc., seguem as mesmas do seu código original:
    // (copiadas a seguir para funcionar como base)

    // ... [INSERIR AQUI SUAS FUNÇÕES showTokenPopup, showPopup, showNotification, etc., SEM MUDANÇAS] ...

})();
