import {
  getIsExtensionActive,
  setIsExtensionActive,
  enableNetBlocking,
  disableNetBlocking,
} from './utils.js';

// SETUP
getIsExtensionActive().then((isActive) => {
  if (isActive) {
    chrome.action.setIcon({ path: 'logo/block.png' });
  } else {
    disableNetBlocking();
    chrome.action.setIcon({ path: 'logo/allow.png' });
  }
});

// EVENT LISTENERS
chrome.tabs.onCreated.addListener(async function (tab) {
  const isActive = await getIsExtensionActive();
  if (isActive) {
    const knownTabs = await chrome.tabs.query({});
    if (knownTabs.length > 1) {
      await chrome.tabs.remove(tab.id);
    } else {
      console.log(
        `Tab created, but not blocked due to insufficient number of tabs. Tabs open: ${knownTabs.length}.`,
      );
    }
  }
});

chrome.action.onClicked.addListener(async function () {
  const isActive = await getIsExtensionActive();
  if (isActive) {
    await setIsExtensionActive(false);
    await disableNetBlocking();
    chrome.action.setIcon({ path: 'logo/allow.png' });
  } else {
    await setIsExtensionActive(true);
    await enableNetBlocking();
    chrome.action.setIcon({ path: 'logo/block.png' });
  }
});
