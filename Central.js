(function() {
  'use strict';

  console.log("-- STARTING AutoResponder By Ramonqwk --");

  const lesson_regex = /https:\/\/(saladofuturo.educacao.sp.gov.br|cmsp.ip.tv)\/mobile\/tms\/task\/\d+\/apply\//;

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

      if (taskQuestion.type === "order-sentences") {
        let answer = taskQuestion.options.sentences.map(s => s.value);
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: answer
        };
      } else if (taskQuestion.type === "fill-words") {
        let answer = taskQuestion.options.phrase.map((item, i) => item.value).filter((_, i) => i % 2 !== 0);
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: answer
        };
      } else if (taskQuestion.type === "text_ai") {
        let answer = taskQuestion.comment.replace(/<\/?p>/g, '');
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: { "0": answer }
        };
      } else if (taskQuestion.type === "fill-letters") {
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: taskQuestion.options.answer
        };
      } else if (taskQuestion.type === "cloud") {
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: taskQuestion.options.ids
        };
      } else {
        let answer = Object.fromEntries(
          Object.keys(taskQuestion.options).map(optionId => [optionId, taskQuestion.options[optionId].answer])
        );
        novoJson.answers[questionId] = {
          question_id: question.question_id,
          question_type: taskQuestion.type,
          answer: answer
        };
      }
    }
    return novoJson;
  }

  const sendRequest = (method, url, token, data, callback) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.setRequestHeader("X-Api-Key", token);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => callback(xhr);
    xhr.onerror = () => console.error('Request failed');
    xhr.send(data ? JSON.stringify(data) : null);
  };

  const observer = new MutationObserver(() => {
    let href = location.href;
    if (lesson_regex.test(href)) {
      console.log("[DEBUG] LESSON DETECTED");

      let platform = href.includes("saladofuturo") ? "saladofuturo.educacao.sp.gov.br" : "cmsp.ip.tv";
      let state = JSON.parse(sessionStorage.getItem(`${platform}:iptvdashboard:state`));
      if (!state || !state.auth || !state.room) return;

      let token = state.auth.auth_token;
      let room = state.room.room.name;
      let id = href.split("/")[6];

      console.log(`[DEBUG] LESSON_ID: ${id} ROOM_NAME: ${room}`);

      let draft = {
        status: "draft",
        accessed_on: "room",
        executed_on: room,
        answers: {}
      };

      sendRequest("POST", `https://edusp-api.ip.tv/tms/task/${id}/answer`, token, draft, (res) => {
        let task_id = JSON.parse(res.responseText).id;
        let get_url = `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}?with_task=true&with_genre=true&with_questions=true&with_assessed_skills=true`;

        sendRequest("GET", get_url, token, null, (res) => {
          let parsed = JSON.parse(res.responseText);
          let final = transformJson(parsed);

          sendRequest("PUT", `https://edusp-api.ip.tv/tms/task/${id}/answer/${task_id}`, token, final, (res) => {
            console.log("[DEBUG] ENVIADO:", res.responseText);
            const watermark = document.querySelector('.MuiTypography-root.MuiTypography-body1.css-1exusee');
            if (watermark) {
              watermark.textContent = 'made by Ramonqwk :P';
              watermark.style.fontSize = '70px';
              setTimeout(() => {
                document.querySelector('button.MuiButtonBase-root.MuiButton-root.MuiLoadingButton-root.MuiButton-contained').click();
              }, 500);
            }
          });
        });
      });
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

})();
