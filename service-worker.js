import {
  getIsExtensionActive,
  setIsExtensionActive,
  getIsUserOriginated,
  setIsUserOriginated,
  enableNetBlocking,
  disableNetBlocking,
} from './utils.js';

function sendMessageToContentScript(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    // Send message to that specific tab ID
    chrome.tabs.sendMessage(activeTab.id, message);
  });
}

function onActivateExtension() {
  chrome.action.setIcon({ path: 'logo/block.png' });
  chrome.action.setTitle({ title: 'Currently blocking tabs' });
  sendMessageToContentScript({ isExtensionActive: true });
}

function onDeactivateExtension() {
  chrome.action.setIcon({ path: 'logo/allow.png' });
  chrome.action.setTitle({ title: 'Not blocking tabs' });
  sendMessageToContentScript({ isExtensionActive: false });
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
chrome.runtime.onMessage.addListener((message) => {
  if (message.isUserOriginated) {
    setIsUserOriginated(message.isUserOriginated);
  }
  if (message.log) {
    console.log(message.log);
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

chrome.action.onClicked.addListener(async function () {
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
});
