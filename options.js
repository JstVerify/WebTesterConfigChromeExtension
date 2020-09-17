const browserAppData = this.browser || this.chrome;
const shortcutCommand = 'toggle-xpath';
const updateAvailable = (typeof browserAppData.commands.update !== 'undefined') ? true : false;
const isMac = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false;
const shortCutKeys = isMac ? 'Command+Shift+' : 'Ctrl+Shift+';
const shortCutLabels = isMac ? 'CMD+SHIFT+' : 'CTRL+SHIFT+';

async function updateShortcut() {
  updateAvailable && await browserAppData.commands.update({
    name: shortcutCommand,
    shortcut: shortCutKeys + document.querySelector('#shortcut').value
  });
}

async function resetShortcut() {
  if (updateAvailable) {
    await browserAppData.commands.reset(shortcutCommand);
    const commands = await browserAppData.commands.getAll();
    for (const command of commands) {
      if (command.name === shortcutCommand) {
        document.querySelector('#shortcut').value = command.shortcut.substr(-1);
      }
    }
    saveOptions();
  }
}

function shortcutKeyField(event) {
  event.target.value = event.target.value.toUpperCase();
}

function saveOptions(e) {
  browserAppData.storage.local.set({
    inspector: document.querySelector('#inspector').checked,
    shortid: document.querySelector('#shortid').checked,
  }, () => {
    const status = document.querySelector('.status');
    status.textContent = 'Options saved.';
    updateAvailable && updateShortcut();
    setTimeout(() => {
      status.textContent = '';
    }, 1000);
  });
  e && e.preventDefault();
}

function restoreOptions() {
  browserAppData.storage.local.get({
    inspector: true,
    shortid: true,
  }, items => {
    document.querySelector('#inspector').checked = items.inspector;
    document.querySelector('#shortid').checked = items.shortid;
  });
}

// check if browser support updating shortcuts
if (updateAvailable) {
  document.querySelector('#reset').addEventListener('click', resetShortcut);
} else {
  // remove button and disable input field
  document.querySelector('#reset').remove();
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector('form').addEventListener('submit', saveOptions);
