// ============================================================
// Retool Custom Component — OTP Input
// Author: Taha Amin (@tahaamin)
// ============================================================
//
// Paste the HTML below into Retool's Custom Component HTML editor.
// The component outputs the entered OTP code via modelUpdate.
// ============================================================

/*
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: #fff;
    gap: 16px;
    padding: 16px;
  }
  .label {
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    letter-spacing: 0.3px;
    text-align: center;
  }
  .otp-wrapper {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
  .otp-input {
    width: 48px;
    height: 56px;
    text-align: center;
    font-size: 22px;
    font-weight: 700;
    color: #111827;
    border: 2px solid #d1d5db;
    border-radius: 10px;
    outline: none;
    background: #f9fafb;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    caret-color: transparent;
  }
  .otp-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    background: #ffffff;
  }
  .otp-input.filled {
    border-color: #6366f1;
    background: #eef2ff;
  }
  .otp-input.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.12);
  }
  .status {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    min-height: 18px;
    text-align: center;
  }
  .status.success { color: #16a34a; }
  .status.error { color: #ef4444; }
  .clear-btn {
    font-size: 12px;
    color: #6366f1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    font-weight: 500;
  }
  .clear-btn:hover { background: #eef2ff; }
</style>
</head>
<body>

<div class="label" id="labelText">Enter verification code</div>

<div class="otp-wrapper" id="otpWrapper"></div>

<div class="status" id="status"></div>

<button class="clear-btn" id="clearBtn">Clear</button>

<script>
  var digits = 6;
  var inputs = [];
  var currentColor = '#6366f1';

  function init(model) {
    digits = (model && model.digits) ? parseInt(model.digits) : 6;
    currentColor = (model && model.accentColor) ? model.accentColor : '#6366f1';

    var label = model && model.label ? model.label : 'Enter verification code';
    document.getElementById('labelText').textContent = label;

    // Apply accent color via CSS variable
    document.documentElement.style.setProperty('--accent', currentColor);

    var wrapper = document.getElementById('otpWrapper');
    wrapper.innerHTML = '';
    inputs = [];

    for (var i = 0; i < digits; i++) {
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'numeric';
      inp.maxLength = 1;
      inp.className = 'otp-input';
      inp.dataset.index = i;
      inp.style.setProperty('--accent', currentColor);
      inp.addEventListener('keydown', onKeyDown);
      inp.addEventListener('input', onInput);
      inp.addEventListener('paste', onPaste);
      inp.addEventListener('focus', function() { this.select(); });
      wrapper.appendChild(inp);
      inputs.push(inp);
    }
  }

  function onInput(e) {
    var idx = parseInt(this.dataset.index);
    var val = this.value.replace(/\D/g, '');
    this.value = val ? val[val.length - 1] : '';
    this.classList.toggle('filled', !!this.value);
    applyAccent();
    if (this.value && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
    sendOtp();
  }

  function onKeyDown(e) {
    var idx = parseInt(this.dataset.index);
    if (e.key === 'Backspace') {
      if (this.value) {
        this.value = '';
        this.classList.remove('filled');
        sendOtp();
      } else if (idx > 0) {
        inputs[idx - 1].focus();
        inputs[idx - 1].value = '';
        inputs[idx - 1].classList.remove('filled');
        sendOtp();
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputs[idx - 1].focus();
    } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }
  }

  function onPaste(e) {
    e.preventDefault();
    var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    var idx = parseInt(this.dataset.index);
    for (var i = 0; i < paste.length && idx + i < inputs.length; i++) {
      inputs[idx + i].value = paste[i];
      inputs[idx + i].classList.add('filled');
    }
    var nextIdx = Math.min(idx + paste.length, inputs.length - 1);
    inputs[nextIdx].focus();
    applyAccent();
    sendOtp();
  }

  function applyAccent() {
    inputs.forEach(function(inp) {
      if (inp.classList.contains('filled')) {
        inp.style.borderColor = currentColor;
        inp.style.background = currentColor + '18';
      } else {
        inp.style.borderColor = '';
        inp.style.background = '';
      }
    });
  }

  function getOtp() {
    return inputs.map(function(i) { return i.value; }).join('');
  }

  function sendOtp() {
    var otp = getOtp();
    var complete = otp.length === digits;
    document.getElementById('status').textContent = complete ? '✓ Code complete' : '';
    document.getElementById('status').className = 'status' + (complete ? ' success' : '');
    if (window.Retool) {
      window.Retool.modelUpdate({ otp: otp, isComplete: complete, length: otp.length });
    }
  }

  document.getElementById('clearBtn').addEventListener('click', function() {
    inputs.forEach(function(inp) {
      inp.value = '';
      inp.classList.remove('filled', 'error');
      inp.style.borderColor = '';
      inp.style.background = '';
    });
    document.getElementById('status').textContent = '';
    document.getElementById('status').className = 'status';
    inputs[0].focus();
    if (window.Retool) {
      window.Retool.modelUpdate({ otp: '', isComplete: false, length: 0 });
    }
  });

  // Init with defaults
  init({});

  // Listen for Retool model changes
  if (window.Retool) {
    window.Retool.subscribe(function(model) {
      if (model.digits || model.label || model.accentColor) {
        init(model);
      }
      if (model.clearOtp) {
        document.getElementById('clearBtn').click();
      }
    });
  }
</script>
</body>
</html>
*/
