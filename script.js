(function () {
  //–– state
  const state = {
    initialSecs: 0,
    startTime: 0,
    pauseOffset: 0,
    timerId: null,
  };
  let inputBuffer = "";

  const alarmSound = new Audio(chrome.runtime.getURL("alarm.mp3"));
 
  
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
  //–– Add minimize button to the Shadow DOM
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
      transform-origin: top left;
      transform: scale(1);
    }

    .resize-handle {
      position: absolute;
      width: 15px;
      height: 15px;
      bottom: 0;
      right: 0;
      cursor: se-resize;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 50%;
    }

    .timer-wrapper {
      width: 350px;
      background-color: rgb(255, 255, 255);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      transform-origin: center; /* Change to center scaling */
    }

    input[type="text"] {
      width: 300px;
      height: 100px;
      border-radius: 6px;
      font-size: 120px;
      text-align: center;
      padding: 5px;
      border: 1px solid #ccc;
      transform-origin: center; /* Add center scaling */
    }

    .timer-nest {
      display: flex;
      justify-content: center; /* Center the buttons */
      gap: 10px; /* Add consistent spacing */
      width: 100%;
    }

    button {
      font-size: 20px; /* Default font size in px */
      margin: 5px;
      border: 1px solid #ccc;
      border-radius: 6px;
      padding: 10px 20px; /* Default padding in px */
      cursor: pointer;
    }

    button:hover {
      background-color: #f0f0f0;
    }

    #timer-start {
      background-color:rgb(219, 255, 216);
    }

    #timer-reset {
      background-color:rgb(217, 220, 255);
    }

    #timer-clear {
      background-color: #fdfdf8;
    }

    .close-btn, .minimize-btn {
      position: absolute;
      top: 1px;
      background: transparent;
      border: none;
      font-size: 1.2em;
      cursor: pointer;
    }

    .close-btn {
      right: 5px;
    }

    .close-btn:hover {
      color: red;
    }

    .minimize-btn {
      left: 5px;
    }

    .minimize-btn:hover {
      color: blue;
    }

    .minimized {
      width: 30px;
      height: 15px;
      padding: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .minimized .timer-wrapper {
      display: none;
    }

    .minimized input[type="text"],
    .minimized .timer-nest {
      display: none;
    }

    .minimized .minimize-btn {
      display: none;
    }

    .minimized .expand-btn {
      display: block;
      position: absolute;
      top: 1px;
      left: 5px;
    }

    .expand-btn {
      display: none;
      font-size: 1.2em;
      cursor: pointer;
      background: transparent;
      border: none;
    }

    #timer-start.stop-state {
  background-color: rgb(255, 190, 195); /* Light red background */
}

  </style>
  <div class="timer-wrapper">
    <button class="close-btn" id="timer-close-dialog">&times;</button>
    <button class="minimize-btn" id="timer-minimize-dialog">-</button>
    <button class="expand-btn" id="timer-expand-dialog">+</button>
    <div class="timer-bg"></div>
    <div><input type="text" id="timer-clock" value="00:00"></div>
    <div class="timer-nest">
      <button id="timer-reset">reset</button>
      <button id="timer-clear">clear</button>
      <button id="timer-start">Start</button>
    </div>
    <div class="resize-handle"></div>
  </div>
`;

//–– Cache new DOM elements
const minimizeDialogBtn = shadowRoot.querySelector("#timer-minimize-dialog");
const expandDialogBtn = shadowRoot.querySelector("#timer-expand-dialog");

// Cache the timer wrapper inside the Shadow DOM
const timerWrapper = shadowRoot.querySelector(".timer-wrapper");

// Minimize and expand logic
minimizeDialogBtn.addEventListener("click", () => {
  timerWrapper.classList.add("minimized");
});

expandDialogBtn.addEventListener("click", () => {
  timerWrapper.classList.remove("minimized");
});

  document.body.appendChild(timerDialog);

  //–– Cache DOM elements inside the Shadow DOM
  const clockEl = shadowRoot.querySelector("#timer-clock");
  const startBtn = shadowRoot.querySelector("#timer-start");
  const resetBtn = shadowRoot.querySelector("#timer-reset");
  const clearBtn = shadowRoot.querySelector("#timer-clear");
  const closeDialogBtn = shadowRoot.querySelector("#timer-close-dialog");

  // Cache the resize handle
  const resizeHandle = shadowRoot.querySelector(".resize-handle");

  // Add resizing logic
  resizeHandle.addEventListener("mousedown", (e) => {
    e.preventDefault();
  
    const initialWidth = timerDialog.offsetWidth;
    const initialHeight = timerDialog.offsetHeight;
    const initialMouseX = e.clientX;
    const aspectRatio = initialWidth / initialHeight;
  
    function onMouseMove(e) {
      const deltaX = e.clientX - initialMouseX;
      const newWidth = Math.max(initialWidth + deltaX, 200);
      const newHeight = newWidth / aspectRatio;
  
      // Calculate scaling factor based on original dimensions
      const scaleFactor = (newWidth / 400).toFixed(4);
      
      // Apply scaling to everything
      scaleInnerElements(parseFloat(scaleFactor));
    }
  
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
  
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  // Function to scale inner elements
  function scaleInnerElements(scaleFactor) {
    if (!timerDialog) return;  // Add safety check
    
    // Scale only the dialog, which will scale all its contents
    timerDialog.style.transform = `scale(${scaleFactor})`;
    timerDialog.style.transformOrigin = 'top left';
  }

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
      alarmSound.play(); // Play the alarm when the timer reaches 0
    }
  }

  function startTimer() {
    state.startTime = performance.now() - state.pauseOffset;
    state.timerId = requestAnimationFrame(tick);
    startBtn.textContent = "Stop";
    startBtn.classList.add("stop-state"); // Add the stop-state class
  }

  function stopAlarm() {
    alarmSound.pause(); // Pause the alarm
    alarmSound.currentTime = 0; // Reset the alarm to the beginning
  }

  function stopTimer() {
    cancelAnimationFrame(state.timerId);
    state.pauseOffset = performance.now() - state.startTime;
    state.timerId = null;
    startBtn.textContent = "Start";
    startBtn.classList.remove("stop-state"); // Remove the stop-state class
    stopAlarm(); // Stop the alarm
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
    if (state.timerId) {
      stopTimer(); // Stop the timer if it's running
    } else if (state.initialSecs > 0) {
      startTimer(); // Start the timer
    }
  });

  resetBtn.addEventListener("click", () => {
    resetVisual();
    stopAlarm(); // Stop the alarm
  });

  clearBtn.addEventListener("click", () => {
    if (state.timerId) stopTimer();
    state.initialSecs = 0;
    state.pauseOffset = 0;
    inputBuffer = "";
    clockEl.value = "00:00";
    stopAlarm(); // Stop the alarm
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

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "closeTimerDialog" && window.activeTimerDialog) {
      timerDialog.remove();
      window.activeTimerDialog = null; // Clear the reference
    }
  });
})();