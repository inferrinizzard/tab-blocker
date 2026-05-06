import {
  getIsExtensionActive,
  setIsExtensionActive,
  getIsUserOriginated,
  setIsUserOriginated,
  enableNetBlocking,
  disableNetBlocking,
} from './utils.js';

function sendMessage(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) =>
    chrome.tabs.sendMessage(tabs[0].id, message),
  );
}

function onActivateExtension() {
  chrome.action.setIcon({ path: 'logo/block.png' });
  chrome.action.setTitle({ title: 'Currently blocking tabs (Ctrl+Shift+Y)' });
  // Send message to active tab to attach document listener
  sendMessage({ isExtensionActive: true });
}

function onDeactivateExtension() {
  chrome.action.setIcon({ path: 'logo/allow.png' });
  chrome.action.setTitle({ title: 'Not blocking tabs (Ctrl+Shift+Y)' });
  chrome.tabs.query({ currentWindow: true }, (tabs) =>
    tabs.forEach((tab) =>
      chrome.tabs.sendMessage(tab.id, { isExtensionActive: false }),
    ),
  );
}

// SETUP
getIsExtensionActive().then((isActive) => {
  if (isActive) {
    onActivateExtension();
  } else {
    disableNetBlocking();
    onDeactivateExtension();
  }
});

// EVENT LISTENERS
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.setup) {
    sendMessage({ isExtensionActive: await getIsExtensionActive() });
  }

  if (message.isUserOriginated) {
    setIsUserOriginated(message.isUserOriginated);
  }

  return true;
});

const tabCreateListener = async function (tab) {
  const isActive = await getIsExtensionActive();
  const isUserOriginated = await getIsUserOriginated();

  if (!isActive) {
    return;
  }

  if (isUserOriginated) {
    setIsUserOriginated(false);
    return;
  }

  const knownTabs = await chrome.tabs.query({});
  if (knownTabs.length > 1) {
    await chrome.tabs.remove(tab.id);
  } else {
    console.log(
      `Tab created, but not blocked due to insufficient number of tabs. Tabs open: ${knownTabs.length}.`,
    );
  }
};

const toggleHandler = async function () {
  const isActive = await getIsExtensionActive();
  if (isActive) {
    await setIsExtensionActive(false);
    await disableNetBlocking();
    onDeactivateExtension();
    chrome.tabs.onCreated.removeListener(tabCreateListener);
  } else {
    await setIsExtensionActive(true);
    await enableNetBlocking();
    onActivateExtension();
    chrome.tabs.onCreated.addListener(tabCreateListener);
  }
};

chrome.action.onClicked.addListener(toggleHandler);
chrome.commands.onCommand.addListener(function (command) {
  console.log(command);
  if (command === 'toggle') {
    toggleHandler();
  }
});
