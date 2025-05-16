(function () {
  //–– state
  const state = {
    initialSecs: 0,
    startTime: 0,
    pauseOffset: 0,
    timerId: null,
  };
  let inputBuffer = "";

  //–– Ensure only one timer dialog exists
  if (window.activeTimerDialog) {
    // Close the existing dialog
    window.activeTimerDialog.remove();
  }

  //–– Create and inject the dialog box
  const timerDialog = document.createElement("div"); // Use a div instead of <dialog> for better control
  timerDialog.id = "timer-dialog";
  timerDialog.style.position = "absolute"; // Ensure it's draggable
  timerDialog.style.fontSize = "1.1em";
  timerDialog.style.width = "auto";
  timerDialog.style.height = "auto";
  timerDialog.style.border = "2px solid black";
  timerDialog.style.borderRadius = "8px";
  timerDialog.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  timerDialog.style.padding = "20px";
  timerDialog.style.display = "flex";
  timerDialog.style.flexDirection = "column";
  timerDialog.style.alignItems = "center";
  timerDialog.style.justifyContent = "space-between"
  timerDialog.style.top = "100px";
  timerDialog.style.left = "100px";
  timerDialog.style.backgroundColor = "rgb(255, 255, 255)";
  timerDialog.style.zIndex = "10000"; // Ensure it's on top

  //–– Attach Shadow DOM
  const shadowRoot = timerDialog.attachShadow({ mode: "open" });

  //–– Add content and styles to the Shadow DOM
  shadowRoot.innerHTML = `
    <style>
      #timer-dialog {
        position: absolute;
        top: 100px;
        left: 100px;
        border: 2px solid red;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        padding: 20px;
        width: 400px;
        height: 220px;
        font-family: Arial, sans-serif;
        background-color: rgb(255, 255, 255);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
      }

      .timer-wrapper {
        width: 350px;
        background-color:rgb(255, 255, 255);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      input[type="text"] {
        width: 100%;
        height: 1em;
        border-radius: 6px;
        font-size: 8.5em;
        text-align: center;
        padding: 5px;
        border: 1px solid #ccc;
        margin: 0 auto;
      }

      .timer-nest {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        width: 100%;
      }

      button {
        font-size: 1em;
        margin: 5px;
        border: 1px solid #ccc;
        border-radius: 6px;
        padding: 5px 10px;
        cursor: pointer;
      }

      button:hover {
        background-color: #f0f0f0;
      }

      #timer-start {
        background-color: #edf8ec;
      }

      #timer-reset {
        background-color: #ecedf8;
      }

      #timer-clear {
        background-color: #fdfdf8;
      }

      .close-btn {
        position: absolute;
        top: 5px;
        right: 5px;
        background: transparent;
        border: none;
        font-size: 1.2em;
        cursor: pointer;
      }

      .close-btn:hover {
        color: red;
      }
    </style>
    <div class="timer-wrapper">
      <button class="close-btn" id="timer-close-dialog">&times;</button>
      <div class="timer-bg"></div>
      <div><input type="text" id="timer-clock" value="00:00"></div>
      <div class="timer-nest">
        <button id="timer-reset">reset</button>
        <button id="timer-clear">clear</button>
        <button id="timer-start">Start</button>
      </div>
    </div>
  `;

  document.body.appendChild(timerDialog);

  //–– Cache DOM elements inside the Shadow DOM
  const clockEl = shadowRoot.querySelector("#timer-clock");
  const startBtn = shadowRoot.querySelector("#timer-start");
  const resetBtn = shadowRoot.querySelector("#timer-reset");
  const clearBtn = shadowRoot.querySelector("#timer-clear");
  const closeDialogBtn = shadowRoot.querySelector("#timer-close-dialog");

  //–– Helpers
  function formatTime(sec) {
    const m = Math.floor(sec / 60),
      s = sec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function tick(now) {
    const elapsed = Math.floor((now - state.startTime) / 1000);
    const left = Math.max(state.initialSecs - elapsed, 0);
    clockEl.value = formatTime(left);

    if (left > 0) {
      state.timerId = requestAnimationFrame(tick);
    } else {
      state.timerId = null;
      startBtn.textContent = "Start";
    }
  }

  function startTimer() {
    state.startTime = performance.now() - state.pauseOffset;
    state.timerId = requestAnimationFrame(tick);
    startBtn.textContent = "Stop";
  }

  function stopTimer() {
    cancelAnimationFrame(state.timerId);
    state.pauseOffset = performance.now() - state.startTime;
    state.timerId = null;
    startBtn.textContent = "Start";
  }

  function resetVisual() {
    if (state.timerId) stopTimer();
    state.pauseOffset = 0;
    clockEl.value = formatTime(state.initialSecs);
    inputBuffer = "";
  }

  //–– Digit-shifting input logic
  clockEl.addEventListener("keydown", (e) => {
    if (/\d/.test(e.key)) {
      e.preventDefault();
      inputBuffer = (inputBuffer + e.key).slice(-4);
    } else if (e.key === "Backspace") {
      e.preventDefault();
      inputBuffer = inputBuffer.slice(0, -1);
    } else {
      return; // allow arrows/tab/etc
    }

    const buf = inputBuffer.padStart(4, "0");
    let mm = parseInt(buf.slice(0, 2), 10);
    let ss = parseInt(buf.slice(2), 10);

    if (ss >= 60) {
      const total = mm * 60 + ss;
      mm = Math.floor(total / 60);
      ss = total % 60;
    }

    state.initialSecs = mm * 60 + ss;
    state.pauseOffset = 0;
    clockEl.value = formatTime(state.initialSecs);
  });

  //–– Button events
  startBtn.addEventListener("click", () => {
    if (state.timerId) stopTimer();
    else if (state.initialSecs > 0) startTimer();
  });

  resetBtn.addEventListener("click", resetVisual);

  clearBtn.addEventListener("click", () => {
    if (state.timerId) stopTimer();
    state.initialSecs = 0;
    state.pauseOffset = 0;
    inputBuffer = "";
    clockEl.value = "00:00";
  });

  closeDialogBtn.addEventListener("click", () => {
    timerDialog.remove();
    window.activeTimerDialog = null; // Clear the reference
  });

  //–– Make the dialog draggable
  timerDialog.addEventListener("mousedown", (e) => {
    let offsetX = e.clientX - timerDialog.offsetLeft;
    let offsetY = e.clientY - timerDialog.offsetTop;

    function onMouseMove(e) {
      timerDialog.style.left = `${e.clientX - offsetX}px`;
      timerDialog.style.top = `${e.clientY - offsetY}px`;
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  //–– Track the active timer dialog
  window.activeTimerDialog = timerDialog;
})();